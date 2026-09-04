"""Runtime AI content generation for the Objective Workspace modal.

Each stage of the modal wizard (summary, constraints, opportunities,
strategies, evidence, execution) is generated on demand by an LLM that has
been told the customer's objective and live wallet. The wizard *skeleton*
remains deterministic on the frontend; this service produces only the content.

Reuses the quota-aware `QuotaFailoverLLM` (Gemini -> Groq) that drives the
main SDUI pipeline, so no new LLM configuration is required.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import uuid

from langchain_core.messages import HumanMessage, SystemMessage

from schemas.objective import (
    CognitiveEvidence,
    ExecutionStep,
    ObjectiveConstraint,
    ObjectiveGenerateRequest,
    ObjectiveGenerateResponse,
    ObjectiveScreenPayload,
    ObjectiveStage,
    RewardOpportunity,
    StrategyCard,
)
from services.llm_router import build_failover_llm
from services.partner_offers import get_filtered_opportunities

# ---------------------------------------------------------------------------
# JSON parsing / repair (mirrors the helpers in workflow/graph.py)
# ---------------------------------------------------------------------------


def _parse_json(text: str) -> dict:
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except (json.JSONDecodeError, TypeError):
                pass
        if isinstance(text, str) and text.lstrip().startswith("{"):
            repaired = _repair_truncated_json(text)
            if repaired is not None:
                print("[OBJECTIVE] Salvaged truncated JSON response")
                return repaired
        return {}


def _repair_truncated_json(text: str):
    try:
        stack = []
        in_str = False
        esc = False
        for ch in text:
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
                continue
            if ch == '"':
                in_str = True
            elif ch in "{[":
                stack.append(ch)
            elif ch in "}]":
                if stack:
                    stack.pop()
        if in_str:
            text = text.rsplit('"', 1)[0] + '"'
        trimmed = text.rstrip()
        closers = "".join("}" if c == "{" else "]" for c in reversed(stack))
        candidate = trimmed + closers
        while True:
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                candidate = candidate[:-1]
                if len(candidate) <= len(trimmed) + 2:
                    return None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Per-stage prompts
# ---------------------------------------------------------------------------


SYSTEM_BASE = """You are a senior rewards redemption strategist for LBG (Lloyds Banking Group).
You help a customer achieve their stated objective using real data about their reward wallet.

Rules:
- Understand the customer's objective before producing content.
- Base every recommendation on the provided wallet (points, tier, brands).
- Be concrete, grounded, and UK-appropriate (use GBP).
- Return ONLY valid JSON. No markdown, no prose outside the JSON object.
- Do not invent brands that are not present in the wallet; prefer the brand(s) the
  customer actually holds points with, plus Cavendish Online which is an LBG reward partner.
"""


def _applied_constraint_texts(objective: str) -> list[str]:
    """Derive applied constraint texts from the stated objective.

    The store's filter engine reads constraint keywords such as 'cashback',
    'conversion rate', 'fee' and 'insurance'. Any fixed numbers mentioned in
    the objective (e.g. £70 cashback, 10:1) are surfaced here so the right
    offers are shortlisted/rejected.
    """
    lean = (objective or "").lower()
    out: list[str] = []

    # Cashback constraint — handles "70 pounds cashback", "£70 cashback",
    # "cashback of £70", "ensuring 70 pounds cashback", etc.
    cashback_match = re.search(r"(?:£|\bpounds?\b)\s*(\d+)", lean)
    if cashback_match:
        out.append(f"cashback {cashback_match.group(1)}")
    else:
        cb_amt = re.search(r"(\d+)\s*(?:pounds?|\bbp\b)?(?:\s*(?:of|in|as|on|back|would give)?\s*(?:cashback|reward|rebate))", lean)
        if cb_amt:
            out.append(f"cashback {cb_amt.group(1)}")

    # Conversion rate constraint (e.g. 10:1)
    rate = re.search(r"(\d+):\s*1(?:\s*conversion)?", lean)
    if rate:
        out.append(f"conversion_rate {rate.group(1)}:1")

    # No transaction/conversion fee constraint
    if "no" in lean and ("fee" in lean or "conversion fee" in lean or "transaction fee" in lean):
        out.append("no_fee")

    # Insurance-applicable constraint
    if "insurance" in lean or "premium" in lean:
        out.append("insurance")

    return out


def _build_user_content(req: ObjectiveGenerateRequest) -> str:
    brands = "\n".join(
        f"- {b.brandName}: {b.points} points" for b in req.wallet.pointsByBrand
    ) or "- (no brand data)"
    constraints = "\n".join(f"- {c}" for c in (req.constraintValues or [])) or "- (none)"
    return f"""Objective: {req.objectiveText or '(not provided)'}
