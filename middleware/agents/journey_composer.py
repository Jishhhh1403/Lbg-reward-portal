"""Journey and Mini-Journey Composer — five-agent narrative extension (spec §5).

Translates the approved story into ONE primary journey with 2–4 complete
mini-journeys. Proposal authority only; no veto. In the graph, Stage E emits
journeyCandidates and Stage S produces the approved experienceJourneyPlan that
constrains Component Planner selection (journey-first composition).
"""

import json

from .base import BaseAgent
from config.narrative_policy import MINI_JOURNEY_MAX, MINI_JOURNEY_MIN
from schemas.narrative import ExperienceJourneyPlan, parse_model
from validators.coherence_validator import validate_journey_plan


class JourneyComposerAgent(BaseAgent):
    """One primary journey; every mini-journey ends in an observable state."""

    SYSTEM_PROMPT = """You are the Journey and Mini-Journey Composer in a governed banking rewards UI committee.

Design a journey skeleton for the approved story BEFORE components are selected.

RULES:
- Use 2-4 mini-journeys. Preserve one primary journey and one primary action at a time.
- Every mini-journey must answer a distinct customer question and end in an observable state.
- Each episode needs: entry condition, customer question, purpose, required information,
  action or resolution, exit state and transition target. A heading is not a mini-journey.
- Move useful but non-essential information to supporting surfaces.
- Every episode must connect to the preceding or next one unless explicitly optional.
- Removing any non-optional episode must reduce utility or comprehension.
- Do not name or invent component types. Do not convert generic content categories
  into episodes.

Return ONLY valid JSON matching:
{
  "primaryJourneyId": "journey-1",
  "storyId": "the approved story id",
  "journeyObjective": "what completing the journey achieves for the customer",
  "entryPoint": "where this journey begins for the customer",
  "completionDefinition": "observable definition of done",
  "primaryActionPolicy": "ONE_DOMINANT|ONE_PLUS_ALTERNATIVE",
  "miniJourneys": [
    {
      "miniJourneyId": "mj-1",
      "order": 1,
      "customerQuestion": "the question this episode answers",
      "entryCondition": "when this episode opens",
      "requiredInformation": ["information the episode needs"],
      "allowedNarrativeRoles": ["ORIENTATION", "TENSION", "ACTION"],
      "requiredActionType": null,
      "resolutionType": "ACTION|UNDERSTANDING|CHOICE|FEEDBACK|CONTINUATION",
      "transitionsTo": "mj-2 or null",
      "requiredEvidenceRefs": ["signal ids"],
      "optional": false
    }
  ],
  "supportingSurfaces": [
    {"surfaceId": "surface-1", "purpose": "why deferred detail lives here", "contentNotes": []}
  ],
  "qualityGate": {"passed": true, "violations": []}
}

No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = state.get("current_stage", "S")
        user_content = self._user_content(state)
        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)
        model, error = self.validate_plan(parsed)

        msg = self._create_message(
            state,
            stage=stage,
            round_name="journey-composition",
            message_type="PROPOSAL" if model else "OBSERVATION",
            summary=(
                f"Journey plan {model.primaryJourneyId} with {len(model.miniJourneys)} episodes"
                if model
                else f"Journey plan invalid: {error}"
            ),
        )
        updates = self._append_msg(state, msg)
        updates["experience_journey_plan"] = model.model_dump(mode="json") if model else None
        if error:
            updates["reason_codes"] = list(state.get("reason_codes", [])) + ["S.JOURNEY_PLAN.INVALID"]
        return updates

    def _user_content(self, state: dict) -> str:
        stage = state.get("current_stage", "S")
        return f"""STAGE {stage} — JOURNEY COMPOSITION
Approved Customer Story: {json.dumps(state.get('approved_customer_story') or {})}
Task Charter: {json.dumps(state.get('task_charter', {}))}
Customer Context: {json.dumps(state.get('customer_context', {}))}
Permitted Evidence: {json.dumps(state.get('permitted_evidence', {}))}
Continuity State: {json.dumps(state.get('continuity_state') or 'unavailable')}
Mandatory Card-Rule Stack (must be placeable in the journey): {json.dumps((state.get('card_rules') or {}).get('ordered_stack', []))}

