"""Narrative Engine — turns a flat component list into a personalized story.

Instead of ordering components by raw priority alone, the engine:
1. Scores every component's RELEVANCE from the intelligence layer's
   componentAffinity vector (probabilities, motive scores, predicted responses),
   card-rule-engine boosts and persona composition guides.
2. Assigns every component to a NARRATIVE ACT (hook → snapshot → pathways →
   momentum → trust) so the screen reads as a story rather than a stack of cards.
3. Selects a STORY ARCHETYPE per persona that orders the acts to match how this
   customer wants to be engaged (e.g. protect-then-reassure for at-risk savers).
4. Emits structured `narrative` metadata on the SDUI envelope and per component
   so the frontend can render act headers between story sections.

Deterministic: same intelligence payload always yields the same layout.
"""

from __future__ import annotations

from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Narrative acts
# ---------------------------------------------------------------------------

NARRATIVE_ACTS: list[dict] = [
    {"id": "HOOK", "label": "Why this matters now", "role": "Grab attention with the single most relevant moment"},
    {"id": "SNAPSHOT", "label": "Where you stand", "role": "Ground the customer in their current value and progress"},
    {"id": "PATHWAYS", "label": "What you can do next", "role": "Present actions matched to their motivations"},
    {"id": "MOMENTUM", "label": "Wins & milestones", "role": "Celebrate progress and preview what's coming"},
    {"id": "TRUST", "label": "Your rewards, your control", "role": "Close with transparency, safety and choice"},
]

ACT_IDS = [a["id"] for a in NARRATIVE_ACTS]

# Component type -> narrative act. Types not listed default to PATHWAYS.
COMPONENT_ACT_MAP: dict[str, str] = {
    # HOOK — time-sensitive, personally urgent
    "EXPIRING_POINTS_ALERT": "HOOK",
    "COUNTDOWN_CARD": "HOOK",
    "INSTANT_REWARD_POPUP": "HOOK",
    "FLASH_REWARD_BANNER": "HOOK",
    "REENGAGEMENT_BANNER": "HOOK",
    "GOAL_COMPLETE_CELEBRATION": "HOOK",
    # SNAPSHOT — value, progress and growth context
    "TANGIBLE_VALUE_CARD": "SNAPSHOT",
    "GOAL_PROGRESS_CARD": "SNAPSHOT",
    "LONG_TERM_GOAL_CARD": "SNAPSHOT",
    "FUTURE_VALUE_CARD": "SNAPSHOT",
    "PROJECTION_CHART": "SNAPSHOT",
    "CONSOLIDATED_REWARD_WALLET": "SNAPSHOT",
    "EARN_BREAKDOWN_CARD": "SNAPSHOT",
    "MONTH_OVER_MONTH_CARD": "SNAPSHOT",
    "POINTS_HEALTH_SCORE": "SNAPSHOT",
    "METRIC_TILE": "SNAPSHOT",
    "POINTS_BALANCE": "SNAPSHOT",
    "SHARED_GOAL_CARD": "SNAPSHOT",
    "TRAVEL_FUND_CARD": "SNAPSHOT",
    "SAVINGS_TRANSFER_CARD": "SNAPSHOT",
    "GOAL_AT_RISK_CARD": "SNAPSHOT",
    # PATHWAYS — actionable next steps
    "QUICK_REDEEM_CARD": "PATHWAYS",
    "QUICK_WIN_CARD": "PATHWAYS",
    "RECOMMENDED_ACTIONS": "PATHWAYS",
    "PERSONALIZED_OFFER_CARD": "PATHWAYS",
    "CHALLENGE_CARD": "PATHWAYS",
    "STREAK_CARD": "PATHWAYS",
    "LEADERBOARD": "PATHWAYS",
    "QUIZ_CARD": "PATHWAYS",
    "GOAL_LINKED_REWARD": "PATHWAYS",
    "ADD_GOAL_CARD": "PATHWAYS",
    "GOAL_TEMPLATE_GALLERY": "PATHWAYS",
    "MILESTONE_REWARD_LADDER": "PATHWAYS",
    "GOAL_STREAK_CARD": "PATHWAYS",
    "GOAL_MATCH_BOOST_CARD": "PATHWAYS",
    "GOAL_MILESTONE_CARD": "PATHWAYS",
    "BEST_VALUE_REDEEM_CARD": "PATHWAYS",
    "REWARD_CAROUSEL": "PATHWAYS",
    "PAYMENT_REWARD_CARD": "PATHWAYS",
    "PARTNER_TRANSFER_CARD": "PATHWAYS",
    "LEARNING_MISSION_CARD": "PATHWAYS",
    "LEARNING_PATH_CARD": "PATHWAYS",
    "DAILY_MONEY_TIP_CARD": "PATHWAYS",
    "MYTH_OR_FACT_CARD": "PATHWAYS",
    "COACH_TIP_CARD": "PATHWAYS",
    "HOW_POINTS_WORK_CARD": "PATHWAYS",
    "SAVINGS_CALCULATOR_CARD": "PATHWAYS",
    "NEW_BRAND_SPOTLIGHT_CARD": "PATHWAYS",
    "LOCAL_DEALS_CARD": "PATHWAYS",
    "COMMUNITY_CHALLENGE_CARD": "PATHWAYS",
    "REFERRAL_CARD": "PATHWAYS",
    "BIRTHDAY_REWARD_CARD": "PATHWAYS",
    # MOMENTUM — celebration and lookahead
    "BADGE_CARD": "MOMENTUM",
    "MILESTONE_CARD": "MOMENTUM",
    "FUTURE_MILESTONE_CARD": "MOMENTUM",
    "MILESTONE_ANNIVERSARY_CARD": "MOMENTUM",
    "POINTS_ACADEMY_BADGE_CARD": "MOMENTUM",
    "COMPREHENSION_FEEDBACK_CARD": "MOMENTUM",
    "CONFIDENCE_PROGRESS_CARD": "MOMENTUM",
    "PAYMENT_REWARD_CONFIRMATION": "MOMENTUM",
    # TRUST — transparency, control, provenance
    "SYNC_STATUS_CARD": "TRUST",
    "PREFERENCES_CARD": "TRUST",
    "AUTO_RULES_CARD": "TRUST",
    "WHY_THIS_UI_CARD": "TRUST",
    "GIFT_DONATE_CARD": "TRUST",
    "BRAND_EXPLORER_CARD": "TRUST",
    "REWARD_PROVENANCE_CARD": "TRUST",
    "PROGRAMME_CONNECTION_CARD": "TRUST",
    "EDUCATIONAL_INSIGHT_CARD": "TRUST",
    "REWARDS_INSIGHT_CARD": "TRUST",
    "REWARD_CHOICE_PANEL": "TRUST",
    "PARTNER_VALUE_COMPARISON": "TRUST",
    "REWARD_ALLOCATION_CONTROL": "TRUST",
}

