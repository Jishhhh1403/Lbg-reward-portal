"""Objective Workspace request/response contracts.

These models drive the AI-generated content for the modal's 12-screen wizard.
The exact screen skeleton stays deterministic on the frontend; only the
*content* for each stage is produced at runtime by the LLM.

Stage names mirror the wizard screens:
  summary       -> Screen 1b
  constraints   -> Screen 1c
  opportunities -> Screen 2a
  strategies    -> Screen 2b
  evidence      -> Screen 2c
  execution     -> Screen 3a / 4a
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ObjectiveStage(str, Enum):
    SUMMARY = "summary"
    CONSTRAINTS = "constraints"
    OPPORTUNITIES = "opportunities"
    STRATEGIES = "strategies"
    EVIDENCE = "evidence"
    EXECUTION = "execution"


class BrandBalance(BaseModel):
    brandName: str
    points: int


class ObjectiveWallet(BaseModel):
    totalPoints: int = 0
    tier: str = "Silver"
    lbgCoins: int = 0
    brandsConnected: int = 0
    pointsByBrand: list[BrandBalance] = Field(default_factory=list)


class ObjectiveGenerateRequest(BaseModel):
    customerReference: str = ""
    objectiveText: str = ""
    stage: ObjectiveStage
    selectedPlan: Optional[str] = None
    toolRequest: Optional[str] = None
    wallet: ObjectiveWallet = Field(default_factory=ObjectiveWallet)


# ---------------------------------------------------------------------------
# Generated content shapes (must match the frontend objective.ts types)
# ---------------------------------------------------------------------------


class ObjectiveSummary(BaseModel):
    summary: str = ""


class ObjectiveConstraint(BaseModel):
    id: str
    text: str
    applied: bool = False


class RewardOpportunity(BaseModel):
    id: str
    title: str
    description: str
    partner: str
    estimatedValue: str


class StrategyCard(BaseModel):
    id: str
    type: str
    title: str
    description: str
    order: int


class CognitiveEvidence(BaseModel):
    summary: str
    factors: list[str] = Field(default_factory=list)


class ExecutionStep(BaseModel):
    id: str
    label: str
    partner: str
    partnerUrl: str
    status: str = "pending"


class ObjectiveScreenPayload(BaseModel):
    screenType: str = ""
    summary: Optional[str] = None
    constraints: list[ObjectiveConstraint] = Field(default_factory=list)
    opportunities: list[RewardOpportunity] = Field(default_factory=list)
    strategies: list[StrategyCard] = Field(default_factory=list)
    evidence: Optional[CognitiveEvidence] = None
    executionSteps: list[ExecutionStep] = Field(default_factory=list)


class ObjectiveGenerateResponse(BaseModel):
    status: str  # PERSONALIZED | REJECTED
    correlationId: str = ""
    screen: ObjectiveScreenPayload = Field(default_factory=ObjectiveScreenPayload)
    intelligence: dict = Field(default_factory=dict)
    confidence: float = 0.0
    reasonCodes: list[str] = Field(default_factory=list)
    error: str = ""
