"""Narrative Sequence and Transition Agent — five-agent narrative extension (spec §6).

Orders candidate components by causal/semantic relationship, assigns narrative
roles, defines dependencies, bridge logic and deferrals. May re-order or defer
but may never invent unregistered components, customer facts or legal copy.
"""

import json

from .base import BaseAgent
from schemas.narrative import NarrativeSequence, parse_model
from validators.coherence_validator import validate_narrative_sequence

_VALID_RELATIONSHIPS = frozenset({
    "situation-to-meaning", "progress-to-gap", "choice-to-action",
    "action-to-feedback", "feedback-to-payoff", "payoff-to-continuation",
    "episode-boundary", "sequential", "bridges",
})


def _repair_transitions(raw_seq: dict) -> tuple[dict, list[str]]:
    """Fill missing required fields on narrative transitions so Pydantic parsing succeeds."""
    notes: list[str] = []
    transitions = raw_seq.get("transitions")
    if not isinstance(transitions, list):
        return raw_seq, notes
    for i, t in enumerate(transitions):
        if not isinstance(t, dict):
            continue
        if not t.get("relationship"):
            t["relationship"] = "sequential"
            notes.append(f"transitions[{i}]: filled missing relationship -> 'sequential'")
        elif t["relationship"] not in _VALID_RELATIONSHIPS:
            notes.append(f"transitions[{i}]: normalised relationship '{t['relationship']}' -> 'sequential'")
            t["relationship"] = "sequential"
        if not t.get("bridgeIntent"):
            t["bridgeIntent"] = "narrative flow"
            notes.append(f"transitions[{i}]: filled missing bridgeIntent -> 'narrative flow'")
    return raw_seq, notes


class NarrativeSequencerAgent(BaseAgent):
    """Causal order, roles, dependencies, bridges and deferrals for Stage S."""

    SYSTEM_PROMPT = """You are the Narrative Sequence and Transition Agent in a governed banking rewards UI committee.

Order candidate components by causal and semantic relationship, assign each a narrative
role, define dependencies and bridge logic, and defer components that interrupt the
approved journey.

SEQUENCING RULES:
- POINTS_BALANCE remains the constitutionally anchored first component, but the first
  non-anchored card must establish the active story.
- Every non-reference component must belong to exactly one mini-journey.
- Every adjacent pair must have an explicit relationship or an episode boundary.
- dependsOn entries MUST be component refs that appear earlier in the sequence.
- resolves entries answer a customer question: use component refs OR mini-journey
  ids from the approved Experience Journey Plan (e.g. "mj-1").
- Only ONE component is designated as the dominant primary action (primaryActionComponentRef).
- An ACTION must be followed by FEEDBACK, PAYOFF or CONTINUATION in the same sequence or
  declared next state.
- Generic educational or programme-mechanics cards become REFERENCE or supporting-surface
  content unless central to the approved story.
- TRUST-act cards (REWARDS_INSIGHT_CARD, EDUCATIONAL_INSIGHT_CARD, WHY_THIS_UI_CARD,
  REWARD_PROVENANCE_CARD, SYNC_STATUS_CARD, PROGRAMME_CONNECTION_CARD) must NEVER be
  ACTION — they are transparency/control cards and cannot be followed by consequences.
  Assign them EVIDENCE or REFERENCE instead.
- Untriggered celebrations, stale actions and semantically orphaned cards are deferred.

NARRATIVE ROLES:
ORIENTATION establish current situation | MEANING explain why it matters |
TENSION genuine gap/choice/opportunity | EVIDENCE relevant support |
OPTION legitimate choice | ACTION enable next step | FEEDBACK show effect of action |
PAYOFF make value visible | CELEBRATION genuinely triggered achievement |
CONTINUATION preview next episode | REFERENCE optional detail without interruption
narrativeRole MUST be exactly one of these eleven values — never invent new role names.

Return ONLY valid JSON matching:
{
  "primaryActionComponentRef": "component-id",
  "components": [
    {
      "componentRef": "component-id",
      "miniJourneyId": "mj-1",
      "narrativeRole": "ORIENTATION|MEANING|TENSION|EVIDENCE|OPTION|ACTION|FEEDBACK|PAYOFF|CELEBRATION|CONTINUATION|REFERENCE",
      "sequence": 1,
      "dependsOn": [],
      "resolves": [],
      "optional": false
    }
  ],
  "transitions": [
    {
      "fromComponentRef": "a",
      "toComponentRef": "b",
      "relationship": "situation-to-meaning|progress-to-gap|choice-to-action|action-to-feedback|feedback-to-payoff|payoff-to-continuation|episode-boundary",
      "bridgeIntent": "why b follows a",
      "bridgeCopy": null
    }
  ],
  "deferredComponents": [
    {
      "componentRef": "id",
      "componentType": "TYPE",
      "reason": "why deferred",
      "reasonCode": "DEFER_UNTRIGGERED_CELEBRATION|DEFER_NOT_CENTRAL|DEFER_STALE_ACTION|DEFER_ORPHAN",
      "alternativeSurface": null
    }
  ],
  "qualityGate": {"passed": true, "violations": []}
}

No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = state.get("current_stage", "S")
        user_content = self._user_content(state)
        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)
        model, error = self.validate_sequence(parsed, state)

        msg = self._create_message(
            state,
            stage=stage,
            round_name="narrative-ordering",
            message_type="PROPOSAL" if model else "OBSERVATION",
            summary=(
                f"Sequenced {len(model.components)} components; "
                f"{len(model.deferredComponents)} deferred"
                if model
                else f"Narrative sequence invalid: {error}"
            ),
        )
        updates = self._append_msg(state, msg)
        updates["narrative_sequence"] = model.model_dump(mode="json") if model else None
        if error:
            updates["reason_codes"] = list(state.get("reason_codes", [])) + ["S.SEQUENCE.INVALID"]
        return updates

    def _user_content(self, state: dict) -> str:
        return f"""STAGE {state.get('current_stage', 'S')} — NARRATIVE ORDERING
