import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest

from services.card_rule_engine import evaluate_rules
from services.narrative_engine import (
    apply_narrative,
    build_narrative,
    compute_relevance,
    narrative_directives_for_prompt,
    select_archetype,
)


@pytest.fixture
def legacy_customer_intel():
    """customer_001-style payload: personality insights present, no engine motive scores."""
    return {
        "available": True,
        "customerId": "customer_001",
        "persona": "INSTANT_GRATIFICATION",
        "confidence": 0.94,
        "motivation": "IMMEDIATE_VALUE",
        "priority": "HIGH",
        "signals": ["frequent immediate redemptions"],
        "recommendations": ["INSTANT_REWARD", "QUICK_REDEEM", "TANGIBLE_VALUE"],
        "motiveScores": {
            "valueCertainty": 0.0,
            "paymentUtility": 0.0,
            "competenceMotivation": 0.0,
            "portabilityPreference": 0.0,
            "probNeedValueExplanation": 0.0,
            "probPreferPaymentLinkedReward": 0.0,
            "probPreferEducationReward": 0.0,
            "probPreferRewardPreview": 0.0,
            "probPreferGuaranteedValue": 0.0,
        },
        "personalityInsights": {
            "valueExplainerViewCount": 1,
            "cashEquivalentUses": 2,
            "partnerComparisons": 0,
            "probabilities": {
                "instantRewards": 0.92,
                "goalLinkedReward": 0.10,
                "tangibleValueExplainer": 0.25,
                "partnerConversion": 0.08,
                "valueExplainer": 0.20,
            },
            "motiveScores": {
                "valueExplainer": 0.22,
                "autonomyPreference": 0.70,
                "progressOrientation": 0.15,
                "paymentUtility": 0.25,
                "portabilityPreference": 0.12,
                "curiosityResponse": 0.40,
            },
            "predictedResponses": {
                "tangibleValueExplainer": 0.28,
                "customerChoicePanel": 0.62,
                "partnerValueComparison": 0.10,
                "gamificationChoice": 0.75,
            },
        },
        "componentAffinity": {
            "instant_reward": 0.905,
            "goal_progress": 0.125,
            "long_term_growth": 0.075,
            "gamification_social": 0.575,
            "value_clarity_education": 0.25,
            "partner_discovery": 0.1,
            "choice_control": 0.66,
            "risk_protection": 0.18,
        },
        "personalizationSignals": {
            "rewardHorizon": "IMMEDIATE",
            "topMotives": [{"motive": "AUTONOMY", "score": 0.7}],
            "preferredTone": "PLAYFUL",
            "engagementDrivers": ["streaks", "challenges"],
            "suppressionHints": [],
        },
    }


@pytest.fixture
def value_certainty_via_personality():
    """Legacy customer whose value-clarity need only shows in personality insights."""
    return {
        "available": True,
        "persona": "LONG_TERM_PLANNER",
        "recommendations": ["LONG_TERM_VALUE"],
        "motiveScores": {},
        "personalityInsights": {
            "probabilities": {"valueExplainer": 0.95, "instantRewards": 0.03},
            "motiveScores": {"valueExplainer": 0.9},
            "predictedResponses": {"tangibleValueExplainer": 0.93, "gamificationChoice": 0.10},
        },
    }


def test_engine_scores_take_precedence(legacy_customer_intel):
    intel = {**legacy_customer_intel}
    intel["motiveScores"] = {**legacy_customer_intel["motiveScores"], "valueCertainty": 1.0}
    result = evaluate_rules(intel)
    assert "R1_VALUE_CERTAINTY" in result.matched_rules


def test_personality_fallback_fires_value_certainty(value_certainty_via_personality):
    """A customer with no engine motive scores still triggers R1 through the
    personality-insights fallback — this is the accuracy fix."""
    result = evaluate_rules(value_certainty_via_personality)
    assert "R1_VALUE_CERTAINTY" in result.matched_rules


def test_low_gamification_prediction_suppresses_public_recognition(value_certainty_via_personality):
    result = evaluate_rules(value_certainty_via_personality)
    assert result.suppressions.get("suppress_public_recognition") is True
    assert "LEADERBOARD" in result.banned_types


def test_relevance_boosts_from_predicted_responses(legacy_customer_intel):
    result = evaluate_rules(legacy_customer_intel)
    assert result.relevance_boosts["STREAK_CARD"] > 0
    assert result.relevance_boosts["CHALLENGE_CARD"] > 0
    assert result.tone == "PLAYFUL"


