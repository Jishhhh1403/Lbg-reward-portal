"""Card Rule Engine — deterministic composition rules driven by the
intelligence layer's motive scores, response predictions and conduct signals.

Rules are evaluated independently; every matching rule contributes an ordered
mandatory component stack and hard suppressions. The engine also enforces
conduct safeguard interlocks and plain-English sanitisation.
"""

from __future__ import annotations

from dataclasses import dataclass, field


# Ordered mandatory stacks per rule (POINTS_BALANCE is always anchored first
# by the composition pipeline and is therefore not listed here).
RULE_STACKS: dict[str, list[str]] = {
    "R1_VALUE_CERTAINTY": [
        "TANGIBLE_VALUE_CARD",
        "REWARD_CHOICE_PANEL",
        "PARTNER_VALUE_COMPARISON",
        "WHY_THIS_UI_CARD",
        "REWARDS_INSIGHT_CARD",
    ],
    "R2_PAYMENT_UTILITY": [
        "GOAL_PROGRESS_CARD",
        "PAYMENT_REWARD_CARD",
        "REWARD_ALLOCATION_CONTROL",
        "PAYMENT_REWARD_CONFIRMATION",
        "TANGIBLE_VALUE_CARD",
        "REWARDS_INSIGHT_CARD",
    ],
    "R3_EDUCATIONAL_COMPETENCE": [
        "GOAL_PROGRESS_CARD",
        "LEARNING_MISSION_CARD",
        "QUIZ_CARD",
        "COMPREHENSION_FEEDBACK_CARD",
        "CONFIDENCE_PROGRESS_CARD",
        "EDUCATIONAL_INSIGHT_CARD",
    ],
    "R4_INTEROPERABILITY": [
        "CONSOLIDATED_REWARD_WALLET",
        "SYNC_STATUS_CARD",
        "PARTNER_VALUE_COMPARISON",
        "PARTNER_TRANSFER_CARD",
        "REWARD_PROVENANCE_CARD",
        "GOAL_PROGRESS_CARD",
        # PROGRAMME_CONNECTION_CARD is optional per spec — appended by the
        # enricher when the screen has room (12-17 target).
        "PROGRAMME_CONNECTION_CARD",
    ],
    "R5_PREVIEW_GUARANTEED": [
        "PERSONALIZED_OFFER_CARD",
        "BEST_VALUE_REDEEM_CARD",
    ],
}

# Component types banned outright by each suppression flag.
SUPPRESSED_TYPES: dict[str, set[str]] = {
    "suppress_leaderboard": {"LEADERBOARD"},
    "suppress_streak": {"STREAK_CARD", "GOAL_STREAK_CARD"},
    "suppress_abstract_points_promotion": set(),
    "suppress_artificial_urgency": {"COUNTDOWN_CARD"},
    "suppress_spend_more_messaging": {"FLASH_REWARD_BANNER", "INSTANT_REWARD_POPUP"},
    "suppress_countdowns": {"COUNTDOWN_CARD"},
    "suppress_public_recognition": {"LEADERBOARD", "COMMUNITY_CHALLENGE_CARD"},
}

# Plain-English replacements applied to all SDUI string props when technical
# language risks are elevated (Rule 4 / conduct interlock).
SANITISATION_MAP: list[tuple[str, str]] = [
    ("blockchain", "secure record"),
    ("crypto", "rewards"),
    ("cryptocurrency", "rewards"),
    ("mint", "award"),
    ("minted", "awarded"),
    ("burn", "remove"),
    ("burned", "removed"),
    ("burnt", "removed"),
    ("ledger", "record"),
    ("public key", "secure ID"),
    ("private key", "secure ID"),
    ("tokenised", "converted"),
    ("tokenize", "convert"),
    ("tokenised", "converted"),
    ("tokens", "points"),
    ("token", "point"),
    ("investment framing", "long-term savings view"),
    ("investment", "long-term savings"),
    ("invest", "save"),
]