# Fallback act for unregistered types.
DEFAULT_ACT = "PATHWAYS"


# ---------------------------------------------------------------------------
# Story archetypes — act ORDER varies by customer psychology
# ---------------------------------------------------------------------------

ARCHETYPES: dict[str, dict] = {
    "GRAB_AND_GO": {
        "personas": {"INSTANT_GRATIFICATION"},
        "headline": "Value you can use right now",
        "act_order": ["HOOK", "SNAPSHOT", "PATHWAYS", "MOMENTUM", "TRUST"],
    },
    "BUILD_YOUR_FUTURE": {
        "personas": {
            "GOAL_ORIENTED_SAVER",
            "LONG_TERM_PLANNER",
            "PLANNER_AT_RISK_MIX",
        },
        "headline": "Your plan, moving forward",
        "act_order": ["SNAPSHOT", "HOOK", "PATHWAYS", "MOMENTUM", "TRUST"],
    },
    "PROTECT_AND_REASSURE": {
        "personas": {"CHURN_RISK", "INSTANT_AT_RISK_MIX"},
        "headline": "Your rewards are safe — here's the fastest win",
        "act_order": ["HOOK", "SNAPSHOT", "PATHWAYS", "MOMENTUM", "TRUST"],
    },
    "PLAY_AND_PROGRESS": {
        "personas": {"GAMIFICATION_MOTIVATED", "MIXED_PROFILE"},
        "headline": "Keep the streak alive",
        "act_order": ["HOOK", "PATHWAYS", "SNAPSHOT", "MOMENTUM", "TRUST"],
    },
    "CLARITY_FIRST": {
        "personas": {
            "VALUE_CERTAINTY_SEEKER",
            "PAYMENT_UTILITY_FOCUSED",
            "EDUCATIONAL_COMPETENCE",
            "INTEROPERABILITY_SEEKER",
            "PREVIEW_GUARANTEED_VALUE",
        },
        "headline": "Exactly what your points are worth",
        "act_order": ["SNAPSHOT", "TRUST", "PATHWAYS", "HOOK", "MOMENTUM"],
    },
}

DEFAULT_ARCHETYPE = "BUILD_YOUR_FUTURE"

