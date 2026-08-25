import json
from .base import BaseAgent


class RedTeamChallengerAgent(BaseAgent):
    """Red-Team Challenger — challenges assumptions, evidence quality, feasibility."""

    SYSTEM_PROMPT = """You are the Red-Team Challenger in a multi-agent committee for banking rewards UI personalization.

Your role: Challenge assumptions, evidence quality, personalization value, operational feasibility and failure conditions. Must give at least one substantive challenge or explicitly state that no material issue was found after applying the red-team checklist.

CHECKLIST:
1. Unsupported assumptions
2. Weak or conflicting evidence
3. Inappropriate urgency
4. Dark-pattern risk
5. Loss of customer choice
6. Excessive personalization
7. Discriminatory proxy risk
8. Component overload
9. Accessibility degradation
10. Incorrect data bindings
11. Stale decisions
12. Renderer failure risk
13. Missing fallback behavior

For STAGE R (Refine), produce:
{
  "challenges": [
    {
      "challengeId": "unique id",
      "category": "checklist item",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "statement": "the challenge",
      "evidence": "supporting evidence for the challenge",
      "recommendation": "how to address"
    }
  ],
  "assumptionsChallenged": 0,
  "evidenceQualityIssues": 0,
  "overallRiskLevel": "LOW|MEDIUM|HIGH",
  "materialIssuesFound": true/false,
  "releaseRecommendation": "RELEASE|HOLD",
  "holdReasons": ["reasons to hold"],
  "unresolvedCritical": 0,
  "unresolvedHigh": 0,
  "validationChecks": {
    "schemaValid": true,
    "constitutionValid": true,
    "componentsValid": true,
    "tokensValid": true,
    "bindingsValid": true,
    "consentValid": true,
    "accessibilityValid": true,
    "fallbackValid": true
  }
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = "R"

        user_content = f"""STAGE R — RED-TEAM CHALLENGE
Customer Reference: {state.get('customer_ref', 'unknown')}
Selected Candidate: {json.dumps(state.get('selected_candidate', {}), indent=2)}
UI Decision Plan: {json.dumps(state.get('ui_decision_plan', {}), indent=2)}
Compiled SDUI: {json.dumps(state.get('compiled_sdui', {}), indent=2) if state.get('compiled_sdui') else 'Not yet compiled'}
Fallback SDUI: {json.dumps(state.get('fallback_sdui', {}), indent=2) if state.get('fallback_sdui') else 'Not yet created'}
Release Check: {json.dumps(state.get('release_check', {}), indent=2) if state.get('release_check') else 'Not yet evaluated'}
All Agent Messages: {json.dumps(state.get('all_messages', [])[-5:], indent=2)}

Apply the red-team checklist. Challenge assumptions, evidence quality, and feasibility."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        material_issues = parsed.get("materialIssuesFound", False)
        msg = self._create_message(
            state,
            stage=stage,
            round_name="red-team",
            message_type="CHALLENGE" if material_issues else "APPROVAL",
            summary=f"Red-team: {'issues found' if material_issues else 'no material issues'}",
            claims=[{
                "claimId": f"rt-claim-{state.get('message_sequence', 0) + 1}",
                "statement": f"Red-team found {parsed.get('assumptionsChallenged', 0)} assumption challenges, {parsed.get('evidenceQualityIssues', 0)} evidence issues",
                "confidence": 0.9,
            }],
            objections=[c.get("statement", "") for c in parsed.get("challenges", []) if c.get("severity") in ("CRITICAL", "HIGH")],
        )

        updates = self._append_msg(state, msg)

        if material_issues or parsed.get("releaseRecommendation") == "HOLD":
            updates["fallback_triggered"] = True
            updates["stage_failure"] = "R_REDTEAM"
            updates["reason_codes"] = parsed.get("holdReasons", ["R_REDTEAM_HOLD"])

        return updates