def test_compute_relevance_prefers_high_affinity_categories(legacy_customer_intel):
    scores = compute_relevance(legacy_customer_intel)
    assert scores["INSTANT_REWARD_POPUP"] > scores["GOAL_PROGRESS_CARD"]
    assert scores["QUICK_REDEEM_CARD"] >= 0.8


def test_select_archetype_per_persona():
    assert select_archetype("CHURN_RISK") == "PROTECT_AND_REASSURE"
    assert select_archetype("GAMIFICATION_MOTIVATED") == "PLAY_AND_PROGRESS"
    assert select_archetype("VALUE_CERTAINTY_SEEKER") == "CLARITY_FIRST"
    assert select_archetype("UNKNOWN_PERSONA") == "BUILD_YOUR_FUTURE"


def test_build_narrative_orders_by_story_not_priority(legacy_customer_intel):
    components = [
        {"id": "c-prefs", "type": "PREFERENCES_CARD", "priority": 3, "props": {}},
        {"id": "c-quick", "type": "QUICK_REDEEM_CARD", "priority": 4, "props": {}},
        {"id": "c-goals", "type": "GOAL_PROGRESS_CARD", "priority": 2, "props": {}},
        {"id": "c-anchor", "type": "POINTS_BALANCE", "priority": 1, "props": {}},
    ]
    plan = build_narrative(components, legacy_customer_intel)
    types = [c["type"] for c in plan.ordered_components]

    assert types[0] == "POINTS_BALANCE"
    # Story beats override raw priority: GOAL_PROGRESS_CARD had priority 2 and
    # PREFERENCES_CARD priority 3, yet the TRUST act always closes the screen.
    assert types[-1] == "PREFERENCES_CARD"
    assert types.index("PREFERENCES_CARD") > types.index("GOAL_PROGRESS_CARD")

    # Every component carries narrative metadata and sequential priorities.
    for i, comp in enumerate(plan.ordered_components):
        assert comp["priority"] == i + 1
        assert comp["props"]["narrative"]["actId"]
        assert "relevanceScore" in comp["props"]["narrative"]

    assert plan.archetype == "GRAB_AND_GO"
    assert plan.acts, "acts metadata missing"


def test_high_affinity_component_outranks_low_priority_within_act(legacy_customer_intel):
    """Within the same act, relevance — not original priority — decides order."""
    components = [
        {"id": "low-rel", "type": "REWARD_CAROUSEL", "priority": 2, "props": {}},
        {"id": "high-rel", "type": "QUICK_REDEEM_CARD", "priority": 9, "props": {}},
    ]
    plan = build_narrative(components, legacy_customer_intel)
    assert [c["type"] for c in plan.ordered_components] == ["QUICK_REDEEM_CARD", "REWARD_CAROUSEL"]


def test_mandatory_stack_pinned_after_anchor(legacy_customer_intel):
    components = [
        {"id": "anchor", "type": "POINTS_BALANCE", "priority": 1, "props": {}},
        {"id": "a", "type": "TANGIBLE_VALUE_CARD", "priority": 2, "props": {}},
        {"id": "b", "type": "REWARD_CHOICE_PANEL", "priority": 3, "props": {}},
        {"id": "z", "type": "LEADERBOARD", "priority": 4, "props": {}},
    ]
    intel = {**legacy_customer_intel, "persona": "VALUE_CERTAINTY_SEEKER"}
    rules = evaluate_rules(intel)
    plan = build_narrative(components, intel, rules)

    types = [c["type"] for c in plan.ordered_components]
    stack = [t for t in types if t in rules.ordered_stack]
    assert stack == rules.ordered_stack
    assert types[0] == "POINTS_BALANCE"


def test_apply_narrative_enriches_envelope(legacy_customer_intel):
    sdui = {
        "schemaVersion": "1.0",
        "components": [
            {"id": "x", "type": "SYNC_STATUS_CARD", "priority": 2, "props": {}},
            {"id": "anchor", "type": "POINTS_BALANCE", "priority": 1, "props": {}},
        ],
    }
    enriched = apply_narrative(sdui, legacy_customer_intel)
    assert enriched["narrative"]["archetype"] == "GRAB_AND_GO"
    assert enriched["components"][0]["type"] == "POINTS_BALANCE"
    act_ids = {a["id"] for a in enriched["narrative"]["acts"]}
    assert "TRUST" in act_ids


def test_prompt_directives_include_story_arc(legacy_customer_intel):
    text = narrative_directives_for_prompt(legacy_customer_intel)
    assert "STORY ARCHETYPE: GRAB_AND_GO" in text
    assert "NARRATIVE ARC" in text
    assert "REWARD HORIZON: IMMEDIATE" in text
