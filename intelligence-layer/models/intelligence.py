from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class Persona(str, Enum):
    INSTANT_GRATIFICATION = "INSTANT_GRATIFICATION"
    GOAL_ORIENTED_SAVER = "GOAL_ORIENTED_SAVER"
    LONG_TERM_PLANNER = "LONG_TERM_PLANNER"
    CHURN_RISK = "CHURN_RISK"
    GAMIFICATION_MOTIVATED = "GAMIFICATION_MOTIVATED"
    MIXED_PROFILE = "MIXED_PROFILE"
    PLANNER_AT_RISK_MIX = "PLANNER_AT_RISK_MIX"
    INSTANT_AT_RISK_MIX = "INSTANT_AT_RISK_MIX"
    # Card rule engine personas
    VALUE_CERTAINTY_SEEKER = "VALUE_CERTAINTY_SEEKER"
    PAYMENT_UTILITY_FOCUSED = "PAYMENT_UTILITY_FOCUSED"
    EDUCATIONAL_COMPETENCE = "EDUCATIONAL_COMPETENCE"
    INTEROPERABILITY_SEEKER = "INTEROPERABILITY_SEEKER"
    PREVIEW_GUARANTEED_VALUE = "PREVIEW_GUARANTEED_VALUE"


class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Motivation(str, Enum):
    IMMEDIATE_VALUE = "IMMEDIATE_VALUE"
    GOAL_ACHIEVEMENT = "GOAL_ACHIEVEMENT"
    FUTURE_SECURITY = "FUTURE_SECURITY"
    RE_ENGAGEMENT = "RE_ENGAGEMENT"
    PROGRESS_AND_COMMUNITY = "PROGRESS_AND_COMMUNITY"
    VALUE_CLARITY = "VALUE_CLARITY"
    PAYMENT_UTILITY = "PAYMENT_UTILITY"
    LEARNING_MASTERY = "LEARNING_MASTERY"
    PORTABILITY = "PORTABILITY"
    GUARANTEED_CERTAINTY = "GUARANTEED_CERTAINTY"


class Recommendation(str, Enum):
    INSTANT_REWARD = "INSTANT_REWARD"
    QUICK_REDEEM = "QUICK_REDEEM"
    TANGIBLE_VALUE = "TANGIBLE_VALUE"
    GOAL_PROGRESS = "GOAL_PROGRESS"
    GOAL_LINKED_REWARD = "GOAL_LINKED_REWARD"
    MILESTONE = "MILESTONE"
    LONG_TERM_VALUE = "LONG_TERM_VALUE"
    PROJECTED_VALUE = "PROJECTED_VALUE"
    EXPIRING_POINTS = "EXPIRING_POINTS"
    REENGAGEMENT = "REENGAGEMENT"
    QUICK_WIN = "QUICK_WIN"
    PERSONALIZED_OFFER = "PERSONALIZED_OFFER"
    CHALLENGE = "CHALLENGE"
    STREAK = "STREAK"
    LEADERBOARD = "LEADERBOARD"
    QUIZ = "QUIZ"


class GoalInfo(BaseModel):
    name: str
    target_value: float = Field(alias="targetValue")
    current_value: float = Field(alias="currentValue")
    progress: float

    class Config:
        populate_by_name = True


class RiskInfo(BaseModel):
    level: str
    expiring_points: int = Field(alias="expiringPoints")
    days_until_expiry: int = Field(alias="daysUntilExpiry")

    class Config:
        populate_by_name = True


class InsightProbabilities(BaseModel):
    """Behavioural probabilities derived from the customer's interaction history.
    All values are 0.0-1.0."""

    instantRewards: float = 0.0
    goalLinkedReward: float = 0.0
    tangibleValueExplainer: float = 0.0
    partnerConversion: float = 0.0
    valueExplainer: float = 0.0


class PersonalityMotiveScores(BaseModel):
    """Personality-level motive strengths (distinct from the card-rule-engine
    MotiveScores). All values are 0.0-1.0."""

    valueExplainer: float = 0.0
    autonomyPreference: float = 0.0
    progressOrientation: float = 0.0
    paymentUtility: float = 0.0
    portabilityPreference: float = 0.0
    curiosityResponse: float = 0.0


class PredictedResponses(BaseModel):
    """Predicted engagement with specific UI/content patterns. All values are
    0.0-1.0."""

    tangibleValueExplainer: float = 0.0
    customerChoicePanel: float = 0.0
    partnerValueComparison: float = 0.0
    gamificationChoice: float = 0.0


class PersonalityInsights(BaseModel):
    """Raw personality insights block mirrored from the analytics store, plus the
    behavioural counters that produced it."""

    valueExplainerViewCount: int = 0
    cashEquivalentUses: int = 0
    partnerComparisons: int = 0
    probabilities: InsightProbabilities = Field(default_factory=InsightProbabilities)
    motiveScores: PersonalityMotiveScores = Field(default_factory=PersonalityMotiveScores)
    predictedResponses: PredictedResponses = Field(default_factory=PredictedResponses)


class MotiveScores(BaseModel):
    """Motive-type scores, response predictions and conduct risk signals that
    drive the middleware card rule engine. All values are 0.0-1.0."""

    # Motive certainty / preference strengths
    valueCertainty: float = 0.0
    paymentUtility: float = 0.0
    competenceMotivation: float = 0.0
    portabilityPreference: float = 0.0
    # Response predictions (probabilities)
    probNeedValueExplanation: float = 0.0
    probPreferPaymentLinkedReward: float = 0.0
    probPreferEducationReward: float = 0.0
    probPreferRewardPreview: float = 0.0
    probPreferGuaranteedValue: float = 0.0
    # Confusion / risk signals
    valueConfusionRisk: float = 0.0
    consolidatedRewardWallet: float = 0.0
    spendRisk: float = 0.0
    rewardChasingRisk: float = 0.0
    dltConfusionRisk: float = 0.0
    trustRiskWithTechnicalLanguage: float = 0.0


class IntelligenceResponse(BaseModel):
    customer_id: str = Field(alias="customerId")
    persona: Persona
    confidence: float
    motivation: Motivation
    priority: Priority
    signals: list[str] = Field(default_factory=list)
    recommendations: list[Recommendation] = Field(default_factory=list)
    goal: Optional[GoalInfo] = None
    goals: list[GoalInfo] = Field(default_factory=list)
    risk: Optional[RiskInfo] = None
    motive_scores: MotiveScores = Field(default_factory=MotiveScores, alias="motiveScores")
    personality_insights: Optional[PersonalityInsights] = Field(
        default=None, alias="personalityInsights"
    )
    component_affinity: dict[str, float] = Field(default_factory=dict, alias="componentAffinity")
    personalization_signals: dict = Field(default_factory=dict, alias="personalizationSignals")
    customer_profile: Optional[dict] = Field(default=None, alias="customerProfile")

    class Config:
        populate_by_name = True
