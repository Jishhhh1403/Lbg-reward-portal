import json
from .base import BaseAgent


class PersonalizationSynthesiserAgent(BaseAgent):
    """Personalization Synthesiser — compares and scores candidate compositions."""

    SYSTEM_PROMPT = """You are the Personalization Synthesiser in a multi-agent committee for banking rewards UI personalization.

Your role: Compare valid candidate compositions using the approved scorecard. Record scores, evidence, disagreements and uncertainties. Recommend a winning candidate but cannot override a guardian veto.

SCORING CRITERIA (weights):
- customerGoalRelevance: 25%
- expectedCustomerUtility: 20%
- rewardProfileAlignment: 15%
- accessibilityAndCognitiveFit: 15%
- evidenceConfidence: 10%
- brandAndDesignConsistency: 5%
- usefulNovelty: 5%
- operationalFeasibility: 5%

RULES:
- Score each candidate on all criteria.
- A hard-gate failure cannot be compensated by a higher weighted score.
- Record disagreements and uncertainties explicitly.
- Recommend the highest-scoring candidate that passes every hard gate.

For STAGE E (Evaluate), produce:
{
  "candidateEvaluations": [
    {
      "candidateId": "candidate id",
      "scores": {
        "customerGoalRelevance": {"score": 0.0, "weight": 0.25, "explanation": "...", "evidenceRefs": []},
        "expectedCustomerUtility": {"score": 0.0, "weight": 0.20, "explanation": "...", "evidenceRefs": []},
        "rewardProfileAlignment": {"score": 0.0, "weight": 0.15, "explanation": "...", "evidenceRefs": []},
        "accessibilityAndCognitiveFit": {"score": 0.0, "weight": 0.15, "explanation": "...", "evidenceRefs": []},
        "evidenceConfidence": {"score": 0.0, "weight": 0.10, "explanation": "...", "evidenceRefs": []},
        "brandAndDesignConsistency": {"score": 0.0, "weight": 0.05, "explanation": "...", "evidenceRefs": []},
        "usefulNovelty": {"score": 0.0, "weight": 0.05, "explanation": "...", "evidenceRefs": []},
        "operationalFeasibility": {"score": 0.0, "weight": 0.05, "explanation": "...", "evidenceRefs": []}
      },
      "weightedTotal": 0.0,
      "hardGatesPass": true,
      "hardGateFailures": [],
      "objections": [],
      "uncertainties": []
    }
  ],
  "recommendedCandidateId": "candidate id",
  "recommendationRationale": "why this candidate",
  "rejections": [
    {
      "candidateId": "id",
      "reason": "why rejected"
    }
  ],
  "disagreements": ["any disagreements"],
  "confidence": 0.85
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = "E"

        user_content = f"""STAGE E — PERSONALIZATION EVALUATION
Customer Reference: {state.get('customer_ref', 'unknown')}
Candidate Compositions: {json.dumps(state.get('candidate_compositions', []), indent=2)}
Customer Context: {json.dumps(state.get('customer_context', {}), indent=2)}
Reward Interaction Profile: {json.dumps(state.get('reward_interaction_profile', {}), indent=2)}
Task Charter: {json.dumps(state.get('task_charter', {}), indent=2)}

Score all candidates using the approved scorecard. Recommend the highest-scoring candidate that passes every hard gate."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        recommended_id = parsed.get("recommendedCandidateId", "")
        evaluations = parsed.get("candidateEvaluations", [])

        msg = self._create_message(
            state,
            stage=stage,
            round_name="evaluation",
            message_type="VOTE",
            summary=f"Recommended candidate: {recommended_id}",
            claims=[{
                "claimId": f"synth-claim-{state.get('message_sequence', 0) + 1}",
                "statement": f"Recommended candidate {recommended_id} with confidence {parsed.get('confidence', 0.8)}",
                "confidence": parsed.get("confidence", 0.8),
                "evidenceRefs": [],
            }],
            recommended_actions=[f"Select candidate {recommended_id}"],
            candidate_refs=[recommended_id],
        )

        updates = self._append_msg(state, msg)
        updates["evaluations"] = parsed

        selected = next(
            (c for c in state.get("candidate_compositions", []) if c.get("candidateId") == recommended_id),
            state.get("candidate_compositions", [{}])[0] if state.get("candidate_compositions") else {},
        )
        updates["selected_candidate"] = selected

        return updates
