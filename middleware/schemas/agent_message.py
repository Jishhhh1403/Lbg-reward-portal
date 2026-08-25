from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class MessageType(str, Enum):
    OBSERVATION = "OBSERVATION"
    PROPOSAL = "PROPOSAL"
    CHALLENGE = "CHALLENGE"
    RESPONSE = "RESPONSE"
    VOTE = "VOTE"
    VETO = "VETO"
    APPROVAL = "APPROVAL"


class Claim(BaseModel):
    claimId: str
    statement: str
    evidenceRefs: list[str] = Field(default_factory=list)
    confidence: float = 0.0
    assumptions: list[str] = Field(default_factory=list)


class AgentMessage(BaseModel):
    messageId: str
    sequence: int
    timestamp: str
    stage: str
    round: str
    fromAgent: str
    toAgents: list[str] = Field(default_factory=list)
    messageType: MessageType
    summary: str
    claims: list[Claim] = Field(default_factory=list)
    recommendedActions: list[str] = Field(default_factory=list)
    objections: list[str] = Field(default_factory=list)
    candidateRefs: list[str] = Field(default_factory=list)
    policyRefs: list[str] = Field(default_factory=list)
    modelVersion: str = "gemini-2.0-flash"
    promptTemplateVersion: str = "1.0"


class ComponentCandidate(BaseModel):
    candidateId: str
    strategy: str
    templateId: str = "default"
    anchoredComponents: list[dict] = Field(default_factory=list)
    governedComponents: list[dict] = Field(default_factory=list)
    dynamicComponents: list[dict] = Field(default_factory=list)
    regionOrdering: list[str] = Field(default_factory=list)
    approvedPropertyChanges: list[dict] = Field(default_factory=list)
    contentRefs: list[str] = Field(default_factory=list)
    dataBindings: list[dict] = Field(default_factory=list)
    analyticsEventRefs: list[str] = Field(default_factory=list)
    evidenceRefs: list[str] = Field(default_factory=list)
    reasonCodes: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    confidence: float = 0.0
    fallbackImpact: str = "none"


class RewardInteractionProfile(BaseModel):
    attributes: list[dict] = Field(default_factory=list)
    methodology: str = ""
    temporaryInterpretation: bool = True
    declaredPreferencesWeight: float = 0.6
    inferredSignalsWeight: float = 0.4
