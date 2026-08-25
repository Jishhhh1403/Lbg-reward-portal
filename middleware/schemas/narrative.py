"""Narrative extension contracts for the QUEST-UI five-agent extension.

Typed, versioned contracts for: Customer Story Architect, Journey and
Mini-Journey Composer, Narrative Sequence and Transition Agent, Experience
Coherence Guardian and Session Continuity Agent.

These models are the source of truth; prompts must match them exactly.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, ClassVar, Literal, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------


class NarrativeRole(str, Enum):
    """Narrative role of a component inside a mini-journey (spec §6.2)."""

    ORIENTATION = "ORIENTATION"
    MEANING = "MEANING"
    TENSION = "TENSION"
    EVIDENCE = "EVIDENCE"
    OPTION = "OPTION"
    ACTION = "ACTION"
    FEEDBACK = "FEEDBACK"
    PAYOFF = "PAYOFF"
    CELEBRATION = "CELEBRATION"
    CONTINUATION = "CONTINUATION"
    REFERENCE = "REFERENCE"


class NarrativeMode(str, Enum):
    START_NEW_JOURNEY = "START_NEW_JOURNEY"
    CONTINUE_ACTIVE_GOAL = "CONTINUE_ACTIVE_GOAL"
    RESOLVE_ACTION = "RESOLVE_ACTION"
    PROTECT_VALUE = "PROTECT_VALUE"
    MAKE_CHOICE = "MAKE_CHOICE"
    UNDERSTAND_VALUE = "UNDERSTAND_VALUE"


class ResolutionType(str, Enum):
    ACTION = "ACTION"
    UNDERSTANDING = "UNDERSTANDING"
    CHOICE = "CHOICE"
    FEEDBACK = "FEEDBACK"
    CONTINUATION = "CONTINUATION"


class PrimaryActionPolicy(str, Enum):
    ONE_DOMINANT = "ONE_DOMINANT"
    ONE_PLUS_ALTERNATIVE = "ONE_PLUS_ALTERNATIVE"


class ExperienceMode(str, Enum):
    NEW = "NEW"
    CONTINUING = "CONTINUING"
    RESOLVING = "RESOLVING"
    UNKNOWN = "UNKNOWN"


class OpeningTreatment(str, Enum):
    START = "START"
    RESUME = "RESUME"
    RECAP = "RECAP"
    RESOLVE = "RESOLVE"
    BRANCH = "BRANCH"
    RETIRE = "RETIRE"
    RESTART = "RESTART"


# ---------------------------------------------------------------------------
# Shared gate result
# ---------------------------------------------------------------------------


class GateResult(BaseModel):
    passed: bool = True
    violations: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Customer Story Architect (spec §4)
# ---------------------------------------------------------------------------


class CustomerStory(BaseModel):
    storyId: str
    storyTitle: str
    oneSentenceStory: str
    customerSituation: str
    storyTension: str
    customerResolution: str
    primaryOutcome: str
    secondaryOutcome: Optional[str] = None
    narrativeMode: NarrativeMode
    evidenceRefs: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1)
    prohibitedDetours: list[str] = Field(default_factory=list)
    completionSignals: list[str] = Field(default_factory=list)
    expiryAt: Optional[datetime] = None


class StoryHypotheses(BaseModel):
    # min_length=1 lets the deterministic layer salvage a single grounded story
    # (degraded mode) instead of failing the whole request; the Customer Story
    # Architect enforces the 2–3 target and flags the shortfall.
    hypotheses: list[CustomerStory] = Field(min_length=1, max_length=3)
    recommendedStoryId: str
    rejectedStoryReasons: dict[str, str] = Field(default_factory=dict)
    qualityGate: GateResult = Field(default_factory=GateResult)

    def recommended(self) -> Optional[CustomerStory]:
        return next(
            (h for h in self.hypotheses if h.storyId == self.recommendedStoryId),
            None,
        )


# ---------------------------------------------------------------------------
# Journey and Mini-Journey Composer (spec §5)
# ---------------------------------------------------------------------------


class SupportingSurface(BaseModel):
    surfaceId: str
    purpose: str
    contentNotes: list[str] = Field(default_factory=list)


class MiniJourney(BaseModel):
    miniJourneyId: str
    order: int
    customerQuestion: str
    entryCondition: str
    requiredInformation: list[str] = Field(default_factory=list)
    allowedNarrativeRoles: list[NarrativeRole] = Field(default_factory=list)
    requiredActionType: Optional[str] = None
    resolutionType: ResolutionType
    transitionsTo: Optional[str] = None
    requiredEvidenceRefs: list[str] = Field(default_factory=list)
    optional: bool = False

    @field_validator("allowedNarrativeRoles", mode="before")
    @classmethod
    def _drop_unknown_roles(cls, v):
        """Advisory metadata: live models invent role names ('SNAPSHOT'...).
        Drop unknown entries instead of failing the whole journey plan."""
        if not isinstance(v, list):
            return v
        known = {r.value for r in NarrativeRole}
        return [r for r in v if r in known]

    _TERMINAL_TRANSITIONS: ClassVar[set[str]] = {"done", "end", "none", "complete", "finish", "exit", "stop"}

    @field_validator("transitionsTo", mode="before")
    @classmethod
    def _normalize_terminal_transition(cls, v):
        """Live LLMs set transitionsTo to 'done'/'end' for the terminal episode.
        Treat these as None (no transition) instead of failing the journey plan."""
        if isinstance(v, str) and v.strip().lower() in cls._TERMINAL_TRANSITIONS:
            return None
        return v


class ExperienceJourneyPlan(BaseModel):
    primaryJourneyId: str
    storyId: str
    journeyObjective: str
    entryPoint: str
    completionDefinition: str
    primaryActionPolicy: PrimaryActionPolicy = PrimaryActionPolicy.ONE_DOMINANT
    miniJourneys: list[MiniJourney] = Field(min_length=2, max_length=4)
    supportingSurfaces: list[SupportingSurface] = Field(default_factory=list)
    qualityGate: GateResult = Field(default_factory=GateResult)

    def ordered_episodes(self) -> list[MiniJourney]:
        return sorted(self.miniJourneys, key=lambda m: m.order)

    def episode_ids(self) -> list[str]:
        return [m.miniJourneyId for m in self.ordered_episodes()]


class JourneyCandidate(BaseModel):
    """Strategy-level journey alternative evaluated in Stage E."""

    candidateId: str
    storyId: str
    journeyObjective: str
    completionDefinition: str
    episodeSketches: list[str] = Field(default_factory=list)
    primaryActionPolicy: PrimaryActionPolicy = PrimaryActionPolicy.ONE_DOMINANT
    weightedTotal: float = 0.0
    hardGatesPass: bool = True


# ---------------------------------------------------------------------------
# Narrative Sequence and Transition Agent (spec §6)
# ---------------------------------------------------------------------------


class DeferredComponent(BaseModel):
    componentRef: str
    componentType: str
    reason: str
    reasonCode: str
    alternativeSurface: Optional[str] = None


class SequencedComponent(BaseModel):
    componentRef: str
    miniJourneyId: str
    narrativeRole: NarrativeRole
    sequence: int
    dependsOn: list[str] = Field(default_factory=list)
    resolves: list[str] = Field(default_factory=list)
    optional: bool = False


class NarrativeTransition(BaseModel):
    fromComponentRef: str
    toComponentRef: str
    relationship: str = "sequential"
    bridgeIntent: str = "narrative flow"
    bridgeCopy: Optional[str] = None


class NarrativeSequence(BaseModel):
    primaryActionComponentRef: str
    components: list[SequencedComponent]
    transitions: list[NarrativeTransition] = Field(default_factory=list)
    deferredComponents: list[DeferredComponent] = Field(default_factory=list)
    qualityGate: GateResult = Field(default_factory=GateResult)


# ---------------------------------------------------------------------------
# Experience Coherence Guardian (spec §7)
# ---------------------------------------------------------------------------


class CoherenceViolation(BaseModel):
    code: str
    description: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"] = "HIGH"


class CoherenceAssessment(BaseModel):
    storyClarity: int = Field(ge=0, le=100)
    journeyContinuity: int = Field(ge=0, le=100)
    miniJourneyCompleteness: int = Field(ge=0, le=100)
    transitionStrength: int = Field(ge=0, le=100)
    actionOutcomeContinuity: int = Field(ge=0, le=100)
    contentDistractionRisk: Literal["Low", "High"] = "Low"
    primaryActionClarity: Literal["PASS", "FAIL"] = "PASS"
    orphanComponents: list[str] = Field(default_factory=list)
    conflictingNarratives: list[str] = Field(default_factory=list)
    violations: list[CoherenceViolation] = Field(default_factory=list)
    decision: Literal["PASS", "VETO", "HOLD"] = "PASS"
    reasonCode: Optional[str] = None


# ---------------------------------------------------------------------------
# Session Continuity Agent (spec §8)
# ---------------------------------------------------------------------------


class StateChange(BaseModel):
    changeId: str
    kind: Literal[
        "ACTION_COMPLETED",
        "CARD_DISMISSED",
        "GOAL_UPDATED",
        "POINTS_CHANGED",
        "JOURNEY_ADVANCED",
        "OTHER",
    ] = "OTHER"
    detail: str
    observedAt: datetime
    expiresAt: Optional[datetime] = None


class ContinuityState(BaseModel):
    available: bool
    previousJourneyId: Optional[str] = None
    previousStoryId: Optional[str] = None
    lastMeaningfulAction: Optional[str] = None
    lastResolvedMiniJourneyId: Optional[str] = None
    activeMiniJourneyId: Optional[str] = None
    completedComponentRefs: list[str] = Field(default_factory=list)
    dismissedComponentRefs: list[str] = Field(default_factory=list)
    deferredChoices: list[str] = Field(default_factory=list)
    stateChanges: list[StateChange] = Field(default_factory=list)
    observedAt: Optional[datetime] = None
    expiresAt: Optional[datetime] = None


class ContinuityPlan(BaseModel):
    openingTreatment: OpeningTreatment = OpeningTreatment.START
    permitted: bool = True
    stateChangeSummary: Optional[str] = None
    retiredComponents: list[str] = Field(default_factory=list)
    suppressionRules: list[str] = Field(default_factory=list)


class ContinuityValidation(BaseModel):
    """R-stage continuity verdict produced by deterministic checks plus the
    Session Continuity Agent's challenge."""

    passed: bool = True
    repeatedCelebrations: list[str] = Field(default_factory=list)
    staleActions: list[str] = Field(default_factory=list)
    dismissedRepeats: list[str] = Field(default_factory=list)
    decision: Literal["RELEASE", "HOLD", "UNAVAILABLE"] = "RELEASE"
    reasonCode: Optional[str] = None