# Persona guide tier base scores (component_catalog PERSONA_COMPOSITION_GUIDES).
GUIDE_TIER_BASE = {"primary": 0.95, "secondary": 0.75, "supporting": 0.55}


@dataclass
class NarrativePlan:
    archetype: str
    headline: str
    tone: str
    ordered_components: list[dict] = field(default_factory=list)
    acts: list[dict] = field(default_factory=list)
    relevance_scores: dict[str, float] = field(default_factory=dict)

    def to_envelope(self) -> dict:
        return {
            "archetype": self.archetype,
            "headline": self.headline,
            "tone": self.tone,
            "acts": self.acts,
            "relevanceScores": self.relevance_scores,
        }


# ---------------------------------------------------------------------------
# Relevance scoring
# ---------------------------------------------------------------------------

def _affinity(intel: dict) -> dict[str, float]:
    raw = intel.get("componentAffinity") or {}
    return raw if isinstance(raw, dict) else {}


def _recommendations(intel: dict) -> set[str]:
    recs = intel.get("recommendations") or []
    return {str(r) for r in recs}


def _persona_guide_tiers(persona: str) -> dict[str, dict[str, float]]:
    """Component type -> tier score for the detected persona, read lazily from
    the catalog so the narrative engine stays decoupled from prompt rendering."""
    try:
        import sys
        import os
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from catalog.component_catalog import get_persona_guide

        guide = get_persona_guide(persona or "")
    except Exception:
        return {}
    tiers: dict[str, dict[str, float]] = {}
    for tier_name, key in (("primary", "primary"), ("secondary", "secondary"), ("supporting", "supporting")):
        for comp_type in guide.get(key, []):
            tiers.setdefault(comp_type, {})[tier_name] = GUIDE_TIER_BASE[tier_name]
    return tiers


def _category_for_component(comp_type: str) -> str | None:
    """Reverse lookup: which affinity category best matches this component."""
    for category, types in CATEGORY_COMPONENTS.items():
        if comp_type in types:
            return category
    return None


CATEGORY_COMPONENTS: dict[str, set[str]] = {
    "instant_reward": {
        "INSTANT_REWARD_POPUP", "FLASH_REWARD_BANNER", "QUICK_REDEEM_CARD",
        "QUICK_WIN_CARD", "REWARD_CAROUSEL",
    },
    "goal_progress": {
        "GOAL_PROGRESS_CARD", "ADD_GOAL_CARD", "GOAL_LINKED_REWARD", "GOAL_MILESTONE_CARD",
        "GOAL_TEMPLATE_GALLERY", "GOAL_AT_RISK_CARD", "SHARED_GOAL_CARD",
        "MILESTONE_REWARD_LADDER", "GOAL_STREAK_CARD", "GOAL_MATCH_BOOST_CARD",
        "TRAVEL_FUND_CARD", "SAVINGS_TRANSFER_CARD",
    },
    "long_term_growth": {
        "LONG_TERM_GOAL_CARD", "FUTURE_VALUE_CARD", "PROJECTION_CHART",
        "FUTURE_MILESTONE_CARD", "SAVINGS_CALCULATOR_CARD",
    },
    "gamification_social": {
        "STREAK_CARD", "CHALLENGE_CARD", "LEADERBOARD", "QUIZ_CARD", "BADGE_CARD",
        "MILESTONE_CARD", "METRIC_TILE", "COMMUNITY_CHALLENGE_CARD", "REFERRAL_CARD",
    },
    "value_clarity_education": {
        "TANGIBLE_VALUE_CARD", "EDUCATIONAL_INSIGHT_CARD", "HOW_POINTS_WORK_CARD",
        "LEARNING_PATH_CARD", "DAILY_MONEY_TIP_CARD", "MYTH_OR_FACT_CARD",
        "COACH_TIP_CARD", "POINTS_ACADEMY_BADGE_CARD", "LEARNING_MISSION_CARD",
        "COMPREHENSION_FEEDBACK_CARD", "CONFIDENCE_PROGRESS_CARD",
    },
    "partner_discovery": {
        "PARTNER_VALUE_COMPARISON", "PARTNER_TRANSFER_CARD", "CONSOLIDATED_REWARD_WALLET",
        "PROGRAMME_CONNECTION_CARD", "REWARD_PROVENANCE_CARD", "NEW_BRAND_SPOTLIGHT_CARD",
        "LOCAL_DEALS_CARD", "BRAND_EXPLORER_CARD",
    },
    "choice_control": {
        "REWARD_CHOICE_PANEL", "REWARD_ALLOCATION_CONTROL", "PREFERENCES_CARD",
        "AUTO_RULES_CARD", "GIFT_DONATE_CARD",
    },
    "risk_protection": {
        "EXPIRING_POINTS_ALERT", "COUNTDOWN_CARD", "SYNC_STATUS_CARD", "GOAL_AT_RISK_CARD",
    },
}

