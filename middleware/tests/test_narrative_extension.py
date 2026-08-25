"""Tests for the five-agent narrative extension (QUEST+R).

Covers: narrative schemas, deterministic coherence validator, agent
deterministic contracts, graph routing (veto/hold/fallback reason codes),
card-rule interaction with post-compile coherence, and backwards-compatible
SDUI rendering.
"""

import sys
import os
import json
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from langchain_core.messages import AIMessage

from config.narrative_policy import COHERENCE_THRESHOLDS, MINI_JOURNEY_MAX
from schemas.narrative import (
    ComponentNarrativeMetadata,
    CustomerStory,
    ExperienceJourneyPlan,
    MiniJourney,
    NarrativeRole,
    NarrativeSequence,
    SequencedComponent,
    StoryHypotheses,
)
from validators.coherence_validator import (
    ValidationResult,
    assert_anchor_preserved,
    assert_no_orphans,
    assert_unique,
    assess_coherence_metrics,
    validate_compiled_screen,
    validate_journey_plan,
    validate_narrative_sequence,
)
from agents.customer_story_architect import GROUNDING_FAILED_REASON, CustomerStoryArchitectAgent
from agents.journey_composer import JourneyComposerAgent, validate_plan_payload
from agents.narrative_sequencer import NarrativeSequencerAgent
from agents.coherence_guardian import CoherenceGuardianAgent
from agents.session_continuity import SessionContinuityAgent, deterministic_continuity_validation
from workflow.graph import build_quest_ui_graph


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------


def make_story(story_id="story-1", refs=("sig-1",), mode="CONTINUE_ACTIVE_GOAL"):
    return {
        "storyId": story_id,
        "storyTitle": "Milestone in reach",
        "oneSentenceStory": "You are one action away from your next milestone.",
        "customerSituation": "Active first-home goal at 60%.",
        "storyTension": "The next milestone remains incomplete.",
        "customerResolution": "Complete one linked-payment action this visit.",
        "primaryOutcome": "Advance the first-home goal by 5%",
        "secondaryOutcome": None,
        "narrativeMode": mode,
        "evidenceRefs": list(refs),
        "confidence": 0.85,
        "prohibitedDetours": ["Generic programme education"],
        "completionSignals": ["Goal progress increments"],
        "expiryAt": None,
    }


def make_story_hypotheses(refs=("sig-1",)):
    return {
        "hypotheses": [make_story("story-1", refs), make_story("story-2", refs)],
        "recommendedStoryId": "story-1",
        "rejectedStoryReasons": {"story-2": "weaker evidence"},
        "qualityGate": {"passed": True, "violations": []},
    }


def make_episode(mj_id="mj-1", order=1, transitions_to=None, resolution="UNDERSTANDING"):
    return {
        "miniJourneyId": mj_id,
        "order": order,
        "customerQuestion": f"Question {order}?",
        "entryCondition": "Screen open",
        "requiredInformation": ["points balance"],
        "allowedNarrativeRoles": ["ORIENTATION", "ACTION"],
        "requiredActionType": None,
        "resolutionType": resolution,
        "transitionsTo": transitions_to,
        "requiredEvidenceRefs": ["sig-1"],
        "optional": False,
    }


def make_journey_plan(episode_count=2):
    ids = [f"mj-{i+1}" for i in range(episode_count)]
    episodes = [
        make_episode(ids[i], i + 1, transitions_to=ids[i + 1] if i + 1 < len(ids) else None)
        for i in range(len(ids))
    ]
    return {
        "primaryJourneyId": "journey-1",
        "storyId": "story-1",
        "journeyObjective": "Advance the active goal",
        "entryPoint": "Rewards home",
        "completionDefinition": "Customer takes the recommended action",
        "primaryActionPolicy": "ONE_DOMINANT",
        "miniJourneys": episodes,
        "supportingSurfaces": [],
        "qualityGate": {"passed": True, "violations": []},
    }


def make_component(cid, ctype, priority):
    return {
        "id": cid,
        "type": ctype,
        "version": "1.0",
        "priority": priority,
        "props": {"layout": {"span": "half"}},
        "actions": [],
    }


def make_components():
    return [
        make_component("comp-points", "POINTS_BALANCE", 1),
        make_component("comp-progress", "GOAL_PROGRESS_CARD", 2),
        make_component("comp-action", "RECOMMENDED_ACTIONS", 3),
        make_component("comp-payoff", "FUTURE_VALUE_CARD", 4),
    ]


def make_narrative_sequence():
    return {
        "primaryActionComponentRef": "comp-action",
        "components": [
            {"componentRef": "comp-points", "miniJourneyId": "mj-1", "narrativeRole": "ORIENTATION", "sequence": 1, "dependsOn": [], "resolves": [], "optional": False},
            {"componentRef": "comp-progress", "miniJourneyId": "mj-1", "narrativeRole": "TENSION", "sequence": 2, "dependsOn": ["comp-points"], "resolves": [], "optional": False},
            {"componentRef": "comp-action", "miniJourneyId": "mj-2", "narrativeRole": "ACTION", "sequence": 3, "dependsOn": ["comp-progress"], "resolves": [], "optional": False},
            {"componentRef": "comp-payoff", "miniJourneyId": "mj-2", "narrativeRole": "PAYOFF", "sequence": 4, "dependsOn": [], "resolves": ["comp-action"], "optional": False},
        ],
        "transitions": [
            {"fromComponentRef": "comp-points", "toComponentRef": "comp-progress", "relationship": "situation-to-meaning", "bridgeIntent": "ground then gap", "bridgeCopy": None}
        ],
        "deferredComponents": [],
        "qualityGate": {"passed": True, "violations": []},
    }