Approved Customer Story: {json.dumps(state.get('approved_customer_story') or {})}
Experience Journey Plan: {json.dumps(state.get('experience_journey_plan') or {})}
Candidate Components: {json.dumps((state.get('selected_candidate') or {}).get('components', state.get('candidate_compositions', [])[:1]))}
Continuity Plan: {json.dumps(state.get('continuity_plan') or {})}
Card-Rule Mandatory Stack: {json.dumps((state.get('card_rules') or {}).get('ordered_stack', []))}

Assign roles, order, dependencies, transitions and deferrals."""

    def validate_sequence(self, parsed: dict, state: dict) -> tuple:
        """Deterministic sequencing contract checks (spec §6.4)."""
        from schemas.narrative import ExperienceJourneyPlan, parse_model as _pm
        from validators.coherence_validator import sanitize_narrative_sequence, repair_roles_in_payload

        raw_seq = parsed.get("narrativeSequence") or parsed
        selected_components = (state.get("selected_candidate") or {}).get("components", [])
        component_ids = {
            c.get("id")
            for c in selected_components
            if isinstance(c, dict)
        } or None
        # Build componentRef -> type mapping so the sanitizer can identify
        # non-actionable components by their actual registered type.
        component_type_map = {
            c.get("id", ""): c.get("type", "")
            for c in selected_components
            if isinstance(c, dict) and c.get("id")
        } or None
        plan = None
        journey_payload = state.get("approved_journey") or state.get("experience_journey_plan")
        if journey_payload:
            plan, _plan_err = _pm(ExperienceJourneyPlan, journey_payload)
            if _plan_err:
                plan = None

        # Repair invented narrative roles in the RAW payload first — the enum
        # would otherwise reject the whole sequence at parse time.
        raw_seq, _role_notes = repair_roles_in_payload(
            raw_seq if isinstance(raw_seq, dict) else {}
        )
        # Repair missing transition fields — LLMs sometimes omit relationship
        # or bridgeIntent which would crash Pydantic parsing.
        raw_seq, _tr_notes = _repair_transitions(raw_seq)
        model, error = parse_model(NarrativeSequence, raw_seq)
        if error:
            return None, error
        model, _notes = sanitize_narrative_sequence(model, plan, component_type_map=component_type_map)
        result = validate_narrative_sequence(model, plan, component_ids)
        if not result.passed:
            return None, "; ".join(result.errors)
        return model, None