# Recommendation enum -> affinity categories they reinforce.
RECOMMENDATION_CATEGORY_MAP: dict[str, str] = {
    "INSTANT_REWARD": "instant_reward",
    "QUICK_REDEEM": "instant_reward",
    "TANGIBLE_VALUE": "value_clarity_education",
    "PERSONALIZED_OFFER": "choice_control",
    "GOAL_PROGRESS": "goal_progress",
    "GOAL_LINKED_REWARD": "goal_progress",
    "MILESTONE": "long_term_growth",
    "LONG_TERM_VALUE": "long_term_growth",
    "PROJECTED_VALUE": "long_term_growth",
    "EXPIRING_POINTS": "risk_protection",
    "REENGAGEMENT": "risk_protection",
    "QUICK_WIN": "instant_reward",
    "CHALLENGE": "gamification_social",
    "STREAK": "gamification_social",
    "LEADERBOARD": "gamification_social",
    "QUIZ": "value_clarity_education",
}


def compute_relevance(intel: dict, boosts: dict[str, float] | None = None) -> dict[str, float]:
    """Relevance score (0..1+) per component type, fusing:
    - componentAffinity category score (intelligence layer probabilities/motives/predictions)
    - persona guide tier (primary/secondary/supporting)
    - recommendation alignment
    - predicted-response relevance boosts from the card rule engine
    """
    affinity = _affinity(intel)
    persona = str(intel.get("persona", ""))
    tiers = _persona_guide_tiers(persona)
    recs = _recommendations(intel)
    boosts = boosts or {}

    all_types: set[str] = set(COMPONENT_ACT_MAP) | set(tiers)
    for types in CATEGORY_COMPONENTS.values():
        all_types |= types

    scores: dict[str, float] = {}
    for comp_type in all_types:
        score = 0.40  # neutral baseline so unknown components still rank sensibly

        category = _category_for_component(comp_type)
        if category and category in affinity:
            score = max(score, float(affinity[category]))

        tier_scores = tiers.get(comp_type)
        if tier_scores:
            score = max(score, max(tier_scores.values()))

        rec_category = next(
            (cat for rec, cat in RECOMMENDATION_CATEGORY_MAP.items() if rec in recs and cat == category),
            None,
        ) if category else None
        if rec_category:
            score += 0.15

        score += boosts.get(comp_type, 0.0)
        scores[comp_type] = round(min(score, 1.5), 3)

    return scores


# ---------------------------------------------------------------------------
# Story assembly
# ---------------------------------------------------------------------------

def select_archetype(persona: str) -> str:
    for name, spec in ARCHETYPES.items():
        if persona in spec["personas"]:
            return name
    return DEFAULT_ARCHETYPE


def build_narrative(
    components: list[dict],
    intel: dict,
    rule_result=None,
) -> NarrativePlan:
    """Reorder `components` into a personalized story arc and annotate each with
    narrative metadata.

    Ordering rules:
    - POINTS_BALANCE stays anchored first.
    - Card-rule mandatory-stack components stay immediately after the anchor
      (conduct guarantees outrank storytelling).
    - Remaining components are grouped by act in archetype order; within an act
      they are ranked by relevance score (descending), then original priority.
    """
    persona = str(intel.get("persona", ""))
    archetype_id = select_archetype(persona)
    archetype = ARCHETYPES[archetype_id]
    act_order = archetype["act_order"]

    boosts = dict(getattr(rule_result, "relevance_boosts", {}) or {})
    relevance = compute_relevance(intel, boosts)
    mandatory_stack = list(getattr(rule_result, "ordered_stack", []) or [])
    tone = getattr(rule_result, "tone", None) or "CONCISE"

    anchored = [c for c in components if c.get("type") == "POINTS_BALANCE"]
    rest = [c for c in components if c.get("type") != "POINTS_BALANCE"]

    pinned_types: set[str] = set()
    pinned: list[dict] = []
    remaining: list[dict] = []
    used_ids: set[str] = set()
    for comp_type in mandatory_stack:
        match = next((c for c in rest if c.get("type") == comp_type and c.get("id") not in used_ids), None)
        if match is not None:
            pinned.append(match)
            used_ids.add(match.get("id"))
            pinned_types.add(comp_type)
    remaining = [c for c in rest if c.get("id") not in used_ids]

    def sort_key(c: dict):
        comp_type = c.get("type", "")
        act = COMPONENT_ACT_MAP.get(comp_type, DEFAULT_ACT)
        try:
            act_pos = act_order.index(act)
        except ValueError:
            act_pos = len(act_order)
        original_priority = c.get("priority", 99)
        try:
            original_priority = float(original_priority)
        except (TypeError, ValueError):
            original_priority = 99.0
        return (act_pos, -relevance.get(comp_type, 0.4), original_priority)

    remaining.sort(key=sort_key)

    ordered = [*anchored, *pinned, *remaining]
    for i, comp in enumerate(ordered):
        comp = {**comp, "priority": i + 1}
        comp_type = comp.get("type", "")
        act = COMPONENT_ACT_MAP.get(comp_type, DEFAULT_ACT)
        comp["props"] = {
            **comp.get("props", {}),
            "narrative": {
                "actId": act,
                "relevanceScore": relevance.get(comp_type, 0.4),
                "pinned": comp_type in pinned_types or comp_type == "POINTS_BALANCE",
            },
        }
        ordered[i] = comp

    acts_meta: list[dict] = []
    for act_spec in sorted(NARRATIVE_ACTS, key=lambda a: act_order.index(a["id"]) if a["id"] in act_order else 99):
        member_ids = [
            c["id"] for c in ordered
            if COMPONENT_ACT_MAP.get(c.get("type", ""), DEFAULT_ACT) == act_spec["id"]
        ]
        if member_ids:
            acts_meta.append({**act_spec, "componentIds": member_ids})

    return NarrativePlan(
        archetype=archetype_id,
        headline=archetype["headline"],
        tone=tone,
        ordered_components=ordered,
        acts=acts_meta,
        relevance_scores=relevance,
    )


