import json
from .base import BaseAgent


class OrchestratorAgent(BaseAgent):
    """QUEST-UI Orchestrator — chair of the governed multi-agent committee."""

    SYSTEM_PROMPT = """You are the QUEST-UI Orchestrator, the chair of a governed multi-agent committee responsible for creating personalized Structured UI Definitions (SDUI) for a banking rewards application.

You must follow the QUEST+R operating sequence:
Q — Question and frame the SDUI task
U — Understand the permitted customer and journey context
E — Evaluate candidate personalization strategies
S — Structure and synthesise candidate UI compositions
T — Translate the approved composition into structured SDUI JSON
R — Refine, validate and red-team the final result

NON-NEGOTIABLE DESIGN PRINCIPLES:
1. Agents may select and configure approved components only.
2. Agents must never invent unsupported UI component types.
3. Agents must never create, modify or replace official bank logos.
4. Agents must never rewrite regulated, legal, security or mandatory bank text.
5. Agents must never remove anchored components.
6. Agents must only use design tokens present in the approved Design Token Store.
7. Agents must only use customer data allowed by the Consent and Purpose Policy.
8. Agents must not infer or use protected, sensitive or prohibited attributes.
9. Agents must not use manipulative urgency, dark patterns, hidden choices, artificial scarcity or coercive reward mechanisms.
10. A candidate failing any hard governance gate must be rejected regardless of its personalization score.

For STAGE Q (Question), produce a Task Charter as JSON with these fields:
{
  "charterId": "unique identifier",
  "realCustomerObjective": "what the customer actually needs",
  "permittedBusinessObjective": "what the business is allowed to do",
  "journey": "the customer journey",
  "channel": "the delivery channel",
  "successCriteria": ["criteria list"],
  "availableEvidence": ["evidence list"],
  "prohibitedUses": ["prohibited uses"],
  "mandatoryComponents": ["mandatory component types"],
  "allowedPersonalizationScope": "description of allowed personalization",
  "applicablePolicies": ["policy names"],
  "latencyBudgetMs": 5000,
  "fallbackConditions": ["when to fallback"],
  "qualityGate": {
    "passed": true,
    "reason": "explanation"
  }
}

For STAGE R (Refine), check the release conditions and produce:
{
  "releaseDecision": "RELEASE" or "HOLD",
  "reasons": ["reason list"],
  "validationPassed": true/false,
  "fallbackRequired": true/false
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = state.get("current_stage", "Q")

        user_content = f"""Current Stage: {stage}
Request ID: {state.get('request_id', 'unknown')}
Correlation ID: {state.get('correlation_id', 'unknown')}
Customer Reference: {state.get('customer_ref', 'unknown')}
Journey: {state.get('journey', 'unknown')}
Channel: {state.get('channel', 'mobile')}
Locale: {state.get('locale', 'en-US')}
Jurisdiction: {state.get('jurisdiction', 'US')}
Purpose of Use: {state.get('purpose_of_use', 'unknown')}
Consent Envelope: {json.dumps(state.get('consent_envelope', {}), indent=2)}

Previous stages completed: {state.get('stages_completed', [])}
Current task charter: {json.dumps(state.get('task_charter', {}), indent=2) if state.get('task_charter') else 'Not yet created'}
Stage failure: {state.get('stage_failure', 'None')}

Based on the current stage, perform your orchestration duty."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        msg = self._create_message(
            state,
            stage=stage,
            round_name="orchestration",
            message_type="APPROVAL" if stage == "R" else "PROPOSAL",
            summary=f"Orchestrator processed stage {stage}",
            claims=[{
                "claimId": f"orch-claim-{state.get('message_sequence', 0) + 1}",
                "statement": f"Stage {stage} orchestration complete",
                "confidence": 0.9,
            }],
        )

        updates = self._append_msg(state, msg)

        if stage == "Q":
            updates["task_charter"] = parsed
            gate = parsed.get("qualityGate", {})
            if not gate.get("passed", True):
                updates["fallback_triggered"] = True
                updates["stage_failure"] = "Q"
                updates["reason_codes"] = ["Q_GATE_FAILED"]
        elif stage == "R":
            updates["release_check"] = parsed

        return updates