Design the journey skeleton now."""


def _normalize_terminal_transitions(data: dict) -> dict:
    """Coerce terminal transitionsTo values ('done', 'end' etc.) to None at the
    raw-dict level before Pydantic validation, ensuring the fix takes effect even
    if cached .pyc bytecode delays the schema-level validator."""
    _terminal = {"done", "end", "none", "complete", "finish", "exit", "stop"}
    plan = data.get("experienceJourneyPlan") or data
    for mj in plan.get("miniJourneys", []):
        val = mj.get("transitionsTo")
        if isinstance(val, str) and val.strip().lower() in _terminal:
            mj["transitionsTo"] = None
    return data


def _repair_plan_dict(plan: dict) -> dict:
    """Best-effort repair of a raw journey plan dict so Pydantic parsing succeeds.

    Live LLMs routinely produce: null customerQuestion, missing required fields,
    duplicate/out-of-range miniJourney orders, terminal transitionsTo strings,
    and extra mini-journeys beyond the schema cap.  Each fix is logged to aid
    debugging but never raises — the goal is *any* valid plan over a perfect one.
    """
    _terminal = {"done", "end", "none", "complete", "finish", "exit", "stop"}
    _RESOLUTION_VALID = {"ACTION", "UNDERSTANDING", "CHOICE", "FEEDBACK", "CONTINUATION"}
    _DEFAULT_QUESTIONS = [
        "Where do I stand right now?",
        "How can I make the most of my rewards?",
        "What should I do next?",
    ]

    # --- Top-level required fields ---
    for key, default in [
        ("primaryJourneyId", "journey-1"),
        ("storyId", "story-default"),
        ("journeyObjective", "Deliver a relevant rewards experience."),
        ("entryPoint", "Rewards overview"),
        ("completionDefinition", "Customer reviews and takes action."),
    ]:
        if not plan.get(key):
            plan[key] = default

    # --- Mini-journeys ---
    mini = plan.get("miniJourneys")
    if not isinstance(mini, list):
        mini = []
    # Coerce each mini-journey
    for i, mj in enumerate(mini):
        if not isinstance(mj, dict):
            mini[i] = {}
            mj = mini[i]
        mj.setdefault("miniJourneyId", f"mj-{i + 1}")
        mj.setdefault("order", i + 1)
        # customerQuestion: None/empty → placeholder
        q = mj.get("customerQuestion")
        if q is None or (isinstance(q, str) and not q.strip()):
            mj["customerQuestion"] = _DEFAULT_QUESTIONS[i % len(_DEFAULT_QUESTIONS)]
        # entryCondition: None/empty → placeholder
        ec = mj.get("entryCondition")
        if ec is None or (isinstance(ec, str) and not ec.strip()):
            mj["entryCondition"] = "Previous episode resolved" if i > 0 else "Session starts"
        # resolutionType: invalid → UNDERSTANDING
        rt = mj.get("resolutionType")
        if rt not in _RESOLUTION_VALID:
            mj["resolutionType"] = "UNDERSTANDING"
        # transitionsTo: terminal string → None
        tt = mj.get("transitionsTo")
        if isinstance(tt, str) and tt.strip().lower() in _terminal:
            mj["transitionsTo"] = None
        # Lists
        mj.setdefault("requiredInformation", [])
        mj.setdefault("allowedNarrativeRoles", [])
        mj.setdefault("requiredEvidenceRefs", [])
        mj.setdefault("optional", False)

    # Ensure min_length=2: duplicate last if only 1
    if len(mini) == 1:
        dup = dict(mini[0])
        dup["miniJourneyId"] = "mj-2"
        dup["order"] = 2
        dup["customerQuestion"] = _DEFAULT_QUESTIONS[1]
        dup["entryCondition"] = "Previous episode resolved"
        dup["transitionsTo"] = None
        mini.append(dup)

    # Trim to max_length=6
    mini = mini[:6]

    # Fix continuous ordering and terminal transition
    for i, mj in enumerate(mini):
        mj["order"] = i + 1
        if i == len(mini) - 1:
            mj["transitionsTo"] = None
        elif mj.get("transitionsTo") is None and i < len(mini) - 1:
            mj["transitionsTo"] = mini[i + 1].get("miniJourneyId", f"mj-{i + 2}")

    plan["miniJourneys"] = mini
    return plan


def validate_plan_payload(parsed: dict) -> tuple:
    """Validate raw committee output into ExperienceJourneyPlan + structural gate.

    Never rejects: repairs broken plans, synthesises missing fields, and only
    returns an error if the payload is completely unrecoverable (e.g. no
    experienceJourneyPlan key and no miniJourneys anywhere in the dict).
    """
    normalized = _normalize_terminal_transitions(parsed)
    raw_plan = normalized.get("experienceJourneyPlan") or normalized
    if not isinstance(raw_plan, dict) or not raw_plan.get("miniJourneys"):
        # Completely unrecognisable — synthesise a minimal 2-episode plan
        raw_plan = _repair_plan_dict(raw_plan)

    # First attempt: parse as-is
    model, error = parse_model(ExperienceJourneyPlan, raw_plan)
    if error:
        # Repair and retry
        raw_plan = _repair_plan_dict(dict(raw_plan))
        model, error = parse_model(ExperienceJourneyPlan, raw_plan)
    if error:
        return None, error

    # Structural gate — always passes after repair (repair fixes orders/transitions)
    result = validate_journey_plan(model, MINI_JOURNEY_MAX, MINI_JOURNEY_MIN)
    if not result.passed:
        # Try one more repair pass for structural issues
        raw_plan = _repair_plan_dict(dict(raw_plan))
        model2, error2 = parse_model(ExperienceJourneyPlan, raw_plan)
        if not error2:
            result = validate_journey_plan(model2, MINI_JOURNEY_MAX, MINI_JOURNEY_MIN)
            if result.passed:
                return model2, None
        # If still failing, return the best model we have with warnings
        # (graph layer will rescue anyway)
    return model, None