def apply_narrative(final_sdui: dict, intel: dict, rule_result=None) -> dict:
    """Apply narrative structure to a compiled SDUI envelope, returning the
    enriched envelope with `narrative` metadata attached."""
    components = list(final_sdui.get("components", []))
    if not components:
        return final_sdui

    plan = build_narrative(components, intel, rule_result)
    return {**final_sdui, "components": plan.ordered_components, "narrative": plan.to_envelope()}


def narrative_directives_for_prompt(intel: dict) -> str:
    """Compact directive block injected into the Stage S prompt so the LLM
    composes WITH the story arc instead of against it."""
    persona = str(intel.get("persona", ""))
    archetype_id = select_archetype(persona)
    archetype = ARCHETYPES[archetype_id]
    affinity = _affinity(intel)
    signals = intel.get("personalizationSignals") or {}
    top_categories = sorted(affinity.items(), key=lambda kv: kv[1], reverse=True)[:4]

    lines = [
        f"STORY ARCHETYPE: {archetype_id} — {archetype['headline']}",
        f"NARRATIVE ARC (order sections in this sequence): "
        f"{' → '.join(archetype['act_order'])} "
        f"(HOOK={next(a['label'] for a in NARRATIVE_ACTS if a['id']=='HOOK')}, "
        f"SNAPSHOT={next(a['label'] for a in NARRATIVE_ACTS if a['id']=='SNAPSHOT')}, "
        f"PATHWAYS={next(a['label'] for a in NARRATIVE_ACTS if a['id']=='PATHWAYS')}, "
        f"MOMENTUM={next(a['label'] for a in NARRATIVE_ACTS if a['id']=='MOMENTUM')}, "
        f"TRUST={next(a['label'] for a in NARRATIVE_ACTS if a['id']=='TRUST')})",
    ]

    if top_categories:
        cats = ", ".join(f"{cat} ({score})" for cat, score in top_categories)
        lines.append(f"HIGHEST-AFFINITY CONTENT CATEGORIES (lead the story with these): {cats}")

    if isinstance(signals, dict):
        horizon = signals.get("rewardHorizon")
        tone = signals.get("preferredTone")
        drivers = signals.get("engagementDrivers") or []
        hints = signals.get("suppressionHints") or []
        if horizon:
            lines.append(f"REWARD HORIZON: {horizon} — frame CTAs within this time preference.")
        if tone:
            lines.append(f"TONE: write all copy as {tone}.")
        if drivers:
            lines.append(f"ENGAGEMENT DRIVERS to weave into copy: {', '.join(drivers)}.")
        for hint in hints:
            lines.append(f"SUPPRESSION HINT: {hint}")

    lines.append(
        "STORYTELLING RULE: priorities must follow the narrative arc above, NOT just importance. "
        "The first card after POINTS_BALANCE must open the story; each following section should "
        "feel like the natural next sentence in a conversation with this customer."
    )
    return "\n".join(lines)
