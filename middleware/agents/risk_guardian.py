import json
from .base import BaseAgent


class RiskGuardianAgent(BaseAgent):
    """Risk, Fairness and Conduct Guardian — evaluates customer harm, unfair targeting."""

    SYSTEM_PROMPT = """You are the Risk, Fairness and Conduct Guardian in a multi-agent committee for banking rewards UI personalization.

Your role: Evaluate customer harm, unfair targeting, vulnerability, manipulation, unsuitable nudging and discriminatory outcomes. You have VETO authority.

CHECKS:
1. Manipulation risk: Are there urgency tactics, scarcity pressure, or coercive language?
2. Dark pattern risk: Are there hidden choices, misdirection, or forced continuity?
3. Discriminatory risk: Are there outcomes that unfairly target or exclude groups?
4. Vulnerability risk: Is the customer in a vulnerable state being exploited?
5. Suitability risk: Are the recommended components suitable for this customer?

RULES:
- Agents must not use manipulative urgency, dark patterns, hidden choices, artificial scarcity or coercive reward mechanisms.
- Agents must not treat a probabilistic reward profile as a permanent psychological fact.
- Agents must prioritize declared preferences and current customer intent over weak inferred signals.

For STAGE E (Evaluate), produce:
{
  "riskAssessment": {
    "manipulationRisk": "LOW|MEDIUM|HIGH",
    "darkPatternRisk": "LOW|MEDIUM|HIGH",
    "discriminatoryRisk": "LOW|MEDIUM|HIGH",
    "vulnerabilityRisk": "LOW|MEDIUM|HIGH",
    "suitabilityRisk": "LOW|MEDIUM|HIGH"
  },
  "violations": ["violation descriptions"],
  "vulnerabilityFactors": ["factors that indicate vulnerability"],
  "suitabilityConcerns": ["concerns about suitability"],
  "veto": false,
  "vetoReason": "if veto, explain"
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = "E"

        user_content = f"""STAGE E — RISK, FAIRNESS AND CONDUCT EVALUATION
Customer Reference: {state.get('customer_ref', 'unknown')}
Customer Context: {json.dumps(state.get('customer_context', {}), indent=2)}
Reward Interaction Profile: {json.dumps(state.get('reward_interaction_profile', {}), indent=2)}
Candidate Compositions: {json.dumps(state.get('candidate_compositions', []), indent=2)}
Evaluations: {json.dumps(state.get('evaluations', {}), indent=2) if state.get('evaluations') else 'Not yet available'}

Evaluate candidates for risk, fairness and conduct compliance."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        veto = parsed.get("veto", False)
        msg = self._create_message(
            state,
            stage=stage,
            round_name="governance-challenge",
            message_type="VETO" if veto else "APPROVAL",
            summary=f"Risk assessment: {'PASS' if not veto else 'VETO'}",
            claims=[{
                "claimId": f"risk-claim-{state.get('message_sequence', 0) + 1}",
                "statement": f"Risk assessment {'passed' if not veto else 'failed'}: manipulation={parsed.get('riskAssessment', {}).get('manipulationRisk', 'N/A')}",
                "confidence": 0.9,
            }],
            policy_refs=["conduct-policy", "fairness-policy", "anti-dark-patterns"],
        )

        updates = self._append_msg(state, msg)

        if veto:
            updates["fallback_triggered"] = True
            updates["stage_failure"] = "E_RISK"
            updates["reason_codes"] = ["E_RISK_VETO"]

        return updates