PASSING_COHERENCE = {
    "storyClarity": 85,
    "journeyContinuity": 80,
    "miniJourneyCompleteness": 82,
    "transitionStrength": 75,
    "actionOutcomeContinuity": 84,
    "contentDistractionRisk": "Low",
    "primaryActionClarity": "PASS",
    "orphanComponents": [],
    "conflictingNarratives": [],
    "violations": [],
    "decision": "PASS",
    "reasonCode": None,
}


class FakeLLM:
    """Scripted LLM keyed by distinctive stage-prompt substrings."""

    compact_mode = False
    active_provider = "gemini"

    def __init__(self, script: dict):
        self.script = script
        self.calls: list[str] = []

    def invoke(self, messages):
        system = messages[0].content
        self.calls.append(system[:40])
        for marker, payload in self.script.items():
            if marker in system:
                return AIMessage(content=json.dumps(payload))
        raise AssertionError(f"No scripted response for prompt: {system[:120]!r}")


def stage_q_payload():
    return {
        "taskCharter": {
            "charterId": "charter-1",
            "realCustomerObjective": "Reach next milestone",
            "permittedBusinessObjective": "Engagement",
            "journey": "rewards-overview",
            "channel": "mobile",
            "successCriteria": ["one dominant action"],
            "availableEvidence": ["sig-1"],
            "prohibitedUses": ["no protected attributes"],
            "mandatoryComponents": ["POINTS_BALANCE"],
            "allowedPersonalizationScope": "rewards content",
            "latencyBudgetMs": 5000,
            "fallbackConditions": ["low confidence"],
            "primaryCustomerOutcome": "Advance first-home goal",
            "experienceMode": "NEW",
            "maxConcurrentPrimaryJourneys": 1,
            "primaryActionPolicy": "ONE_DOMINANT",
            "programmeEducationInterruptionPolicy": "ONLY_IF_CENTRAL",
            "continuityPermitted": False,
            "coherenceThresholdProfile": "default-v1",
        },
        "consentCheck": {"consentValid": True, "purposeValid": True, "permittedScope": "signals", "veto": False},
        "journeyAnalysis": {
            "identifiedJourney": "goal-progress",
            "currentIntent": "check progress",
            "intentConfidence": 0.9,
            "supportingEvidence": ["sig-1"],
            "journeyPhase": "evaluation",
        },
        "agentMessages": [{"fromAgent": "orchestrator", "messageType": "OBSERVATION", "summary": "framed"}],
    }


def stage_u_payload(refs=("sig-1",)):
    return {
        "customerContext": {
            "summary": "Goal-oriented saver",
            "observedFacts": [{"factId": "fact-1", "statement": "active goal", "source": "intel", "confidence": 0.9}],
            "declaredPreferences": [],
            "inferredProperties": [],
        },
        "rewardInteractionProfile": {
            "attributes": [{"attribute": "motivation", "value": "GOAL_PROGRESS", "confidence": 0.9, "evidenceRefs": ["sig-1"]}],
            "methodology": "intel-grounded",
            "temporaryInterpretation": True,
        },
        "accessibilityAnalysis": {
            "cognitiveLoadScore": 40,
            "recommendedMaxComponents": 8,
            "readabilityLevel": "basic",
            "navigationComplexity": "low",
        },
        "permittedSignals": [
            {"signalId": "sig-1", "classification": "OBSERVED", "value": "active goal", "source": "behavior", "confidence": 0.9, "allowedPurpose": "personalization"}
        ],
        "storyHypotheses": make_story_hypotheses(refs),
        "continuityState": {"available": False},
        "agentMessages": [{"fromAgent": "customer-story-architect", "messageType": "PROPOSAL", "summary": "stories framed"}],
    }


