import sys
import os
import logging
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.base import IntelligenceProvider
from models.intelligence import (
    IntelligenceResponse,
    InsightProbabilities,
    MotiveScores,
    PersonalityInsights,
    PersonalityMotiveScores,
    PredictedResponses,
    Persona,
    Motivation,
    Priority,
    Recommendation,
    GoalInfo,
    RiskInfo,
)
from personas.customer_data import CUSTOMER_DATA

logger = logging.getLogger(__name__)


class MockIntelligenceProvider(IntelligenceProvider):
    def __init__(self):
        self._db_available = False
        self._try_init_db()

    def _try_init_db(self):
        try:
            from services.db_client import get_customer
            self._db_available = True
            logger.info("[PROVIDER] Database client available, will prefer DB")
        except Exception as e:
            logger.info("[PROVIDER] Database client not available, using static data: %s", e)
            self._db_available = False

    def get_customer_intelligence(self, customer_id: str) -> IntelligenceResponse:
        data = None

        # Try database first
        if self._db_available:
            try:
                import asyncio
                try:
                    loop = asyncio.get_running_loop()
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor() as pool:
                        future = pool.submit(asyncio.run, self._get_from_db(customer_id))
                        data = future.result(timeout=5.0)
                except RuntimeError:
                    data = asyncio.run(self._get_from_db(customer_id))
            except Exception as e:
                logger.warning("[PROVIDER] DB fetch failed for %s: %s, falling back to static", customer_id, e)
                data = None

        # Fallback to static data
        if data is None:
            data = CUSTOMER_DATA.get(customer_id)

        if not data:
            raise ValueError(f"Customer {customer_id} not found")

        return self._analyze_customer(data)

    async def _get_from_db(self, customer_id: str):
        from services.db_client import get_customer
        return await get_customer(customer_id)

    def _motive_scores(self, data: dict) -> MotiveScores:
        return MotiveScores(**data.get("motive_scores", {}))

    def _analyze_customer(self, data: dict) -> IntelligenceResponse:
        behaviors = data["behaviors"]
        m = self._motive_scores(data)

        # Card rule engine personas take precedence when their motive
        # thresholds are clearly met; legacy heuristics apply otherwise.
        if self._is_value_certainty_seeker(m):
            response = self._value_certainty_intelligence(data)
        elif self._is_payment_utility_focused(m):
            response = self._payment_utility_intelligence(data)
        elif self._is_educational_competence(m):
            response = self._educational_competence_intelligence(data)
        elif self._is_interoperability_seeker(m):
            response = self._interoperability_intelligence(data)
        elif self._is_preview_guaranteed(m):
            response = self._preview_guaranteed_intelligence(data)
        elif self._is_planner_at_risk_mix(data, behaviors):
            response = self._planner_at_risk_intelligence(data)
        elif self._is_instant_at_risk_mix(data, behaviors):
            response = self._instant_at_risk_intelligence(data)
        elif self._is_mixed_profile(data, behaviors):
            response = self._mixed_profile_intelligence(data)
        elif self._is_churn_risk(data, behaviors):
            response = self._churn_risk_intelligence(data)
        elif self._is_gamification_motivated(data, behaviors):
            response = self._gamification_intelligence(data)
        elif self._is_instant_gratification(data, behaviors):
            response = self._instant_gratification_intelligence(data)
        elif self._is_long_term_planner(data, behaviors):
            response = self._long_term_planner_intelligence(data)
        elif self._is_goal_oriented(data, behaviors):
            response = self._goal_oriented_intelligence(data)
        else:
            response = self._default_intelligence(data)

        response.customer_profile = self._build_customer_profile(data)
        response.motive_scores = self._motive_scores(data)
        response.personality_insights = self._personality_insights(data)
        affinity = self._component_affinity(data)
        response.component_affinity = affinity
        response.personalization_signals = self._personalization_signals(data, affinity)
        return response

    def _personality_insights(self, data: dict) -> PersonalityInsights | None:
        raw = data.get("personality_insights")
        if not raw:
            return None
        return PersonalityInsights(
            valueExplainerViewCount=raw.get("value_explainer_view_count", 0),
            cashEquivalentUses=raw.get("cash_equivalent_uses", 0),
            partnerComparisons=raw.get("partner_comparisons", 0),
            probabilities=InsightProbabilities(
                instantRewards=raw.get("probabilities", {}).get("instant_rewards", 0.0),
                goalLinkedReward=raw.get("probabilities", {}).get("goal_linked_reward", 0.0),
                tangibleValueExplainer=raw.get("probabilities", {}).get("tangible_value_explainer", 0.0),
                partnerConversion=raw.get("probabilities", {}).get("partner_conversion", 0.0),
                valueExplainer=raw.get("probabilities", {}).get("value_explainer", 0.0),
            ),
            motiveScores=PersonalityMotiveScores(
                valueExplainer=raw.get("motive_scores", {}).get("value_explainer", 0.0),
                autonomyPreference=raw.get("motive_scores", {}).get("autonomy_preference", 0.0),
                progressOrientation=raw.get("motive_scores", {}).get("progress_orientation", 0.0),
                paymentUtility=raw.get("motive_scores", {}).get("payment_utility", 0.0),
                portabilityPreference=raw.get("motive_scores", {}).get("portability_preference", 0.0),
                curiosityResponse=raw.get("motive_scores", {}).get("curiosity_response", 0.0),
            ),
            predictedResponses=PredictedResponses(
                tangibleValueExplainer=raw.get("predicted_responses", {}).get("tangible_value_explainer", 0.0),
                customerChoicePanel=raw.get("predicted_responses", {}).get("customer_choice_panel", 0.0),
                partnerValueComparison=raw.get("predicted_responses", {}).get("partner_value_comparison", 0.0),
                gamificationChoice=raw.get("predicted_responses", {}).get("gamification_choice", 0.0),
            ),
        )

    @staticmethod
    def _blend(*values) -> float:
        usable = [float(v) for v in values if isinstance(v, (int, float))]
        return round(sum(usable) / len(usable), 3) if usable else 0.0

    def _component_affinity(self, data: dict) -> dict[str, float]:
        """Per-category component relevance vector (0.0-1.0) derived from the
        customer's probabilities, personality motive scores and predicted
        responses. Consumed by the middleware for relevance-ranked storytelling."""
        pi = data.get("personality_insights", {}) or {}
        probs = pi.get("probabilities", {}) or {}
        motives = pi.get("motive_scores", {}) or {}
        predicted = pi.get("predicted_responses", {}) or {}
        b = data.get("behaviors", {}) or {}

        instant_prob = probs.get("instant_rewards", 0.0)

        return {
            "instant_reward": self._blend(instant_prob, b.get("immediate_redemption_rate")),
            "goal_progress": self._blend(
                probs.get("goal_linked_reward"), motives.get("progress_orientation")
            ),
            "long_term_growth": self._blend(
                round(1 - instant_prob, 3), motives.get("progress_orientation")
            ),
            "gamification_social": self._blend(
                predicted.get("gamification_choice"),
                max(motives.get("curiosity_response", 0.0) * 0.5, 0.0),
            ),
            "value_clarity_education": self._blend(
                probs.get("value_explainer"),
                probs.get("tangible_value_explainer"),
                predicted.get("tangible_value_explainer"),
                motives.get("value_explainer"),
            ),
            "partner_discovery": self._blend(
                probs.get("partner_conversion"),
                predicted.get("partner_value_comparison"),
                motives.get("portability_preference"),
            ),
            "choice_control": self._blend(
                predicted.get("customer_choice_panel"), motives.get("autonomy_preference")
            ),
            "risk_protection": self._risk_affinity(data),
        }

    def _risk_affinity(self, data: dict) -> float:
        b = data.get("behaviors", {}) or {}
        expiring = data.get("expiring_points", 0)
        days_left = data.get("days_until_expiry") or 30
        if expiring > 0:
            urgency = min(expiring / max(data.get("points", 1), 1), 1.0)
            time_pressure = max(0.0, 1 - days_left / 30)
            return round(min(0.55 + 0.45 * max(urgency, time_pressure), 1.0), 3)
        churn = self._blend(b.get("days_since_last_activity", 0) / 60, 1 - (data.get("engagement_score") or 0))
        return round(churn, 3)

    def _personalization_signals(self, data: dict, affinity: dict[str, float]) -> dict:
        """High-level personalization directives the middleware can act on
        without re-deriving behavioural meaning."""
        pi = data.get("personality_insights", {}) or {}
        motives = pi.get("motive_scores", {}) or {}
        predicted = pi.get("predicted_responses", {}) or {}
        b = data.get("behaviors", {}) or {}

        ranked_motives = sorted(
            [
                ("VALUE_CLARITY", max(motives.get("value_explainer", 0.0), pi.get("probabilities", {}).get("value_explainer", 0.0))),
                ("AUTONOMY", motives.get("autonomy_preference", 0.0)),
                ("PROGRESS", motives.get("progress_orientation", 0.0)),
                ("PAYMENT_UTILITY", motives.get("payment_utility", 0.0)),
                ("PORTABILITY", motives.get("portability_preference", 0.0)),
                ("CURIOSITY", motives.get("curiosity_response", 0.0)),
            ],
            key=lambda kv: kv[1],
            reverse=True,
        )

        instant_prob = (pi.get("probabilities", {}) or {}).get("instant_rewards", 0.0)
        if instant_prob >= 0.6:
            horizon = "IMMEDIATE"
        elif instant_prob <= 0.2 and (b.get("avg_redemption_time_hours") or 0) > 168:
            horizon = "LONG_HORIZON"
        else:
            horizon = "BALANCED"

        if predicted.get("gamification_choice", 0.0) >= 0.7:
            tone = "PLAYFUL"
        elif max(motives.get("value_explainer", 0.0), predicted.get("tangible_value_explainer", 0.0)) >= 0.7:
            tone = "EDUCATIONAL"
        elif affinity.get("risk_protection", 0.0) >= 0.7:
            tone = "REASSURING"
        else:
            tone = "CONCISE"

        engagement_drivers = [
            name for name, score in (
                ("streaks", predicted.get("gamification_choice", 0.0)),
                ("challenges", predicted.get("gamification_choice", 0.0)),
                ("cash_value_transparency", predicted.get("tangible_value_explainer", 0.0)),
                ("choice_panels", predicted.get("customer_choice_panel", 0.0)),
                ("partner_comparisons", predicted.get("partner_value_comparison", 0.0)),
            ) if score >= 0.6
        ]

        suppression_hints = []
        if predicted.get("gamification_choice", 1.0) < 0.2:
            suppression_hints.append("LOW_GAMIFICATION_RESPONSE: avoid leaderboards/public rankings/streaks")
        if predicted.get("partner_value_comparison", 1.0) < 0.15:
            suppression_hints.append("LOW_PARTNER_INTEREST: avoid partner comparison surfaces")
        if (b.get("notification_open_rate", 1.0)) < 0.15:
            suppression_hints.append("NOTIFICATION_FATIGUE: avoid urgency/countdown framing")

        return {
            "rewardHorizon": horizon,
            "topMotives": [{"motive": m, "score": round(s, 3)} for m, s in ranked_motives[:3]],
            "preferredTone": tone,
            "engagementDrivers": engagement_drivers,
            "suppressionHints": suppression_hints,
        }

    def _build_customer_profile(self, data: dict) -> dict:
        profile = {
            "name": data["name"],
            "points": data["points"],
            "tier": data["tier"],
            "engagementScore": data.get("engagement_score", 0.0),
            "behaviors": data.get("behaviors", {}),
            "signals": data.get("signals", []),
            "rewardsHistory": data.get("rewards_history", []),
            "expiringPoints": data.get("expiring_points", 0),
            "daysUntilExpiry": data.get("days_until_expiry"),
            "goals": data.get("goals", []),
            "challengesCompleted": data.get("challenges_completed", 0),
            "badges": data.get("badges", 0),
            "streakDays": data.get("streak_days", 0),
            "leaderboardRank": data.get("leaderboard_rank"),
        }
        # Forward the raw personality insights block so downstream consumers see
        # exactly what the analytics store holds.
        if data.get("personality_insights"):
            profile["personalityInsights"] = data["personality_insights"]
        return profile

    def _is_value_certainty_seeker(self, m: MotiveScores) -> bool:
        return (
            m.valueCertainty >= 0.85
            or m.valueConfusionRisk >= 0.75
            or m.probNeedValueExplanation >= 0.85
        )

    def _is_payment_utility_focused(self, m: MotiveScores) -> bool:
        return m.paymentUtility >= 0.85 and m.probPreferPaymentLinkedReward >= 0.80

    def _is_educational_competence(self, m: MotiveScores) -> bool:
        return m.competenceMotivation >= 0.85 or m.probPreferEducationReward >= 0.80

    def _is_interoperability_seeker(self, m: MotiveScores) -> bool:
        return m.portabilityPreference >= 0.85 or m.consolidatedRewardWallet >= 0.85

    def _is_preview_guaranteed(self, m: MotiveScores) -> bool:
        return m.probPreferRewardPreview >= 0.85 and m.probPreferGuaranteedValue >= 0.80

    def _value_certainty_intelligence(self, data: dict) -> IntelligenceResponse:
        goals_info = self._goals_to_info(data)
        primary_goal = goals_info[0] if goals_info else None
        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.VALUE_CERTAINTY_SEEKER,
            confidence=0.93,
            motivation=Motivation.VALUE_CLARITY,
            priority=Priority.HIGH,
            signals=data["signals"],
            recommendations=[
                Recommendation.TANGIBLE_VALUE,
                Recommendation.PERSONALIZED_OFFER,
                Recommendation.GOAL_PROGRESS,
                Recommendation.MILESTONE,
            ],
            goal=primary_goal,
            goals=goals_info,
        )

    def _payment_utility_intelligence(self, data: dict) -> IntelligenceResponse:
        goals_info = self._goals_to_info(data)
        primary_goal = goals_info[0] if goals_info else None
        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.PAYMENT_UTILITY_FOCUSED,
            confidence=0.92,
            motivation=Motivation.PAYMENT_UTILITY,
            priority=Priority.HIGH,
            signals=data["signals"],
            recommendations=[
                Recommendation.GOAL_PROGRESS,
                Recommendation.TANGIBLE_VALUE,
                Recommendation.GOAL_LINKED_REWARD,
                Recommendation.MILESTONE,
            ],
            goal=primary_goal,
            goals=goals_info,
        )

    def _educational_competence_intelligence(self, data: dict) -> IntelligenceResponse:
        goals_info = self._goals_to_info(data)
        primary_goal = goals_info[0] if goals_info else None
        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.EDUCATIONAL_COMPETENCE,
            confidence=0.94,
            motivation=Motivation.LEARNING_MASTERY,
            priority=Priority.HIGH,
            signals=data["signals"],
            recommendations=[
                Recommendation.QUIZ,
                Recommendation.GOAL_PROGRESS,
                Recommendation.MILESTONE,
                Recommendation.GOAL_LINKED_REWARD,
            ],
            goal=primary_goal,
            goals=goals_info,
        )

    def _interoperability_intelligence(self, data: dict) -> IntelligenceResponse:
        goals_info = self._goals_to_info(data)
        primary_goal = goals_info[0] if goals_info else None
        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.INTEROPERABILITY_SEEKER,
            confidence=0.91,
            motivation=Motivation.PORTABILITY,
            priority=Priority.HIGH,
            signals=data["signals"],
            recommendations=[
                Recommendation.GOAL_PROGRESS,
                Recommendation.LONG_TERM_VALUE,
                Recommendation.MILESTONE,
                Recommendation.GOAL_LINKED_REWARD,
            ],
            goal=primary_goal,
            goals=goals_info,
        )

    def _preview_guaranteed_intelligence(self, data: dict) -> IntelligenceResponse:
        goals_info = self._goals_to_info(data)
        primary_goal = goals_info[0] if goals_info else None
        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.PREVIEW_GUARANTEED_VALUE,
            confidence=0.90,
            motivation=Motivation.GUARANTEED_CERTAINTY,
            priority=Priority.HIGH,
            signals=data["signals"],
            recommendations=[
                Recommendation.TANGIBLE_VALUE,
                Recommendation.PERSONALIZED_OFFER,
                Recommendation.QUICK_WIN,
                Recommendation.GOAL_PROGRESS,
            ],
            goal=primary_goal,
            goals=goals_info,
        )

    def _is_mixed_profile(self, data: dict, b: dict) -> bool:
        has_goals = len(data.get("goals", [])) >= 2
        has_gamification = (
            data.get("challenges_completed", 0) > 3
            or data.get("streak_days", 0) > 7
            or data.get("leaderboard_rank") is not None
        )
        declared_mixed = b.get("preferred_reward_type") == "MIXED"
        return (has_goals and has_gamification) or declared_mixed

    def _has_churn_signals(self, data: dict, b: dict) -> bool:
        return (
            b["days_since_last_activity"] > 30
            or data["expiring_points"] > 1000
            or b["monthly_active_days"] < 5
        )

    def _is_planner_at_risk_mix(self, data: dict, b: dict) -> bool:
        planner = (
            b["avg_redemption_time_hours"] > 1000
            or b["preferred_reward_type"] == "LONG_TERM"
        )
        return planner and self._has_churn_signals(data, b)

    def _is_instant_at_risk_mix(self, data: dict, b: dict) -> bool:
        instant = (
            b["immediate_redemption_rate"] > 0.7
            or b["preferred_reward_type"] == "INSTANT"
            or b["avg_redemption_time_hours"] < 24
        )
        return instant and self._has_churn_signals(data, b)

    def _is_churn_risk(self, data: dict, b: dict) -> bool:
        return (
            b["days_since_last_activity"] > 30
            or data["expiring_points"] > 1000
            or b["engagement_score" if "engagement_score" in b else "monthly_active_days"] < 0.3
            or b["monthly_active_days"] < 5
        )

    def _is_gamification_motivated(self, data: dict, b: dict) -> bool:
        return (
            data["challenges_completed"] > 5
            or data["streak_days"] > 10
            or data["leaderboard_rank"] is not None
            or b["preferred_reward_type"] == "CHALLENGE"
        )

    def _is_instant_gratification(self, data: dict, b: dict) -> bool:
        return (
            b["immediate_redemption_rate"] > 0.7
            or b["preferred_reward_type"] == "INSTANT"
            or b["avg_redemption_time_hours"] < 24
        )

    def _is_long_term_planner(self, data: dict, b: dict) -> bool:
        return (
            b["avg_redemption_time_hours"] > 1000
            or b["preferred_reward_type"] == "LONG_TERM"
            or data["points"] > 20000
        )

    def _is_goal_oriented(self, data: dict, b: dict) -> bool:
        return (
            b["goal_completion_rate"] > 0.5
            or b["preferred_reward_type"] == "GOAL_LINKED"
            or len(data.get("goals", [])) > 0
        )

    def _instant_gratification_intelligence(self, data: dict) -> IntelligenceResponse:
        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.INSTANT_GRATIFICATION,
            confidence=0.94,
            motivation=Motivation.IMMEDIATE_VALUE,
            priority=Priority.HIGH,
            signals=data["signals"],
            recommendations=[
                Recommendation.INSTANT_REWARD,
                Recommendation.QUICK_REDEEM,
                Recommendation.TANGIBLE_VALUE,
            ],
        )

    def _mixed_profile_intelligence(self, data: dict) -> IntelligenceResponse:
        goals_info = [
            GoalInfo(
                name=g["name"],
                targetValue=g["target_value"],
                currentValue=g["current_value"],
                progress=g["progress"],
            )
            for g in data.get("goals", [])
        ]
        primary_goal = goals_info[0] if goals_info else None

        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.MIXED_PROFILE,
            confidence=0.87,
            motivation=Motivation.PROGRESS_AND_COMMUNITY,
            priority=Priority.HIGH,
            signals=data["signals"],
            recommendations=[
                Recommendation.GOAL_PROGRESS,
                Recommendation.GOAL_LINKED_REWARD,
                Recommendation.LONG_TERM_VALUE,
                Recommendation.PROJECTED_VALUE,
                Recommendation.CHALLENGE,
                Recommendation.STREAK,
                Recommendation.LEADERBOARD,
            ],
            goal=primary_goal,
            goals=goals_info,
        )

    def _goals_to_info(self, data: dict) -> list[GoalInfo]:
        return [
            GoalInfo(
                name=g["name"],
                targetValue=g["target_value"],
                currentValue=g["current_value"],
                progress=g["progress"],
            )
            for g in data.get("goals", [])
        ]

    def _risk_info(self, data: dict) -> RiskInfo | None:
        if data["expiring_points"] > 0:
            return RiskInfo(
                level="HIGH",
                expiringPoints=data["expiring_points"],
                daysUntilExpiry=data.get("days_until_expiry", 30),
            )
        return None

    def _planner_at_risk_intelligence(self, data: dict) -> IntelligenceResponse:
        goals_info = self._goals_to_info(data)
        primary_goal = goals_info[0] if goals_info else None

        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.PLANNER_AT_RISK_MIX,
            confidence=0.91,
            motivation=Motivation.FUTURE_SECURITY,
            priority=Priority.CRITICAL,
            signals=data["signals"],
            recommendations=[
                Recommendation.EXPIRING_POINTS,
                Recommendation.LONG_TERM_VALUE,
                Recommendation.PROJECTED_VALUE,
                Recommendation.GOAL_PROGRESS,
                Recommendation.QUICK_WIN,
                Recommendation.PERSONALIZED_OFFER,
            ],
            goal=primary_goal,
            goals=goals_info,
            risk=self._risk_info(data),
        )

    def _instant_at_risk_intelligence(self, data: dict) -> IntelligenceResponse:
        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.INSTANT_AT_RISK_MIX,
            confidence=0.92,
            motivation=Motivation.IMMEDIATE_VALUE,
            priority=Priority.CRITICAL,
            signals=data["signals"],
            recommendations=[
                Recommendation.EXPIRING_POINTS,
                Recommendation.INSTANT_REWARD,
                Recommendation.QUICK_REDEEM,
                Recommendation.TANGIBLE_VALUE,
                Recommendation.QUICK_WIN,
                Recommendation.REENGAGEMENT,
            ],
            risk=self._risk_info(data),
        )

    def _goal_oriented_intelligence(self, data: dict) -> IntelligenceResponse:
        primary_goal = data["goals"][0] if data.get("goals") else None
        goal_info = None
        if primary_goal:
            goal_info = GoalInfo(
                name=primary_goal["name"],
                targetValue=primary_goal["target_value"],
                currentValue=primary_goal["current_value"],
                progress=primary_goal["progress"],
            )

        goals_info = [
            GoalInfo(
                name=g["name"],
                targetValue=g["target_value"],
                currentValue=g["current_value"],
                progress=g["progress"],
            )
            for g in data.get("goals", [])
        ]

        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.GOAL_ORIENTED_SAVER,
            confidence=0.91,
            motivation=Motivation.GOAL_ACHIEVEMENT,
            priority=Priority.HIGH,
            signals=data["signals"],
            recommendations=[
                Recommendation.GOAL_PROGRESS,
                Recommendation.GOAL_LINKED_REWARD,
                Recommendation.MILESTONE,
            ],
            goal=goal_info,
            goals=goals_info,
        )

    def _long_term_planner_intelligence(self, data: dict) -> IntelligenceResponse:
        primary_goal = data["goals"][0] if data.get("goals") else None
        goal_info = None
        if primary_goal:
            goal_info = GoalInfo(
                name=primary_goal["name"],
                targetValue=primary_goal["target_value"],
                currentValue=primary_goal["current_value"],
                progress=primary_goal["progress"],
            )

        goals_info = [
            GoalInfo(
                name=g["name"],
                targetValue=g["target_value"],
                currentValue=g["current_value"],
                progress=g["progress"],
            )
            for g in data.get("goals", [])
        ]

        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.LONG_TERM_PLANNER,
            confidence=0.89,
            motivation=Motivation.FUTURE_SECURITY,
            priority=Priority.MEDIUM,
            signals=data["signals"],
            recommendations=[
                Recommendation.LONG_TERM_VALUE,
                Recommendation.PROJECTED_VALUE,
                Recommendation.GOAL_PROGRESS,
            ],
            goal=goal_info,
            goals=goals_info,
        )

    def _churn_risk_intelligence(self, data: dict) -> IntelligenceResponse:
        risk_info = None
        if data["expiring_points"] > 0:
            risk_info = RiskInfo(
                level="HIGH",
                expiringPoints=data["expiring_points"],
                daysUntilExpiry=data.get("days_until_expiry", 30),
            )

        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.CHURN_RISK,
            confidence=0.96,
            motivation=Motivation.RE_ENGAGEMENT,
            priority=Priority.CRITICAL,
            signals=data["signals"],
            recommendations=[
                Recommendation.EXPIRING_POINTS,
                Recommendation.REENGAGEMENT,
                Recommendation.QUICK_WIN,
                Recommendation.PERSONALIZED_OFFER,
            ],
            risk=risk_info,
        )

    def _gamification_intelligence(self, data: dict) -> IntelligenceResponse:
        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.GAMIFICATION_MOTIVATED,
            confidence=0.93,
            motivation=Motivation.PROGRESS_AND_COMMUNITY,
            priority=Priority.HIGH,
            signals=data["signals"],
            recommendations=[
                Recommendation.CHALLENGE,
                Recommendation.STREAK,
                Recommendation.LEADERBOARD,
                Recommendation.QUIZ,
                Recommendation.MILESTONE,
            ],
        )

    def _default_intelligence(self, data: dict) -> IntelligenceResponse:
        return IntelligenceResponse(
            customerId=data["id"],
            persona=Persona.GOAL_ORIENTED_SAVER,
            confidence=0.70,
            motivation=Motivation.GOAL_ACHIEVEMENT,
            priority=Priority.MEDIUM,
            signals=data.get("signals", []),
            recommendations=[
                Recommendation.GOAL_PROGRESS,
                Recommendation.MILESTONE,
            ],
        )
