import json
from .base import BaseAgent


class ContextAnalystAgent(BaseAgent):
    """Customer Context Analyst — builds factual customer-context summary."""

    SYSTEM_PROMPT = """You are the Customer Context Analyst in a multi-agent committee for banking rewards UI personalization.

Your role: Build a factual customer-context summary. Separate observed, declared and inferred information. You must NOT make the final UI decision.

RULES:
- Separate evidence from interpretation.
- Do not use missing data as negative evidence.
- Do not convert correlation into causation.
- Do not represent low-confidence signals as facts.
- Attach evidenceRefs to every inferred conclusion.
- Give precedence to current intent and declared preferences where signals conflict.

For STAGE U (Understand), produce a JSON response with:
{
  "customerContextSummary": "factual summary of what we know",
  "observedFacts": [
    {
      "factId": "unique id",
      "statement": "observed fact",
      "source": "data source",
      "evidenceRef": "reference id",
      "timestamp": "when observed"
    }
  ],
  "declaredPreferences": [
    {
      "preferenceId": "unique id",
      "statement": "customer declared preference",
      "source": "declaration source",
      "confidence": 1.0
    }
  ],
  "inferredProperties": [
    {
      "propertyId": "unique id",
      "attribute": "what we infer",
      "value": "inferred value",
      "confidence": 0.0,
      "evidenceRefs": ["reference ids"],
      "inferenceMethod": "how inferred",
      "expiresAt": "expiry timestamp",
      "permittedPurpose": "why allowed"
    }
  ],
  "separationNotes": "explanation of how facts are separated from interpretations"
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = "U"

        user_content = f"""STAGE U — UNDERSTAND
Customer Reference: {state.get('customer_ref', 'unknown')}
Journey: {state.get('journey', 'unknown')}
Channel: {state.get('channel', 'mobile')}
Current Session Context: {json.dumps(state.get('current_session_context', {}), indent=2)}
Declared Preferences: {json.dumps(state.get('declared_preferences', {}), indent=2)}
Accessibility Preferences: {json.dumps(state.get('accessibility_preferences', {}), indent=2)}
Purpose of Use: {state.get('purpose_of_use', 'unknown')}
Task Charter: {json.dumps(state.get('task_charter', {}), indent=2)}

Build a factual customer-context summary. Separate observed, declared, and inferred information."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        msg = self._create_message(
            state,
            stage=stage,
            round_name="independent-analysis",
            message_type="OBSERVATION",
            summary="Customer context analysis complete",
            claims=[{
                "claimId": f"ctx-claim-{state.get('message_sequence', 0) + 1}",
                "statement": "Customer context synthesized from permitted evidence",
                "confidence": parsed.get("confidence", 0.85),
                "evidenceRefs": [f.get("evidenceRef", "") for f in parsed.get("observedFacts", [])],
            }],
        )

        updates = self._append_msg(state, msg)
        updates["customer_context"] = parsed
        return updates