def stage_e_payload(assessment=None, approved=True):
    payload = {
        "candidateEvaluations": [
            {"candidateId": "candidate-1", "strategy": "story-first strategy", "scores": {}, "weightedTotal": 8.2, "hardGatesPass": True, "objections": []},
            {"candidateId": "candidate-2", "strategy": "alternative", "scores": {}, "weightedTotal": 7.4, "hardGatesPass": True, "objections": []},
        ],
        "approvedCustomerStory": make_story(),
        "journeyCandidates": [
            {"candidateId": "journey-candidate-1", "storyId": "story-1", "journeyObjective": "advance goal", "completionDefinition": "action taken", "episodeSketches": ["recognise progress", "take next step"], "primaryActionPolicy": "ONE_DOMINANT", "weightedTotal": 8.0, "hardGatesPass": True},
            {"candidateId": "journey-candidate-2", "storyId": "story-1", "journeyObjective": "alt", "completionDefinition": "x", "episodeSketches": ["a"], "primaryActionPolicy": "ONE_DOMINANT", "weightedTotal": 7.0, "hardGatesPass": True},
        ],
        "recommendedJourneyId": "journey-candidate-1",
        "riskAssessment": {"manipulationRisk": "LOW", "darkPatternRisk": "LOW", "discriminatoryRisk": "LOW", "vulnerabilityRisk": "LOW", "veto": False},
        "agentMessages": [{"fromAgent": "coherence-guardian", "messageType": "APPROVAL", "summary": "coherent"}],
    }
    if assessment is not None:
        payload["coherenceAssessment"] = assessment
    else:
        payload["coherenceAssessment"] = dict(PASSING_COHERENCE)
    if not approved:
        payload["approvedCustomerStory"] = {"storyId": "story-does-not-exist"}
    return payload


def stage_s_payload(sequence=None, plan=None, components=None, assessment=None):
    payload = {
        "experienceJourneyPlan": plan or make_journey_plan(2),
        "candidates": [{
            "candidateId": "candidate-1",
            "strategy": "journey-first mapping",
            "components": components or make_components(),
            "confidence": 0.9,
            "reasonCodes": ["APPROVED_STORY"],
        }],
        "narrativeSequence": sequence or make_narrative_sequence(),
        "continuityPlan": {
            "openingTreatment": "START",
            "permitted": True,
            "stateChangeSummary": None,
            "retiredComponents": [],
            "suppressionRules": [],
        },
        "constitutionCheck": {"status": "PASS", "anchoredComponentsIntact": True, "bankIdentityIntact": True, "violations": []},
        "selectedCandidateId": "candidate-1",
        "agentMessages": [{"fromAgent": "journey-composer", "messageType": "PROPOSAL", "summary": "plan"}],
    }
    payload["coherenceAssessment"] = assessment if assessment is not None else dict(PASSING_COHERENCE)
    return payload


def stage_t_payload():
    return {"finalSdui": {}, "fallbackSdui": {}, "validationResults": {}}


def stage_r_payload(decision="RELEASE"):
    return {
        "releaseDecision": decision,
        "challenges": [],
        "unresolvedCritical": 0,
        "unresolvedHigh": 0,
        "releaseReasons": ["coherent"],
        "agentMessages": [{"fromAgent": "red-team", "messageType": "APPROVAL", "summary": "clean"}],
    }


def happy_script(**overrides):
    script = {
        "working together in Stage Q": stage_q_payload(),
        "Stage U — UNDERSTAND": stage_u_payload(),
        "Stage E — EVALUATE": stage_e_payload(),
        "STRUCTURE AND SYNTHESISE": stage_s_payload(),
        "SDUI Compiler": stage_t_payload(),
        "(Stage R)": stage_r_payload(),
    }
    script.update(overrides)
    return script


def base_state(**extra):
    state = {
        "request_id": "req-1",
        "correlation_id": "corr-1",
        "customer_ref": "cust-1",
        "journey": "rewards-overview",
        "channel": "mobile",
        "locale": "en-US",
        "jurisdiction": "US",
        "latency_budget_ms": 5000,
        "consent_envelope": {"valid": True, "scope": ["rewards-personalization"]},
        "purpose_of_use": "rewards-personalization",
        "declared_preferences": {},
        "accessibility_preferences": {},
        "current_session_context": {},
        "intelligence_data": {"available": False},
        "card_rules": {},
        "stages_completed": [],
        "reason_codes": [],
        "candidate_compositions": [],
        "all_messages": [],
        "llm_transcript": [],
        "message_sequence": 0,
    }
    state.update(extra)
    return state


def run_graph(script, state):
    llm = FakeLLM(script)
    graph = build_quest_ui_graph(llm)
    result = asyncio.run(graph.ainvoke(state))
    return result, llm


# ---------------------------------------------------------------------------
# Schema contracts
# ---------------------------------------------------------------------------


def test_story_hypotheses_count_contract():
    # Zero hypotheses is structurally invalid.
    with pytest.raises(Exception):
        StoryHypotheses.model_validate({
            "hypotheses": [],
            "recommendedStoryId": "story-1",
        })
    model = StoryHypotheses.model_validate(make_story_hypotheses())
    assert model.recommended().storyId == "story-1"
    # A single hypothesis parses at the schema layer; the architect decides
    # whether it degrades gracefully (live-model robustness).
    single = StoryHypotheses.model_validate({
        "hypotheses": [make_story()],
        "recommendedStoryId": "story-1",
    })
    assert len(single.hypotheses) == 1


def test_customer_story_confidence_bounds():
    story = make_story()
    story["confidence"] = 1.5
    with pytest.raises(Exception):
        CustomerStory.model_validate(story)


def test_narrative_sequence_role_enum_enforced():
    seq = make_narrative_sequence()
    seq["components"][0]["narrativeRole"] = "NOT_A_ROLE"
    with pytest.raises(Exception):
        NarrativeSequence.model_validate(seq)


