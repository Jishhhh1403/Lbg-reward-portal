"""Customer Story Architect — five-agent narrative extension (spec §4).

Converts permitted customer context into 2–3 evidence-grounded screen stories
and recommends one. Proposal authority only; no veto. In the QUEST+R graph the
committee prompt in Stage U produces storyHypotheses and this agent owns their
deterministic validation (grounding, one-outcome, caps).
"""

import json

from .base import BaseAgent
from config.narrative_policy import (
    ONE_SENTENCE_MAX_LEN,
    STORY_HYPOTHESES_MAX,
    STORY_HYPOTHESES_MIN,
)
from schemas.narrative import StoryHypotheses, parse_model


class CustomerStoryArchitectAgent(BaseAgent):
    """One screen-level customer story: situation, tension, resolution, outcome."""

    SYSTEM_PROMPT = """You are the Customer Story Architect in a governed banking rewards UI committee.

Create 2-3 evidence-grounded screen stories, then recommend one. Each story must define
one primary customer outcome and an achievable, meaningfully advanceable resolution for
this visit.

MUST:
- Use permitted evidence only and cite evidenceRefs.
- Keep exactly one primary outcome per story.
- Express each story in a single sentence.
- Identify detours that would fragment the experience (prohibitedDetours).
- Give every story non-empty completionSignals.

MUST NOT:
- Invent customer facts, goals or urgency.
- Reinterpret the reward interaction profile as personality.
- Create campaign copy or regulated advice.
- Use or lose sensitive/protected attributes.

Return ONLY valid JSON matching:
{
  "hypotheses": [
    {
      "storyId": "story-1",
      "storyTitle": "short title",
      "oneSentenceStory": "one sentence",
      "customerSituation": "bounded current situation",
      "storyTension": "genuine tension or opportunity",
      "customerResolution": "resolution achievable this visit",
      "primaryOutcome": "the ONE primary customer outcome",
      "secondaryOutcome": null,
      "narrativeMode": "START_NEW_JOURNEY|CONTINUE_ACTIVE_GOAL|RESOLVE_ACTION|PROTECT_VALUE|MAKE_CHOICE|UNDERSTAND_VALUE",
      "evidenceRefs": ["signal ids from permitted evidence"],
      "confidence": 0.0,
      "prohibitedDetours": ["detour descriptions"],
      "completionSignals": ["observable completion signal"],
      "expiryAt": null
    }
  ],
  "recommendedStoryId": "story-1",
  "rejectedStoryReasons": {},
  "qualityGate": {"passed": true, "violations": []}
}

No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        """Standalone invocation path (Stage U)."""
        stage = state.get("current_stage", "U")
        user_content = self._user_content(state)
        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)
        model, error = self.validate_hypotheses(parsed, state)

        msg = self._create_message(
            state,
            stage=stage,
            round_name="story-framing",
            message_type="PROPOSAL" if model else "OBSERVATION",
            summary=(
                f"Recommended story {model.recommendedStoryId}"
                if model
                else f"Story grounding failed: {error}"
            ),
        )
        updates = self._append_msg(state, msg)
        updates["story_hypotheses"] = model.model_dump(mode="json") if model else None
        if error:
            updates["reason_codes"] = list(state.get("reason_codes", [])) + ["U.STORY.GROUNDING.FAILED"]
        return updates

    def _user_content(self, state: dict) -> str:
        return f"""STAGE U — CUSTOMER STORY FRAMING
Task Charter: {json.dumps(state.get('task_charter', {}))}
Journey Analysis: {json.dumps(state.get('current_session_context', {}).get('journeyAnalysis', {}))}
Customer Context: {json.dumps(state.get('customer_context', {}))}
Permitted Evidence: {json.dumps(state.get('permitted_evidence', {}))}
Reward Interaction Profile: {json.dumps(state.get('reward_interaction_profile', {}))}
Accessibility Analysis: {json.dumps(state.get('current_session_context', {}).get('accessibilityAnalysis', {}))}
Intelligence Data: {json.dumps(state.get('intelligence_data', {}))}
Continuity State: {json.dumps(state.get('continuity_state') or 'unavailable')}
Card Rules Summary: {json.dumps({k: v for k, v in (state.get('card_rules') or {}).items() if k in ('ordered_stack', 'suppressions', 'banned_types')})}

