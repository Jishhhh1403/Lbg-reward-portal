import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest

from catalog.component_catalog import (
    COMPONENT_CATALOG,
    PERSONA_COMPOSITION_GUIDES,
    get_persona_guide,
    render_catalog_for_prompt,
    render_persona_guides_for_prompt,
)
from validators.sdui_validator import VALID_COMPONENT_TYPES
from workflow.graph import _parse_json, _normalize_component, _build_sdui_envelope
from explainability.writer import ExplainabilityWriter


# ---------- Component Catalog ----------


def test_catalog_types_are_validator_registered():
    # Catalog is the agent-facing source of truth; validator may allow extra
    # generic/legacy types, but every catalog type must be renderable.
    assert set(COMPONENT_CATALOG.keys()) <= VALID_COMPONENT_TYPES


def test_every_catalog_entry_has_required_fields():
    for comp_type, spec in COMPONENT_CATALOG.items():
        assert spec.get("description"), f"{comp_type} missing description"
        assert isinstance(spec.get("props"), dict) and spec["props"], f"{comp_type} missing props"
        assert spec.get("personaAffinity"), f"{comp_type} missing personaAffinity"


def test_all_personas_have_guides():
    expected = {
        "INSTANT_GRATIFICATION",
        "GOAL_ORIENTED_SAVER",
        "LONG_TERM_PLANNER",
        "CHURN_RISK",
        "GAMIFICATION_MOTIVATED",
        "MIXED_PROFILE",
        "PLANNER_AT_RISK_MIX",
        "INSTANT_AT_RISK_MIX",
    }
    assert set(PERSONA_COMPOSITION_GUIDES.keys()) == expected


def test_persona_guide_structure():
    for persona, guide in PERSONA_COMPOSITION_GUIDES.items():
        assert guide.get("strategy"), f"{persona} missing strategy"
        for section in ("primary", "secondary", "supporting"):
            assert guide.get(section), f"{persona} missing {section}"
            for comp in guide[section]:
                assert comp in COMPONENT_CATALOG, f"{persona}.{section} references unregistered {comp}"


def test_unknown_persona_falls_back_to_default():
    guide = get_persona_guide("SOMETHING_ELSE")
    assert guide == PERSONA_COMPOSITION_GUIDES["GOAL_ORIENTED_SAVER"]


def test_render_catalog_for_prompt_lists_all_components():
    text = render_catalog_for_prompt()
    for comp_type in COMPONENT_CATALOG:
        assert comp_type in text


def test_render_persona_guides_for_prompt_lists_all_personas():
    text = render_persona_guides_for_prompt()
    for persona in PERSONA_COMPOSITION_GUIDES:
        assert persona in text


# ---------- Workflow graph helpers ----------


def test_parse_json_valid():
    assert _parse_json('{"a": 1}') == {"a": 1}


def test_parse_json_wrapped_in_markdown_fence():
    text = 'Here you go:\n```json\n{"a": {"b": 2}}\n```\nDone.'
    assert _parse_json(text) == {"a": {"b": 2}}


def test_parse_json_garbage_returns_raw_response():
    parsed = _parse_json("total nonsense")
    assert parsed == {"raw_response": "total nonsense"}


def test_normalize_component_fills_defaults():
    normalized = _normalize_component({"type": "STREAK_CARD"}, 3)
    assert normalized["id"].startswith("streak_card-")
    assert normalized["version"] == "1.0"
    assert normalized["priority"] == 4
    assert normalized["props"] == {}
    assert normalized["actions"] == []


def test_normalize_component_preserves_values_and_fixes_actions():
    component = {
        "id": "fixed-id",
        "type": "LEADERBOARD",
        "priority": 2,
        "props": {"userRank": 3},
        "actions": "not-a-list",
    }
    normalized = _normalize_component(component, 0)
    assert normalized["id"] == "fixed-id"
    assert normalized["priority"] == 2
    assert normalized["actions"] == []


def test_build_sdui_envelope_sorts_by_priority():
    state = {"correlation_id": "abc123", "customer_ref": "customer_001"}
    components = [
        {"id": "b", "type": "STREAK_CARD", "priority": 2, "props": {}, "actions": []},
        {"id": "a", "type": "POINTS_BALANCE", "priority": 1, "props": {}, "actions": []},
    ]
    envelope = _build_sdui_envelope(state, components)
    assert envelope["correlationId"] == "abc123"
    assert envelope["decisionId"] == "decision-abc123"
    assert [c["id"] for c in envelope["components"]] == ["a", "b"]
    assert envelope["schemaVersion"] == "1.0"
    assert envelope["metadata"]["componentRegistryVersion"] == "1.0"


