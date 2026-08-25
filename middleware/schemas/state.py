from typing import Any, Optional
from typing_extensions import Annotated
from operator import add

from pydantic import Field
from langgraph.graph import MessagesState

from .agent_message import AgentMessage, ComponentCandidate, RewardInteractionProfile


class QuestUIState(MessagesState):
    """Shared state for the QUEST-UI LangGraph workflow."""

    request_id: str = ""
    correlation_id: str = ""
    customer_ref: str = ""
    journey: str = ""
    channel: str = "mobile"
    locale: str = "en-US"
    jurisdiction: str = "US"
    latency_budget_ms: int = 5000

    consent_envelope: dict = Field(default_factory=dict)
    purpose_of_use: str = ""
    declared_preferences: dict = Field(default_factory=dict)
    accessibility_preferences: dict = Field(default_factory=dict)
    current_session_context: dict = Field(default_factory=dict)
    intelligence_data: dict = Field(default_factory=dict)
    card_rules: dict = Field(default_factory=dict)

    stages_completed: list[str] = Field(default_factory=list)
    stage_failure: Optional[str] = None
    fallback_triggered: bool = False
    reason_codes: Annotated[list[str], add]

    task_charter: dict = Field(default_factory=dict)
    customer_context: dict = Field(default_factory=dict)
    reward_interaction_profile: dict = Field(default_factory=dict)
    permitted_evidence: dict = Field(default_factory=dict)
    candidate_compositions: Annotated[list[dict], add]
    evaluations: dict = Field(default_factory=dict)
    selected_candidate: dict = Field(default_factory=dict)
    ui_decision_plan: dict = Field(default_factory=dict)

    # --- Five-agent narrative extension (overwrite unless noted) ---
    story_hypotheses: Optional[dict] = None
    approved_customer_story: Optional[dict] = None
    continuity_state: Optional[dict] = None
    journey_candidates: Annotated[list[dict], add]
    approved_journey: Optional[dict] = None
    experience_journey_plan: Optional[dict] = None
    narrative_sequence: Optional[dict] = None
    deferred_components: Annotated[list[dict], add]
    continuity_plan: Optional[dict] = None
    coherence_assessment: Optional[dict] = None
    post_compile_coherence: Optional[dict] = None
    continuity_validation: Optional[dict] = None
    coherence_structural_errors: dict = Field(default_factory=dict)

    final_sdui: Optional[dict] = None
    fallback_sdui: Optional[dict] = None
    compiled_sdui: Optional[dict] = None
    release_check: dict = Field(default_factory=dict)

    all_messages: Annotated[list[dict], add]
    llm_transcript: Annotated[list[dict], add]
    message_sequence: int = 0
