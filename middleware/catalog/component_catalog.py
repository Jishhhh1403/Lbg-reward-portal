"""Component Catalog — the single source of truth for agent component selection.

Mirrors the ILRP-app frontend registry (src/renderer/componentRegistry.tsx), which maps
every registered type onto a real React card in src/components/rewards-intelligence/.

This catalog covers EVERY component the ILRP-app can render, so any persona may be
composed from the full set. Persona affinity below is guidance for the committee,
never a whitelist — any registered type may be used for any customer when it genuinely
serves them.

Semantic accent tokens (resolved by the frontend design system):
    brand          -> Lloyds green, primary actions and identity
    goal_progress  -> goal/savings progress and milestones
    achievement    -> badges, tier upgrades, reward unlocks
    urgency        -> expiring rewards, challenges, limited-time states
    insight        -> AI/personalised recommendations
    community      -> leaderboards and social progress
    celebration    -> major achievements and special moments (use sparingly)
    education      -> learning paths, money tips, academy content
    automation     -> auto-rules and hands-free earning controls

Persona accent defaults: INSTANT_GRATIFICATION=achievement,
GOAL_ORIENTED_SAVER=goal_progress, LONG_TERM_PLANNER=community,
CHURN_RISK=urgency, GAMIFICATION_MOTIVATED=achievement, MIXED_PROFILE=celebration,
PLANNER_AT_RISK_MIX=urgency, INSTANT_AT_RISK_MIX=urgency.
AI/insight components always use "insight".
"""

