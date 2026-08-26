import json
from .base import BaseAgent


class JourneyIntentAgent(BaseAgent):
    """Journey and Intent Agent — identifies customer journey and current objective."""

    SYSTEM_PROMPT = """You are the Journey and Intent Agent in a multi-agent committee for banking rewards UI personalization.

Your role: Identify the customer's immediate journey and likely current objective. Give higher priority to current intent than historical segmentation.

RULES:
- Current intent takes precedence over historical segmentation.
- Do not assume intent from a single data point.
- Consider the full session context.
- Classify intent with confidence levels.

For STAGE Q (Question), produce:
{
  "identifiedJourney": "the identified journey type",
  "currentIntent": "likely current objective",
  "intentConfidence": 0.0,
  "supportingEvidence": ["evidence list"],
  "journeyPhase": "discovery|evaluation|redemption|post-redemption",
  "recommendedApproach": "how to approach this customer in this journey"
}

For STAGE U (Understand), produce:
{
  "journeyAnalysis": {
    "journeyType": "type",
    "currentObjective": "objective",
    "confidence": 0.0,
    "evidence": ["evidence list"],
    "precedence": "current-intent-over-historical"
  },
  "intentSignals": [
    {
      "signal": "description",
      "weight": 0.0,
      "source": "source"
    }
  ]
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = state.get("current_stage", "Q")

        user_content = f"""STAGE {stage} — JOURNEY AND INTENT ANALYSIS
Customer Reference: {state.get('customer_ref', 'unknown')}
Journey: {state.get('journey', 'unknown')}
Channel: {state.get('channel', 'mobile')}
Current Session Context: {json.dumps(state.get('current_session_context', {}), indent=2)}
Customer Context: {json.dumps(state.get('customer_context', {}), indent=2) if state.get('customer_context') else 'Not yet available'}
Task Charter: {json.dumps(state.get('task_charter', {}), indent=2) if state.get('task_charter') else 'Not yet created'}

Identify the customer's immediate journey and likely current objective."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        msg = self._create_message(
            state,
            stage=stage,
            round_name="independent-analysis",
            message_type="OBSERVATION",
            summary=f"Journey and intent analysis complete for stage {stage}",
            claims=[{
                "claimId": f"journey-claim-{state.get('message_sequence', 0) + 1}",
                "statement": f"Identified intent: {parsed.get('currentIntent', parsed.get('journeyAnalysis', {}).get('currentObjective', 'unknown'))}",
                "confidence": parsed.get("intentConfidence", parsed.get("journeyAnalysis", {}).get("confidence", 0.7)),
            }],
        )

        updates = self._append_msg(state, msg)
        updates["current_session_context"] = {
            **state.get("current_session_context", {}),
            "journeyAnalysis": parsed,
        }
        return updates
