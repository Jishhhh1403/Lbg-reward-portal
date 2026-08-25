import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schemas.sdui import SDUIScreen, SDUIComponent

VALID_COMPONENT_TYPES = {
    "POINTS_BALANCE",
    "INSTANT_REWARD_POPUP",
    "FLASH_REWARD_BANNER",
    "QUICK_REDEEM_CARD",
    "TANGIBLE_VALUE_CARD",
    "REWARD_CAROUSEL",
    "GOAL_PROGRESS_CARD",
    "GOAL_MILESTONE_CARD",
    "GOAL_LINKED_REWARD",
    "RECOMMENDED_ACTIONS",
    "ADD_GOAL_CARD",
    "FUTURE_VALUE_CARD",
    "PROJECTION_CHART",
    "LONG_TERM_GOAL_CARD",
    "EDUCATIONAL_INSIGHT_CARD",
    "FUTURE_MILESTONE_CARD",
    "EXPIRING_POINTS_ALERT",
    "COUNTDOWN_CARD",
    "QUICK_WIN_CARD",
    "PERSONALIZED_OFFER_CARD",
    "REENGAGEMENT_BANNER",
    "STREAK_CARD",
    "CHALLENGE_CARD",
    "LEADERBOARD",
    "QUIZ_CARD",
    "BADGE_CARD",
    "MILESTONE_CARD",
    "CTA_BUTTON",
    "HEADER",
    "NOTIFICATION",
    "REWARD_CARD",
    "MODAL",
    "BOTTOM_SHEET",
    "TIER_PROGRESS",
    "TIER_REWARD",
    "COMMUNITY_ACHIEVEMENT",
    "RANK_PROGRESS",
    "METRIC_TILE",
    "BRAND_EXPLORER_CARD",
    "SYNC_STATUS_CARD",
    "REWARDS_INSIGHT_CARD",
    # Educational & financial literacy
    "LEARNING_PATH_CARD",
    "DAILY_MONEY_TIP_CARD",
    "POINTS_ACADEMY_BADGE_CARD",
    "MYTH_OR_FACT_CARD",
    "SAVINGS_CALCULATOR_CARD",
    "COACH_TIP_CARD",
    "HOW_POINTS_WORK_CARD",
    # Goal-related rewards & automation
    "GOAL_TEMPLATE_GALLERY",
    "MILESTONE_REWARD_LADDER",
    "GOAL_STREAK_CARD",
    "GOAL_MATCH_BOOST_CARD",
    "SHARED_GOAL_CARD",
    "GOAL_AT_RISK_CARD",
    "AUTO_RULES_CARD",
    "GOAL_COMPLETE_CELEBRATION",
    # Money-smart
    "BEST_VALUE_REDEEM_CARD",
    "SAVINGS_TRANSFER_CARD",
    "TRAVEL_FUND_CARD",
    # Analytics
    "EARN_BREAKDOWN_CARD",
    "MONTH_OVER_MONTH_CARD",
    "POINTS_HEALTH_SCORE",
    # Social proof & community
    "PEER_INSIGHT_CARD",
    "COMMUNITY_CHALLENGE_CARD",
    # Lifecycle & moments
    "MILESTONE_ANNIVERSARY_CARD",
    "BIRTHDAY_REWARD_CARD",
    # Discovery
    "NEW_BRAND_SPOTLIGHT_CARD",
    "LOCAL_DEALS_CARD",
    # Control & utility
    "PREFERENCES_CARD",
    "GIFT_DONATE_CARD",
    "REFERRAL_CARD",
    # Value certainty & transparency
    "REWARD_CHOICE_PANEL",
    "PARTNER_VALUE_COMPARISON",
    "WHY_THIS_UI_CARD",
    # Payment utility
    "PAYMENT_REWARD_CARD",
    "REWARD_ALLOCATION_CONTROL",
    "PAYMENT_REWARD_CONFIRMATION",
    # Educational competence
    "LEARNING_MISSION_CARD",
    "COMPREHENSION_FEEDBACK_CARD",
    "CONFIDENCE_PROGRESS_CARD",
    # Interoperability & portability
    "CONSOLIDATED_REWARD_WALLET",
    "PARTNER_TRANSFER_CARD",
    "REWARD_PROVENANCE_CARD",
    "PROGRAMME_CONNECTION_CARD",
}


class ValidationError:
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message

    def to_dict(self):
        return {"field": self.field, "message": self.message}


class ValidationResult:
    def __init__(self):
        self.errors: list[ValidationError] = []
        self.warnings: list[str] = []

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0

    def add_error(self, field: str, message: str):
        self.errors.append(ValidationError(field, message))

    def add_warning(self, message: str):
        self.warnings.append(message)

    def to_dict(self):
        return {
            "valid": self.is_valid,
            "errors": [e.to_dict() for e in self.errors],
            "warnings": self.warnings,
        }


class SDUIValidator:
    def validate(self, screen: SDUIScreen) -> ValidationResult:
        result = ValidationResult()

        if screen.schema_version not in ("1.0", "1.1"):
            result.add_error("schemaVersion", f"Unsupported schema version: {screen.schema_version}")

        if not screen.experience_id:
            result.add_error("experienceId", "experienceId is required")

        if not screen.customer_id:
            result.add_error("customerId", "customerId is required")

        if not screen.persona:
            result.add_error("persona", "persona is required")

        if not screen.components:
            result.add_error("components", "At least one component is required")

        seen_priorities = set()
        for i, comp in enumerate(screen.components):
            prefix = f"components[{i}]"

            if not comp.id:
                result.add_error(f"{prefix}.id", "Component id is required")

            if comp.type not in VALID_COMPONENT_TYPES:
                result.add_error(f"{prefix}.type", f"Unknown component type: {comp.type}")

            if comp.priority in seen_priorities:
                result.add_warning(f"{prefix}.priority", f"Duplicate priority: {comp.priority}")
            seen_priorities.add(comp.priority)

            if comp.priority < 1 or comp.priority > 100:
                result.add_error(f"{prefix}.priority", f"Priority must be between 1 and 100, got {comp.priority}")

            if comp.version not in ("1.0", "1.1"):
                result.add_error(f"{prefix}.version", f"Invalid version: {comp.version}")

            for j, action in enumerate(comp.actions):
                if not action.type:
                    result.add_error(f"{prefix}.actions[{j}].type", "Action type is required")

        return result