def test_mini_journey_cap_enforced():
    plan = make_journey_plan(MINI_JOURNEY_MAX + 1)
    with pytest.raises(Exception):
        ExperienceJourneyPlan.model_validate(plan)


def test_mini_journey_drops_invented_narrative_roles():
    """Live models invent role names ('SNAPSHOT'); advisory metadata must not
    fail the whole journey plan."""
    plan = make_journey_plan(2)
    plan["miniJourneys"][0]["allowedNarrativeRoles"] = ["ORIENTATION", "SNAPSHOT", "MADE_UP"]
    model = ExperienceJourneyPlan.model_validate(plan)
    assert [str(r) for r in model.miniJourneys[0].allowedNarrativeRoles] == ["NarrativeRole.ORIENTATION"]


# ---------------------------------------------------------------------------
# Deterministic coherence validator
# ---------------------------------------------------------------------------


def test_assert_unique_detects_duplicates():
    errors = []
    assert_unique(["a", "b", "a"], errors)
    assert errors and "a" in errors[0]


def test_validate_narrative_sequence_requires_dense_ordering():
    model = NarrativeSequence.model_validate({**make_narrative_sequence(), "components": [
        {**c, "sequence": s} for c, s in zip(make_narrative_sequence()["components"], [1, 2, 4, 5])
    ]})
    result = validate_narrative_sequence(model)
    assert not result.passed


def test_resolves_may_reference_episode_ids():
    """Live-model semantics: 'resolves' answers a customer question and may name
    the mini-journey whose question is answered (spec §6.3 ambiguity resolved)."""
    seq = make_narrative_sequence()
    seq["components"][1]["resolves"] = ["mj-1"]
    model = NarrativeSequence.model_validate(seq)
    plan = ExperienceJourneyPlan.model_validate(make_journey_plan(2))
    result = validate_narrative_sequence(model, plan, {"comp-points", "comp-progress", "comp-action", "comp-payoff"})
    assert result.passed, result.errors
    # Without the plan the episode id cannot be verified -> still an error.
    result_no_plan = validate_narrative_sequence(model, None, None)
    assert not result_no_plan.passed


def test_depends_on_must_be_component_refs_even_with_plan():
    seq = make_narrative_sequence()
    seq["components"][2]["dependsOn"] = ["mj-1"]
    model = NarrativeSequence.model_validate(seq)
    plan = ExperienceJourneyPlan.model_validate(make_journey_plan(2))
    result = validate_narrative_sequence(model, plan, None)
    assert not result.passed
    assert any("unresolved component reference: mj-1" in e for e in result.errors)


def test_sanitize_resolves_rewrites_question_text_to_episode_id():
    """Live models cite the mini-journey question text; rewrite to episode id."""
    from validators.coherence_validator import sanitize_narrative_sequence as sanitize_resolves

    plan = ExperienceJourneyPlan.model_validate(make_journey_plan(2))
    questions = [m.customerQuestion for m in plan.miniJourneys]
    seq = make_narrative_sequence()
    seq["components"][0]["resolves"] = [questions[0], "totally-unknown-ref", "comp-action"]
    model = NarrativeSequence.model_validate(seq)
    cleaned, notes = sanitize_resolves(model, plan)
    assert cleaned.components[0].resolves == ["mj-1", "comp-action"]
    assert any("rewrote resolves" in n for n in notes)
    assert any("dropped unresolvable" in n for n in notes)
    # dependsOn untouched by sanitization
    assert cleaned.components[1].dependsOn == ["comp-points"]
    # And the sanitized sequence passes full contract validation
    result = validate_narrative_sequence(cleaned, plan, None)
    assert result.passed, result.errors


def test_reconcile_compiled_order_honors_approved_sequence():
    """Mechanical compilation must not let priority numbers override the
    approved narrative order; card-rule insertions keep their neighbourhood."""
    from workflow.graph import _reconcile_compiled_order

    sequence = {"components": [
        {"componentRef": f"c{i}", "sequence": i + 1} for i in range(4)
    ]}
    # Compiled order has c1/c2 swapped by priority, plus a card-rule insertion
    # right after the anchor.
    compiled = [
        {"id": "c0", "priority": 3},
        {"id": "header-rule", "priority": 99},
        {"id": "c2", "priority": 1},
        {"id": "c1", "priority": 2},
        {"id": "c3", "priority": 4},
    ]
    out = _reconcile_compiled_order(compiled, sequence)
    ids = [c["id"] for c in out]
    assert ids[:4] == ["c0", "header-rule", "c1", "c2"], ids
    assert ids[-1] == "c3"


def test_reconcile_noop_without_sequence():
    from workflow.graph import _reconcile_compiled_order
    comps = [{"id": "b", "priority": 2}, {"id": "a", "priority": 1}]
    assert _reconcile_compiled_order(comps, {"components": []}) == comps