Constraints the customer cares about:
{constraints}
Wallet:
- Total points: {req.wallet.totalPoints}
- LBG coins: {req.wallet.lbgCoins}
- Tier: {req.wallet.tier}
- Brands connected: {req.wallet.brandsConnected}
- Points by brand:
{brands}
Selected plan: {req.selectedPlan or 'none yet'}
Coplan tool request: {req.toolRequest or '(none)'}
"""


def _hard_fact_constraints(objective: str) -> list[ObjectiveConstraint]:
    """Return constraints that are direct hard facts of the stated objective.

    The app's objective is paying an insurance premium using LBG coins while
    maximising the value derived from the rewards balance. These items are
    concrete and objective-specific rather than generic filler, and are used to
    anchor the extracted-constraints list whenever an LLM returns a loose
    "keep it simple"-style constraint that adds no factual information.
    """
    lean = (objective or "").lower()
    constraints: list[ObjectiveConstraint] = []

    # Cashback amount — e.g. "£70 cashback", "70 pounds cashback"
    import re as _re
    m = _re.search(r"(\d+(?:[.,]\d+)?)\s*(?:pounds?|£|gbp)?\s*cashback", lean)
    if m:
        constraints.append(
            ObjectiveConstraint(
                id="c1",
                label="Cashback value",
                value=m.group(0).replace("cashback", "").strip().strip("£"),
                text=f"Ensure at least {m.group(0)} on the payment",
                applied=True,
            )
        )

    # Conversion rate — e.g. "10:1", "minimum 10:1 conversion rate"
    m = _re.search(r"(\d+(?:[.,]\d+)?)\s*:\s*(\d+(?:[.,]\d+)?)", lean)
    if m:
        constraints.append(
            ObjectiveConstraint(
                id="c2",
                label="Conversion rate",
                value=f"{m.group(1)}:{m.group(2)}",
                text="Minimum conversion rate of coins to GBP as stated",
                applied=True,
            )
        )

    # Conversion fee — e.g. "no conversion fee", "zero fee"
    if _re.search(r"no\s+conversion\s+fee|zero\s+fee|no\s+fee", lean):
        constraints.append(
            ObjectiveConstraint(
                id="c3",
                label="Fees",
                value="0",
                text="No conversion fee on the payment",
                applied=True,
            )
        )

    if constraints:
        return constraints

    if "insurance" in lean or "premium" in lean or "pay" in lean:
        return [
            ObjectiveConstraint(id="c1", label="Payment method", value="LBG coins", text="Pay the insurance premium using available LBG coins", applied=True),
            ObjectiveConstraint(id="c2", label="Redemption value", value="Maximise", text="Maximise the value gained from the rewards balance", applied=True),
            ObjectiveConstraint(id="c3", label="Connected brands", value="Use", text="Use existing connected brand points to boost the balance", applied=True),
        ]
    if lean.strip():
        return [
            ObjectiveConstraint(id="c1", label="Goal", value=objective.strip(), text=f"Achieve your goal of: \"{objective.strip()}\"", applied=True),
            ObjectiveConstraint(id="c2", label="Redemption value", value="Maximise", text="Maximise the value gained from the rewards balance", applied=True),
            ObjectiveConstraint(id="c3", label="Connected brands", value="Use", text="Use existing connected brand points to cover the cost", applied=True),
        ]
    return [
        ObjectiveConstraint(id="c1", label="Payment method", value="LBG coins", text="Pay the insurance premium using available LBG coins", applied=True),
        ObjectiveConstraint(id="c2", label="Redemption value", value="Maximise", text="Maximise the value gained from the rewards balance", applied=True),
        ObjectiveConstraint(id="c3", label="Connected brands", value="Use", text="Use existing connected brand points to boost the balance", applied=True),
    ]


PROMPTS: dict[str, str] = {
    "summary": SYSTEM_BASE + """

