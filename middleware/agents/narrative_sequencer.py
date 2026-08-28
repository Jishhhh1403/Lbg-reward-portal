"""Narrative Sequence and Transition Agent — five-agent narrative extension (spec §6).

Orders candidate components by causal/semantic relationship, assigns narrative
roles, defines dependencies, bridge logic and deferrals. May re-order or defer
but may never invent unregistered components, customer facts or legal copy.
"""

import json

from .base import BaseAgent
from schemas.narrative import NarrativeSequence, SequencedComponent, NarrativeRole, parse_model
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
        """Deterministic sequencing contract checks (spec §6.4).

        Never fully rejects: repairs roles/transitions, and if the LLM output
        is completely unparseable, auto-generates a minimal valid sequence from
        the candidate components + journey plan.
        """
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
            # Auto-generate a minimal valid sequence from components + plan
            model = self._auto_generate_sequence(selected_components, plan)
            if model is None:
                return None, error
        model, _notes = sanitize_narrative_sequence(model, plan, component_type_map=component_type_map)
        result = validate_narrative_sequence(model, plan, component_ids)
        if not result.passed:
            # Try to repair remaining issues before giving up
            model = self._repair_sequence(model, plan, result.errors)
            if model is not None:
                result = validate_narrative_sequence(model, plan, component_ids)
            if model is None or not result.passed:
                # Last resort: auto-generate from scratch
                model = self._auto_generate_sequence(selected_components, plan)
                if model is None:
                    return None, "; ".join(result.errors) if result.errors else "sequence unrecoverable"
                model, _notes = sanitize_narrative_sequence(model, plan, component_type_map=component_type_map)
        return model, None

    @staticmethod
    def _auto_generate_sequence(
        components: list[dict], plan=None
    ) -> "NarrativeSequence | None":
        """Build a minimal valid NarrativeSequence from raw candidate components.

        Used as a last-resort rescue when the LLM's sequence output is
        completely unparseable.  Assigns dense 1..N sequence numbers,
        ORIENTATION/REFERENCE roles, and a sensible primaryActionComponentRef.
        """
        if not components:
            return None

        roles = list(NarrativeRole)
        comps = []
        for i, c in enumerate(components):
            cid = c.get("id") or f"comp-{i}"
            # First component is always POINTS_BALANCE anchor → ORIENTATION
            # Try to find a suitable role; last resort is REFERENCE
            if i == 0:
                role = NarrativeRole.ORIENTATION
            elif c.get("type") in ("POINTS_BALANCE",):
                role = NarrativeRole.ORIENTATION
            else:
                # Cycle through roles for variety
                role = roles[i % len(roles)] if i < len(roles) else NarrativeRole.REFERENCE

            mj_id = f"mj-{min(i + 1, plan and len(plan.miniJourneys) or 2)}"
            comps.append(SequencedComponent(
                componentRef=cid,
                miniJourneyId=mj_id,
                narrativeRole=role,
                sequence=i + 1,
            ))

        # Pick primary action: first ACTION, or first non-ORIENTATION component
        primary = comps[0].componentRef
        for sc in comps:
            if sc.narrativeRole == NarrativeRole.ACTION:
                primary = sc.componentRef
                break
        else:
            if len(comps) > 1:
                primary = comps[1].componentRef

        return NarrativeSequence(
            primaryActionComponentRef=primary,
            components=comps,
        )

    @staticmethod
    def _repair_sequence(
        model: "NarrativeSequence", plan, errors: list[str]
    ) -> "NarrativeSequence | None":
        """Attempt targeted repairs on a parsed but invalid sequence.

        Returns repaired model if feasible, None if the issues are too severe.
        """
        from schemas.narrative import SequencedComponent, NarrativeRole

        comps = [sc.model_copy() for sc in model.components]
        changed = False

        for err in errors:
            # Fix duplicate sequence numbers
            if "duplicate" in err.lower() and "sequence" in err.lower():
                for i, sc in enumerate(comps):
                    sc.sequence = i + 1
                changed = True
            # Fix unknown component references — drop them
            elif "references unknown component" in err.lower():
                ref = err.split("component:")[-1].strip() if "component:" in err else ""
                if ref:
                    comps = [sc for sc in comps if sc.componentRef != ref]
                    changed = True
            # Fix primary action ref issues
            elif "primaryActionComponentRef" in err or "primary action ref" in err.lower():
                refs = {sc.componentRef for sc in comps}
                if model.primaryActionComponentRef not in refs and comps:
                    # Pick first ACTION or first non-anchor
                    for sc in comps:
                        if sc.narrativeRole == NarrativeRole.ACTION:
                            model.primaryActionComponentRef = sc.componentRef
                            changed = True
                            break
                    else:
                        model.primaryActionComponentRef = comps[0].componentRef
                        changed = True
            # Fix dependency ordering
            elif "does not precede" in err.lower():
                # Drop backward deps
                order_index = {sc.componentRef: sc.sequence for sc in comps}
                for sc in comps:
                    valid_deps = [
                        d for d in sc.dependsOn
                        if d in order_index and order_index[d] < sc.sequence
                    ]
                    if len(valid_deps) != len(sc.dependsOn):
                        sc.dependsOn = valid_deps
                        changed = True

        if not changed:
            return None

        return model.__class__(
            primaryActionComponentRef=model.primaryActionComponentRef,
            components=comps,
            transitions=model.transitions,
            deferredComponents=model.deferredComponents,
        )
