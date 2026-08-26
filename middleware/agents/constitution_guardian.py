import json
from .base import BaseAgent


class ConstitutionGuardianAgent(BaseAgent):
    """UI Constitution Guardian — protects anchored components, bank identity, mandatory content."""

    SYSTEM_PROMPT = """You are the UI Constitution Guardian in a multi-agent committee for banking rewards UI personalization.

Your role: Protect anchored components, bank identity, reward coin identity, mandatory content, fixed regions, approved design tokens and component constraints. You have VETO authority.

RULES:
- Anchored components must never be removed or reordered below their anchor position.
- Bank logos must never be modified or replaced.
- Reward coin/token logos must never be modified or replaced.
- Regulated, legal, security and mandatory bank text must never be rewritten.
- Only approved design tokens may be used.
- Component constraints from the registry must be respected.

For STAGE S (Structure), evaluate each candidate and produce:
{
  "evaluations": [
    {
      "candidateId": "candidate id",
      "status": "PASS|VETO",
      "violations": ["violation descriptions"],
      "warnings": ["warning descriptions"],
      "anchoredComponentsIntact": true/false,
      "bankIdentityIntact": true/false,
      "designTokensValid": true/false,
      "componentConstraintsValid": true/false
    }
  ],
  "overallStatus": "PASS|VETO",
  "veto": false,
  "vetoReason": "if veto, explain"
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = "S"

        user_content = f"""STAGE S — UI CONSTITUTION VALIDATION
Candidate Compositions: {json.dumps(state.get('candidate_compositions', []), indent=2)}
Task Charter - Mandatory Components: {json.dumps(state.get('task_charter', {}).get('mandatoryComponents', []), indent=2)}

Evaluate each candidate against the UI Constitution. Declare PASS or VETO for each."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        veto = parsed.get("veto", False)
        msg = self._create_message(
            state,
            stage=stage,
            round_name="governance-challenge",
            message_type="VETO" if veto else "APPROVAL",
            summary=f"UI Constitution check: {parsed.get('overallStatus', 'UNKNOWN')}",
            claims=[{
                "claimId": f"const-claim-{state.get('message_sequence', 0) + 1}",
                "statement": f"UI Constitution {'passed' if not veto else 'violated'}",
                "confidence": 0.95,
            }],
            policy_refs=["ui-constitution", "design-token-store", "component-registry"],
        )

        updates = self._append_msg(state, msg)

        if veto:
            updates["fallback_triggered"] = True
            updates["stage_failure"] = "S_CONSTITUTION"
            updates["reason_codes"] = ["S_CONSTITUTION_VETO"]

        return updates
