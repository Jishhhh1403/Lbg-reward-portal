import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from transformers.composer import ExperienceComposer
from validators.sdui_validator import SDUIValidator, VALID_COMPONENT_TYPES

composer = ExperienceComposer()
validator = SDUIValidator()


@pytest.fixture
def instant_intel():
    return {
        "customerId": "customer_001",
        "persona": "INSTANT_GRATIFICATION",
        "confidence": 0.94,
        "motivation": "IMMEDIATE_VALUE",
        "priority": "HIGH",
        "signals": ["frequent immediate redemptions"],
        "recommendations": ["INSTANT_REWARD", "QUICK_REDEEM", "TANGIBLE_VALUE"],
    }


@pytest.fixture
def goal_intel():
    return {
        "customerId": "customer_002",
        "persona": "GOAL_ORIENTED_SAVER",
        "confidence": 0.91,
        "motivation": "GOAL_ACHIEVEMENT",
        "priority": "HIGH",
        "signals": ["frequent goal-linked redemptions"],
        "recommendations": ["GOAL_PROGRESS", "GOAL_LINKED_REWARD", "MILESTONE"],
        "goal": {
            "name": "Japan Vacation",
            "targetValue": 2500,
            "currentValue": 1680,
            "progress": 67,
        },
    }


@pytest.fixture
def churn_intel():
    return {
        "customerId": "customer_004",
        "persona": "CHURN_RISK",
        "confidence": 0.96,
        "motivation": "RE_ENGAGEMENT",
        "priority": "CRITICAL",
        "signals": ["declining engagement"],
        "recommendations": ["EXPIRING_POINTS", "REENGAGEMENT", "QUICK_WIN"],
        "risk": {
            "level": "HIGH",
            "expiringPoints": 1850,
            "daysUntilExpiry": 12,
        },
    }


@pytest.fixture
def gamification_intel():
    return {
        "customerId": "customer_005",
        "persona": "GAMIFICATION_MOTIVATED",
        "confidence": 0.93,
        "motivation": "PROGRESS_AND_COMMUNITY",
        "priority": "HIGH",
        "signals": ["completes challenges regularly"],
        "recommendations": ["CHALLENGE", "STREAK", "LEADERBOARD", "QUIZ"],
    }


@pytest.fixture
def customer_data():
    return {
        "id": "customer_001",
        "name": "Alex Rivera",
        "tier": "Gold",
        "points": 4250,
        "challenges_completed": 12,
        "badges": 15,
        "streak_days": 34,
        "leaderboard_rank": 3,
    }


def test_compose_instant_gratification(instant_intel, customer_data):
    screen = composer.compose(instant_intel, customer_data)
    assert screen.persona == "INSTANT_GRATIFICATION"
    assert len(screen.components) >= 4
    types = [c.type for c in screen.components]
    assert "INSTANT_REWARD_POPUP" in types
    assert "QUICK_REDEEM_CARD" in types


def test_compose_goal_oriented(goal_intel, customer_data):
    screen = composer.compose(goal_intel, customer_data)
    assert screen.persona == "GOAL_ORIENTED_SAVER"
    types = [c.type for c in screen.components]
    assert "GOAL_PROGRESS_CARD" in types
    assert "GOAL_MILESTONE_CARD" in types


def test_compose_churn_risk(churn_intel, customer_data):
    screen = composer.compose(churn_intel, customer_data)
    assert screen.persona == "CHURN_RISK"
    types = [c.type for c in screen.components]
    assert "EXPIRING_POINTS_ALERT" in types
    assert "COUNTDOWN_CARD" in types


def test_compose_gamification(gamification_intel, customer_data):
    screen = composer.compose(gamification_intel, customer_data)
    assert screen.persona == "GAMIFICATION_MOTIVATED"
    types = [c.type for c in screen.components]
    assert "CHALLENGE_CARD" in types
    assert "LEADERBOARD" in types
    assert "STREAK_CARD" in types


def test_components_have_required_fields(instant_intel, customer_data):
    screen = composer.compose(instant_intel, customer_data)
    for comp in screen.components:
        assert comp.id, "Component must have an id"
        assert comp.type, "Component must have a type"
        assert comp.version, "Component must have a version"
        assert comp.priority > 0, "Component must have a positive priority"


def test_validate_valid_screen(instant_intel, customer_data):
    screen = composer.compose(instant_intel, customer_data)
    result = validator.validate(screen)
    assert result.is_valid


def test_validate_rejects_empty_components():
    from schemas.sdui import SDUIScreen
    screen = SDUIScreen(
        schemaVersion="1.0",
        experienceId="EXP-test",
        customerId="customer_001",
        persona="INSTANT_GRATIFICATION",
        components=[],
    )
    result = validator.validate(screen)
    assert not result.is_valid


def test_validate_rejects_unknown_component_type():
    from schemas.sdui import SDUIScreen, SDUIComponent
    screen = SDUIScreen(
        schemaVersion="1.0",
        experienceId="EXP-test",
        customerId="customer_001",
        persona="INSTANT_GRATIFICATION",
        components=[
            SDUIComponent(id="test-1", type="UNKNOWN_TYPE", priority=1)
        ],
    )
    result = validator.validate(screen)
    assert not result.is_valid


def test_validate_rejects_invalid_schema_version():
    from schemas.sdui import SDUIScreen
    screen = SDUIScreen(
        schemaVersion="2.0",
        experienceId="EXP-test",
        customerId="customer_001",
        persona="INSTANT_GRATIFICATION",
        components=[],
    )
    result = validator.validate(screen)
    assert not result.is_valid