def test_invented_roles_repaired_in_raw_payload_before_parse():
    """Live failure dfa88579: model emitted 'SNAPSHOT' as narrativeRole; the
    enum rejected the whole sequence. Repair ladder must rescue it pre-parse."""
    from validators.coherence_validator import repair_roles_in_payload
    from agents.narrative_sequencer import NarrativeSequencerAgent

    seq = make_narrative_sequence()
    seq["components"][0]["narrativeRole"] = "SNAPSHOT"          # known synonym -> ORIENTATION
    seq["components"][1]["narrativeRole"] = "action"            # case-insensitive -> ACTION
    seq["components"][2]["narrativeRole"] = "TOTALLY_INVENTED"  # unmapped -> REFERENCE

    payload, notes = repair_roles_in_payload(seq)
    inner = payload
    assert inner["components"][0]["narrativeRole"] == "ORIENTATION"
    assert inner["components"][1]["narrativeRole"] == "ACTION"
    assert inner["components"][2]["narrativeRole"] == "REFERENCE"
    assert len(notes) == 3

    # Full agent path: previously-vetoing payload now parses and validates.
    plan_payload = make_journey_plan(2)
    s = NarrativeSequencerAgent(_NullLLM(), "x", "narrative-sequencer")
    model, error = s.validate_sequence(
        {"narrativeSequence": seq},
        {"selected_candidate": {"components": [{"id": c["componentRef"]} for c in seq["components"]]},
         "experience_journey_plan": plan_payload},
    )
    assert error is None or "primaryActionComponentRef" not in str(error)
    if model is not None:
        assert all(c.narrativeRole.value in {r.value for r in NarrativeRole} for c in model.components)


def test_repair_roles_leaves_valid_payload_untouched():
    from validators.coherence_validator import repair_roles_in_payload
    seq = make_narrative_sequence()
    before = json.dumps(seq)
    payload, notes = repair_roles_in_payload(json.loads(before))
    assert notes == []
    assert payload == json.loads(before)


def test_action_without_consequence_fails():
    seq = make_narrative_sequence()
    seq["components"] = [c for c in seq["components"] if c["componentRef"] != "comp-payoff"]
    model = NarrativeSequence.model_validate(seq)
    result = validate_narrative_sequence(
        model, None, {"comp-points", "comp-progress", "comp-action"}
    )
    assert not result.passed
    assert any("consequence" in e for e in result.errors)


def test_reference_cannot_be_primary_action():
    seq = make_narrative_sequence()
    seq["primaryActionComponentRef"] = "comp-points"
    for c in seq["components"]:
        if c["componentRef"] == "comp-points":
            c["narrativeRole"] = "REFERENCE"
    model = NarrativeSequence.model_validate(seq)
    result = validate_narrative_sequence(model)
    assert not result.passed


def test_deferred_components_must_leave_mainline():
    seq = make_narrative_sequence()
    seq["deferredComponents"] = [{
        "componentRef": "comp-payoff", "componentType": "FUTURE_VALUE_CARD",
        "reason": "not central", "reasonCode": "DEFER_NOT_CENTRAL", "alternativeSurface": None,
    }]
    model = NarrativeSequence.model_validate(seq)
    result = validate_narrative_sequence(model)
    assert not result.passed


def test_unknown_episode_reference_fails():
    plan = ExperienceJourneyPlan.model_validate(make_journey_plan(2))
    seq = make_narrative_sequence()
    seq["components"][1]["miniJourneyId"] = "mj-unknown"
    model = NarrativeSequence.model_validate(seq)
    result = validate_narrative_sequence(model, plan)
    assert not result.passed
    assert any("mj-unknown" in e for e in result.errors)


def test_compiled_screen_divergence_detected():
    seq_model = NarrativeSequence.model_validate(make_narrative_sequence())
    # Swap priorities so compiled order differs from approved order.
    screen = {
        "components": [
            make_component("comp-points", "POINTS_BALANCE", 1),
            make_component("comp-action", "RECOMMENDED_ACTIONS", 2),
            make_component("comp-progress", "GOAL_PROGRESS_CARD", 3),
            make_component("comp-payoff", "FUTURE_VALUE_CARD", 4),
        ]
    }
    result = validate_compiled_screen(screen, seq_model, ["mj-1", "mj-2"])
    assert not result.passed
    assert any("diverges" in e for e in result.errors)


def test_mandatory_insertion_does_not_break_approved_subsequence():
    seq_model = NarrativeSequence.model_validate(make_narrative_sequence())
    screen = {
        "components": [
            make_component("comp-points", "POINTS_BALANCE", 1),
            make_component("rule-inserted", "TANGIBLE_VALUE_CARD", 2),
            make_component("comp-progress", "GOAL_PROGRESS_CARD", 3),
            make_component("comp-action", "RECOMMENDED_ACTIONS", 4),
            make_component("comp-payoff", "FUTURE_VALUE_CARD", 5),
        ]
    }
    result = validate_compiled_screen(screen, seq_model, ["mj-1", "mj-2"])
    assert result.passed, result.errors


def test_anchor_violation_detected():
    errors = []
    assert_anchor_preserved([make_component("x", "GOAL_PROGRESS_CARD", 1)], "POINTS_BALANCE", errors)
    assert errors and "anchor" in errors[0]


