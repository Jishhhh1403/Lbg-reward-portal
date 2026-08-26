import json
from .base import BaseAgent


class SDUICompilerAgent(BaseAgent):
    """SDUI Compiler and Validator — converts approved plan into executable SDUI JSON."""

    SYSTEM_PROMPT = """You are the SDUI Compiler and Validator in a multi-agent committee for banking rewards UI personalization.

Your role: Convert only the approved UI Decision Plan into executable SDUI JSON. Must not introduce new components or personalization decisions. Validate the result against schemas, policies and registries.

COMPILER RULES:
- Do not make new personalization decisions.
- Do not add components not present in the approved plan.
- Do not rewrite approved content.
- Use registered IDs and references only.
- Include schema and policy versions.
- Include decision ID, creation timestamp and expiry timestamp.
- Include concise reason codes and evidence references.
- Exclude agent deliberation from the front-end payload.
- Exclude raw customer behavioural histories.

The SDUI JSON must follow this structure:
{
  "schemaVersion": "1.0",
  "decisionId": "unique decision identifier",
  "correlationId": "correlation identifier",
  "createdAt": "ISO-8601 UTC timestamp",
  "expiresAt": "ISO-8601 UTC timestamp",
  "customerRef": "pseudonymized customer reference",
  "components": [
    {
      "id": "component-unique-id",
      "type": "REGISTERED_COMPONENT_TYPE",
      "version": "1.0",
      "priority": 1,
      "props": {
        "key": "value"
      },
      "actions": [
        {
          "type": "ACTION_TYPE",
          "payload": {}
        }
      ],
      "evidenceRefs": ["reference ids"],
      "reasonCodes": ["reason codes"]
    }
  ],
  "metadata": {
    "schemaVersion": "1.0",
    "policyVersions": ["policy versions"],
    "componentRegistryVersion": "1.0",
    "contentRegistryVersion": "1.0",
    "designTokenVersion": "1.0"
  }
}

For STAGE T (Translate), produce:
{
  "finalSdui": { ... the SDUI JSON above ... },
  "fallbackSdui": { ... a neutral fallback SDUI ... },
  "finalSduiHash": "sha256 hash of the final SDUI",
  "fallbackSduiHash": "sha256 hash of the fallback SDUI",
  "validationResults": {
    "schemaValid": true,
    "componentRegistryValid": true,
    "contentRegistryValid": true,
    "designTokenValid": true,
    "dataBindingValid": true
  },
  "reasonCodes": ["reason codes"]
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = "T"

        user_content = f"""STAGE T — TRANSLATE TO SDUI JSON
Customer Reference: {state.get('customer_ref', 'unknown')}
Correlation ID: {state.get('correlation_id', 'unknown')}
Selected Candidate: {json.dumps(state.get('selected_candidate', {}), indent=2)}
UI Decision Plan: {json.dumps(state.get('ui_decision_plan', {}), indent=2)}
Customer Context: {json.dumps(state.get('customer_context', {}), indent=2)}

Convert the approved UI Decision Plan into executable SDUI JSON. Create both final and fallback versions."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        msg = self._create_message(
            state,
            stage=stage,
            round_name="compilation",
            message_type="PROPOSAL",
            summary="SDUI compilation complete",
            claims=[{
                "claimId": f"compile-claim-{state.get('message_sequence', 0) + 1}",
                "statement": f"Compiled {len(parsed.get('finalSdui', {}).get('components', []))} components into SDUI payload",
                "confidence": 0.95,
            }],
        )

        updates = self._append_msg(state, msg)
        updates["final_sdui"] = parsed.get("finalSdui", {})
        updates["fallback_sdui"] = parsed.get("fallbackSdui", {})
        updates["compiled_sdui"] = parsed

        return updates
