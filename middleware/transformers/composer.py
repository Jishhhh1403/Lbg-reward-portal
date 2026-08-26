import uuid
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schemas.sdui import SDUIComponent, SDUIAction, SDUIScreen

PERSONA_ACCENT_TOKENS = {
    "INSTANT_GRATIFICATION": "achievement",
    "GOAL_ORIENTED_SAVER": "goal_progress",
    "LONG_TERM_PLANNER": "community",
    "CHURN_RISK": "urgency",
    "GAMIFICATION_MOTIVATED": "achievement",
    "MIXED_PROFILE": "celebration",
    "PLANNER_AT_RISK_MIX": "urgency",
    "INSTANT_AT_RISK_MIX": "urgency",
}

# Goals with a target above this are treated as long-horizon goals in mixed profiles.
LONG_TERM_GOAL_THRESHOLD = 20000

INSIGHT_COMPONENTS = {
    "EDUCATIONAL_INSIGHT_CARD",
    "PERSONALIZED_OFFER_CARD",
    "REWARDS_INSIGHT_CARD",
}

# Learning content always renders with the education accent.
EDUCATION_COMPONENTS = {
    "LEARNING_PATH_CARD",
    "DAILY_MONEY_TIP_CARD",
    "POINTS_ACADEMY_BADGE_CARD",
    "MYTH_OR_FACT_CARD",
    "SAVINGS_CALCULATOR_CARD",
    "COACH_TIP_CARD",
    "HOW_POINTS_WORK_CARD",
}

# Automation controls render with the automation accent.
AUTOMATION_COMPONENTS = {
    "AUTO_RULES_CARD",
}

# Layout hints consumed by the front-end SDUI renderer.
# "full" cards occupy an entire row; consecutive "half" cards pair up in a 2-column grid.
COMPONENT_SPANS = {
    "POINTS_BALANCE": "full",
    "INSTANT_REWARD_POPUP": "full",
    "FLASH_REWARD_BANNER": "full",
    "QUICK_REDEEM_CARD": "full",
    "TANGIBLE_VALUE_CARD": "full",
    "REWARD_CAROUSEL": "full",
    "GOAL_PROGRESS_CARD": "half",
    "ADD_GOAL_CARD": "half",
    "GOAL_MILESTONE_CARD": "full",
    "GOAL_LINKED_REWARD": "full",
    "RECOMMENDED_ACTIONS": "full",
    "FUTURE_VALUE_CARD": "full",
    "PROJECTION_CHART": "full",
    "LONG_TERM_GOAL_CARD": "half",
    "EDUCATIONAL_INSIGHT_CARD": "full",
    "FUTURE_MILESTONE_CARD": "full",
    "EXPIRING_POINTS_ALERT": "full",
    "COUNTDOWN_CARD": "half",
    "QUICK_WIN_CARD": "full",
    "PERSONALIZED_OFFER_CARD": "full",
    "REENGAGEMENT_BANNER": "full",
    "STREAK_CARD": "half",
    "CHALLENGE_CARD": "half",
    "LEADERBOARD": "full",
    "QUIZ_CARD": "half",
    "BADGE_CARD": "full",
    "MILESTONE_CARD": "full",
    "METRIC_TILE": "half",
    "BRAND_EXPLORER_CARD": "full",
    "SYNC_STATUS_CARD": "full",
    "REWARDS_INSIGHT_CARD": "full",
    # Educational & financial literacy
    "LEARNING_PATH_CARD": "full",
    "DAILY_MONEY_TIP_CARD": "half",
    "POINTS_ACADEMY_BADGE_CARD": "half",
    "MYTH_OR_FACT_CARD": "full",
    "SAVINGS_CALCULATOR_CARD": "full",
    "COACH_TIP_CARD": "full",
    "HOW_POINTS_WORK_CARD": "full",
    # Goal-related rewards & automation
    "GOAL_TEMPLATE_GALLERY": "full",
    "MILESTONE_REWARD_LADDER": "full",
    "GOAL_STREAK_CARD": "half",
    "GOAL_MATCH_BOOST_CARD": "half",
    "SHARED_GOAL_CARD": "full",
    "GOAL_AT_RISK_CARD": "half",
    "AUTO_RULES_CARD": "full",
    "GOAL_COMPLETE_CELEBRATION": "full",
    # Money-smart
    "BEST_VALUE_REDEEM_CARD": "full",
    "SAVINGS_TRANSFER_CARD": "half",
    "TRAVEL_FUND_CARD": "half",
    # Analytics
    "EARN_BREAKDOWN_CARD": "full",
    "MONTH_OVER_MONTH_CARD": "full",
    "POINTS_HEALTH_SCORE": "half",
    # Social proof & community
    "PEER_INSIGHT_CARD": "full",
    "COMMUNITY_CHALLENGE_CARD": "full",
    # Lifecycle & moments
    "MILESTONE_ANNIVERSARY_CARD": "full",
    "BIRTHDAY_REWARD_CARD": "half",
    # Discovery
    "NEW_BRAND_SPOTLIGHT_CARD": "half",
    "LOCAL_DEALS_CARD": "full",
    # Control & utility
    "PREFERENCES_CARD": "full",
    "GIFT_DONATE_CARD": "half",
    "REFERRAL_CARD": "half",
}