def test_threshold_breach_vetoes_even_with_clean_structure():
    weak = {**PASSING_COHERENCE, "storyClarity": 50}
    decision, code = assess_coherence_metrics(ValidationResult(), weak, COHERENCE_THRESHOLDS)
    assert decision == "VETO" and code == "S.COHERENCE.VETO"


# ---------------------------------------------------------------------------
# Agent deterministic contracts
# ---------------------------------------------------------------------------

AGENT_STATE = lambda: base_state(
    permitted_evidence={"permittedSignals": [{"signalId": "sig-1"}], "availableEvidence": []},
    customer_context={"observedFacts": [{"factId": "fact-1"}]},
)


class _NullLLM:
    def invoke(self, messages):  # pragma: no cover - should never be hit
        raise AssertionError("LLM should not be called during deterministic validation")


def _architect():
    return CustomerStoryArchitectAgent(_NullLLM(), "Customer Story Architect", "customer-story-architect")


def test_architect_rejects_fully_ungrounded_stories():
    parsed = {"storyHypotheses": make_story_hypotheses(refs=("made-up-signal",))}
    model, error = _architect().validate_hypotheses(parsed, AGENT_STATE())
    assert error and "no grounded stories survive" in error


def test_architect_strips_unpermitted_refs_but_keeps_grounded_story():
    """Privacy scope stays strict; sloppy citations are stripped, not honoured."""
    hyps = make_story_hypotheses()
    hyps["hypotheses"][0]["evidenceRefs"] = ["made-up-signal", "sig-1"]
    model, error = _architect().validate_hypotheses({"storyHypotheses": hyps}, AGENT_STATE())
    assert error is None
    assert model.hypotheses[0].evidenceRefs == ["sig-1"]
    assert any("stripped unpermitted" in v for v in model.qualityGate.violations)


def test_architect_drops_story_without_permitted_refs_and_reassigns_recommendation():
    hyps = make_story_hypotheses()
    hyps["hypotheses"][0]["evidenceRefs"] = ["made-up-a"]
    hyps["hypotheses"][1]["evidenceRefs"] = ["sig-1"]
    hyps["recommendedStoryId"] = "story-1"
    model, error = _architect().validate_hypotheses({"storyHypotheses": hyps}, AGENT_STATE())
    assert error is None
    assert [h.storyId for h in model.hypotheses] == ["story-2"]
    assert model.recommendedStoryId == "story-2"


def test_architect_accepts_grounded_stories():
    parsed = {"storyHypotheses": make_story_hypotheses()}
    model, error = _architect().validate_hypotheses(parsed, AGENT_STATE())
    assert error is None
    assert model.recommendedStoryId == "story-1"


def test_architect_degrades_single_grounded_story():
    """Live-model robustness: one grounded story is accepted, flagged, not fatal."""
    single = make_story_hypotheses()
    single["hypotheses"] = [single["hypotheses"][0]]
    model, error = _architect().validate_hypotheses({"storyHypotheses": single}, AGENT_STATE())
    assert error is None
    assert len(model.hypotheses) == 1
    assert model.qualityGate.passed
    assert any("degraded" in v for v in model.qualityGate.violations)


def test_architect_flags_missing_completion_signals():
    bad = make_story_hypotheses()
    bad["hypotheses"][0]["completionSignals"] = []
    model, error = _architect().validate_hypotheses({"storyHypotheses": bad}, AGENT_STATE())
    assert error and "completionSignals" in error
    assert not model.qualityGate.passed


def test_grounding_failed_reason_code_constant():
    assert GROUNDING_FAILED_REASON == "U.STORY.GROUNDING.FAILED"


def test_composer_rejects_single_episode_plan():
    payload = {"experienceJourneyPlan": make_journey_plan(1)}
    model, error = validate_plan_payload(payload)
    assert error and "at least 2" in error


def test_composer_rejects_heading_only_plans():
    plan = make_journey_plan(2)
    plan["miniJourneys"][0]["customerQuestion"] = ""
    payload = {"experienceJourneyPlan": plan}
    model, error = validate_plan_payload(payload)
    assert error and "customer question" in error


def test_sequencer_defers_unresolved_references():
    agent = NarrativeSequencerAgent(_NullLLM(), "Narrative Sequencer", "narrative-sequencer")
    seq = make_narrative_sequence()
    seq["components"][1]["dependsOn"] = ["ghost-component"]
    state = AGENT_STATE()
    state["selected_candidate"] = {"components": make_components()}
    model, error = agent.validate_sequence({"narrativeSequence": seq}, state)
    assert error and "ghost-component" in error


def test_guardian_maps_decision_to_message_type():
    class ScriptedLLM:
        def invoke(self, messages):
            return AIMessage(content=json.dumps({"coherenceAssessment": dict(PASSING_COHERENCE)}))

    agent = CoherenceGuardianAgent(ScriptedLLM(), "Coherence Guardian", "coherence-guardian")
    state = AGENT_STATE()
    state["current_stage"] = "S"
    state["approved_customer_story"] = make_story()
    state["coherence_structural_errors"] = {"S": ["anchor violated"]}
    updates = agent.invoke(state)
    last_msg = updates["all_messages"][0]
    assert last_msg["messageType"] == "VETO"
    assert updates["coherence_assessment"]["decision"] == "VETO"


