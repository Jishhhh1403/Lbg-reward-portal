"""Experience Coherence Guardian — five-agent narrative extension (spec §7).

Protects the semantic integrity of the customer experience. VETO authority in
Stages E and S; HOLD recommendation in Stage R. Deterministic structural facts
from validators/coherence_validator.py are combined with the guardian's scored
assessment; scores can never override hard structural failures.
"""

import json

from .base import BaseAgent
from config.narrative_policy import COHERENCE_THRESHOLDS
from schemas.narrative import CoherenceAssessment, parse_model
from validators.coherence_validator import assess_coherence_metrics


class CoherenceGuardianAgent(BaseAgent):
    """Hard gate: one story, one dominant action, every action has a consequence."""

    SYSTEM_PROMPT = """You are the Experience Coherence Guardian in a governed banking rewards UI committee.

Vote on the semantic integrity of the proposed experience:
- The journey is complete and transitions are intelligible.
- One dominant story is identifiable.
- One primary action dominates.
- Each action has a represented consequence.
- Intended outcomes remain connected.
- No mandatory component has fragmented the experience.

HARD-GATE CONDITIONS (any one forces VETO):
- No single story can be inferred from the artefacts or compiled screen.
- More than one journey competes for primary attention.
- The primary action is unrelated to the opening story context.
- The action consequence is absent from the current or declared next state.
- A mandatory component inserted after compilation breaks the main sequence.
- One or more non-reference components are semantically orphaned.
- Headings claim continuity that card relationships do not support.
- A mini-journey begins but has no action, resolution or deliberate continuation.
- The compiled SDUI materially differs from the approved narrative sequence.
- The dominant action is visually or logically ambiguous.

Score each metric 0-100. PASS requires (configurable policy default-v1):
storyClarity>=75, journeyContinuity>=70, miniJourneyCompleteness>=75,
transitionStrength>=65, actionOutcomeContinuity>=75, contentDistractionRisk=Low,
no orphanComponents, primaryActionClarity=PASS.

Return ONLY valid JSON matching:
{
  "coherenceAssessment": {
    "storyClarity": 0,
    "journeyContinuity": 0,
    "miniJourneyCompleteness": 0,
    "transitionStrength": 0,
    "actionOutcomeContinuity": 0,
    "contentDistractionRisk": "Low|High",
    "primaryActionClarity": "PASS|FAIL",
    "orphanComponents": [],
    "conflictingNarratives": [],
    "violations": [
      {"code": "VIOLATION_CODE", "description": "what and why", "severity": "CRITICAL|HIGH|MEDIUM|LOW"}
    ],
    "decision": "PASS|VETO|HOLD",
    "reasonCode": null
  }
}

No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = state.get("current_stage", "S")
        user_content = self._user_content(state)
        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)
        model, error = parse_model(CoherenceAssessment, parsed.get("coherenceAssessment") or parsed)

        decision = "PASS"
        if error:
            decision = "VETO"
        elif model is not None:
            structural_errors = list((state.get("coherence_structural_errors") or {}).get(stage, []))
            decision, _ = assess_coherence_metrics(
                type("V", (), {"passed": not structural_errors, "errors": structural_errors})(),
                model.model_dump(),
                COHERENCE_THRESHOLDS,
            )

        message_type = {"PASS": "APPROVAL", "VETO": "VETO", "HOLD": "CHALLENGE"}[decision]
        msg = self._create_message(
            state,
            stage=stage,
            round_name="coherence-gate",
            message_type=message_type,
            summary=(
                f"Coherence {decision}"
                + (f": {error}" if error else f" (scores: {model.model_dump() if model else ''})"[:180])
            ),
            objections=[] if decision == "PASS" else [error or "coherence thresholds breached"],
        )
        updates = self._append_msg(state, msg)
        if model is None:
            stored = {
                "decision": "VETO",
                "reasonCode": stage + ".COHERENCE.VETO",
                "violations": [{"code": "ASSESSMENT_PARSE_FAILED", "description": error, "severity": "CRITICAL"}],
            }
        else:
            stored = model.model_dump(mode="json")
            # Structural facts outrank the guardian's declared decision.
            structural = list((state.get("coherence_structural_errors") or {}).get(stage, []))
            if structural and stored.get("decision") != "HOLD":
                stored["decision"] = decision
                stored["reasonCode"] = stage + ".COHERENCE.VETO"
                stored["violations"] = list(stored.get("violations", [])) + [
                    {"code": "STRUCTURAL_INVARIANT_FAILED", "description": "; ".join(structural), "severity": "CRITICAL"}
                ]
            else:
                stored["decision"] = decision
                stored.setdefault("reasonCode", None)
        updates["coherence_assessment"] = stored
        return updates

    def _user_content(self, state: dict) -> str:
        return f"""STAGE {state.get('current_stage', 'S')} — COHERENCE REVIEW
Approved Customer Story: {json.dumps(state.get('approved_customer_story') or {})}
Journey Plan: {json.dumps(state.get('experience_journey_plan') or {})}
Narrative Sequence: {json.dumps(state.get('narrative_sequence') or {})}
Compiled Screen Summary: {json.dumps([
    {"id": c.get("id"), "type": c.get("type"), "priority": c.get("priority")}
    for c in ((state.get('final_sdui') or {}).get('components') or [])
])}
Structural Validator Errors: {json.dumps((state.get('coherence_structural_errors') or {}).get(state.get('current_stage', 'S'), []))}

Score coherence metrics and decide PASS/VETO/HOLD."""


def apply_thresholds(
    assessment_dict: dict,
    structural_errors: list[str],
    default_veto_code: str = "S.COHERENCE.VETO",
) -> tuple[str, str | None]:
    """Deterministic decision resolution used by the graph in Stages E/S."""
    return assess_coherence_metrics(
        type("V", (), {"passed": not structural_errors, "errors": structural_errors})(),
        assessment_dict,
        COHERENCE_THRESHOLDS,
        default_veto_code=default_veto_code,
    )
