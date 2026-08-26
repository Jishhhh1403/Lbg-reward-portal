import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from services.mock_provider import MockIntelligenceProvider
from models.intelligence import Persona, Motivation, Priority


@pytest.fixture
def provider():
    return MockIntelligenceProvider()


def test_instant_gratification_persona(provider):
    result = provider.get_customer_intelligence("customer_001")
    assert result.persona == Persona.INSTANT_GRATIFICATION
    assert result.confidence > 0.8
    assert result.motivation == Motivation.IMMEDIATE_VALUE
    assert result.priority == Priority.HIGH
    assert len(result.signals) > 0
    assert len(result.recommendations) > 0


def test_goal_oriented_persona(provider):
    result = provider.get_customer_intelligence("customer_002")
    assert result.persona == Persona.GOAL_ORIENTED_SAVER
    assert result.confidence > 0.8
    assert result.motivation == Motivation.GOAL_ACHIEVEMENT
    assert result.goal is not None
    assert result.goal.progress > 0


def test_long_term_planner_persona(provider):
    result = provider.get_customer_intelligence("customer_003")
    assert result.persona == Persona.LONG_TERM_PLANNER
    assert result.motivation == Motivation.FUTURE_SECURITY
    assert result.goal is not None


def test_churn_risk_persona(provider):
    result = provider.get_customer_intelligence("customer_004")
    assert result.persona == Persona.CHURN_RISK
    assert result.priority == Priority.CRITICAL
    assert result.risk is not None
    assert result.risk.expiring_points > 0


def test_gamification_persona(provider):
    result = provider.get_customer_intelligence("customer_005")
    assert result.persona == Persona.GAMIFICATION_MOTIVATED
    assert result.motivation == Motivation.PROGRESS_AND_COMMUNITY
    assert len(result.recommendations) >= 4


def test_unknown_customer_raises(provider):
    with pytest.raises(ValueError):
        provider.get_customer_intelligence("customer_999")


def test_all_personas_have_signals(provider):
    for cid in ["customer_001", "customer_002", "customer_003", "customer_004", "customer_005"]:
        result = provider.get_customer_intelligence(cid)
        assert len(result.signals) > 0, f"{cid} has no signals"


def test_all_personas_have_recommendations(provider):
    for cid in ["customer_001", "customer_002", "customer_003", "customer_004", "customer_005"]:
        result = provider.get_customer_intelligence(cid)
        assert len(result.recommendations) > 0, f"{cid} has no recommendations"


def test_personality_insights_forwarded(provider):
    result = provider.get_customer_intelligence("customer_001")
    assert result.personality_insights is not None
    assert result.personality_insights.probabilities.instantRewards == pytest.approx(0.92)
    assert result.personality_insights.predictedResponses.gamificationChoice == pytest.approx(0.75)
    assert result.personality_insights.motiveScores.progressOrientation == pytest.approx(0.15)
    assert result.personality_insights.valueExplainerViewCount == 1


def test_component_affinity_vector(provider):
    result = provider.get_customer_intelligence("customer_001")
    affinity = result.component_affinity
    assert affinity, "component affinity vector missing"
    for category in [
        "instant_reward",
        "goal_progress",
        "long_term_growth",
        "gamification_social",
        "value_clarity_education",
        "partner_discovery",
        "choice_control",
        "risk_protection",
    ]:
        assert category in affinity
        assert 0.0 <= affinity[category] <= 1.0
    # Alex is the archetypal instant-gratifier
    assert affinity["instant_reward"] > affinity["goal_progress"]


def test_personalization_signals(provider):
    result = provider.get_customer_intelligence("customer_001")
    signals = result.personalization_signals
    assert signals["rewardHorizon"] == "IMMEDIATE"
    assert signals["preferredTone"] == "PLAYFUL"
    assert len(signals["topMotives"]) == 3


def test_risk_protection_high_for_expiring_points(provider):
    result = provider.get_customer_intelligence("customer_004")
    assert result.component_affinity["risk_protection"] >= 0.7