# ---------------------------------------------------------------------------
# SDUI narrative metadata (spec §9.3) — backwards compatible, all optional at
# point of attachment.
# ---------------------------------------------------------------------------


class SDUINarrativeMetadata(BaseModel):
    storyId: str
    primaryOutcome: str
    primaryJourneyId: str
    currentMiniJourneyId: Optional[str] = None
    entryMode: str = "START"
    primaryActionComponentId: Optional[str] = None


class ComponentNarrativeMetadata(BaseModel):
    journeyId: str
    miniJourneyId: str
    role: NarrativeRole
    dependsOn: list[str] = Field(default_factory=list)
    resolves: list[str] = Field(default_factory=list)
    optional: bool = False


NARRATIVE_SCHEMA_VERSION = "1.0"


def model_to_dict(model: Optional[BaseModel]) -> Optional[dict]:
    """Serialise a narrative contract for shared state / SDUI attachment."""
    if model is None:
        return None
    if isinstance(model, dict):
        return model
    return model.model_dump(mode="json")


def parse_model(model_cls: type[BaseModel], payload: Any):
    """Validate raw LLM output into a contract, returning (model, error)."""
    if not isinstance(payload, dict):
        return None, f"{model_cls.__name__}: expected object, got {type(payload).__name__}"
    try:
        return model_cls.model_validate(payload), None
    except Exception as exc:  # pydantic ValidationError and friends
        return None, f"{model_cls.__name__}: {exc}"
