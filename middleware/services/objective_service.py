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
from schemas.sdui import SDUIComponent
from services.llm_router import build_failover_llm

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


def _build_user_content(req: ObjectiveGenerateRequest) -> str:
    brands = "\n".join(
        f"- {b.brandName}: {b.points} points" for b in req.wallet.pointsByBrand
    ) or "- (no brand data)"
    return f"""Objective: {req.objectiveText or '(not provided)'}
Wallet:
- Total points: {req.wallet.totalPoints}
- LBG coins: {req.wallet.lbgCoins}
- Tier: {req.wallet.tier}
- Brands connected: {req.wallet.brandsConnected}
- Points by brand:
{brands}
Selected plan: {req.selectedPlan or 'none yet'}
"""


PROMPTS: dict[str, str] = {
    "summary": SYSTEM_BASE + """

Generate a concise summary of the customer's objective, phrased as a friendly
recommendation path. Emit:
{"summary": "A short, warm summary sentence referencing what they want and that
we will find the most rewarding path."}
""",
    "constraints": SYSTEM_BASE + """

Based on the objective and wallet, determine which reward-relevant constraints
should guide planning. Emit an array. Each constraint is a structured label/value
pair where "label" is a short canonical name (e.g. "Cashback value", "Conversion
rate", "Fees", "Redemption value", "Steps") and "value" is the concrete number,
ratio or figure the user stated (e.g. "£70", "10:1", "0", "High"). Also include a
"text" with the full human-readable sentence for display. Emit:
{"constraints": [
  {"id": "c1", "label": "Cashback value", "value": "£70", "text": "Ensure at least £70 cashback on the payment", "applied": true},
  {"id": "c2", "label": "Conversion rate", "value": "10:1", "text": "Minimum 10:1 conversion rate of coins to GBP", "applied": true},
  {"id": "c3", "label": "Fees", "value": "0", "text": "No conversion fee on the payment", "applied": true}
]}
Provide 3 constraints. Mark "applied" true when it genuinely matters to this
customer (e.g. prefer quick steps if the objective is urgent).
IMPORTANT: Each constraint must be a concrete hard fact extracted directly from
the stated objective and wallet — with a real numeric or ratio "value" drawn from
the objective (e.g. cashback amount, conversion rate, fee amount) and a clean
canonical "label". Do not emit generic filler such as "keep it simple".
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

Produce up to 2 distinct redemption strategy plans for the objective. The first
should be a simple single-step path; the second a higher-value consolidated path
if the wallet has points across multiple brands. Emit:
{"strategies": [
  {"id": "simplicity", "type": "simplicity", "title": "...", "description": "...", "order": 1},
  {"id": "max-redeem", "type": "max-redeem", "title": "...", "description": "...", "order": 2}
]}
""",
    "evidence": SYSTEM_BASE + """

The customer selected the plan "{plan}". Produce cognitive evidence explaining
why this plan is recommended for them, grounded in their wallet. Emit:
{"evidence": {"summary": "one or two sentences", "factors": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"]}}
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


# ---------------------------------------------------------------------------
# SDUI composition helpers
#
# Each wizard stage is composed into a generic list of SDUIComponent so the
# frontend can render it through a component registry (the same contract as the
# Rewards Dashboard). Interactive actions are attached as SDUI actions with a
# type the registry wires to a real handler.
# ---------------------------------------------------------------------------


def _comp(comp_id: str, comp_type: str, props: dict, actions: list = None) -> SDUIComponent:
    return SDUIComponent(
        id=comp_id,
        type=comp_type,
        version="1.0",
        priority=0,
        props=props,
        actions=actions or [],
    )


def _headline(objective: str, eyebrow: str = "Your Objective") -> SDUIComponent:
    return _comp(
        "obj-headline",
        "OBJECTIVE_HEADLINE",
        {"eyebrow": eyebrow, "title": objective},
    )


def _nav(primary: str = "Next", secondary: str = None, is_next: bool = True) -> SDUIComponent:
    actions = []
    if secondary:
        actions.append({"type": "OBJECTIVE_MODIFY", "payload": {}})
    if is_next:
        actions.append({"type": "OBJECTIVE_NEXT", "payload": {}})
    return _comp(
        "obj-nav",
        "OBJECTIVE_NAV",
        {"primary": primary, "secondary": secondary},
        actions,
    )


def _hard_fact_constraints(objective: str) -> list[ObjectiveConstraint]:
    """Return constraints that are direct hard facts of the stated objective.

    The app's objective is paying an insurance premium using LBG coins while
    maximising the value derived from the rewards balance. These items are
    concrete and objective-specific rather than generic filler, used to anchor
    the extracted-constraints list whenever an LLM returns a loose
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


def _compose_summary(screen: ObjectiveScreenPayload) -> list[SDUIComponent]:
    return [
        _headline("Summary of your Objective", eyebrow=""),
        _comp("obj-summary", "OBJECTIVE_SUMMARY_CARD", {"summary": screen.summary or ""}),
        _nav(secondary="Modify"),
    ]


def _compose_constraints(screen: ObjectiveScreenPayload, objective: str) -> list[SDUIComponent]:
    items = [
        {"id": c.id, "text": c.text, "applied": c.applied}
        for c in screen.constraints
    ]
    return [
        _headline(objective),
        _comp("obj-constraints", "OBJECTIVE_CONSTRAINTS", {"items": items}),
        _nav(secondary="Modify"),
    ]


def _compose_opportunities(screen: ObjectiveScreenPayload, objective: str) -> list[SDUIComponent]:
    items = [
        {
            "id": o.id,
            "title": o.title,
            "description": o.description,
            "partner": o.partner,
            "estimatedValue": o.estimatedValue,
        }
        for o in screen.opportunities
    ]
    return [
        _headline(objective),
        _comp("obj-opps", "OBJECTIVE_OPPORTUNITIES", {"items": items}),
        _nav(),
    ]


def _compose_strategies(screen: ObjectiveScreenPayload) -> list[SDUIComponent]:
    items = [
        {
            "id": s.id,
            "type": s.type,
            "title": s.title,
            "description": s.description,
            "order": s.order,
            "actions": [{"type": "OBJECTIVE_SELECT_PLAN", "payload": {"type": s.type}}],
        }
        for s in sorted(screen.strategies, key=lambda s: s.order)
    ]
    return [
        _headline("Choose Your Strategy", eyebrow="Step 2"),
        _comp("obj-strategies", "OBJECTIVE_STRATEGIES", {"items": items}),
        _comp("obj-ai-tools", "OBJECTIVE_AI_TOOLS", {"tools": ["Understand", "Compare", "Consolidate", "Change Constraints", "Learn More"]}),
        _nav(),
    ]


def _compose_evidence(screen: ObjectiveScreenPayload, plan: str) -> list[SDUIComponent]:
    plan_title = "Maximum Value Plan" if plan == "max-redeem" else "Simplicity Plan"
    return [
        _headline(plan_title, eyebrow=""),
        _comp(
            "obj-evidence",
            "OBJECTIVE_EVIDENCE",
            {
                "title": "Cognitive Evidence",
                "summary": screen.evidence.summary if screen.evidence else "",
                "factors": screen.evidence.factors if screen.evidence else [],
            },
        ),
        _nav(),
    ]


def _compose_execution(screen: ObjectiveScreenPayload, plan: str) -> list[SDUIComponent]:
    if plan == "max-redeem":
        plan_label, desc = "Maximum Value Plan", "Convert Alpha Medical points into LBG coins first, then pay for your Cavendish Online insurance for higher combined value."
    else:
        plan_label, desc = "Simplicity Plan", "Use your existing LBG coin balance to pay for your Cavendish Online insurance in a single step."
    items = [
        {"id": e.id, "label": e.label, "partner": e.partner, "status": e.status}
        for e in screen.executionSteps
    ]
    return [
        _comp("obj-exec-header", "OBJECTIVE_EXECUTION_HEADER", {"planLabel": plan_label, "description": desc}),
        _comp(
            "obj-steps",
            "OBJECTIVE_EXECUTION_STEPS",
            {"items": items},
        ),
    ]


def _compose_screen(stage: str, screen: ObjectiveScreenPayload, objective: str, plan: str | None) -> list[SDUIComponent]:
    if stage == "summary":
        return _compose_summary(screen)
    if stage == "constraints":
        return _compose_constraints(screen, objective)
    if stage == "opportunities":
        return _compose_opportunities(screen, objective)
    if stage == "strategies":
        return _compose_strategies(screen)
    if stage == "evidence":
        return _compose_evidence(screen, plan or "simplicity")
    if stage == "execution":
        return _compose_execution(screen, plan or "simplicity")
    return []


class ObjectiveService:
    def __init__(self, llm=None):
        self.llm = llm or self._build_llm()
        self._cache: dict[str, dict] = {}
        self._mock_mode = os.getenv("MOCK_OBJECTIVE_MODE", "").lower() in ("1", "true", "yes")
        if self._mock_mode:
            print("[OBJECTIVE] Mock mode enabled — skipping LLM calls")

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

        components = _compose_screen(
            req.stage.value, screen, req.objectiveText, req.selectedPlan
        )
        if not components:
            return ObjectiveGenerateResponse(
                status="REJECTED",
                correlationId=correlation_id,
                reasonCodes=["INVALID_SCREEN"],
                error="The AI response could not be composed into UI components. Please try again.",
            ).model_dump()

        self._cache[cache_key] = content
        return ObjectiveGenerateResponse(
            status="PERSONALIZED",
            correlationId=correlation_id,
            components=components,
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
            payload.constraints = parsed

        elif stage == "opportunities":
            items = content.get("opportunities", [])
            parsed: list[RewardOpportunity] = []
            for it in items or []:
                if not isinstance(it, dict):
                    continue
                parsed.append(
                    RewardOpportunity(
                        id=it.get("id") or f"opp-{len(parsed)+1}",
                        title=it.get("title") or "",
                        description=it.get("description") or "",
                        partner=it.get("partner") or "",
                        estimatedValue=it.get("estimatedValue") or "",
                    )
                )
            if not parsed:
                return None
            payload.opportunities = parsed

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
                    {"id": "c1", "label": "Redemption value", "value": "Maximise", "text": "Maximise redemption value", "applied": True},
                    {"id": "c2", "label": "Steps", "value": "Quick", "text": "Prefer quick and simple steps", "applied": True},
                    {"id": "c3", "label": "Offers", "value": "Use", "text": "Use available partner offers", "applied": True},
                ]
            }
        if stage == "opportunities":
            return {
                "opportunities": [
                    {"id": "opp-1", "title": "Cavendish Voucher", "description": "Redeem 2,000 points for a £20 Cavendish gift card.", "partner": "Cavendish Online", "estimatedValue": "£20"},
                    {"id": "opp-2", "title": "Alpha Medical Credit", "description": "Consolidate your Alpha Medical points to unlock a combined redemption.", "partner": "Alpha Medical", "estimatedValue": "£15"},
                    {"id": "opp-3", "title": "Weekend Dining Deal", "description": "Use 1,500 points for a weekend dining experience.", "partner": "Cavendish Online", "estimatedValue": "£15"},
                ]
            }
        if stage == "strategies":
            return {
                "strategies": [
                    {"id": "simplicity", "type": "simplicity", "title": "Simplicity Plan", "description": "A single-step path that uses your existing LBG coin balance to pay the Cavendish Online insurance premium. Quick and easy.", "order": 1},
                    {"id": "max-redeem", "type": "max-redeem", "title": "Maximum Value Plan", "description": "Convert Alpha Medical points into LBG coins first, then pay the Cavendish Online insurance premium for higher combined value.", "order": 2},
                ]
            }
        if stage == "evidence":
            return {
                "evidence": {
                    "summary": "Based on your current balances and recent activity, this plan optimises your total redemption value.",
                    "factors": [
                        "Consolidating first yields approximately £8 more value.",
                        "Your tier qualifies you for the premium conversion rate.",
                        "Idle points lose value over time.",
                        "Cavendish Online offers a bonus on combined redemptions.",
                    ],
                }
            }
        if stage == "execution":
            plan = req.selectedPlan or "simplicity"
            if plan == "max-redeem":
                return {
                    "executionSteps": [
                        {"id": "step-1", "label": "Consolidate points at Alpha Medical", "partner": "Alpha Medical", "partnerUrl": "http://localhost:5174", "status": "pending"},
                        {"id": "step-2", "label": "Redeem points via Cavendish Online", "partner": "Cavendish Online", "partnerUrl": "http://localhost:5175", "status": "pending"},
                    ]
                }
            return {
                "executionSteps": [
                    {"id": "step-1", "label": "Redeem points via Cavendish Online", "partner": "Cavendish Online", "partnerUrl": "http://localhost:5175", "status": "pending"},
                ]
            }
        return {}