Produce 2-3 story hypotheses and recommend one."""

    def validate_hypotheses(self, parsed: dict, state: dict) -> tuple:
        """Deterministic quality checks (spec §4.5). Returns (StoryHypotheses|None, error).

        Degraded mode: a SINGLE fully-grounded, otherwise valid hypothesis is
        accepted with a flagged quality-gate violation instead of failing the
        whole request — relevance gates stay hard, count is a quality target.
        """
        model, error = parse_model(StoryHypotheses, parsed.get("storyHypotheses") or parsed)
        if error:
            return None, error

        errors: list[str] = []
        if not (STORY_HYPOTHESES_MIN <= len(model.hypotheses) <= STORY_HYPOTHESES_MAX):
            errors.append(
                f"expected {STORY_HYPOTHESES_MIN}-{STORY_HYPOTHESES_MAX} hypotheses, got {len(model.hypotheses)}"
            )

        permitted_refs = self._permitted_ref_ids(state)
        survivors: list = []
        for h in model.hypotheses:
            supported = [r for r in h.evidenceRefs if r in permitted_refs]
            unpermitted = [r for r in h.evidenceRefs if r not in permitted_refs]
            if unpermitted:
                # Privacy scope stays strict: unpermitted citations are stripped,
                # never honoured. Stories keep flying only with >=1 permitted ref.
                errors.append(f"{h.storyId}: stripped unpermitted evidenceRefs {unpermitted}")
                if not supported:
                    errors.append(f"{h.storyId}: dropped — no permitted evidenceRefs remain")
                    continue
                h = h.model_copy(update={"evidenceRefs": supported})
            if not h.primaryOutcome.strip():
                errors.append(f"{h.storyId}: missing primaryOutcome")
            if not h.oneSentenceStory.strip() or len(h.oneSentenceStory) > ONE_SENTENCE_MAX_LEN:
                errors.append(f"{h.storyId}: oneSentenceStory empty or over length cap")
            if not h.completionSignals:
                errors.append(f"{h.storyId}: completionSignals empty")
            survivors.append(h)

        if not survivors:
            gate = model.qualityGate.model_copy(update={"passed": False, "violations": errors})
            return None, "no grounded stories survive validation: " + "; ".join(errors)

        recommended = model.recommendedStoryId
        if recommended not in {h.storyId for h in survivors}:
            recommended = survivors[0].storyId
            errors.append(f"recommendedStoryId reassigned to first surviving story {recommended}")

        degraded = len(survivors) == 1
        if not (STORY_HYPOTHESES_MIN <= len(survivors) <= STORY_HYPOTHESES_MAX):
            if degraded:
                errors.append(
                    f"degraded: {STORY_HYPOTHESES_MIN}-{STORY_HYPOTHESES_MAX} hypotheses expected, got {len(survivors)} "
                    "(accepted as single grounded story)"
                )
            else:
                errors.append(f"expected {STORY_HYPOTHESES_MIN}-{STORY_HYPOTHESES_MAX} hypotheses, got {len(survivors)}")

        hard_errors = [
            e for e in errors
            if "missing primaryOutcome" in e or "oneSentenceStory" in e or "completionSignals" in e
        ]
        if hard_errors:
            gate = model.qualityGate.model_copy(update={"passed": False, "violations": errors})
            payload = {**model.model_dump(), "qualityGate": gate.model_dump()}
            payload["hypotheses"] = [h.model_dump() for h in survivors]
            payload["recommendedStoryId"] = recommended
            return model.__class__(**payload), "; ".join(hard_errors)

        gate = model.qualityGate.model_copy(
            update={"passed": True, "violations": errors}
        )
        payload = {**model.model_dump(), "qualityGate": gate.model_dump()}
        payload["hypotheses"] = [h.model_dump() for h in survivors]
        payload["recommendedStoryId"] = recommended
        return model.__class__(**payload), None

    def _permitted_ref_ids(self, state: dict) -> set:
        refs: set = set()
        permitted = state.get("permitted_evidence") or {}
        for key in ("permittedSignals", "availableEvidence"):
            for item in permitted.get(key, []) or []:
                if isinstance(item, str):
                    refs.add(item)
                elif isinstance(item, dict):
                    for field in ("signalId", "id", "ref", "value"):
                        if item.get(field):
                            refs.add(item[field])
        for obs in (state.get("customer_context") or {}).get("observedFacts", []) or []:
            if isinstance(obs, dict) and obs.get("factId"):
                refs.add(obs["factId"])
        intel = state.get("intelligence_data") or {}
        for sig in intel.get("signals", []) or []:
            refs.add(str(sig))
        return refs


# Reason code emitted when grounding fails (spec §9.4).
GROUNDING_FAILED_REASON = "U.STORY.GROUNDING.FAILED"
