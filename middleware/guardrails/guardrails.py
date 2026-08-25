from typing import Any
from datetime import datetime, timezone


class GuardrailResult:
    def __init__(self, passed: bool, details: dict[str, Any] | None = None):
        self.passed = passed
        self.details = details or {}
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> dict[str, Any]:
        return {
            "passed": self.passed,
            "timestamp": self.timestamp,
            **self.details,
        }


class ConsentGuardrail:
    PROHIBITED_ATTRIBUTES = {
        "race", "religion", "sexual_orientation", "political_affiliation",
        "health_conditions", "genetic_data", "biometric_data",
        "mental_health", "disability_status", "marital_status",
        "pregnancy_status", "age_precise", "national_origin",
    }

    def check(self, consent_envelope: dict, purpose_of_use: str) -> GuardrailResult:
        if not consent_envelope or not purpose_of_use:
            return GuardrailResult(
                False,
                {"reason": "Missing consent envelope or purpose of use", "veto": True},
            )

        consent_valid = bool(consent_envelope.get("valid", True))
        purpose_valid = bool(purpose_of_use)

        violations = []
        if not consent_valid:
            violations.append("Consent envelope is not valid")
        if not purpose_valid:
            violations.append("Purpose of use is empty")

        return GuardrailResult(
            passed=consent_valid and purpose_valid,
            details={
                "consentValid": consent_valid,
                "purposeValid": purpose_valid,
                "violations": violations,
                "veto": not (consent_valid and purpose_valid),
            },
        )


class ConstitutionGuardrail:
    ANCHORED_COMPONENTS = {"POINTS_BALANCE", "HEADER", "NOTIFICATION"}

    BANK_IDENTITY_COMPONENTS = {"HEADER", "NOTIFICATION"}
    REWARD_COIN_COMPONENTS = {"POINTS_BALANCE"}

    def check(self, components: list[dict]) -> GuardrailResult:
        violations = []
        warnings = []

        component_types = {c.get("type", "") for c in components}

        for anchored in self.ANCHORED_COMPONENTS:
            if anchored not in component_types:
                violations.append(f"Anchored component {anchored} is missing")

        for comp in components:
            comp_type = comp.get("type", "")
            props = comp.get("props", {})

            if comp_type in self.BANK_IDENTITY_COMPONENTS:
                if "bankLogo" in props and isinstance(props["bankLogo"], str):
                    if props["bankLogo"] not in ("approved-logo-1", "default"):
                        violations.append(
                            f"Component {comp_type} has unapproved bank logo reference"
                        )

            if comp_type in self.REWARD_COIN_COMPONENTS:
                if "coinLogo" in props and isinstance(props["coinLogo"], str):
                    if props["coinLogo"] not in ("approved-coin-1", "default"):
                        violations.append(
                            f"Component {comp_type} has unapproved reward coin logo"
                        )

        return GuardrailResult(
            passed=len(violations) == 0,
            details={
                "violations": violations,
                "warnings": warnings,
                "anchoredComponentsIntact": len(violations) == 0,
                "veto": len(violations) > 0,
            },
        )


class RiskGuardrail:
    MANIPULATION_KEYWORDS = {
        "act now", "limited time only", "last chance", "only 1 left",
        "you will lose", "don't miss out", "urgent", "expires today",
    }

    def check(self, components: list[dict], customer_context: dict) -> GuardrailResult:
        violations = []
        vulnerability_factors = []
        suitability_concerns = []

        engagement_score = customer_context.get("engagementScore", 1.0)
        if engagement_score < 0.3:
            vulnerability_factors.append("Low engagement score - customer may be vulnerable")

        for comp in components:
            props = comp.get("props", {})
            text_fields = ["title", "subtitle", "message", "description", "motivationalMessage"]

            for field in text_fields:
                value = str(props.get(field, "")).lower()
                for keyword in self.MANIPULATION_KEYWORDS:
                    if keyword in value:
                        violations.append(
                            f"Component {comp.get('type')} contains manipulation keyword: {keyword}"
                        )

        return GuardrailResult(
            passed=len(violations) == 0,
            details={
                "violations": violations,
                "vulnerabilityFactors": vulnerability_factors,
                "suitabilityConcerns": suitability_concerns,
                "manipulationRisk": "HIGH" if violations else "LOW",
                "darkPatternRisk": "HIGH" if violations else "LOW",
                "discriminatoryRisk": "LOW",
                "veto": len(violations) > 0,
            },
        )