# ---------- Explainability writer ----------


@pytest.fixture
def sample_state():
    return {
        "permitted_evidence": {"consentValid": True},
        "customer_context": {"summary": "factual summary"},
        "all_messages": [
            {
                "messageId": "m1",
                "sequence": 1,
                "stage": "Q",
                "fromAgent": "consent-guardian",
                "messageType": "APPROVAL",
                "summary": "consent ok",
                "timestamp": "2026-08-21T06:00:00+00:00",
            },
            {
                "messageId": "m2",
                "sequence": 2,
                "stage": "R",
                "fromAgent": "red-team",
                "messageType": "VETO",
                "summary": "dark pattern",
                "objections": ["fake scarcity"],
                "timestamp": "2026-08-21T06:05:00+00:00",
            },
        ],
        "llm_transcript": [
            {
                "turnId": "turn-1",
                "stage": "Q",
                "stageName": "QUESTION",
                "participatingAgents": ["orchestrator"],
                "model": "gemini-3.5-flash-lite",
                "conversation": [
                    {"role": "user", "content": "input"},
                    {"role": "assistant", "content": "output"},
                ],
                "extractedAgentMessages": [{"fromAgent": "orchestrator", "summary": "framed"}],
            }
        ],
        "evaluations": {"candidateEvaluations": [{"candidateId": "candidate-1"}]},
        "candidate_compositions": [],
        "ui_decision_plan": {"planId": "plan-x"},
        "selected_candidate": {"candidateId": "candidate-1"},
        "reward_interaction_profile": {"attributes": []},
        "final_sdui": {"components": []},
        "fallback_sdui": {"components": []},
        "compiled_sdui": {"validationResults": {"schemaValid": True}},
        "release_check": {"releaseDecision": "RELEASE"},
        "stages_completed": ["Q", "U", "E", "S", "T", "R"],
        "fallback_triggered": False,
        "reason_codes": [],
    }


def test_write_record_creates_complete_audit_bundle(tmp_path, sample_state):
    writer = ExplainabilityWriter(base_path=str(tmp_path))
    record_dir = writer.write_record("testcorr", {"requestId": "r1", "customerReference": "c1"}, sample_state)

    expected_files = {
        "manifest.json",
        "request-snapshot.json",
        "permitted-evidence.json",
        "agent-conversation.json",
        "agent-ai-conversation.json",
        "candidate-evaluations.json",
        "policy-decisions.json",
        "ui-decision-plan.json",
        "final-sdui.json",
        "fallback-sdui.json",
        "validation-results.json",
        "audit-summary.json",
    }
    actual_files = {f.name for f in tmp_path.rglob("*.json")}
    assert expected_files <= actual_files

    manifest = json.loads(record_dir and open(os.path.join(record_dir, "manifest.json")).read())
    assert manifest["correlationId"] == "testcorr"
    assert manifest["retentionClassification"] == "OPERATIONAL"
    assert len(manifest["files"]) == 12  # every artifact except the manifest itself (incl. narrative validation_result.json)
    assert manifest["recordIntegrityHash"]


def test_policy_decisions_extraction(tmp_path, sample_state):
    writer = ExplainabilityWriter(base_path=str(tmp_path))
    decisions = writer._extract_policy_decisions(sample_state["all_messages"])
    assert decisions["totalApprovals"] == 1
    assert decisions["totalVetoes"] == 1
    assert decisions["vetoes"][0]["agent"] == "red-team"
    assert decisions["vetoes"][0]["objections"] == ["fake scarcity"]


def test_participation_and_breakdown(tmp_path, sample_state):
    writer = ExplainabilityWriter(base_path=str(tmp_path))
    participation = writer._compute_participation(sample_state["all_messages"])
    assert participation["consent-guardian"]["messageCount"] == 1
    assert "Q" in participation["consent-guardian"]["stages"]

    breakdown = writer._message_type_breakdown(sample_state["all_messages"])
    assert breakdown == {"APPROVAL": 1, "VETO": 1}


def test_agent_perspectives_group_transcript(tmp_path, sample_state):
    writer = ExplainabilityWriter(base_path=str(tmp_path))
    perspectives = writer._build_agent_perspectives(sample_state["llm_transcript"])
    assert "orchestrator" in perspectives
    turn = perspectives["orchestrator"][0]
    assert turn["receivedInput"] == "input"
    assert turn["aiResponse"] == "output"
    assert turn["utterances"][0]["fromAgent"] == "orchestrator"