def test_continuity_prevents_repeated_celebration_and_dismissed_repeats():
    final_sdui = {"components": [
        make_component("celebrate-1", "GOAL_COMPLETE_CELEBRATION", 2),
        make_component("dismissed-card", "STREAK_CARD", 3),
    ]}
    continuity_state = {
        "available": True,
        "completedComponentRefs": ["celebrate-1"],
        "dismissedComponentRefs": ["dismissed-card"],
    }
    verdict = deterministic_continuity_validation(final_sdui, continuity_state, None)
    assert verdict["decision"] == "HOLD"
    assert verdict["reasonCode"] == "R.CONTINUITY.HOLD"
    assert "celebrate-1" in verdict["repeatedCelebrations"]
    assert "dismissed-card" in verdict["dismissedRepeats"]


def test_continuity_unavailable_is_safe_not_negative():
    verdict = deterministic_continuity_validation({"components": []}, None, None)
    assert verdict["decision"] == "UNAVAILABLE"
    assert verdict["passed"] is True
    assert verdict["reasonCode"] == "R.CONTINUITY.UNAVAILABLE"


def test_continuity_ttl_bounded_by_policy():
    agent = SessionContinuityAgent(_NullLLM(), "Session Continuity", "session-continuity")
    payload = {"continuityState": {"available": True}}
    model, error = agent.build_continuity_state(payload)
    assert error is None and model.available
    assert model.expiresAt > model.observedAt


# ---------------------------------------------------------------------------
# Graph integration & routing
# ---------------------------------------------------------------------------


def test_happy_path_returns_personalized_with_narrative_artefacts():
    result, llm = run_graph(happy_script(), base_state())
    assert result["stages_completed"] == ["Q", "U", "E", "S", "T", "R"]
    assert not result.get("fallback_triggered")
    assert result["story_hypotheses"]["recommendedStoryId"] == "story-1"
    assert result["approved_customer_story"]["storyId"] == "story-1"
    assert result["experience_journey_plan"]["primaryJourneyId"] == "journey-1"
    assert result["narrative_sequence"]["primaryActionComponentRef"] == "comp-action"
    sdui = result["final_sdui"]
    assert sdui["experienceNarrative"]["storyId"] == "story-1"
    assert sdui["experienceNarrative"]["entryMode"] == "START"
    by_id = {c["id"]: c for c in sdui["components"]}
    assert by_id["comp-action"]["narrative"]["role"] == "ACTION"
    assert by_id["comp-points"]["narrative"]["role"] == "ORIENTATION"
    # Continuity unavailable → safe continuation reason code, no fallback.
    assert "R.CONTINUITY.UNAVAILABLE" in result["reason_codes"]
    assert result["post_compile_coherence"]["decision"] == "RELEASE"


def test_stage_u_grounding_failure_routes_to_fallback():
    script = happy_script(**{
        "Stage U — UNDERSTAND": stage_u_payload(refs=("ungrounded-signal",)),
    })
    result, _ = run_graph(script, base_state())
    assert result["fallback_triggered"] is True
    assert GROUNDING_FAILED_REASON in result["reason_codes"]
    assert "U" in result["stages_completed"] and "E" not in result["stages_completed"]


def test_stage_e_coherence_veto_routes_to_fallback():
    veto = {**PASSING_COHERENCE, "decision": "VETO", "reasonCode": None,
            "conflictingNarratives": ["two mainlines"]}
    script = happy_script(**{"Stage E — EVALUATE": stage_e_payload(assessment=veto)})
    result, _ = run_graph(script, base_state())
    assert result["fallback_triggered"] is True
    assert "E.COHERENCE.VETO" in result["reason_codes"]


def test_stage_e_story_selection_failure_routes_to_fallback():
    script = happy_script(**{"Stage E — EVALUATE": stage_e_payload(approved=False)})
    result, _ = run_graph(script, base_state())
    assert result["fallback_triggered"] is True
    assert "E.STORY_SELECTION.FAILED" in result["reason_codes"]


def test_stage_s_invalid_journey_plan_routes_to_fallback():
    script = happy_script(**{
        "STRUCTURE AND SYNTHESISE": stage_s_payload(plan=make_journey_plan(1)),
    })
    result, _ = run_graph(script, base_state())
    assert result["fallback_triggered"] is True
    assert "S.JOURNEY_PLAN.INVALID" in result["reason_codes"]


def test_stage_s_invalid_sequence_routes_to_fallback():
    seq = make_narrative_sequence()
    seq["components"][3]["narrativeRole"] = "REFERENCE"  # ACTION loses its consequence
    script = happy_script(**{"STRUCTURE AND SYNTHESISE": stage_s_payload(sequence=seq)})
    result, _ = run_graph(script, base_state())
    assert result["fallback_triggered"] is True
    assert "S.COHERENCE.VETO" in result["reason_codes"]


