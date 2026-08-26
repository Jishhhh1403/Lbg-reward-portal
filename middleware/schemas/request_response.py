from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class StatusEnum(str, Enum):
    PERSONALIZED = "PERSONALIZED"
    FALLBACK = "FALLBACK"
    REJECTED = "REJECTED"


class ValidationSummary(BaseModel):
    schemaValidation: str = "FAIL"
    uiConstitution: str = "FAIL"
    componentRegistry: str = "FAIL"
    contentRegistry: str = "FAIL"
    accessibility: str = "FAIL"
    consent: str = "FAIL"
    conduct: str = "FAIL"


class FinalResponse(BaseModel):
    status: StatusEnum
    correlationId: str
    decisionId: str
    sdui: dict = Field(default_factory=dict)
    fallbackApplied: bool = False
    reasonCodes: list[str] = Field(default_factory=list)
    confidence: float = 0.0
    expiresAt: str = ""
    explainabilityRecordRef: str = ""
    validationSummary: ValidationSummary = Field(default_factory=ValidationSummary)


class ConsentCheckResult(BaseModel):
    status: str = "PASS"
    permittedSignals: list[dict] = Field(default_factory=list)
    removedSignals: list[dict] = Field(default_factory=list)
    violations: list[str] = Field(default_factory=list)
    consentValid: bool = True
    purposeValid: bool = True
    veto: bool = False


class ConstitutionCheckResult(BaseModel):
    status: str = "PASS"
    violations: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    anchoredComponentsIntact: bool = True
    bankIdentityIntact: bool = True
    designTokensValid: bool = True
    componentConstraintsValid: bool = True
    veto: bool = False


class RiskCheckResult(BaseModel):
    status: str = "PASS"
    violations: list[str] = Field(default_factory=list)
    vulnerabilityFactors: list[str] = Field(default_factory=list)
    suitabilityConcerns: list[str] = Field(default_factory=list)
    manipulationRisk: str = "LOW"
    discriminatoryRisk: str = "LOW"
    darkPatternRisk: str = "LOW"
    veto: bool = False


class RedTeamChallengeResult(BaseModel):
    status: str = "PASS"
    challenges: list[dict] = Field(default_factory=list)
    unresolvedCritical: int = 0
    unresolvedHigh: int = 0
    assumptionsChallenged: int = 0
    evidenceQualityIssues: int = 0
    schemaValid: bool = True
    constitutionValid: bool = True
    componentsValid: bool = True
    tokensValid: bool = True
    bindingsValid: bool = True
    consentValid: bool = True
    accessibilityValid: bool = True
    fallbackValid: bool = True
    veto: bool = False
