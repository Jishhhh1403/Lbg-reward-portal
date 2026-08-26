"""Session Continuity Agent — five-agent narrative extension (spec §8).

Maintains purpose-bound experience state across visits. Determines START /
RESUME / RECAP / RESOLVE / BRANCH / RETIRE / RESTART treatment, prevents
repeated celebrations, stale actions and generic resets. No veto; may recommend
HOLD in Stage R.
"""

import json
from datetime import datetime, timedelta, timezone

from .base import BaseAgent
from config.narrative_policy import (
    CONTINUITY_MAX_STATE_CHANGES,
    CONTINUITY_STATE_TTL_HOURS,
)
from schemas.narrative import ContinuityPlan, ContinuityState, parse_model


class SessionContinuityAgent(BaseAgent):
    """Bounded, consented, expiring continuity — never surveillance."""

    SYSTEM_PROMPT = """You are the Session Continuity Agent in a governed banking rewards UI committee.

Maintain a purpose-bound experience state across visits and customer actions. Decide whether
the customer should START, RESUME, RECAP, RESOLVE, BRANCH, RETIRE or RESTART a journey.

PRIVACY AND RETENTION GUARDRAILS (binding):
- Use only session and event information approved by the Consent Guardian.
- Never build an unbounded behavioural history.
- Every continuity attribute must carry source context, observedAt and expiry.
- Dismissal is NOT a permanent negative preference unless explicitly declared.
- Missing history means continuity unavailable — never "customer has no prior interest".
- Do not infer emotion, vulnerability or personality from abandonment or dwell time.
- Retire stale stories when evidence, goal state or permission changes.

For STAGE U produce the continuity observation:
{
  "continuityState": {
    "available": false,
    "previousJourneyId": null,
    "previousStoryId": null,
    "lastMeaningfulAction": null,
    "lastResolvedMiniJourneyId": null,
    "activeMiniJourneyId": null,
    "completedComponentRefs": [],
    "dismissedComponentRefs": [],
    "deferredChoices": [],
    "stateChanges": [
      {"changeId": "sc-1", "kind": "ACTION_COMPLETED|CARD_DISMISSED|GOAL_UPDATED|POINTS_CHANGED|JOURNEY_ADVANCED|OTHER", "detail": "...", "observedAt": "ISO-8601", "expiresAt": "ISO-8601"}
    ],
    "observedAt": null,
    "expiresAt": null
  }
}

For STAGE S produce the continuity plan:
{
  "continuityPlan": {
    "openingTreatment": "START|RESUME|RECAP|RESOLVE|BRANCH|RETIRE|RESTART",
    "permitted": true,
    "stateChangeSummary": null,
    "retiredComponents": ["component refs to retire"],
    "suppressionRules": ["e.g. never repeat dismissed card this visit"]
  }
}

Return ONLY valid JSON. No markdown, no commentary."""

    def invoke(self, state: dict) -> dict:
        stage = state.get("current_stage", "U")
        user_content = self._user_content(state)
        response_text = self._call_llm(self.SYSTEM_PROMPT, user_content)
        parsed = self._json_parse_with_retry(response_text)

        updates = self._append_msg(
            state,
            self._create_message(
                state,
                stage=stage,
                round_name="session-continuity",
                message_type="OBSERVATION" if stage == "U" else "PROPOSAL",
                summary="Continuity observation/plan produced",
            ),
        )

        if stage == "U":
            model, error = self.build_continuity_state(parsed)
            updates["continuity_state"] = model.model_dump(mode="json") if model else None
            if error:
                # Absent/broken history means unavailable, never negative inference.
                updates["reason_codes"] = list(state.get("reason_codes", [])) + ["R.CONTINUITY.UNAVAILABLE"]
        else:
            model, error = self.build_continuity_plan(parsed)
            updates["continuity_plan"] = model.model_dump(mode="json") if model else None
        return updates

    def _user_content(self, state: dict) -> str:
        return f"""STAGE {state.get('current_stage', 'U')} — SESSION CONTINUITY
Continuity Permitted: {(state.get('task_charter') or {}).get('continuityPermitted', False)}
Prior Session Context: {json.dumps(state.get('current_session_context', {}))}
Approved Customer Story: {json.dumps(state.get('approved_customer_story') or {})}
Narrative Sequence: {json.dumps(state.get('narrative_sequence') or {})}

Produce the required continuity artefact."""

    def build_continuity_state(self, parsed: dict):
        payload = parsed.get("continuityState")
        permitted = True
        if isinstance(payload, dict) and payload.get("available"):
            now = datetime.now(timezone.utc)
            ttl = now + timedelta(hours=CONTINUITY_STATE_TTL_HOURS)
            payload = {
                **payload,
                "observedAt": payload.get("observedAt") or now.isoformat(),
                "expiresAt": payload.get("expiresAt") or ttl.isoformat(),
            }
            changes = payload.get("stateChanges") or []
            payload["stateChanges"] = changes[-CONTINUITY_MAX_STATE_CHANGES:]
        return parse_model(ContinuityState, payload or {"available": False})

    def build_continuity_plan(self, parsed: dict):
        return parse_model(ContinuityPlan, parsed.get("continuityPlan") or {})


def deterministic_continuity_validation(
    final_sdui: dict,
    continuity_state: dict | None,
    narrative_sequence: dict | None,
) -> dict:
    """R-stage deterministic checks: repeated celebrations, stale actions,
    dismissed repeats. Returns ContinuityValidation-shaped dict."""
    components = final_sdui.get("components", [])
    comp_ids = {c.get("id") for c in components}
    celebration_types = {"GOAL_COMPLETE_CELEBRATION", "BADGE_CARD", "MILESTONE_CARD"}

    repeated_celebrations = []
    stale_actions = []
    dismissed_repeats = []

    if continuity_state and continuity_state.get("available"):
        completed = set(continuity_state.get("completedComponentRefs") or [])
        dismissed = set(continuity_state.get("dismissedComponentRefs") or [])
        last_action = continuity_state.get("lastMeaningfulAction")

        for c in components:
            cid = c.get("id", "")
            ctype = c.get("type", "")
            if cid in completed and ctype in celebration_types:
                repeated_celebrations.append(cid)
            if cid in dismissed:
                dismissed_repeats.append(cid)

        if (
            last_action
            and narrative_sequence
            and narrative_sequence.get("primaryActionComponentRef") == last_action
            and last_action in completed
        ):
            stale_actions.append(last_action)

    decision = "RELEASE"
    reason_code = None
    if repeated_celebrations or stale_actions or dismissed_repeats:
        decision = "HOLD"
        reason_code = "R.CONTINUITY.HOLD"
    elif not (continuity_state or {}).get("available", False):
        decision = "UNAVAILABLE"
        reason_code = "R.CONTINUITY.UNAVAILABLE"

    return {
        "passed": decision == "RELEASE" or decision == "UNAVAILABLE",
        "repeatedCelebrations": repeated_celebrations,
        "staleActions": stale_actions,
        "dismissedRepeats": dismissed_repeats,
        "decision": decision,
        "reasonCode": reason_code,
        "_checkedComponentIds": sorted(x for x in comp_ids if x),
    }
