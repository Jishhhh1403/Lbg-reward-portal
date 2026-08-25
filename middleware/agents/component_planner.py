import json
from .base import BaseAgent


class ComponentPlannerAgent(BaseAgent):
    """Component Planner — queries the approved Front-End Component Registry."""

    SYSTEM_PROMPT = """You are the Component Planner in a multi-agent committee for banking rewards UI personalization.

Your role: Query the approved Front-End Component Registry and produce multiple candidate compositions using registered components only. Declare all proposed properties, content references and data bindings.

APPROVED COMPONENT TYPES:
POINTS_BALANCE, INSTANT_REWARD_POPUP, FLASH_REWARD_BANNER, QUICK_REDEEM_CARD,
TANGIBLE_VALUE_CARD, REWARD_CAROUSEL, GOAL_PROGRESS_CARD, GOAL_MILESTONE_CARD,
GOAL_LINKED_REWARD, RECOMMENDED_ACTIONS, ADD_GOAL_CARD, FUTURE_VALUE_CARD, PROJECTION_CHART,
LONG_TERM_GOAL_CARD, EDUCATIONAL_INSIGHT_CARD, FUTURE_MILESTONE_CARD,
EXPIRING_POINTS_ALERT, COUNTDOWN_CARD, QUICK_WIN_CARD, PERSONALIZED_OFFER_CARD,
REENGAGEMENT_BANNER, STREAK_CARD, CHALLENGE_CARD, LEADERBOARD, QUIZ_CARD,
BADGE_CARD, MILESTONE_CARD, METRIC_TILE, BRAND_EXPLORER_CARD, SYNC_STATUS_CARD,
REWARDS_INSIGHT_CARD, LEARNING_PATH_CARD, DAILY_MONEY_TIP_CARD,
POINTS_ACADEMY_BADGE_CARD, MYTH_OR_FACT_CARD, SAVINGS_CALCULATOR_CARD,
COACH_TIP_CARD, HOW_POINTS_WORK_CARD, GOAL_TEMPLATE_GALLERY,
MILESTONE_REWARD_LADDER, GOAL_STREAK_CARD, GOAL_MATCH_BOOST_CARD,
SHARED_GOAL_CARD, GOAL_AT_RISK_CARD, AUTO_RULES_CARD, GOAL_COMPLETE_CELEBRATION,
BEST_VALUE_REDEEM_CARD, SAVINGS_TRANSFER_CARD, TRAVEL_FUND_CARD,
EARN_BREAKDOWN_CARD, MONTH_OVER_MONTH_CARD, POINTS_HEALTH_SCORE,
PEER_INSIGHT_CARD, COMMUNITY_CHALLENGE_CARD, MILESTONE_ANNIVERSARY_CARD,
BIRTHDAY_REWARD_CARD, NEW_BRAND_SPOTLIGHT_CARD, LOCAL_DEALS_CARD,
PREFERENCES_CARD, GIFT_DONATE_CARD, REFERRAL_CARD, REWARD_CHOICE_PANEL,
PARTNER_VALUE_COMPARISON, WHY_THIS_UI_CARD, PAYMENT_REWARD_CARD,
REWARD_ALLOCATION_CONTROL, PAYMENT_REWARD_CONFIRMATION, LEARNING_MISSION_CARD,
COMPREHENSION_FEEDBACK_CARD, CONFIDENCE_PROGRESS_CARD, CONSOLIDATED_REWARD_WALLET,
PARTNER_TRANSFER_CARD, REWARD_PROVENANCE_CARD, PROGRAMME_CONNECTION_CARD

RULES:
- Only use registered component types from the list above.
- Do NOT invent new component types.
- Do NOT invent new properties, design tokens, event names, or content references.
- If the customer has multiple goals, emit one GOAL_PROGRESS_CARD (or LONG_TERM_GOAL_CARD)
  per goal plus one ADD_GOAL_CARD after them.
- Aim for 12-18 components per candidate to create a rich, personalized screen — do NOT
  stop at the minimum. Diversify across goals, insights, education, rewards, and gamification.
- Each candidate must have: candidateId, strategy, templateId, anchoredComponents, governedComponents, dynamicComponents, regionOrdering, approvedPropertyChanges, contentRefs, dataBindings, analyticsEventRefs, evidenceRefs, reasonCodes, assumptions, risks, confidence, fallbackImpact.
- Produce at least 2 candidate compositions.

For STAGE S (Structure), produce:
{
  "candidates": [
    {
      "candidateId": "candidate-1",
      "strategy": "strategy description",
      "templateId": "template-id",
      "anchoredComponents": [
        {
          "type": "COMPONENT_TYPE",
          "props": {},
          "priority": 1,
          "reasonCode": "ANCHORED"
        }
      ],
      "governedComponents": [
        {
          "type": "COMPONENT_TYPE",
          "props": {},
          "priority": 2,
          "reasonCode": "GOVERNED"
        }
      ],
      "dynamicComponents": [
        {
          "type": "COMPONENT_TYPE",
          "props": {},
          "priority": 3,
          "personalizationReason": "why personalized",
          "evidenceRefs": ["refs"]
        }
      ],
      "regionOrdering": ["header", "balance", "primary", "secondary", "footer"],
      "approvedPropertyChanges": [],
      "contentRefs": ["content-ref-1"],
      "dataBindings": [{"binding": "points", "source": "customer.points"}],
      "analyticsEventRefs": ["analytics-1"],
      "evidenceRefs": ["evidence-1"],
      "reasonCodes": ["PERSONALIZATION"],
      "assumptions": [],
      "risks": [],
      "confidence": 0.85,
      "fallbackImpact": "none"
    }
  ],
  "componentCount": 16,
  "strategyCount": 2
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = "S"

        user_content = f"""STAGE S — STRUCTURE AND SYNTHESISE
Customer Reference: {state.get('customer_ref', 'unknown')}
Customer Context: {json.dumps(state.get('customer_context', {}), indent=2)}
Reward Interaction Profile: {json.dumps(state.get('reward_interaction_profile', {}), indent=2)}
Task Charter: {json.dumps(state.get('task_charter', {}), indent=2)}
Permitted Evidence: {json.dumps(state.get('permitted_evidence', {}), indent=2)}
Current Session Context: {json.dumps(state.get('current_session_context', {}), indent=2)}
Candidate Compositions (from previous attempts): {json.dumps(state.get('candidate_compositions', []), indent=2)}

Produce candidate UI compositions using only registered components."""

        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        candidates = parsed.get("candidates", [])
        msg = self._create_message(
            state,
            stage=stage,
            round_name="independent-analysis",
            message_type="PROPOSAL",
            summary=f"Proposed {len(candidates)} candidate compositions",
            claims=[{
                "claimId": f"comp-claim-{state.get('message_sequence', 0) + 1}",
                "statement": f"Proposed {len(candidates)} candidates with registered components only",
                "confidence": 0.85,
            }],
            candidate_refs=[c.get("candidateId", "") for c in candidates],
        )

        updates = self._append_msg(state, msg)
        updates["candidate_compositions"] = candidates
        return updates