COMPONENT_CATALOG = {
    "POINTS_BALANCE": {
        "description": "Anchored header card showing the customer's points balance, tier and name. MANDATORY on every screen; rendered by the app's fixed header, not the body.",
        "props": {"points": "number", "tier": "string (Silver|Gold|Platinum|Diamond)", "name": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "INSTANT_REWARD_POPUP": {
        "description": "Celebratory bonus-reward card announcing freshly earned points with claim CTA and expiry.",
        "props": {"title": "string", "subtitle": "string", "points": "number", "expiresIn": "string e.g. '2 hours'", "celebration": "boolean"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "FLASH_REWARD_BANNER": {
        "description": "Genuine limited-time discounted reward banner with real before/after point costs.",
        "props": {"title": "string", "subtitle": "string", "originalPoints": "number", "discountedPoints": "number", "timer": "string HH:MM:SS"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "QUICK_REDEEM_CARD": {
        "description": "Instantly redeemable low-point rewards list with icons (coffee|utensils|film) and a view-all CTA.",
        "props": {"title": "string", "description": "string", "rewards": [{"name": "string", "points": "number", "icon": "coffee|utensils|film"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "TANGIBLE_VALUE_CARD": {
        "description": "Translates points into real cash value (GBP) with an itemized breakdown.",
        "props": {"title": "string", "cashValue": "string e.g. £42.50", "pointsEquivalent": "number", "breakdown": [{"label": "string", "value": "string"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "REWARD_CAROUSEL": {
        "description": "Scrollable curated reward catalogue filtered to the customer's taste.",
        "props": {"title": "string", "rewards": [{"name": "string", "points": "number", "category": "string", "limited": "boolean"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "GOAL_PROGRESS_CARD": {
        "description": "Progress bar toward the customer's named goal with motivational message. Emit ONE card per goal — customers with multiple goals get one GOAL_PROGRESS_CARD each.",
        "props": {"goalName": "string", "current": "number", "target": "number", "percentage": "number 0-100", "remaining": "number", "motivationalMessage": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "ADD_GOAL_CARD": {
        "description": "Dashed call-to-action card inviting the customer to create a new savings goal. Place AFTER all goal cards.",
        "props": {"title": "string default 'Add a New Goal'", "subtitle": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "GOAL_MILESTONE_CARD": {
        "description": "Milestone ladder (25%/50%/75%/100%) for the active goal showing reached steps.",
        "props": {"goalName": "string", "milestones": [{"label": "string", "reached": "boolean"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "GOAL_LINKED_REWARD": {
        "description": "Rewards whose earning accelerates the customer's specific goal.",
        "props": {"title": "string", "goalName": "string", "rewards": [{"name": "string", "points": "number", "goalLinked": "boolean"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "RECOMMENDED_ACTIONS": {
        "description": "Concrete earn-more actions with point values and icons (target|users|shopping-bag).",
        "props": {"title": "string", "actions": [{"label": "string", "points": "number", "icon": "target|users|shopping-bag"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "FUTURE_VALUE_CARD": {
        "description": "Projects current points into future value with growth rate and timeframe.",
        "props": {"title": "string", "currentValue": "number", "projectedValue": "number", "timeframe": "string", "growthRate": "string", "message": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "PROJECTION_CHART": {
        "description": "Multi-year area chart of projected rewards value.",
        "props": {"title": "string", "growthLabel": "string", "data": [{"year": "string e.g. '2027'", "value": "number"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "LONG_TERM_GOAL_CARD": {
        "description": "Long-horizon goal tracker with estimated completion date.",
        "props": {"goalName": "string", "current": "number", "target": "number", "percentage": "number 0-100", "estimatedCompletion": "string e.g. '2031'", "message": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "EDUCATIONAL_INSIGHT_CARD": {
        "description": "Short educational tip about maximizing rewards value.",
        "props": {"title": "string", "insight": "string", "source": "string", "actionLabel": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "FUTURE_MILESTONE_CARD": {
        "description": "Upcoming dated milestones the customer can look forward to.",
        "props": {"title": "string", "milestones": [{"label": "string", "date": "string e.g. 'Q4 2026'", "achieved": "boolean"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "EXPIRING_POINTS_ALERT": {
        "description": "Alert for points about to expire with days left. Only when the profile has genuine expiringPoints > 0.",
        "props": {"title": "string", "expiringPoints": "number", "daysLeft": "number", "message": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "COUNTDOWN_CARD": {
        "description": "Countdown to a genuine deadline such as points expiry or offer end.",
        "props": {"title": "string", "days": "number", "hours": "number", "minutes": "number", "message": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "QUICK_WIN_CARD": {
        "description": "Small effortless rewards redeemable immediately, ideal for lapsed users.",
        "props": {"title": "string", "subtitle": "string", "rewards": [{"name": "string", "points": "number"}]},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "PERSONALIZED_OFFER_CARD": {
        "description": "Tailored offer card with validity date based on customer history.",
        "props": {"title": "string", "subtitle": "string", "offer": "string", "validUntil": "string", "message": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "REENGAGEMENT_BANNER": {
        "description": "Warm welcome-back banner with a single low-friction CTA for inactive customers.",
        "props": {"title": "string", "message": "string", "ctaText": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "STREAK_CARD": {
        "description": "Current activity streak with next reward and milestone ladder.",
        "props": {"streakDays": "number", "message": "string", "nextReward": "string", "milestones": [{"days": "number", "reward": "string", "achieved": "boolean"}]},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "CHALLENGE_CARD": {
        "description": "Active challenge with progress bar, reward and days remaining.",
        "props": {"title": "string", "description": "string", "progress": "number 0-100", "reward": "string", "daysLeft": "number", "participants": "number"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "LEADERBOARD": {
        "description": "Leaderboard standings highlighting the customer's own rank.",
        "props": {"entries": [{"rank": "number", "name": "string", "points": "number", "avatar": "string initials", "isCurrentUser": "boolean"}], "period": "weekly|monthly|allTime"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "QUIZ_CARD": {
        "description": "Interactive trivia quiz with reward for answering.",
        "props": {"question": "string", "options": ["string"], "reward": "string", "timeLimit": "number seconds"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "BADGE_CARD": {
        "description": "Badge collection grid showing earned vs locked badges (icons: flame|trophy|star|brain|crown).",
        "props": {"title": "string", "badges": [{"name": "string", "icon": "flame|trophy|star|brain|crown", "earned": "boolean"}], "totalEarned": "number", "totalAvailable": "number"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "MILESTONE_CARD": {
        "description": "Generic achievement milestone checklist.",
        "props": {"milestones": [{"label": "string", "achieved": "boolean"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "METRIC_TILE": {
        "description": "Compact metric tile for wallet facts (total points, brands linked, coins earned). Emit in groups of three.",
        "props": {"label": "string", "value": "string", "unit": "string optional", "tone": "white|brand", "infoText": "string"},
        "defaultSpan": "third",
        "personaAffinity": ["ALL"],
    },
    "BRAND_EXPLORER_CARD": {
        "description": "Eligible brand category discovery grid (icons: landmark|shield|car|shopping-bag|basket|plane|coffee|utensils|heart|film|dumbbell|zap) with brand counts.",
        "props": {"title": "string", "actionLabel": "string", "categories": [{"label": "string", "count": "number", "icon": "landmark|shield|car|shopping-bag|basket|plane|coffee|utensils|heart|film|dumbbell|zap"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "SYNC_STATUS_CARD": {
        "description": "Trust card showing rewards sync freshness and last synced timestamp with refresh CTA.",
        "props": {"status": "synced|syncing|error", "title": "string", "lastSyncedAt": "string", "message": "string", "ctaText": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "REWARDS_INSIGHT_CARD": {
        "description": "Personalized insight card combining top brand affinity, a growth recommendation and expiring-points nudge.",
        "props": {"title": "string", "topBrandName": "string", "topBrandPoints": "number", "growthTip": "string", "expiringPoints": "number", "expiryDate": "string date e.g. '30 Sep'", "ctaText": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    # ---------- Educational & financial literacy ----------
    "LEARNING_PATH_CARD": {
        "description": "Rewards Academy micro-course progress: current lesson of N, points earned per lesson, continue CTA.",
        "props": {"courseName": "string e.g. 'Rewards Academy'", "currentLesson": "number", "totalLessons": "number", "lessonPoints": "number"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "DAILY_MONEY_TIP_CARD": {
        "description": "Rotating daily financial-wellbeing tip with category tag, expandable body and read time.",
        "props": {"tipTitle": "string", "tipBody": "string", "category": "string", "readTimeMin": "number"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "POINTS_ACADEMY_BADGE_CARD": {
        "description": "Learner level ladder (Bronze->Silver->Gold) showing lessons remaining to the next academy badge.",
        "props": {"level": "string", "nextLevel": "string", "lessonsToNext": "number"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "MYTH_OR_FACT_CARD": {
        "description": "Tap-to-reveal myth-vs-fact statements about points and money; each correct reveal earns rewardPoints.",
        "props": {"statements": [{"myth": "string", "fact": "string", "rewardPoints": "number"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "SAVINGS_CALCULATOR_CARD": {
        "description": "Interactive savings simulator: monthly presets showing year-end value plus bonus points earned.",
        "props": {"title": "string", "presets": [{"monthly": "number GBP", "yearEnd": "number GBP", "bonusPoints": "number"}], "note": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "COACH_TIP_CARD": {
        "description": "Personalized AI-coach lesson derived from the customer's own behaviour, referencing a related brand.",
        "props": {"coachName": "string e.g. 'Ava from Rewards Coaching'", "headline": "string", "body": "string", "relatedBrand": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "HOW_POINTS_WORK_CARD": {
        "description": "Numbered earn->convert->redeem explainer steps for newer members with a single CTA.",
        "props": {"steps": [{"title": "string", "description": "string"}], "ctaLabel": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    # ---------- Goal-related rewards & automation ----------
    "GOAL_TEMPLATE_GALLERY": {
        "description": "One-tap starter goal templates (Holiday, New Laptop, Emergency Fund...) with suggested monthly points.",
        "props": {"templates": [{"name": "string", "icon": "plane|laptop|shield|heart|home|car", "targetPoints": "number", "monthlySuggestion": "number"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "MILESTONE_REWARD_LADDER": {
        "description": "Vertical ladder showing the concrete reward unlocked at each goal checkpoint (25%/50%/75%/100%).",
        "props": {"goalName": "string", "rungs": [{"percent": "number 0-100", "reward": "string", "unlocked": "boolean"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "GOAL_STREAK_CARD": {
        "description": "Consecutive weeks contributing to any goal, with personal best and next milestone.",
        "props": {"weeks": "number", "bestWeeks": "number", "nextMilestone": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "GOAL_MATCH_BOOST_CARD": {
        "description": "Limited-time boost: top up the named goal today and the bank matches part of it in bonus points.",
        "props": {"goalName": "string", "topUpPoints": "number", "bonusPoints": "number", "expiresIn": "string e.g. 'today 23:59'"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "SHARED_GOAL_CARD": {
        "description": "Joint/family goal pooling: member avatars, each contribution and the combined total vs target.",
        "props": {"goalName": "string", "targetPoints": "number", "members": [{"name": "string", "contributed": "number"}], "combinedTotal": "number"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "GOAL_AT_RISK_CARD": {
        "description": "Behind-pace warning for a named goal with one-tap recovery options. Only when a real goal is genuinely behind schedule.",
        "props": {"goalName": "string", "missedContributions": "number", "recoveryOptions": [{"label": "string", "effect": "string"}]},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "AUTO_RULES_CARD": {
        "description": "Toggleable earn automation rules (e.g. every coffee purchase -> points to Travel Fund).",
        "props": {"rules": [{"trigger": "string", "action": "string", "enabled": "boolean"}], "toggleLabel": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "GOAL_COMPLETE_CELEBRATION": {
        "description": "Full-width celebration when a goal genuinely reaches 100%: achieved points, unlocked reward and a suggested next goal. Use ONLY when a profile goal is actually complete.",
        "props": {"goalName": "string", "achievedPoints": "number", "rewardUnlocked": "string", "nextGoalSuggestion": "string", "celebration": "boolean"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    # ---------- Money-smart ----------
    "BEST_VALUE_REDEEM_CARD": {
        "description": "Redemption options ranked by pounds-per-point value so the customer redeems optimally; flags the best deal.",
        "props": {"options": [{"name": "string", "points": "number", "cashValue": "string e.g. £12.50", "valuePerPoint": "number pence e.g. 1.4", "best": "boolean"}], "note": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "SAVINGS_TRANSFER_CARD": {
        "description": "Move points into a named savings pot with its GBP equivalent and rate note.",
        "props": {"potName": "string", "suggestedPoints": "number", "gbpValue": "string e.g. £25.00", "apyNote": "string e.g. 'Earns 4.5% AER in your pot'"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "TRAVEL_FUND_CARD": {
        "description": "Travel-specific points pool with destination progress and partner brands that accelerate it.",
        "props": {"destination": "string e.g. 'Tokyo'", "fundPoints": "number", "targetPoints": "number", "partners": ["string"]},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    # ---------- Analytics ----------
    "EARN_BREAKDOWN_CARD": {
        "description": "Donut chart of where the customer's points came from this period by brand or category.",
        "props": {"period": "string e.g. 'this month'", "segments": [{"label": "string", "points": "number", "colorToken": "brand|goal_progress|achievement|insight|community|urgency"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "MONTH_OVER_MONTH_CARD": {
        "description": "This month vs last month earned/redeemed comparison bars with delta summary.",
        "props": {"earned": "number", "prevEarned": "number", "redeemed": "number", "prevRedeemed": "number", "deltaLabel": "string e.g. '+12% vs last month'"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "POINTS_HEALTH_SCORE": {
        "description": "Gamified 0-100 rewards-fitness gauge with month delta and one improvement tip.",
        "props": {"score": "number 0-100", "delta": "number +/- vs last month", "tip": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    # ---------- Social proof & community ----------
    "PEER_INSIGHT_CARD": {
        "description": "You-vs-cohort benchmarks ('members like you') across redemption frequency and earning.",
        "props": {"cohortLabel": "string e.g. 'Gold members like you'", "metrics": [{"label": "string", "you": "number", "peers": "number", "unit": "string e.g. '/month'"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "COMMUNITY_CHALLENGE_CARD": {
        "description": "Collective community target progress bar with the customer's own contribution counted in.",
        "props": {"title": "string", "communityTotal": "number", "target": "number", "myContribution": "number", "endsOn": "string date"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    # ---------- Lifecycle & moments ----------
    "MILESTONE_ANNIVERSARY_CARD": {
        "description": "Celebration of membership anniversary or lifetime-points milestone with member-since date. Only when the profile supports it.",
        "props": {"headline": "string", "subline": "string", "lifetimePoints": "number", "memberSince": "string e.g. '2023'", "celebration": "boolean"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "BIRTHDAY_REWARD_CARD": {
        "description": "Time-boxed birthday gift claim. Only when the profile contains a birthday in the current window.",
        "props": {"gift": "string", "expiresInDays": "number", "claimed": "boolean", "message": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    # ---------- Discovery ----------
    "NEW_BRAND_SPOTLIGHT_CARD": {
        "description": "Single-brand hero with join bonus and a personalised match score explaining why it fits this customer.",
        "props": {"brandName": "string", "logoText": "string initials", "color": "hex string", "bonusPoints": "number", "matchScore": "number 0-100", "whyThisBrand": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "LOCAL_DEALS_CARD": {
        "description": "Offers near the customer's location with distance and point cost per deal.",
        "props": {"city": "string", "deals": [{"merchant": "string", "distanceKm": "number", "offer": "string", "points": "number"}]},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    # ---------- Control & utility ----------
    "PREFERENCES_CARD": {
        "description": "Offer-category toggles so the customer steers their own personalization; save CTA.",
        "props": {"categories": [{"label": "string", "enabled": "boolean"}], "onSaveLabel": "string default 'Save preferences'"},
        "defaultSpan": "full",
        "personaAffinity": ["ALL"],
    },
    "GIFT_DONATE_CARD": {
        "description": "Gift points to family/friends or donate to partner charities; lists minimum point amounts.",
        "props": {"options": [{"recipient": "string", "minPoints": "number", "icon": "heart|users|gift"}], "ctaLabel": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    "REFERRAL_CARD": {
        "description": "Invite-a-friend referral code with both-side bonuses and accepted-invite count.",
        "props": {"referralCode": "string e.g. 'ALEX-8F2K'", "friendBonus": "number", "myBonus": "number", "invitesAccepted": "number"},
        "defaultSpan": "half",
        "personaAffinity": ["ALL"],
    },
    # ---------- Value certainty & transparency ----------
    "REWARD_CHOICE_PANEL": {
        "description": "Clear three-way choice panel: use points now, compare partner options, or keep collecting. No pressure framing.",
        "props": {"title": "string", "subtitle": "string", "options": [{"id": "string", "label": "string", "description": "string", "points": "number"}]},
        "defaultSpan": "full",
        "personaAffinity": ["VALUE_CERTAINTY_SEEKER", "ALL"],
    },
    "PARTNER_VALUE_COMPARISON": {
        "description": "Side-by-side comparison of what the customer's points are worth at each partner, in plain GBP terms.",
        "props": {"title": "string", "subtitle": "string", "partners": [{"name": "string", "points": "number", "value": "string e.g. '£12.00'", "perk": "string"}]},
        "defaultSpan": "half",
        "personaAffinity": ["VALUE_CERTAINTY_SEEKER", "INTEROPERABILITY_SEEKER"],
    },
    "WHY_THIS_UI_CARD": {
        "description": "Transparent explainability card listing why this screen was composed for the customer.",
        "props": {"title": "string", "intro": "string", "reasons": [{"label": "string", "detail": "string"}]},
        "defaultSpan": "full",
        "personaAffinity": ["VALUE_CERTAINTY_SEEKER"],
    },
    # ---------- Payment utility ----------
    "PAYMENT_REWARD_CARD": {
        "description": "Payment-linked reward card: earn rate on everyday spending, method and monthly cap. Never encourages extra spending.",
        "props": {"title": "string", "paymentMethod": "string", "rewardRate": "string e.g. '0.5% back in points'", "monthlyCap": "string", "description": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["PAYMENT_UTILITY_FOCUSED"],
    },
    "REWARD_ALLOCATION_CONTROL": {
        "description": "Control panel showing how earned points are allocated (e.g. to payment cashback vs goals) with editable percentages.",
        "props": {"title": "string", "subtitle": "string", "allocation": [{"label": "string", "percent": "number 0-100"}]},
        "defaultSpan": "half",
        "personaAffinity": ["PAYMENT_UTILITY_FOCUSED"],
    },
    "PAYMENT_REWARD_CONFIRMATION": {
        "description": "Confirmation that a payment-linked reward was applied: amount, reference, date.",
        "props": {"title": "string", "message": "string", "amount": "string e.g. '£4.20'", "reference": "string", "date": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["PAYMENT_UTILITY_FOCUSED"],
    },
    # ---------- Educational competence ----------
    "LEARNING_MISSION_CARD": {
        "description": "Self-paced learning mission with module progress bar and completion bonus. Untimed, mastery-focused framing.",
        "props": {"title": "string", "missionName": "string", "description": "string", "modulesDone": "number", "modulesTotal": "number", "pointsOnCompletion": "number"},
        "defaultSpan": "full",
        "personaAffinity": ["EDUCATIONAL_COMPETENCE"],
    },
    "COMPREHENSION_FEEDBACK_CARD": {
        "description": "Constructive feedback on a recent quiz answer: question, key point and encouraging explanation. Never shaming.",
        "props": {"title": "string", "question": "string", "yourAnswer": "string", "correctAnswer": "string", "feedback": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["EDUCATIONAL_COMPETENCE"],
    },
    "CONFIDENCE_PROGRESS_CARD": {
        "description": "Financial-confidence meter for a topic area with level label and next milestone. Progress over comparison.",
        "props": {"title": "string", "topic": "string", "confidencePercent": "number 0-100", "levelLabel": "string e.g. 'Building confidence'", "nextMilestone": "string"},
        "defaultSpan": "half",
        "personaAffinity": ["EDUCATIONAL_COMPETENCE"],
    },
    # ---------- Interoperability & portability ----------
    "CONSOLIDATED_REWARD_WALLET": {
        "description": "Unified wallet of rewards across all connected programmes with combined GBP value.",
        "props": {"title": "string", "subtitle": "string", "programmes": [{"name": "string", "points": "number", "value": "string e.g. '£25.00'", "status": "string"}], "totalValue": "string e.g. '£61.50'"},
        "defaultSpan": "full",
        "personaAffinity": ["INTEROPERABILITY_SEEKER"],
    },
    "PARTNER_TRANSFER_CARD": {
        "description": "Transfer interface: move points from the primary programme to a partner, with estimated arrival value in GBP.",
        "props": {"title": "string", "fromProgramme": "string", "toPartner": "string", "points": "number", "estimatedValue": "string e.g. '£18.00'", "status": "string"},
        "defaultSpan": "full",
        "personaAffinity": ["INTEROPERABILITY_SEEKER"],
    },
    "REWARD_PROVENANCE_CARD": {
        "description": "Clear history of where each batch of points was earned, with dates and amounts. Plain English only.",
        "props": {"title": "string", "subtitle": "string", "history": [{"source": "string", "date": "string", "points": "number"}]},
        "defaultSpan": "half",
        "personaAffinity": ["INTEROPERABILITY_SEEKER"],
    },
    "PROGRAMME_CONNECTION_CARD": {
        "description": "Optional list of partner loyalty programmes with connect status; linking brings balances into the unified wallet.",
        "props": {"title": "string", "subtitle": "string", "programmes": [{"name": "string", "status": "string", "connected": "boolean"}]},
        "defaultSpan": "full",
        "personaAffinity": ["INTEROPERABILITY_SEEKER"],
    },
}

PERSONA_COMPOSITION_GUIDES = {
    "INSTANT_GRATIFICATION": {
        "strategy": "Lead with immediate redeemable value and celebration; everything actionable within one tap. Secondary: show real cash worth and curated catalogue; supporting: brand discovery and offers.",
        "primary": ["INSTANT_REWARD_POPUP", "FLASH_REWARD_BANNER", "QUICK_REDEEM_CARD"],
        "secondary": ["TANGIBLE_VALUE_CARD", "REWARD_CAROUSEL", "QUICK_WIN_CARD", "METRIC_TILE", "BEST_VALUE_REDEEM_CARD"],
        "supporting": ["PERSONALIZED_OFFER_CARD", "BADGE_CARD", "BRAND_EXPLORER_CARD", "SYNC_STATUS_CARD", "REWARDS_INSIGHT_CARD", "STREAK_CARD", "CHALLENGE_CARD", "QUIZ_CARD", "MILESTONE_CARD", "RECOMMENDED_ACTIONS", "COUNTDOWN_CARD", "GOAL_PROGRESS_CARD", "ADD_GOAL_CARD", "NEW_BRAND_SPOTLIGHT_CARD", "LOCAL_DEALS_CARD", "REFERRAL_CARD", "MYTH_OR_FACT_CARD", "BIRTHDAY_REWARD_CARD"],
    },
    "GOAL_ORIENTED_SAVER": {
        "strategy": "Center the screen on goal progress and the next milestone; show how every action moves them closer. Render ONE GOAL_PROGRESS_CARD per active goal (side by side as half-span cards), followed by an ADD_GOAL_CARD.",
        "primary": ["GOAL_PROGRESS_CARD", "ADD_GOAL_CARD", "GOAL_MILESTONE_CARD", "GOAL_LINKED_REWARD"],
        "secondary": ["RECOMMENDED_ACTIONS", "REWARD_CAROUSEL", "MILESTONE_CARD", "METRIC_TILE", "GOAL_TEMPLATE_GALLERY", "MILESTONE_REWARD_LADDER", "TRAVEL_FUND_CARD", "SAVINGS_TRANSFER_CARD"],
        "supporting": ["EDUCATIONAL_INSIGHT_CARD", "PERSONALIZED_OFFER_CARD", "BADGE_CARD", "REWARDS_INSIGHT_CARD", "FUTURE_MILESTONE_CARD", "PROJECTION_CHART", "FUTURE_VALUE_CARD", "LONG_TERM_GOAL_CARD", "SYNC_STATUS_CARD", "BRAND_EXPLORER_CARD", "STREAK_CARD", "QUIZ_CARD", "QUICK_WIN_CARD", "GOAL_STREAK_CARD", "AUTO_RULES_CARD", "LEARNING_PATH_CARD", "COACH_TIP_CARD", "GOAL_AT_RISK_CARD"],
    },
    "LONG_TERM_PLANNER": {
        "strategy": "Emphasize growth, projections and education; patience is framed as an advantage. Render ONE LONG_TERM_GOAL_CARD (or GOAL_PROGRESS_CARD) per long-horizon goal — e.g. retirement, children education fund, home deposit — as half-span cards, followed by an ADD_GOAL_CARD.",
        "primary": ["FUTURE_VALUE_CARD", "PROJECTION_CHART", "LONG_TERM_GOAL_CARD", "ADD_GOAL_CARD"],
        "secondary": ["GOAL_PROGRESS_CARD", "EDUCATIONAL_INSIGHT_CARD", "FUTURE_MILESTONE_CARD", "METRIC_TILE", "LEARNING_PATH_CARD", "SAVINGS_CALCULATOR_CARD"],
        "supporting": ["TANGIBLE_VALUE_CARD", "RECOMMENDED_ACTIONS", "MILESTONE_CARD", "REWARDS_INSIGHT_CARD", "GOAL_LINKED_REWARD", "GOAL_MILESTONE_CARD", "SYNC_STATUS_CARD", "BADGE_CARD", "BRAND_EXPLORER_CARD", "REWARD_CAROUSEL", "QUIZ_CARD", "DAILY_MONEY_TIP_CARD", "COACH_TIP_CARD", "PEER_INSIGHT_CARD", "MONTH_OVER_MONTH_CARD", "MILESTONE_ANNIVERSARY_CARD", "HOW_POINTS_WORK_CARD"],
    },
    "CHURN_RISK": {
        "strategy": "Re-engage gently: surface expiring value, one easy win, and a warm welcome back. No pressure tactics.",
        "primary": ["EXPIRING_POINTS_ALERT", "REENGAGEMENT_BANNER", "QUICK_WIN_CARD"],
        "secondary": ["PERSONALIZED_OFFER_CARD", "COUNTDOWN_CARD", "QUICK_REDEEM_CARD", "METRIC_TILE"],
        "supporting": ["TANGIBLE_VALUE_CARD", "REWARD_CAROUSEL", "MILESTONE_CARD", "SYNC_STATUS_CARD", "REWARDS_INSIGHT_CARD", "BRAND_EXPLORER_CARD", "RECOMMENDED_ACTIONS", "BADGE_CARD", "STREAK_CARD", "QUIZ_CARD", "FLASH_REWARD_BANNER", "INSTANT_REWARD_POPUP", "GOAL_PROGRESS_CARD", "ADD_GOAL_CARD", "HOW_POINTS_WORK_CARD", "POINTS_ACADEMY_BADGE_CARD", "LOCAL_DEALS_CARD"],
    },
    "GAMIFICATION_MOTIVATED": {
        "strategy": "Feed competitive energy: challenges, streaks, rank and social achievement front and center.",
        "primary": ["CHALLENGE_CARD", "STREAK_CARD", "LEADERBOARD"],
        "secondary": ["BADGE_CARD", "QUIZ_CARD", "MILESTONE_CARD", "METRIC_TILE", "GOAL_STREAK_CARD", "POINTS_HEALTH_SCORE"],
        "supporting": ["REWARD_CAROUSEL", "QUICK_WIN_CARD", "PERSONALIZED_OFFER_CARD", "REWARDS_INSIGHT_CARD", "SYNC_STATUS_CARD", "RECOMMENDED_ACTIONS", "FLASH_REWARD_BANNER", "QUICK_REDEEM_CARD", "INSTANT_REWARD_POPUP", "BRAND_EXPLORER_CARD", "GOAL_PROGRESS_CARD", "ADD_GOAL_CARD", "COMMUNITY_CHALLENGE_CARD", "REFERRAL_CARD", "MYTH_OR_FACT_CARD"],
    },
    "MIXED_PROFILE": {
        "strategy": "Blend three motivations in one screen: active goal progress (short-term), long-horizon goal tracking, and gamification energy. Render one GOAL_PROGRESS_CARD per short-term goal and one LONG_TERM_GOAL_CARD per long-term goal as half-span cards, add an ADD_GOAL_CARD, then keep competitive components (streak, challenge, leaderboard) visible. Every category must be represented.",
        "primary": ["GOAL_PROGRESS_CARD", "LONG_TERM_GOAL_CARD", "ADD_GOAL_CARD", "STREAK_CARD", "CHALLENGE_CARD", "LEADERBOARD"],
        "secondary": ["GOAL_LINKED_REWARD", "BADGE_CARD", "FUTURE_VALUE_CARD", "RECOMMENDED_ACTIONS", "METRIC_TILE"],
        "supporting": ["MILESTONE_CARD", "QUIZ_CARD", "EDUCATIONAL_INSIGHT_CARD", "REWARDS_INSIGHT_CARD", "PROJECTION_CHART", "FUTURE_MILESTONE_CARD", "GOAL_MILESTONE_CARD", "REWARD_CAROUSEL", "QUICK_WIN_CARD", "PERSONALIZED_OFFER_CARD", "SYNC_STATUS_CARD", "BRAND_EXPLORER_CARD", "GOAL_TEMPLATE_GALLERY", "MILESTONE_REWARD_LADDER", "GOAL_STREAK_CARD", "LEARNING_PATH_CARD", "BEST_VALUE_REDEEM_CARD", "PEER_INSIGHT_CARD"],
    },
    "PLANNER_AT_RISK_MIX": {
        "strategy": "A lapsing long-term saver with a large accumulated balance. Protect what they built while gently re-engaging: lead with a genuine EXPIRING_POINTS_ALERT using their real expiringPoints/daysUntilExpiry, reassure with FUTURE_VALUE_CARD or PROJECTION_CHART projections of continued growth, render ONE LONG_TERM_GOAL_CARD per long-horizon goal plus an ADD_GOAL_CARD. Frame redemption as protecting the future they planned. Supportive tone only - never pressure tactics.",
        "primary": ["EXPIRING_POINTS_ALERT", "FUTURE_VALUE_CARD", "LONG_TERM_GOAL_CARD", "ADD_GOAL_CARD"],
        "secondary": ["COUNTDOWN_CARD", "QUICK_WIN_CARD", "PROJECTION_CHART", "METRIC_TILE"],
        "supporting": ["REWARDS_INSIGHT_CARD", "TANGIBLE_VALUE_CARD", "SYNC_STATUS_CARD", "EDUCATIONAL_INSIGHT_CARD", "FUTURE_MILESTONE_CARD", "RECOMMENDED_ACTIONS", "GOAL_LINKED_REWARD", "MILESTONE_CARD", "PERSONALIZED_OFFER_CARD", "REENGAGEMENT_BANNER", "GOAL_AT_RISK_CARD", "DAILY_MONEY_TIP_CARD", "SAVINGS_CALCULATOR_CARD"],
    },
    "INSTANT_AT_RISK_MIX": {
        "strategy": "A lapsing instant-gratifier who used to redeem within hours. Win them back with immediately redeemable value: lead with a genuine EXPIRING_POINTS_ALERT using their real expiringPoints/daysUntilExpiry, then follow with one-tap rewards (QUICK_REDEEM_CARD, FLASH_REWARD_BANNER, QUICK_WIN_CARD, INSTANT_REWARD_POPUP). Every CTA should deliver an instant payoff; timer values must reflect real expiry dates from the profile.",
        "primary": ["EXPIRING_POINTS_ALERT", "QUICK_REDEEM_CARD", "FLASH_REWARD_BANNER", "QUICK_WIN_CARD"],
        "secondary": ["INSTANT_REWARD_POPUP", "COUNTDOWN_CARD", "TANGIBLE_VALUE_CARD", "METRIC_TILE"],
        "supporting": ["PERSONALIZED_OFFER_CARD", "REENGAGEMENT_BANNER", "BRAND_EXPLORER_CARD", "SYNC_STATUS_CARD", "REWARDS_INSIGHT_CARD", "REWARD_CAROUSEL", "STREAK_CARD", "MILESTONE_CARD", "BEST_VALUE_REDEEM_CARD", "LOCAL_DEALS_CARD"],
    },
}

DEFAULT_GUIDE = PERSONA_COMPOSITION_GUIDES["GOAL_ORIENTED_SAVER"]


# ---------------------------------------------------------------------------
# Objective Workspace SDUI catalogue
#
# These types are emitted by the /objective/generate endpoint and rendered by
# the frontend's objective registry (src/components/objective/registry.tsx).
# They follow the same SDUIComponent contract as the dashboard components.
# ---------------------------------------------------------------------------

OBJECTIVE_COMPONENT_CATALOG = {
    "OBJECTIVE_HEADLINE": {
        "description": "Stage heading: optional green eyebrow label and bold title (often the customer's own objective).",
        "props": {"eyebrow": "string optional", "title": "string"},
        "defaultSpan": "full",
    },
    "OBJECTIVE_INPUT": {
        "description": "Capture stage - multi-line text field where the customer states their objective. Controlled by workspace state.",
        "props": {"label": "string", "placeholder": "string", "value": "string"},
        "defaultSpan": "full",
    },
    "OBJECTIVE_SUMMARY_CARD": {
        "description": "AI summary of the customer's objective and the recommended path.",
        "props": {"summary": "string"},
        "defaultSpan": "full",
    },
    "OBJECTIVE_CONSTRAINTS": {
        "description": "List of reward-relevant constraints applied to planning, each with an applied check state.",
        "props": {"items": [{"id": "string", "text": "string", "applied": "boolean"}]},
        "defaultSpan": "full",
    },
    "OBJECTIVE_OPPORTUNITIES": {
        "description": "Reward opportunities list with partner, description and estimated GBP value.",
        "props": {"items": [{"id": "string", "title": "string", "description": "string", "partner": "string", "estimatedValue": "string"}]},
        "defaultSpan": "full",
    },
    "OBJECTIVE_STRATEGIES": {
        "description": "Selectable redemption strategy plans (radio selection). Each item carries an OBJECTIVE_SELECT_PLAN action.",
        "props": {"items": [{"id": "string", "type": "string", "title": "string", "description": "string", "order": "number"}]},
        "defaultSpan": "full",
    },
    "OBJECTIVE_AI_TOOLS": {
        "description": "Quick AI-assist chips (Understand / Compare / Consolidate / Change Constraints / Learn More).",
        "props": {"tools": ["string"]},
        "defaultSpan": "full",
    },
    "OBJECTIVE_EVIDENCE": {
        "description": "Cognitive evidence explaining why the selected plan is recommended, with supporting factors.",
        "props": {"title": "string", "summary": "string", "factors": ["string"]},
        "defaultSpan": "full",
    },
    "OBJECTIVE_EXECUTION_HEADER": {
        "description": "Execution plan banner: plan label and one-line description.",
        "props": {"planLabel": "string", "description": "string"},
        "defaultSpan": "full",
    },
    "OBJECTIVE_EXECUTION_STEPS": {
        "description": "Ordered execution steps with live status (pending/running/completed). Each item carries an OBJECTIVE_SELECT_STEP action.",
        "props": {"items": [{"id": "string", "label": "string", "partner": "string", "status": "pending|running|completed|failed"}]},
        "defaultSpan": "full",
    },
    "OBJECTIVE_REDIRECT": {
        "description": "Transient redirect-confirmation screen: shows the partner being redirected to with a go / confirm action.",
        "props": {"planLabel": "string", "stepLabel": "string", "partner": "string", "confirmLabel": "string"},
        "defaultSpan": "full",
    },
    "OBJECTIVE_RESULT": {
        "description": "Execution result screen: success or failure outcome with a return-home action.",
        "props": {"success": "boolean", "title": "string", "message": "string", "detail": "string optional"},
        "defaultSpan": "full",
    },
    "OBJECTIVE_NAV": {
        "description": "Primary/secondary action row (e.g. Next + Modify). Actions: OBJECTIVE_NEXT, OBJECTIVE_MODIFY.",
        "props": {"primary": "string", "secondary": "string optional"},
        "defaultSpan": "full",
    },
}


def get_persona_guide(persona: str) -> dict:
    return PERSONA_COMPOSITION_GUIDES.get(persona, DEFAULT_GUIDE)


def render_catalog_for_prompt() -> str:
    lines = []
    for comp_type, spec in COMPONENT_CATALOG.items():
        affinity = ", ".join(spec["personaAffinity"])
        lines.append(f"- {comp_type}: {spec['description']}")
        lines.append(f"  props: {spec['props']}")
        lines.append(f"  defaultSpan: {spec.get('defaultSpan', 'full')}")
        lines.append(f"  best for: {affinity} (guidance only — usable for ANY persona)")
    return "\n".join(lines)


def render_persona_guides_for_prompt() -> str:
    lines = []
    for persona, guide in PERSONA_COMPOSITION_GUIDES.items():
        lines.append(f"{persona}:")
        lines.append(f"  strategy: {guide['strategy']}")
        lines.append(f"  primary components (must include most of these): {', '.join(guide['primary'])}")
        lines.append(f"  secondary components (include several of these): {', '.join(guide['secondary'])}")
        lines.append(f"  supporting components (sprinkle in 3-6 of these for richness): {', '.join(guide['supporting'])}")
        lines.append(f"  TARGET: use at least 12-16 components total across primary + secondary + supporting")
    return "\n".join(lines)


def render_catalog_for_prompt_compact() -> str:
    """One line per component — used when the provider has a small token budget."""
    lines = []
    for comp_type, spec in COMPONENT_CATALOG.items():
        def _fmt(v):
            if isinstance(v, list):
                return "|".join(str(x) for x in v)
            return str(v).split("(")[0].strip()
        props = ", ".join(f"{k}:{_fmt(v)}" for k, v in spec["props"].items())
        lines.append(f"- {comp_type} [{spec.get('defaultSpan', 'full')}]: props: {props}")
    return "\n".join(lines)


def render_persona_guides_for_prompt_compact() -> str:
    lines = []
    for persona, guide in PERSONA_COMPOSITION_GUIDES.items():
        strategy = guide["strategy"].split(".")[0]
        lines.append(
            f"{persona}: {strategy} | primary: {', '.join(guide['primary'])} | "
            f"secondary: {', '.join(guide['secondary'][:5])} | "
            f"supporting: {', '.join(guide['supporting'][:4])} | TARGET: 12-16 total"
        )
    return "\n".join(lines)
