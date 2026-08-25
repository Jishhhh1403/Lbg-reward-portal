import json
from .base import BaseAgent


class ConsentGuardianAgent(BaseAgent):
    """Customer Data and Consent Guardian — determines which data may be used."""

    SYSTEM_PROMPT = """You are the Customer Data and Consent Guardian in a multi-agent committee for banking rewards UI personalization.

Your role: Determine which data may be used for this specific purpose and session. Remove prohibited, expired, unsupported or non-consented signals. You have VETO authority.

PROHIBITED ATTRIBUTES:
- Race, religion, sexual orientation, political affiliation
- Health conditions, genetic data, biometric data
- Mental health, disability status, marital status
- Pregnancy status, precise age, national origin

RULES:
- Do not continue with behavioral personalization if the consent envelope or purpose of use is missing.
- Every signal must contain: signalId, classification, value, source, timestamp, confidence, allowedPurpose, retentionClass, expiresAt.
- Classify every signal as: DECLARED, OBSERVED, DERIVED, or INFERRED.
- Prohibited or expired signals must be excluded before deliberation.

For STAGE Q (Question), produce:
{
  "consentValid": true/false,
  "purposeValid": true/false,
  "permittedScope": "description of what data can be used",
  "prohibitedUses": ["list of prohibited uses"],
  "veto": false,
  "vetoReason": "if veto, explain why"
}

For STAGE U (Understand), produce:
{
  "permittedSignals": [
    {
      "signalId": "id",
      "classification": "DECLARED|OBSERVED|DERIVED|INFERRED",
      "value": "value or category",
      "source": "source",
      "timestamp": "ISO-8601",
      "confidence": 0.0,
      "allowedPurpose": "purpose",
      "retentionClass": "class",
      "expiresAt": "ISO-8601",
      "modelVersion": "version if applicable"
    }
  ],
  "removedSignals": [
    {
      "signalId": "id",
      "reason": "why removed"
    }
  ],
  "violations": ["any violations found"],
  "consentValid": true/false,
  "purposeValid": true/false,
  "veto": false
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = state.get("current_stage", "Q")

        user_content = f"""STAGE {stage} — CONSENT CHECK
Consent Envelope: {json.dumps(state.get('consent_envelope', {}), indent=2)}
Purpose of Use: {state.get('purpose_of_use', 'unknown')}
Customer Context: {json.dumps(state.get('customer_context', {}), indent=2) if state.get('customer_context') else 'Not yet available'}
Declared Preferences: {json.dumps(state.get('declared_preferences', {}), indent=2)}

Evaluate consent and determine which data may be used for this purpose and session."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        msg = self._create_message(
            state,
            stage=stage,
            round_name="governance-challenge",
            message_type="VETO" if parsed.get("veto", False) else "APPROVAL",
            summary=f"Consent check complete for stage {stage}: {'PASS' if not parsed.get('veto', False) else 'VETO'}",
            claims=[{
                "claimId": f"consent-claim-{state.get('message_sequence', 0) + 1}",
                "statement": f"Consent validation {'passed' if not parsed.get('veto', False) else 'failed'}",
                "confidence": 0.95,
            }],
            policy_refs=["consent-policy", "purpose-limitation-policy"],
        )

        updates = self._append_msg(state, msg)

        if parsed.get("veto", False):
            updates["fallback_triggered"] = True
            updates["stage_failure"] = f"{stage}_CONSENT"
            updates["reason_codes"] = [f"{stage}_CONSENT_VETO"]

        if stage == "Q":
            updates["permitted_evidence"] = parsed
        elif stage == "U":
            updates["permitted_evidence"] = parsed

        return updates