Generate a concise summary of the customer's objective, phrased as a friendly
recommendation path. Emit:
{"summary": "A short, warm summary sentence referencing what they want and that
we will find the most rewarding path."}
""",
    "constraints": SYSTEM_BASE + """

This is the planning stage for the customer's stated objective (e.g. paying an
insurance bill using LBG coins while maximising value).
IMPORTANT: Do NOT name any specific provider or partner brand (for example
Cavendish Online or Alpha Medical) at this stage. Partners are revealed only in
the later opportunities and strategies steps.
Each constraint MUST be a specific, factual requirement extracted directly from
the customer's objective and live wallet, expressed as a structured label/value
pair. "label" is a short canonical name (e.g. "Cashback value", "Conversion
rate", "Fees", "Redemption value", "Steps") and "value" is the concrete number,
ratio or figure the user stated (e.g. "£70", "10:1", "0", "High"). Include a
human-readable "text" sentence for display. Do not emit generic or stock filler
constraints such as "keep it simple", "keep it quick", or "straightforward".
The three items together should read as concrete hard facts — things that are
actually true of this customer's stated goal and available balance. Emit:
{"constraints": [
  {"id": "c1", "label": "Cashback value", "value": "£70", "text": "Ensure at least £70 cashback on the payment", "applied": true},
  {"id": "c2", "label": "Conversion rate", "value": "10:1", "text": "Minimum 10:1 conversion rate of coins to GBP", "applied": true},
  {"id": "c3", "label": "Fees", "value": "0", "text": "No conversion fee on the payment", "applied": true}
]}
Provide 3 constraints that are directly tied to this specific objective, phrased
in plain, non-branded language.
""",
    "opportunities": SYSTEM_BASE + """

Produce reward opportunities that are realistic for this customer's wallet and
objective. Prefer real partners from the wallet or Cavendish Online. Emit:
{"opportunities": [
  {"id": "opp-1", "title": "...", "description": "...", "partner": "...", "estimatedValue": "£20"},
  ...
]}
Estimate values in GBP consistent with their point balances. Provide 3 items.
""",
    "strategies": SYSTEM_BASE + """

Produce exactly four redemption strategy plans for the objective. The first must be
a simple single-step path ("simplicity"); the second a higher-value consolidated
path ("max-redeem") that first converts Alpha Medical points into LBG coins and
then pays Cavendish Online; the third a "monitor" plan where the customer takes
no action and we simply monitor for new future strategies; and the fourth a
"no-redeem" plan where the customer pays Cavendish Online directly without using
any LBG coins or rewards.And i want the description of the strategies to be just 2 lines short decsription.
 Emit:
{"strategies": [
  {"id": "simplicity", "type": "simplicity", "title": "Simplicity Plan", "description": "...", "order": 1},
  {"id": "max-redeem", "type": "max-redeem", "title": "Maximum Value Plan", "description": "...", "order": 2},
  {"id": "monitor", "type": "monitor", "title": "Monitor Plan", "description": "...", "order": 3},
  {"id": "no-redeem", "type": "no-redeem", "title": "No Rewards Plan", "description": "...", "order": 4}
]}
If a Coplan tool request is present in the prompt, adapt the short plan descriptions so
the plans directly answer that request (e.g. explain, combine, edit constraints,
or compare). Keep the same four ids/types/titles.
""",
    "evidence": SYSTEM_BASE + """

The customer selected the plan "{plan}". Produce cognitive evidence that is factual
and grounded in BOTH the customer's stated objective AND their constraints. The
evidence should explain:
1. what the user gave as their objective,
2. which plan they chose and why this plan is a good fit for this specific user
   and this objective,
3. what constraints the user gave and how this strategy honours each constraint,
4. how this strategy will help the user achieve their objective.

Base every point directly on the supplied "Objective" and "Constraints" rather
than generic filler. Use the live wallet numbers when they support a point.
If the plan is "simplicity" the reasoning should reflect a simple, single-step
path using the current LBG coin balance. If the plan is "max-redeem" it should
reflect converting partner-brand points into LBG coins first for a larger
combined payment. If the plan is "hybrid", a balanced single-step path that still
folds in partner points.
Emit at least 6 sharp, factual points:
{"evidence": {"summary": "one or two sentences linking the objective, chosen plan and constraints", "factors": ["fact 1", "fact 2", "fact 3", "fact 4", "fact 5", "fact 6", ...]}}
""",
    "execution": SYSTEM_BASE + """

Produce the ordered execution steps to carry out the selected plan "{plan}". If
the plan is "max-redeem" include a consolidation step at a brand they hold
points with first, then a redemption via Cavendish Online. Emit:
{"executionSteps": [
  {"id": "step-1", "label": "...", "partner": "...", "partnerUrl": "http://localhost:5175", "status": "pending"},
  ...
]}
Use realistic partner names. Set partnerUrl to the exact fixed partner base URL:
- "http://localhost:5174" when partner is "Alpha Medical"
- "http://localhost:5175" when partner is "Cavendish Online"
""",
}


class ObjectiveService:
    def __init__(self, llm=None):
        self.llm = llm or self._build_llm()
        self._cache: dict[str, dict] = {}

    @staticmethod
    def _build_llm():
        gemini_keys = []
        for i in range(1, 4):
            key = os.getenv(f"GEMINI_API_KEY_{i}", "")
            if key:
                gemini_keys.append(key)
        return build_failover_llm(
            gemini_api_keys=gemini_keys,
            groq_api_key=os.getenv("GROQ_API_KEY", ""),
            groq_model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
        )

    def _cache_key(self, req: ObjectiveGenerateRequest) -> str:
        raw = json.dumps(
            {
                "obj": req.objectiveText,
                "stage": req.stage.value,
                "plan": req.selectedPlan,
                "toolRequest": req.toolRequest or "",
                "total": req.wallet.totalPoints,
                "tier": req.wallet.tier,
                "brands": [(b.brandName, b.points) for b in req.wallet.pointsByBrand],
            },
            sort_keys=True,
        )
        return hashlib.sha256(raw.encode()).hexdigest()

    async def generate(self, req: ObjectiveGenerateRequest) -> dict:
        correlation_id = uuid.uuid4().hex[:8]
        cache_key = self._cache_key(req)
        if cache_key in self._cache:
            print(f"[OBJECTIVE] Cache hit stage={req.stage.value}")
        else:
            print(f"[OBJECTIVE] Generating stage={req.stage.value} corr={correlation_id}")

        content = await self._invoke(req, cache_key)

        if not content:
            return ObjectiveGenerateResponse(
                status="REJECTED",
                correlationId=correlation_id,
                reasonCodes=["EMPTY_LLM_RESPONSE"],
                error="The AI returned no usable content. Please try again.",
            ).model_dump()

        screen = self._build_screen(req, content)
        if not screen:
            return ObjectiveGenerateResponse(
                status="REJECTED",
                correlationId=correlation_id,
                reasonCodes=["INVALID_SCREEN"],
                error="The AI response did not match the expected structure. Please try again.",
            ).model_dump()

        self._cache[cache_key] = content
        return ObjectiveGenerateResponse(
            status="PERSONALIZED",
            correlationId=correlation_id,
            screen=screen,
            confidence=0.9,
        ).model_dump()

    async def _invoke(self, req: ObjectiveGenerateRequest, cache_key: str) -> dict | None:
        if cache_key in self._cache:
            return self._cache[cache_key]
        if getattr(self, "_mock_mode", False):
            return self._mock_content(req)
        prompt = PROMPTS.get(req.stage.value)
        if not prompt:
            return None
        plan_label = req.selectedPlan or "simplicity"
        if req.stage.value in ("evidence", "execution"):
            prompt = prompt.replace("{plan}", plan_label)
        try:
            response = self.llm.invoke(
                [SystemMessage(content=prompt), HumanMessage(content=_build_user_content(req))]
            )
            text = getattr(response, "content", "") or ""
            parsed = _parse_json(str(text))
            return parsed or None
        except Exception as e:
            print(f"[OBJECTIVE] LLM invoke failed stage={req.stage.value}: {e}")
            return None

    def _build_screen(self, req: ObjectiveGenerateRequest, content: dict) -> ObjectiveScreenPayload | None:
        stage = req.stage.value
        payload = ObjectiveScreenPayload(screenType=stage)

        if stage == "summary":
            s = content.get("summary")
            if not isinstance(s, str) or not s:
                return None
            payload.summary = s

        elif stage == "constraints":
            items = content.get("constraints", [])
            parsed: list[ObjectiveConstraint] = []
            for it in items or []:
                if not isinstance(it, dict):
                    continue
                parsed.append(
                    ObjectiveConstraint(
                        id=it.get("id") or f"c{len(parsed)+1}",
                        text=it.get("text") or "",
                        label=it.get("label") or "",
                        value=it.get("value") or "",
                        applied=bool(it.get("applied", False)),
                    )
                )
            if not parsed:
                return None
            # Guard: drop generic/stock filler constraints and anchor the list on
            # the actual hard facts of the customer's objective so every item is
            # directly tied to what they asked for (never a loose "keep it simple").
            keep = []
            for c in parsed:
                low = (c.text or "").lower()
                if any(g in low for g in ("keep it simple", "keep it quick", "straightforward", "keep the redemption process simple")):
                    continue
                keep.append(c)
            if len(keep) < 3:
                keep = _hard_fact_constraints(req.objectiveText) + [
                    c for c in keep if c.text not in {d.text for d in _hard_fact_constraints(req.objectiveText)}
                ]
            payload.constraints = keep[:3]

        elif stage == "opportunities":
            # Reward opportunities come from the partner offers data store,
            # filtered by the applied constraints to partition into
            # shortlisted and rejected buckets. The applied constraints come
            # from the user's objective (reverse-engineered from the constraint
            # stage) and are used to decide which offer qualifies.
            applied_constraints = req.constraintValues or _applied_constraint_texts(req.objectiveText)
            shortlisted, rejected = get_filtered_opportunities(
                req.objectiveText,
                applied_constraints,
            )
            payload.opportunities = shortlisted
            payload.shortlisted = shortlisted
            payload.rejected = rejected

        elif stage == "strategies":
            items = content.get("strategies", [])
            parsed: list[StrategyCard] = []
            for it in items or []:
                if not isinstance(it, dict):
                    continue
                parsed.append(
                    StrategyCard(
                        id=it.get("id") or f"strat-{len(parsed)+1}",
                        type=it.get("type") or ("simplicity" if len(parsed) == 0 else "max-redeem"),
                        title=it.get("title") or "",
                        description=it.get("description") or "",
                        order=int(it.get("order", len(parsed) + 1)),
                    )
                )
            if not parsed:
                return None
            payload.strategies = parsed

        elif stage == "evidence":
            ev = content.get("evidence")
            if not isinstance(ev, dict):
                return None
            factors = ev.get("factors", [])
            if not isinstance(factors, list):
                factors = []
            payload.evidence = CognitiveEvidence(
                summary=ev.get("summary") or "",
                factors=[str(f) for f in factors],
            )

        elif stage == "execution":
            items = content.get("executionSteps", [])
            parsed: list[ExecutionStep] = []
            for it in items or []:
                if not isinstance(it, dict):
                    continue
                parsed.append(
                    ExecutionStep(
                        id=it.get("id") or f"step-{len(parsed)+1}",
                        label=it.get("label") or "",
                        partner=it.get("partner") or "",
                        partnerUrl=it.get("partnerUrl") or "",
                        status=it.get("status") or "pending",
                    )
                )
            if not parsed:
                return None
            payload.executionSteps = parsed

        else:
            return None

        return payload

    def _mock_content(self, req: ObjectiveGenerateRequest) -> dict:
        stage = req.stage.value
        if stage == "summary":
            return {"summary": f'Based on your input, you are looking to "{req.objectiveText}" — we will find the most rewarding path for you.'}
        if stage == "constraints":
            return {
                "constraints": [
                    {"id": "c1", "label": "Effort", "value": "Low", "text": "Pay my insurance with the least amount of effort", "applied": True},
                    {"id": "c2", "label": "Redemption value", "value": "Maximise", "text": "Get the most value from my rewards balance", "applied": True},
                    {"id": "c3", "label": "Steps", "value": "Few", "text": "Keep everything in as few steps as possible", "applied": True},
                ]
            }
        if stage == "opportunities":
            shortlisted, rejected = get_filtered_opportunities(
                req.objectiveText,
                req.constraintValues or _applied_constraint_texts(req.objectiveText),
            )
            return {
                "shortlisted": [s.model_dump() for s in shortlisted],
                "rejected": [r.model_dump() for r in rejected],
            }
        if stage == "strategies":
            request = (req.toolRequest or "").strip()
            adapt = f" ({request})" if request else ""
            return {
                "strategies": [
                    {"id": "simplicity", "type": "simplicity", "title": "Simplicity Plan", "description": f"A single-step path that uses your existing LBG coin balance to pay the Cavendish Online insurance premium. Quick and easy.{adapt}", "order": 1},
                    {"id": "max-redeem", "type": "max-redeem", "title": "Maximum Value Plan", "description": f"Convert Alpha Medical points into LBG coins first, then pay the Cavendish Online insurance premium for higher combined value.{adapt}", "order": 2},
                    {"id": "monitor", "type": "monitor", "title": "Monitor Plan", "description": f"Take no action for now. We will keep watching for new strategies for your objective and let you know when something valuable appears.{adapt}", "order": 3},
                    {"id": "no-redeem", "type": "no-redeem", "title": "No Rewards Plan", "description": f"Pay your Cavendish Online insurance directly with cash, keeping all of your LBG coins and rewards untouched.{adapt}", "order": 4},
                ]
            }
        if stage == "evidence":
            plan = req.selectedPlan or "simplicity"
            objective = (req.objectiveText or "").strip() or "your insurance payment"
            constraints = req.constraintValues or _applied_constraint_texts(req.objectiveText)
            cons_text = "; ".join(constraints) if constraints else "no extra constraints beyond achieving your objective"
            if plan == "hybrid":
                return {
                    "evidence": {
                        "summary": f"Your objective is “{objective}”. You chose the Best of Both plan, which keeps the payment as simple as a single step while folding in your partner points — so every constraint you gave is met with the least effort.",
                        "factors": [
                            f"You want to: {objective}.",
                            "You chose the Best of Both plan, which balances ease and value.",
                            "Your partner points are converted into LBG coins automatically.",
                            f"Your constraints are respected: {cons_text}.",
                            "A single payment keeps the journey simple for you.",
                            "This plan helps you reach your objective without extra actions.",
                        ],
                    }
                }
            if plan == "max-redeem":
                return {
                    "evidence": {
                        "summary": f"Your objective is “{objective}”. You chose the Maximum Value plan, which converts your partner-brand points into LBG coins first so the larger combined balance covers the payment and your constraints are met.",
                        "factors": [
                            f"You want to: {objective}.",
                            "You chose the Maximum Value plan, which maximises what you get back.",
                            "Converting partner points into LBG coins grows your balance first.",
                            f"Your constraints are respected: {cons_text}.",
                            "Your combined balance covers the full insurance premium.",
                            "This plan helps you achieve your objective with the most value.",
                        ],
                    }
                }
            return {
                "evidence": {
                    "summary": f"Your objective is “{objective}”. You chose the Simplicity plan, which uses your current LBG coins to pay in one smooth step, so your constraints are met quickly and with no waiting on conversions.",
                    "factors": [
                        f"You want to: {objective}.",
                        "You chose the Simplicity plan, which is quick and one-step.",
                        "Your current LBG coin balance is ready to pay right away.",
                        f"Your constraints are respected: {cons_text}.",
                        "No waiting on conversions from partner brands.",
                        "This plan helps you achieve your objective in the simplest way.",
                    ],
                }
            }
        if stage == "execution":
            plan = req.selectedPlan or "simplicity"
            if plan == "max-redeem":
                return {
                    "executionSteps": [
                        {"id": "step-1", "label": "Convert Alpha Medical points to LBG coins", "partner": "Alpha Medical", "partnerUrl": "http://localhost:5174/lbg-rewards/convert", "status": "pending"},
                        {"id": "step-2", "label": "Return to your workspace", "partner": "LBG Coins", "partnerUrl": "http://localhost:5173", "status": "pending"},
                        {"id": "step-3", "label": "Pay your Cavendish Online insurance", "partner": "Cavendish Online", "partnerUrl": "http://localhost:5175/#/checkout", "status": "pending"},
                    ]
                }
            return {
                "executionSteps": [
                    {"id": "step-1", "label": "Use your existing LBG coin balance", "partner": "LBG Coins", "partnerUrl": "http://localhost:5173", "status": "pending"},
                    {"id": "step-2", "label": "Pay your Cavendish Online insurance", "partner": "Cavendish Online", "partnerUrl": "http://localhost:5175/#/checkout", "status": "pending"},
                ]
            }
        return {}
