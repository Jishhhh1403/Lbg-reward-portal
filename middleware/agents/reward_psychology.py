import json
from .base import BaseAgent


class RewardPsychologyAgent(BaseAgent):
    """Reward Psychology Specialist — evaluates permitted reward-behaviour signals."""

    SYSTEM_PROMPT = """You are the Reward Psychology Specialist in a multi-agent committee for banking rewards UI personalization.

Your role: Evaluate permitted reward-behaviour signals. Use approved motivational constructs: autonomy, competence, and relatedness (Self-Determination Theory). Must NOT produce clinical, medical or sensitive psychological diagnoses.

CUSTOMER MODELLING RULE:
- Use the term "rewardInteractionProfile".
- Do not call the output a definitive "personality".
- The rewardInteractionProfile is a temporary, purpose-bound interpretation.
- Each inferred property must include: value, confidence, evidence references, inference method, creation timestamp, expiry timestamp, permitted purpose.
- If confidence is low, use the neutral UI or apply only low-risk personalization.

RULES:
- Do not use prohibited or sensitive psychological labels.
- Do not infer protected attributes.
- Prioritize declared preferences over inferred signals.
- A low-confidence inference must be explicitly flagged.

For STAGE U (Understand), produce:
{
  "rewardInteractionProfile": {
    "attributes": [
      {
        "attribute": "attribute name",
        "value": "value",
        "confidence": 0.0,
        "evidenceRefs": ["reference ids"],
        "inferenceMethod": "method description",
        "createdAt": "ISO-8601",
        "expiresAt": "ISO-8601",
        "permittedPurpose": "purpose"
      }
    ],
    "methodology": "description of how profile was built",
    "temporaryInterpretation": true,
    "declaredPreferencesWeight": 0.6,
    "inferredSignalsWeight": 0.4
  },
  "motivationalConstructs": {
    "autonomy": {"present": false, "evidence": "evidence"},
    "competence": {"present": false, "evidence": "evidence"},
    "relatedness": {"present": false, "evidence": "evidence"}
  },
  "lowConfidenceAttributes": ["list of low confidence attributes"],
  "recommendations": ["personalization recommendations based on psychology"]
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = "U"

        user_content = f"""STAGE U — REWARD PSYCHOLOGY ANALYSIS
Customer Reference: {state.get('customer_ref', 'unknown')}
Customer Context: {json.dumps(state.get('customer_context', {}), indent=2)}
Permitted Evidence: {json.dumps(state.get('permitted_evidence', {}), indent=2)}
Declared Preferences: {json.dumps(state.get('declared_preferences', {}), indent=2)}
Journey Analysis: {json.dumps(state.get('current_session_context', {}).get('journeyAnalysis', {}), indent=2)}

Evaluate permitted reward-behaviour signals and create a rewardInteractionProfile."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        msg = self._create_message(
            state,
            stage=stage,
            round_name="independent-analysis",
            message_type="PROPOSAL",
            summary="Reward interaction profile created",
            claims=[{
                "claimId": f"psych-claim-{state.get('message_sequence', 0) + 1}",
                "statement": "Reward interaction profile synthesized from permitted evidence",
                "confidence": parsed.get("rewardInteractionProfile", {}).get("attributes", [{}])[0].get("confidence", 0.7) if parsed.get("rewardInteractionProfile", {}).get("attributes") else 0.7,
            }],
        )

        updates = self._append_msg(state, msg)
        updates["reward_interaction_profile"] = parsed.get("rewardInteractionProfile", parsed)
        return updates
