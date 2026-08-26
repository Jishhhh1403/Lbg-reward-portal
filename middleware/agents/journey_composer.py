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


def validate_plan_payload(parsed: dict) -> tuple:
    """Validate raw committee output into ExperienceJourneyPlan + structural gate."""
    normalized = _normalize_terminal_transitions(parsed)
    model, error = parse_model(ExperienceJourneyPlan, normalized.get("experienceJourneyPlan") or normalized)
    if error:
        return None, error
    result = validate_journey_plan(model, MINI_JOURNEY_MAX, MINI_JOURNEY_MIN)
    if not result.passed:
        return None, "; ".join(result.errors)
    return model, None