@dataclass
class RuleResult:
    matched_rules: list[str] = field(default_factory=list)
    ordered_stack: list[str] = field(default_factory=list)
    suppressions: dict[str, bool] = field(default_factory=dict)
    banned_types: set[str] = field(default_factory=set)
    sanitize_technical_language: bool = False
    preview_mode: bool = False
    guaranteed_baseline: bool = False
    tone: str = "CONCISE"
    # component type -> relevance boost (added by the narrative engine)
    relevance_boosts: dict[str, float] = field(default_factory=dict)

    @property
    def active(self) -> bool:
        return bool(self.matched_rules)

    def prompt_notes(self) -> str:
        notes = []
        if self.ordered_stack:
            notes.append(
                "MANDATORY ORDERED STACK: every candidate MUST include these component "
                "types in exactly this order immediately after POINTS_BALANCE, with "
                f"priorities assigned in sequence: {', '.join(self.ordered_stack)}"
            )
        if self.suppressions:
            flags = ", ".join(k for k, v in self.suppressions.items() if v)
            notes.append(f"HARD SUPPRESSIONS ACTIVE: {flags}. Never include suppressed content or framing.")
            if self.banned_types:
                notes.append(
                    "BANNED COMPONENT TYPES for this customer: " + ", ".join(sorted(self.banned_types))
                )
        if self.preview_mode:
            notes.append(
                "PREVIEW MODE: offer cards must present interactive preview states "
                "(full terms, exact value, what happens next) before any commitment CTA."
            )
        if self.guaranteed_baseline:
            notes.append(
                "GUARANTEED BASELINE: compute and display the guaranteed minimum value "
                "explicitly on every offer card BEFORE the customer selects anything."
            )
        if self.sanitize_technical_language:
            notes.append(
                "PLAIN ENGLISH ONLY: all copy must avoid technical/transfer jargon; "
                "express values in GBP monetary terms."
            )
        if self.tone != "CONCISE":
            notes.append(
                f"COMMUNICATION TONE: {self.tone} — match all copy to this predicted-response tone."
            )
        if self.relevance_boosts:
            boosts = ", ".join(f"{t} (+{v})" for t, v in sorted(self.relevance_boosts.items()))
            notes.append(
                "PREDICTED-RESPONSE RELEVANCE BOOSTS (rank these higher in the story flow): " + boosts
            )
        return "\n".join(f"- {n}" for n in notes)


def _score(intel: dict, key: str) -> float:
    scores = intel.get("motiveScores") or {}
    try:
        return float(scores.get(key, 0.0) or 0.0)
    except (TypeError, ValueError):
        return 0.0


def _personality(intel: dict) -> dict:
    insights = intel.get("personalityInsights") or {}
    if not isinstance(insights, dict):
        return {}
    return insights


def _fused_score(intel: dict, key: str) -> float:
    """Card-rule-engine score with a personality-insights fallback so legacy
    customers without engine-level motive scores still personalise correctly.
    Card-engine values always take precedence when present."""
    direct = _score(intel, key)
    if direct > 0.0:
        return direct

    pi = _personality(intel)
    pm = pi.get("motiveScores") or {}
    probs = pi.get("probabilities") or {}

    fallbacks = {
        "valueCertainty": max(
            float(pm.get("valueExplainer", 0.0) or 0.0),
            float(probs.get("valueExplainer", 0.0) or 0.0),
        ),
        "paymentUtility": float(pm.get("paymentUtility", 0.0) or 0.0),
        "portabilityPreference": float(pm.get("portabilityPreference", 0.0) or 0.0),
        "competenceMotivation": float(pm.get("curiosityResponse", 0.0) or 0.0),
        "probNeedValueExplanation": float(
            (pi.get("predictedResponses") or {}).get("tangibleValueExplainer", 0.0) or 0.0
        ),
        "probPreferEducationReward": float(pm.get("curiosityResponse", 0.0) or 0.0),
    }
    return float(fallbacks.get(key, 0.0) or 0.0)


def _predicted_response(intel: dict, key: str) -> float:
    try:
        return float((_personality(intel).get("predictedResponses") or {}).get(key, 0.0) or 0.0)
    except (TypeError, ValueError):
        return 0.0


