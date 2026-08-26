import json
from .base import BaseAgent


class AccessibilityAgent(BaseAgent):
    """Accessibility and Cognitive Load Agent — evaluates density, readability, accessibility."""

    SYSTEM_PROMPT = """You are the Accessibility and Cognitive Load Agent in a multi-agent committee for banking rewards UI personalization.

Your role: Evaluate density, readability, navigation effort, hierarchy and accessible presentation. Enforce accessibility policy and customer accessibility preferences.

RULES:
- Maximum recommended components per screen: 20
- Aim for 12-18 components to provide a rich, personalized experience — customers expect to see diverse relevant content.
- Critical information must be in the top 3 components.
- Cognitive load score must be below 70 for approval.
- Respect WCAG 2.1 AA standards.
- Consider: screen reader compatibility, color contrast, touch targets, text readability.
- Customers with accessibility preferences need simplified layouts.

For STAGE U (Understand), produce:
{
  "accessibilityAnalysis": {
    "cognitiveLoadScore": 0.0,
    "readabilityLevel": "basic|intermediate|advanced",
    "navigationComplexity": "low|medium|high",
    "recommendedMaxComponents": 16,
    "accessibilityRequirements": ["requirements"]
  },
  "recommendations": ["accessibility recommendations"]
}

For STAGE S (Structure), produce:
{
  "accessibilityValidation": {
    "cognitiveLoadAcceptable": true/false,
    "componentCountAcceptable": true/false,
    "hierarchyValid": true/false,
    "readabilityAcceptable": true/false
  },
  "adjustments": ["suggested adjustments"]
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = state.get("current_stage", "U")

        user_content = f"""STAGE {stage} — ACCESSIBILITY AND COGNITIVE LOAD EVALUATION
Customer Reference: {state.get('customer_ref', 'unknown')}
Accessibility Preferences: {json.dumps(state.get('accessibility_preferences', {}), indent=2)}
Customer Context: {json.dumps(state.get('customer_context', {}), indent=2)}
Candidate Compositions: {json.dumps(state.get('candidate_compositions', []), indent=2) if state.get('candidate_compositions') else 'Not yet created'}
Reward Interaction Profile: {json.dumps(state.get('reward_interaction_profile', {}), indent=2) if state.get('reward_interaction_profile') else 'Not yet created'}

Evaluate accessibility and cognitive load for the UI composition."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        msg = self._create_message(
            state,
            stage=stage,
            round_name="independent-analysis",
            message_type="OBSERVATION",
            summary="Accessibility evaluation complete",
            claims=[{
                "claimId": f"a11y-claim-{state.get('message_sequence', 0) + 1}",
                "statement": f"Cognitive load score: {parsed.get('accessibilityAnalysis', parsed.get('accessibilityValidation', {})).get('cognitiveLoadScore', 'N/A')}",
                "confidence": 0.85,
            }],
        )

        updates = self._append_msg(state, msg)
        return updates