def test_card_rule_keeps_already_placed_stack_card_in_approved_position():
    rules = {
        "matched_rules": ["mandatory-stack"],
        "ordered_stack": ["TANGIBLE_VALUE_CARD"],
        "suppressions": {},
        "banned_types": [],
        "sanitize_technical_language": False,
        "preview_mode": False,
        "guaranteed_baseline": False,
        "tone": "CONCISE",
        "relevance_boosts": {},
    }
    # Spec §12.2 reconciliation: a mandated type already present in the approved
    # mainline STAYS at its approved position — enforcement must not fragment
    # the story by pulling it to the stack block.
    components = make_components() + [make_component("comp-tangible", "TANGIBLE_VALUE_CARD", 5)]
    seq = make_narrative_sequence()
    seq["components"].append({
        "componentRef": "comp-tangible", "miniJourneyId": "mj-2", "narrativeRole": "REFERENCE",
        "sequence": 5, "dependsOn": [], "resolves": [], "optional": True,
    })
    script = happy_script(**{
        "STRUCTURE AND SYNTHESISE": stage_s_payload(components=components, sequence=seq),
    })
    result, _ = run_graph(script, base_state(card_rules=rules))
    assert "R" in result["stages_completed"]
    assert not result.get("fallback_triggered")
    served_ids = [c["id"] for c in result["final_sdui"]["components"]]
    assert served_ids.index("comp-points") < served_ids.index("comp-tangible")
    # Approved relative order fully preserved.
    approved_refs = [c["componentRef"] for c in seq["components"]]
    assert [i for i in served_ids if i in approved_refs] == approved_refs


def test_card_rule_stack_honored_in_plan_releases_cleanly():
    rules = {
        "matched_rules": ["mandatory-stack"],
        "ordered_stack": ["TANGIBLE_VALUE_CARD"],
        "suppressions": {},
        "banned_types": [],
        "sanitize_technical_language": False,
        "preview_mode": False,
        "guaranteed_baseline": False,
        "tone": "CONCISE",
        "relevance_boosts": {},
    }
    # Planner honours directives: stack card sits right after the anchor.
    components = [
        make_component("comp-points", "POINTS_BALANCE", 1),
        make_component("comp-tangible", "TANGIBLE_VALUE_CARD", 2),
        make_component("comp-progress", "GOAL_PROGRESS_CARD", 3),
        make_component("comp-action", "RECOMMENDED_ACTIONS", 4),
        make_component("comp-payoff", "FUTURE_VALUE_CARD", 5),
    ]
    seq = make_narrative_sequence()
    seq["components"].insert(1, {
        "componentRef": "comp-tangible", "miniJourneyId": "mj-1", "narrativeRole": "REFERENCE",
        "sequence": 2, "dependsOn": [], "resolves": [], "optional": True,
    })
    for i, c in enumerate(seq["components"][2:], start=3):
        c["sequence"] = i
    script = happy_script(**{"STRUCTURE AND SYNTHESISE": stage_s_payload(components=components, sequence=seq)})
    result, _ = run_graph(script, base_state(card_rules=rules))
    assert not result.get("fallback_triggered")
    types = [c["type"] for c in result["final_sdui"]["components"]]
    assert types.index("POINTS_BALANCE") < types.index("TANGIBLE_VALUE_CARD") < types.index("GOAL_PROGRESS_CARD")
    inserted = next(c for c in result["final_sdui"]["components"] if c["id"] == "comp-tangible")
    assert inserted["narrative"]["role"] == "REFERENCE"
    assert result["post_compile_coherence"]["decision"] == "RELEASE"


def test_old_renderer_ignores_optional_narrative_metadata():
    from schemas.sdui import SDUIComponent, SDUIScreen

    result, _ = run_graph(happy_script(), base_state())
    raw = result["final_sdui"]

    component = SDUIComponent.model_validate(raw["components"][0])
    assert component.narrative is not None  # present but optional

    legacy = {k: v for k, v in raw.items() if k != "experienceNarrative"}
    legacy["experienceId"] = legacy.pop("decisionId", "exp-1")
    legacy["customerId"] = "cust-1"
    legacy["persona"] = "PERSONALIZED"
    legacy_components = []
    for c in legacy["components"]:
        stripped = {k: v for k, v in c.items() if k != "narrative"}
        legacy_components.append(stripped)
    legacy["components"] = legacy_components
    screen = SDUIScreen.model_validate(legacy)
    assert screen.experience_narrative is None
    assert all(c.narrative is None for c in screen.components)


def test_explainability_writer_persists_new_artefacts(tmp_path):
    from explainability.writer import ExplainabilityWriter

    result, _ = run_graph(happy_script(), base_state())
    writer = ExplainabilityWriter(base_path=str(tmp_path))
    record_dir = writer.write_record("corr-narr", {"requestId": "r"}, result)
    files = set(os.listdir(record_dir))
    expected = {
        "story_hypotheses.json",
        "approved_customer_story.json",
        "journey_candidates.json",
        "experience_journey_plan.json",
        "narrative_sequence.json",
        "continuity_state.json",
        "continuity_plan.json",
        "coherence_assessment.json",
        "post_compile_coherence.json",
        "validation_result.json",
    }
    assert expected <= files
    with open(os.path.join(record_dir, "manifest.json")) as f:
        manifest = json.load(f)
    for name in expected:
        assert name in manifest["files"]