def _uid():
    return str(uuid.uuid4())[:8]


def _make_component(component_type: str, priority: int, props: dict, actions: list = None) -> SDUIComponent:
    return SDUIComponent(
        id=f"{component_type.lower()}-{_uid()}",
        type=component_type,
        priority=priority,
        props=props,
        actions=[SDUIAction(**a) if isinstance(a, dict) else a for a in (actions or [])],
    )


class ExperienceComposer:
    def compose(self, intelligence: dict, customer_data: dict) -> SDUIScreen:
        persona = intelligence["persona"]
        strategy = self._get_strategy(persona)
        components = strategy(intelligence, customer_data)

        # Narrative storytelling order driven by the intelligence layer's
        # affinity signals; falls back to plain priority when unavailable.
        narrative_meta = None
        try:
            from services.narrative_engine import apply_narrative
            from services.card_rule_engine import evaluate_rules

            intel_payload = {**intelligence, "available": True}
            rules = evaluate_rules(intel_payload)
            enriched = apply_narrative(
                {"components": [c.model_dump(by_alias=True) for c in components]},
                intel_payload,
                rules,
            )
            ordered = enriched.get("components", [])
            components = [
                SDUIComponent(**c) if isinstance(c, dict) else c for c in ordered
            ]
            narrative_meta = enriched.get("narrative")
        except Exception as exc:  # pragma: no cover - defensive fallback
            print(f"[COMPOSER] Narrative engine unavailable, using priority order: {exc}")
            components.sort(key=lambda c: c.priority)

        self._apply_accent_tokens(persona, components)
        self._apply_layout_spans(components)

        return SDUIScreen(
            schemaVersion="1.0",
            experienceId=f"EXP-{_uid()}",
            customerId=intelligence["customerId"],
            persona=persona,
            components=components,
            narrative=narrative_meta,
        )

    def _apply_layout_spans(self, components: list[SDUIComponent]) -> None:
        for component in components:
            component.props.setdefault(
                "layout", {"span": COMPONENT_SPANS.get(component.type, "full")}
            )

    def _apply_accent_tokens(self, persona: str, components: list[SDUIComponent]) -> None:
        persona_token = PERSONA_ACCENT_TOKENS.get(persona, "brand")
        for component in components:
            if component.type in INSIGHT_COMPONENTS:
                component.props["accentToken"] = "insight"
            elif component.type in EDUCATION_COMPONENTS:
                component.props["accentToken"] = "education"
            elif component.type in AUTOMATION_COMPONENTS:
                component.props["accentToken"] = "automation"
            else:
                component.props.setdefault("accentToken", persona_token)

    def _get_strategy(self, persona: str):
        strategies = {
            "INSTANT_GRATIFICATION": self._compose_instant,
            "GOAL_ORIENTED_SAVER": self._compose_goal_oriented,
            "LONG_TERM_PLANNER": self._compose_long_term,
            "CHURN_RISK": self._compose_churn_risk,
            "GAMIFICATION_MOTIVATED": self._compose_gamification,
            "MIXED_PROFILE": self._compose_mixed,
            "PLANNER_AT_RISK_MIX": self._compose_planner_at_risk_mix,
            "INSTANT_AT_RISK_MIX": self._compose_instant_at_risk_mix,
        }
        return strategies.get(persona, self._compose_default)

    def _compose_instant(self, intel: dict, data: dict) -> list[SDUIComponent]:
        components = []

        components.append(_make_component("POINTS_BALANCE", 1, {
            "points": data["points"],
            "tier": data["tier"],
            "name": data["name"],
        }, [{"type": "VIEW_HISTORY", "payload": {}}]))

        components.append(_make_component("INSTANT_REWARD_POPUP", 2, {
            "title": "You just earned 250 bonus points!",
            "subtitle": "Claim now before it expires",
            "points": 250,
            "expiresIn": "2 hours",
            "celebration": True,
        }, [{"type": "CLAIM_REWARD", "payload": {"rewardId": "bonus-250"}}]))

        components.append(_make_component("FLASH_REWARD_BANNER", 3, {
            "title": "Flash Sale",
            "subtitle": "50% off coffee vouchers - Today only",
            "originalPoints": 400,
            "discountedPoints": 200,
            "timer": "04:32:11",
        }, [{"type": "REDEEM_REWARD", "payload": {"rewardId": "flash-coffee"}}]))

        components.append(_make_component("QUICK_REDEEM_CARD", 4, {
            "title": "Quick Redeem",
            "description": "Use your points right now",
            "rewards": [
                {"name": "Coffee Voucher", "points": 200, "icon": "coffee"},
                {"name": "Fast Food", "points": 500, "icon": "utensils"},
                {"name": "Movie Ticket", "points": 1000, "icon": "film"},
            ],
        }, [{"type": "REDEEM_REWARD", "payload": {}}]))

        components.append(_make_component("TANGIBLE_VALUE_CARD", 5, {
            "title": "Your Points Are Worth",
            "cashValue": "$42.50",
            "pointsEquivalent": 4250,
            "breakdown": [
                {"label": "Coffee vouchers", "value": "$8.00"},
                {"label": "Dining rewards", "value": "$15.00"},
                {"label": "Entertainment", "value": "$19.50"},
            ],
        }, []))

        components.append(_make_component("REWARD_CAROUSEL", 6, {
            "title": "Rewards Just For You",
            "rewards": [
                {"name": "Spa Voucher", "points": 1500, "category": "Wellness", "limited": True},
                {"name": "Tech Gadget", "points": 3000, "category": "Electronics", "limited": False},
                {"name": "Dining Experience", "points": 800, "category": "Food", "limited": True},
            ],
        }, [{"type": "OPEN_REWARD", "payload": {}}]))

        components.append(_make_component("BRAND_EXPLORER_CARD", 7, {
            "title": "Explore Eligible Brands",
            "actionLabel": "View all brands",
            "categories": [
                {"label": "Banking", "count": 12, "icon": "landmark"},
                {"label": "Dining", "count": 24, "icon": "coffee"},
                {"label": "Travel", "count": 9, "icon": "plane"},
                {"label": "Shopping", "count": 18, "icon": "shopping-bag"},
                {"label": "Entertainment", "count": 11, "icon": "film"},
                {"label": "Mobility", "count": 7, "icon": "car"},
            ],
        }, [{"type": "OPEN_LOCATE_MODAL", "payload": {}}]))

        return components

    def _compose_goal_oriented(self, intel: dict, data: dict) -> list[SDUIComponent]:
        components = []
        goals = self._collect_goals(intel)
        primary = goals[0] if goals else {}

        components.append(_make_component("POINTS_BALANCE", 1, {
            "points": data["points"],
            "tier": data["tier"],
            "name": data["name"],
        }, []))

        for i, goal in enumerate(goals):
            components.append(_make_component("GOAL_PROGRESS_CARD", 2 + i, {
                "goalName": goal.get("name", "Savings Goal"),
                "current": goal.get("currentValue", 0),
                "target": goal.get("targetValue", 100),
                "percentage": goal.get("progress", 0),
                "remaining": goal.get("targetValue", 100) - goal.get("currentValue", 0),
                "motivationalMessage": f"You're {goal.get('progress', 0)}% there! Keep going!",
            }, [{"type": "OPEN_GOAL", "payload": {"goalId": f"goal-{i + 1}"}}]))

        next_priority = 2 + len(goals)
        components.append(_make_component("ADD_GOAL_CARD", next_priority, {
            "title": "Add a New Goal",
            "subtitle": "Save toward what matters to you",
        }, [{"type": "CREATE_GOAL", "payload": {}}]))
        next_priority += 1

        components.append(_make_component("GOAL_MILESTONE_CARD", next_priority, {
            "goalName": primary.get("name", "Japan Vacation"),
            "currentMilestone": "75% Away",
            "nextMilestone": "80%",
            "milestones": [
                {"label": "25%", "reached": True},
                {"label": "50%", "reached": True},
                {"label": "75%", "reached": False},
                {"label": "100%", "reached": False},
            ],
        }, []))
        next_priority += 1

        components.append(_make_component("GOAL_LINKED_REWARD", next_priority, {
            "title": "Earn Toward Your Goal",
            "rewards": [
                {"name": "Double Points Weekend", "bonus": 200, "goalLinked": True},
                {"name": "Flight Discount", "points": 500, "goalLinked": True},
            ],
            "goalName": primary.get("name", "Japan Vacation"),
        }, [{"type": "CLAIM_REWARD", "payload": {}}]))
        next_priority += 1

        remaining = primary.get("targetValue", 2500) - primary.get("currentValue", 1680)
        components.append(_make_component("RECOMMENDED_ACTIONS", next_priority, {
            "title": f"{remaining} points to go!",
            "actions": [
                {"label": "Complete a challenge", "points": 150, "icon": "target"},
                {"label": "Refer a friend", "points": 500, "icon": "users"},
                {"label": "Shop with partners", "points": 300, "icon": "shopping-bag"},
            ],
        }, []))
        next_priority += 1

        components.append(_make_component("REWARDS_INSIGHT_CARD", next_priority, {
            "title": "Your Rewards Insight",
            "topBrandName": "Avios Travel",
            "topBrandPoints": 640,
            "growthTip": f"Redeeming with travel partners moves you {max(remaining // 10, 1)} points closer to your goal on average.",
            "expiringPoints": 0,
            "expiryDate": "",
            "ctaText": "Redeem smarter",
        }, [{"type": "OPEN_REDEEM_MODAL", "payload": {}}]))

        return components

    def _compose_long_term(self, intel: dict, data: dict) -> list[SDUIComponent]:
        components = []
        goals = self._collect_goals(intel)
        primary = goals[0] if goals else {}

        components.append(_make_component("POINTS_BALANCE", 1, {
            "points": data["points"],
            "tier": data["tier"],
            "name": data["name"],
        }, []))

        components.append(_make_component("FUTURE_VALUE_CARD", 2, {
            "title": "Your Rewards, Growing",
            "currentValue": data["points"],
            "projectedValue": int(data["points"] * 3.5),
            "timeframe": "10 years",
            "growthRate": "12% annually",
            "message": "Your patience pays off. Your rewards are projected to grow significantly.",
        }, []))

        for i, goal in enumerate(goals):
            components.append(_make_component("LONG_TERM_GOAL_CARD", 3 + i, {
                "goalName": goal.get("name", "Long-Term Goal"),
                "current": goal.get("currentValue", 0),
                "target": goal.get("targetValue", 100),
                "percentage": goal.get("progress", 0),
                "estimatedCompletion": str(2031 + i),
                "message": "Steady progress toward your long-term goal",
            }, [{"type": "OPEN_GOAL", "payload": {"goalId": f"goal-lt-{i + 1}"}}]))

        next_priority = 3 + len(goals)
        components.append(_make_component("ADD_GOAL_CARD", next_priority, {
            "title": "Add a New Goal",
            "subtitle": "Plan for your future, one goal at a time",
        }, [{"type": "CREATE_GOAL", "payload": {}}]))
        next_priority += 1

        components.append(_make_component("PROJECTION_CHART", next_priority, {
            "title": "Value Projection",
            "data": [
                {"year": "Now", "value": data["points"]},
                {"year": "Year 2", "value": int(data["points"] * 1.24)},
                {"year": "Year 5", "value": int(data["points"] * 1.76)},
                {"year": "Year 10", "value": int(data["points"] * 3.1)},
                {"year": "Year 15", "value": int(data["points"] * 5.35)},
            ],
            "growthLabel": "Projected Growth",
        }, []))
        next_priority += 1

        components.append(_make_component("EDUCATIONAL_INSIGHT_CARD", next_priority, {
            "title": "Did You Know?",
            "insight": "Customers who consistently earn 500+ points monthly see an average 340% increase in rewards value over 10 years.",
            "source": "Rewards Intelligence Report 2024",
            "actionLabel": "Learn more about long-term rewards",
        }, []))
        next_priority += 1

        components.append(_make_component("FUTURE_MILESTONE_CARD", next_priority, {
            "title": "Upcoming Milestones",
            "milestones": [
                {"label": "35% of goal", "date": "March 2027", "achieved": False},
                {"label": "50% of goal", "date": "September 2027", "achieved": False},
                {"label": "75% of goal", "date": "March 2029", "achieved": False},
            ],
        }, []))

        return components

    @staticmethod
    def _collect_goals(intel: dict) -> list[dict]:
        goals = intel.get("goals") or []
        if not goals and intel.get("goal"):
            goals = [intel["goal"]]
        return goals

    def _compose_mixed(self, intel: dict, data: dict) -> list[SDUIComponent]:
        """Mixed profile: blends goal-oriented, long-term planner and gamification components."""
        components = []
        goals = self._collect_goals(intel)
        short_term = [g for g in goals if g.get("targetValue", 0) < LONG_TERM_GOAL_THRESHOLD]
        long_term = [g for g in goals if g.get("targetValue", 0) >= LONG_TERM_GOAL_THRESHOLD]

        components.append(_make_component("POINTS_BALANCE", 1, {
            "points": data["points"],
            "tier": data["tier"],
            "name": data["name"],
        }, []))

        priority = 2
        for i, goal in enumerate(short_term):
            components.append(_make_component("GOAL_PROGRESS_CARD", priority, {
                "goalName": goal.get("name", "Savings Goal"),
                "current": goal.get("currentValue", 0),
                "target": goal.get("targetValue", 100),
                "percentage": goal.get("progress", 0),
                "remaining": goal.get("targetValue", 100) - goal.get("currentValue", 0),
                "motivationalMessage": f"You're {goal.get('progress', 0)}% there! Keep going!",
            }, [{"type": "OPEN_GOAL", "payload": {"goalId": f"goal-mix-s{i + 1}"}}]))
            priority += 1

        for i, goal in enumerate(long_term):
            components.append(_make_component("LONG_TERM_GOAL_CARD", priority, {
                "goalName": goal.get("name", "Long-Term Goal"),
                "current": goal.get("currentValue", 0),
                "target": goal.get("targetValue", 100),
                "percentage": goal.get("progress", 0),
                "estimatedCompletion": str(2035 + i),
                "message": "Steady progress toward your long-term goal",
            }, [{"type": "OPEN_GOAL", "payload": {"goalId": f"goal-mix-l{i + 1}"}}]))
            priority += 1

        components.append(_make_component("ADD_GOAL_CARD", priority, {
            "title": "Add a New Goal",
            "subtitle": "Save toward what matters to you",
        }, [{"type": "CREATE_GOAL", "payload": {}}]))
        priority += 1

        components.append(_make_component("STREAK_CARD", priority, {
            "streakDays": data.get("streak_days", 21),
            "message": "Keep your streak alive!",
            "nextReward": "500 bonus points at 30 days",
            "milestones": [
                {"days": 7, "reward": "Badge", "achieved": True},
                {"days": 14, "reward": "100 pts", "achieved": True},
                {"days": 30, "reward": "500 pts", "achieved": False},
                {"days": 60, "reward": "Gold Badge", "achieved": False},
            ],
        }, [{"type": "VIEW_STREAK", "payload": {}}]))
        priority += 1

        components.append(_make_component("CHALLENGE_CARD", priority, {
            "title": "Active Challenge",
            "name": "Goal Booster Sprint",
            "description": "Earn 1500 points this week to fast-forward your goals",
            "progress": 55,
            "reward": "750 bonus points",
            "daysLeft": 4,
            "participants": 1932,
        }, [{"type": "START_CHALLENGE", "payload": {"challengeId": "booster-1"}}]))
        priority += 1

        components.append(_make_component("LEADERBOARD", priority, {
            "title": "Weekly Leaderboard",
            "userRank": data.get("leaderboard_rank", 7),
            "userPoints": data["points"],
            "period": "weekly",
            "entries": [
                {"rank": 5, "name": "Elena Novak", "points": 18200, "avatar": "EN"},
                {"rank": 6, "name": "Tom Becker", "points": 16100, "avatar": "TB"},
                {"rank": 7, "name": data["name"], "points": data["points"], "avatar": "PS", "isCurrentUser": True},
                {"rank": 8, "name": "Ava Kim", "points": 14300, "avatar": "AK"},
                {"rank": 9, "name": "Leo Martins", "points": 13850, "avatar": "LM"},
            ],
        }, [{"type": "VIEW_LEADERBOARD", "payload": {}}]))

        return components

    def _compose_churn_risk(self, intel: dict, data: dict) -> list[SDUIComponent]:
        components = []
        risk = intel.get("risk", {})

        components.append(_make_component("POINTS_BALANCE", 1, {
            "points": data["points"],
            "tier": data["tier"],
            "name": data["name"],
        }, []))

        components.append(_make_component("EXPIRING_POINTS_ALERT", 2, {
            "title": "Your Points Are Expiring",
            "expiringPoints": risk.get("expiringPoints", 1850),
            "daysLeft": risk.get("daysUntilExpiry", 12),
            "urgency": "high",
            "message": f"Don't lose your {risk.get('expiringPoints', 1850)} points! Use them before they expire.",
        }, [{"type": "USE_EXPIRING", "payload": {}}]))

        components.append(_make_component("COUNTDOWN_CARD", 3, {
            "title": "Time Remaining",
            "days": risk.get("daysUntilExpiry", 12),
            "hours": 0,
            "minutes": 0,
            "message": "Don't wait too long",
        }, []))

        components.append(_make_component("QUICK_WIN_CARD", 4, {
            "title": "Quick Win Rewards",
            "subtitle": "Redeem these before your points expire",
            "rewards": [
                {"name": "Coffee Voucher", "points": 200, "quickWin": True},
                {"name": "Sandwich Deal", "points": 350, "quickWin": True},
                {"name": "Parking Pass", "points": 500, "quickWin": True},
            ],
        }, [{"type": "REDEEM_REWARD", "payload": {}}]))

        components.append(_make_component("PERSONALIZED_OFFER_CARD", 5, {
            "title": "Welcome Back Offer",
            "subtitle": "We miss you! Here's something special",
            "offer": "50% bonus on your next redemption",
            "validUntil": "7 days",
            "message": "As a valued member, we've prepared this exclusive offer just for you.",
        }, [{"type": "CLAIM_OFFER", "payload": {"offerId": "welcome-back-50"}}]))

        components.append(_make_component("REENGAGEMENT_BANNER", 6, {
            "title": "Welcome Back!",
            "message": "Your rewards journey continues. We've curated these rewards just for you.",
            "ctaText": "Start Exploring",
        }, [{"type": "EXPLORE_REWARDS", "payload": {}}]))

        components.append(_make_component("SYNC_STATUS_CARD", 7, {
            "status": "synced",
            "title": "All your points are safe and up to date",
            "lastSyncedAt": "today, 09:41",
            "message": "Nothing expires without us telling you first.",
            "ctaText": "Refresh points",
        }, [{"type": "REFRESH_DATA", "payload": {}}]))

        return components

    def _compose_planner_at_risk_mix(self, intel: dict, data: dict) -> list[SDUIComponent]:
        """Planner x At-Risk mix: protect accumulated value while gently re-engaging."""
        components = []
        goals = self._collect_goals(intel)
        risk = intel.get("risk") or {}
        expiring = risk.get("expiringPoints", data.get("expiring_points", 0))
        days_left = risk.get("daysUntilExpiry", data.get("days_until_expiry", 30))

        components.append(_make_component("POINTS_BALANCE", 1, {
            "points": data["points"],
            "tier": data["tier"],
            "name": data["name"],
        }, []))

        components.append(_make_component("EXPIRING_POINTS_ALERT", 2, {
            "title": "Part of Your Savings Is Expiring",
            "expiringPoints": expiring,
            "daysLeft": days_left,
            "urgency": "HIGH",
            "message": f"{expiring} points you saved are about to expire. Put them toward a goal you care about.",
        }, [{"type": "USE_EXPIRING", "payload": {}}]))

        components.append(_make_component("FUTURE_VALUE_CARD", 3, {
            "title": "Your Rewards, Still Growing",
            "currentValue": data["points"],
            "projectedValue": int(data["points"] * 3.2),
            "timeframe": "10 years",
            "growthRate": "11% annually",
            "message": "You have built serious momentum. A quick visit now protects the future you planned.",
        }, []))

        priority = 4
        for i, goal in enumerate(goals):
            components.append(_make_component("LONG_TERM_GOAL_CARD", priority, {
                "goalName": goal.get("name", "Long-Term Goal"),
                "current": goal.get("currentValue", 0),
                "target": goal.get("targetValue", 100),
                "percentage": goal.get("progress", 0),
                "estimatedCompletion": str(2033 + i),
                "message": "Steady progress toward your long-term goal",
            }, [{"type": "OPEN_GOAL", "payload": {"goalId": f"goal-par-{i + 1}"}}]))
            priority += 1

        components.append(_make_component("ADD_GOAL_CARD", priority, {
            "title": "Add a New Goal",
            "subtitle": "Plan for your future, one goal at a time",
        }, [{"type": "CREATE_GOAL", "payload": {}}]))
        priority += 1

        components.append(_make_component("COUNTDOWN_CARD", priority, {
            "title": "Time Remaining",
            "days": days_left,
            "hours": 0,
            "minutes": 0,
            "message": "Redeem soon so nothing goes to waste",
        }, []))
        priority += 1

        components.append(_make_component("QUICK_WIN_CARD", priority, {
            "title": "Quick Win While You Decide",
            "subtitle": "Small redemptions that keep your balance working",
            "rewards": [
                {"name": "Coffee Voucher", "points": 200, "quickWin": True},
                {"name": "Charity Donation", "points": 250, "quickWin": True},
                {"name": "Parking Pass", "points": 500, "quickWin": True},
            ],
        }, [{"type": "REDEEM_REWARD", "payload": {}}]))

        return components

    def _compose_instant_at_risk_mix(self, intel: dict, data: dict) -> list[SDUIComponent]:
        """Instant x At-Risk mix: win back with immediately redeemable value."""
        components = []
        risk = intel.get("risk") or {}
        expiring = risk.get("expiringPoints", data.get("expiring_points", 0))
        days_left = risk.get("daysUntilExpiry", data.get("days_until_expiry", 30))

        components.append(_make_component("POINTS_BALANCE", 1, {
            "points": data["points"],
            "tier": data["tier"],
            "name": data["name"],
        }, [{"type": "VIEW_HISTORY", "payload": {}}]))

        components.append(_make_component("EXPIRING_POINTS_ALERT", 2, {
            "title": "Your Points Are Expiring",
            "expiringPoints": expiring,
            "daysLeft": days_left,
            "urgency": "HIGH",
            "message": f"Don't lose your {expiring} points! Grab something you love before they're gone.",
        }, [{"type": "USE_EXPIRING", "payload": {}}]))

        components.append(_make_component("FLASH_REWARD_BANNER", 3, {
            "title": "Welcome Back Flash Deal",
            "subtitle": "50% off coffee vouchers - Today only",
            "originalPoints": 400,
            "discountedPoints": 200,
            "timer": "08:15:00",
        }, [{"type": "REDEEM_REWARD", "payload": {"rewardId": "flash-coffee"}}]))

        components.append(_make_component("QUICK_REDEEM_CARD", 4, {
            "title": "Quick Redeem",
            "description": "Use your points right now",
            "rewards": [
                {"name": "Coffee Voucher", "points": 200, "icon": "coffee"},
                {"name": "Fast Food", "points": 500, "icon": "utensils"},
                {"name": "Movie Ticket", "points": 1000, "icon": "film"},
            ],
        }, [{"type": "REDEEM_REWARD", "payload": {}}]))

        components.append(_make_component("INSTANT_REWARD_POPUP", 5, {
            "title": "We kept 250 bonus points waiting for you",
            "subtitle": "Claim now before it expires",
            "points": 250,
            "expiresIn": f"{max(days_left - 1, 1)} days",
            "celebration": True,
        }, [{"type": "CLAIM_REWARD", "payload": {"rewardId": "welcome-back-bonus"}}]))

        components.append(_make_component("QUICK_WIN_CARD", 6, {
            "title": "Quick Win Rewards",
            "subtitle": "Redeem these before your points expire",
            "rewards": [
                {"name": "Snack Box", "points": 350, "quickWin": True},
                {"name": "Streaming Pass", "points": 450, "quickWin": True},
                {"name": "Parking Pass", "points": 500, "quickWin": True},
            ],
        }, [{"type": "REDEEM_REWARD", "payload": {}}]))

        components.append(_make_component("COUNTDOWN_CARD", 7, {
            "title": "Time Remaining",
            "days": days_left,
            "hours": 0,
            "minutes": 0,
            "message": "Don't wait too long",
        }, []))

        components.append(_make_component("SYNC_STATUS_CARD", 8, {
            "status": "synced",
            "title": "All your points are safe and up to date",
            "lastSyncedAt": "today, 09:41",
            "message": "Nothing expires without us telling you first.",
            "ctaText": "Refresh points",
        }, [{"type": "REFRESH_DATA", "payload": {}}]))

        return components

    def _compose_gamification(self, intel: dict, data: dict) -> list[SDUIComponent]:
        components = []

        components.append(_make_component("POINTS_BALANCE", 1, {
            "points": data["points"],
            "tier": data["tier"],
            "name": data["name"],
        }, []))

        components.append(_make_component("STREAK_CARD", 2, {
            "streakDays": data.get("streak_days", 34),
            "message": "Keep your streak alive!",
            "nextReward": "500 bonus points at 40 days",
            "milestones": [
                {"days": 7, "reward": "Badge", "achieved": True},
                {"days": 14, "reward": "100 pts", "achieved": True},
                {"days": 30, "reward": "250 pts", "achieved": True},
                {"days": 40, "reward": "500 pts", "achieved": False},
                {"days": 60, "reward": "Gold Badge", "achieved": False},
            ],
        }, [{"type": "VIEW_STREAK", "payload": {}}]))

        components.append(_make_component("CHALLENGE_CARD", 3, {
            "title": "Active Challenge",
            "name": "Points Sprint",
            "description": "Earn 1000 points this week",
            "progress": 65,
            "reward": "500 bonus points",
            "daysLeft": 3,
            "participants": 2847,
        }, [{"type": "START_CHALLENGE", "payload": {"challengeId": "sprint-1"}}]))

        components.append(_make_component("LEADERBOARD", 4, {
            "title": "Weekly Leaderboard",
            "userRank": data.get("leaderboard_rank", 3),
            "userPoints": data["points"],
            "period": "weekly",
            "entries": [
                {"rank": 1, "name": "Kai Thompson", "points": 12450, "avatar": "KT"},
                {"rank": 2, "name": "Nina Patel", "points": 10200, "avatar": "NP"},
                {"rank": 3, "name": "Marcus Johnson", "points": 8750, "avatar": "MJ", "isCurrentUser": True},
                {"rank": 4, "name": "Sophie Lee", "points": 7800, "avatar": "SL"},
                {"rank": 5, "name": "Carlos Ruiz", "points": 6900, "avatar": "CR"},
            ],
        }, [{"type": "VIEW_LEADERBOARD", "payload": {}}]))

        components.append(_make_component("QUIZ_CARD", 5, {
            "title": "Daily Quiz",
            "question": "How many points do you need for a Gold tier upgrade?",
            "options": ["5,000", "10,000", "15,000", "20,000"],
            "reward": "100 points for correct answer",
            "timeLimit": 30,
        }, [{"type": "SUBMIT_QUIZ", "payload": {}}]))

        components.append(_make_component("BADGE_CARD", 6, {
            "title": "Your Badges",
            "badges": [
                {"name": "Streak Master", "icon": "flame", "earned": True},
                {"name": "Challenge Champion", "icon": "trophy", "earned": True},
                {"name": "Community Star", "icon": "star", "earned": True},
                {"name": "Quiz Whiz", "icon": "brain", "earned": False},
                {"name": "Top 10", "icon": "crown", "earned": False},
            ],
            "totalEarned": data.get("badges", 15),
            "totalAvailable": 25,
        }, []))

        components.append(_make_component("MILESTONE_CARD", 7, {
            "title": "Your Milestones",
            "milestones": [
                {"label": "First 1000 points", "achieved": True},
                {"label": "10-day streak", "achieved": True},
                {"label": "Win a challenge", "achieved": True},
                {"label": "Top 5 leaderboard", "achieved": False},
                {"label": "25 badges", "achieved": False},
            ],
        }, []))

        components.append(_make_component("METRIC_TILE", 8, {
            "label": "Engagement Score",
            "value": f"{min(int(data.get('challenges_completed', 0) * 8 + data.get('streak_days', 0) * 2), 100)}",
            "unit": "Top 5% of members",
            "infoText": "Your engagement score reflects challenges, streaks and leaderboard activity.",
            "accent": "amber",
        }, []))

        return components

    def _compose_default(self, intel: dict, data: dict) -> list[SDUIComponent]:
        return [
            _make_component("POINTS_BALANCE", 1, {
                "points": data["points"],
                "tier": data["tier"],
                "name": data["name"],
            }, []),
            _make_component("SYNC_STATUS_CARD", 2, {
                "status": "synced",
                "title": "All your points are up to date",
                "lastSyncedAt": "today",
                "message": "All brand points have been successfully updated.",
                "ctaText": "Refresh",
            }, [{"type": "REFRESH_DATA", "payload": {}}]),
        ]
