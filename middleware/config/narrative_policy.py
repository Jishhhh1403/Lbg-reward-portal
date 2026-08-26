"""Narrative policy configuration.

All thresholds and caps that govern the five-agent narrative extension live
here — NOT in prompts. Values are implementation recommendations from the
QUEST-UI middleware specification (v1.0) and may be tuned per deployment.
"""

from __future__ import annotations

import os

def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


# --- Coherence Guardian hard-gate thresholds (spec §7.4) ---
COHERENCE_THRESHOLDS = {
    "storyClarity": 75,
    "journeyContinuity": 70,
    "miniJourneyCompleteness": 75,
    "transitionStrength": 65,
    "actionOutcomeContinuity": 75,
}
COHERENCE_PROFILE_ID = "default-v1"

# --- Story hypotheses (spec §4.5) ---
STORY_HYPOTHESES_MIN = 2
STORY_HYPOTHESES_MAX = 3
ONE_SENTENCE_MAX_LEN = 240

# --- Mini-journeys (spec §5.2 / §13.1) ---
MINI_JOURNEY_MIN = 2
MINI_JOURNEY_MAX = _env_int("NARRATIVE_MINI_JOURNEY_MAX", 4)

# --- Screen composition caps (existing constitution + accessibility) ---
MAX_SCREEN_COMPONENTS = _env_int("NARRATIVE_MAX_COMPONENTS", 20)

# --- Task-charter defaults (spec §9.2) ---
MAX_CONCURRENT_PRIMARY_JOURNEYS = 1

# --- Continuity retention guardrails (spec §8.3) ---
CONTINUITY_STATE_TTL_HOURS = 72
CONTINUITY_MAX_STATE_CHANGES = 25

# --- Post-compile coherence (spec §7.3 / §12.2) ---
MANDATORY_INSERTION_ROLE = "REFERENCE"