def evaluate_rules(intelligence: dict) -> RuleResult:
    """Evaluate persona card rules against an intelligence-layer payload.
    Scores are fused: card-rule-engine motive scores take precedence, with
    personality-insights probabilities/motive scores/predicted responses as
    fallbacks so every customer personalises accurately."""
    result = RuleResult()

    def match(rule_id: str) -> None:
        if rule_id not in result.matched_rules:
            result.matched_rules.append(rule_id)

    m = lambda k: _fused_score(intelligence, k)  # noqa: E731

    # RULE 1 — value certainty needed
    if (
        m("valueCertainty") >= 0.85
        or m("valueConfusionRisk") >= 0.75
        or m("probNeedValueExplanation") >= 0.85
    ):
        match("R1_VALUE_CERTAINTY")
        result.suppressions.update({
            "suppress_leaderboard": True,
            "suppress_streak": True,
            "suppress_abstract_points_promotion": True,
            "suppress_artificial_urgency": True,
        })

    # RULE 2 — payment utility focused
    if m("paymentUtility") >= 0.85 and m("probPreferPaymentLinkedReward") >= 0.80:
        match("R2_PAYMENT_UTILITY")
        result.suppressions.update({
            "suppress_leaderboard": True,
            "suppress_streak": True,
            "suppress_spend_more_messaging": True,
            "suppress_artificial_urgency": True,
        })

    # RULE 3 — educational competence & learning
    if m("competenceMotivation") >= 0.85 or m("probPreferEducationReward") >= 0.80:
        match("R3_EDUCATIONAL_COMPETENCE")
        result.suppressions.update({
            "suppress_leaderboard": True,
            "suppress_countdowns": True,
            "suppress_public_recognition": True,
            "suppress_click_through_shortcuts": True,
        })

    # RULE 4 — interoperability & portability
    if m("portabilityPreference") >= 0.85 or m("consolidatedRewardWallet") >= 0.85:
        match("R4_INTEROPERABILITY")
        result.suppressions.update({"showBlockchainTerminology": False})
        result.sanitize_technical_language = True

    # RULE 5 — preview & guaranteed certainty
    if m("probPreferRewardPreview") >= 0.85 and m("probPreferGuaranteedValue") >= 0.80:
        match("R5_PREVIEW_GUARANTEED")
        result.preview_mode = True
        result.guaranteed_baseline = True

    # CONDUCT SAFEGUARD INTERLOCKS (always enforced)
    if m("spendRisk") > 0.50 or m("rewardChasingRisk") > 0.50:
        result.suppressions.update({
            "suppress_spend_more_messaging": True,
            "suppress_streak": True,
            "suppress_artificial_urgency": True,
        })
    if m("dltConfusionRisk") > 0.50 or m("trustRiskWithTechnicalLanguage") > 0.50:
        result.sanitize_technical_language = True

    # RESPONSE-PREDICTION GUARDS from personality insights — suppress surfaces
    # this customer demonstrably does not engage with.
    gamification_response = _predicted_response(intelligence, "gamificationChoice")
    partner_response = _predicted_response(intelligence, "partnerValueComparison")
    choice_panel_response = _predicted_response(intelligence, "customerChoicePanel")
    explainer_response = _predicted_response(intelligence, "tangibleValueExplainer")

    if 0.0 < gamification_response < 0.20:
        result.suppressions.setdefault("suppress_public_recognition", True)
        result.suppressions.setdefault("suppress_streak", True)
    if 0.0 < partner_response < 0.15:
        result.banned_types.add("PARTNER_VALUE_COMPARISON")

    # RELEVANCE BOOSTS — predicted-response strengths raise the storytelling
    # rank of matching components in the narrative engine.
    if explainer_response >= 0.6:
        result.relevance_boosts["TANGIBLE_VALUE_CARD"] = 0.30
        result.relevance_boosts["HOW_POINTS_WORK_CARD"] = 0.15
    if choice_panel_response >= 0.6:
        result.relevance_boosts["REWARD_CHOICE_PANEL"] = 0.25
        result.relevance_boosts["REWARD_ALLOCATION_CONTROL"] = 0.15
    if partner_response >= 0.6:
        result.relevance_boosts["PARTNER_VALUE_COMPARISON"] = 0.25
        result.relevance_boosts["PARTNER_TRANSFER_CARD"] = 0.15
    if gamification_response >= 0.7:
        result.relevance_boosts["STREAK_CARD"] = 0.25
        result.relevance_boosts["CHALLENGE_CARD"] = 0.25
        result.relevance_boosts["LEADERBOARD"] = 0.20

    # Preferred communication tone from the intelligence layer's own signal.
    signals = intelligence.get("personalizationSignals") or {}
    if isinstance(signals, dict) and signals.get("preferredTone"):
        result.tone = str(signals["preferredTone"])

    # Merge ordered stacks (dedupe, preserve rule order)
    seen: set[str] = set()
    stack: list[str] = []
    for rule_id in result.matched_rules:
        for comp_type in RULE_STACKS.get(rule_id, []):
            if comp_type not in seen:
                seen.add(comp_type)
                stack.append(comp_type)
    result.ordered_stack = stack

    # Resolve banned types from suppression flags
    banned: set[str] = set(result.banned_types)
    for flag, types in SUPPRESSED_TYPES.items():
        if result.suppressions.get(flag):
            banned |= types
    result.banned_types = banned

    return result


def sanitize_text(text: str) -> str:
    """Apply plain-English replacements to a single string."""
    out = text
    lowered = out.lower()
    for term, replacement in SANITISATION_MAP:
        if term in lowered:
            # Preserve original casing style for whole-word-ish replacement
            out = _replace_ci(out, term, replacement)
            lowered = out.lower()
    return out


def _replace_ci(text: str, term: str, replacement: str) -> str:
    import re

    pattern = re.compile(re.escape(term), re.IGNORECASE)

    def _sub(match: re.Match) -> str:
        found = match.group(0)
        return replacement.capitalize() if found[:1].isupper() else replacement

    return pattern.sub(_sub, text)


def sanitize_value(value):
    """Recursively sanitise all strings inside parsed JSON props."""
    if isinstance(value, str):
        return sanitize_text(value)
    if isinstance(value, dict):
        return {k: sanitize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [sanitize_value(v) for v in value]
    return value
