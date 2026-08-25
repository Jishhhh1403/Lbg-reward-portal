import os
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from collections import defaultdict


class ExplainabilityWriter:
    """Writes per-customer explainability records to the explainability folder.

    Full audit mode: writes the final SDUI, narrative artefacts, original
    audit bundle, and a compact manifest for each correlation.
    """

    def __init__(self, base_path: str = None):
        if base_path is None:
            base_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "explainability",
            )
        self.base_path = Path(base_path)

    def _hash_content(self, content: str) -> str:
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def _write_json(self, path: Path, data: dict):
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(data, f, indent=2, default=str)

    # ------------------------------------------------------------------
    # Explainability helper methods
    # ------------------------------------------------------------------

    def _extract_policy_decisions(self, messages: list) -> dict:
        approvals = [m for m in messages if m.get("messageType") == "APPROVAL"]
        vetoes = [m for m in messages if m.get("messageType") == "VETO"]
        return {
            "totalApprovals": len(approvals),
            "totalVetoes": len(vetoes),
            "vetoes": [
                {
                    "agent": m.get("fromAgent", "unknown"),
                    "objections": m.get("objections", []),
                    "summary": m.get("summary", ""),
                }
                for m in vetoes
            ],
        }

    def _compute_participation(self, messages: list) -> dict:
        participation: dict = defaultdict(lambda: {"messageCount": 0, "stages": set()})
        for m in messages:
            agent = m.get("fromAgent", "unknown")
            participation[agent]["messageCount"] += 1
            if m.get("stage"):
                participation[agent]["stages"].add(m["stage"])
        return {
            k: {"messageCount": v["messageCount"], "stages": sorted(v["stages"])}
            for k, v in participation.items()
        }

    def _message_type_breakdown(self, messages: list) -> dict:
        breakdown: dict = defaultdict(int)
        for m in messages:
            breakdown[m.get("messageType", "UNKNOWN")] += 1
        return dict(breakdown)

    def _build_agent_perspectives(self, transcript: list) -> dict:
        perspectives: dict = defaultdict(list)
        for turn in transcript:
            agents = turn.get("participatingAgents", [])
            conversation = turn.get("conversation", [])
            utterances = turn.get("extractedAgentMessages", [])
            ai_response = next(
                (c["content"] for c in conversation if c.get("role") == "assistant"), ""
            )
            received_input = next(
                (c["content"] for c in conversation if c.get("role") == "user"), ""
            )
            for agent in agents:
                perspectives[agent].append({
                    "turnId": turn.get("turnId", ""),
                    "stage": turn.get("stage", ""),
                    "model": turn.get("model", ""),
                    "receivedInput": received_input,
                    "aiResponse": ai_response,
                    "utterances": utterances,
                })
        return dict(perspectives)

    def write_record(self, correlation_id: str, request: dict, state: dict) -> str:
        now = datetime.now(timezone.utc)
        date_path = f"{now.strftime('%Y')}/{now.strftime('%m')}/{now.strftime('%d')}"
        record_dir = self.base_path / date_path / correlation_id

        # 1) Final SDUI — the primary deliverable.
        final_sdui = state.get("final_sdui") or state.get("compiled_sdui", {}).get("finalSdui", {})
        self._write_json(record_dir / "final-sdui.json", final_sdui)
        final_sdui_hash = self._hash_content(json.dumps(final_sdui, default=str))

        # 2) Fallback SDUI.
        fallback_sdui = state.get("fallback_sdui", {})
        self._write_json(record_dir / "fallback-sdui.json", fallback_sdui)

        # 3) Request snapshot.
        self._write_json(record_dir / "request-snapshot.json", request)

        # 4) Permitted evidence.
        self._write_json(record_dir / "permitted-evidence.json", state.get("permitted_evidence", {}))

        # 5) Agent conversation + AI conversation.
        all_messages = state.get("all_messages", [])
        self._write_json(record_dir / "agent-conversation.json", all_messages)
        self._write_json(record_dir / "agent-ai-conversation.json", state.get("llm_transcript", []))

        # 6) Candidate evaluations.
        evaluations = state.get("evaluations", {})
        self._write_json(record_dir / "candidate-evaluations.json", evaluations)

        # 7) Policy decisions.
        policy_decisions = self._extract_policy_decisions(all_messages)
        self._write_json(record_dir / "policy-decisions.json", policy_decisions)

        # 8) UI decision plan.
        ui_decision_plan = state.get("ui_decision_plan", {})
        self._write_json(record_dir / "ui-decision-plan.json", ui_decision_plan)

        # 9) Validation results.
        validation = state.get("compiled_sdui", {}).get("validationResults", {})
        self._write_json(record_dir / "validation-results.json", validation)

        # 10) Narrative artefacts.
        narrative_artefacts = {
            "story_hypotheses.json": state.get("story_hypotheses"),
            "approved_customer_story.json": state.get("approved_customer_story"),
            "journey_candidates.json": state.get("journey_candidates"),
            "experience_journey_plan.json": state.get("experience_journey_plan"),
            "narrative_sequence.json": state.get("narrative_sequence"),
            "continuity_state.json": state.get("continuity_state"),
            "continuity_plan.json": state.get("continuity_plan"),
            "coherence_assessment.json": state.get("coherence_assessment"),
            "post_compile_coherence.json": state.get("post_compile_coherence"),
            "validation_result.json": validation or None,
        }
        for filename, payload in narrative_artefacts.items():
            if payload is not None:
                self._write_json(record_dir / filename, payload)

        # 11) Audit summary.
        audit_summary = {
            "participation": self._compute_participation(all_messages),
            "messageTypeBreakdown": self._message_type_breakdown(all_messages),
            "agentPerspectives": self._build_agent_perspectives(state.get("llm_transcript", [])),
        }
        self._write_json(record_dir / "audit-summary.json", audit_summary)

        # 12) Compact manifest.
        fallback_triggered = state.get("fallback_triggered", False)
        stages = state.get("stages_completed", [])
        reason_codes = state.get("reason_codes", [])

        all_files = sorted({f.name for f in record_dir.iterdir() if f.is_file()})

        manifest = {
            "correlationId": correlation_id,
            "decisionId": final_sdui.get("decisionId", f"decision-{correlation_id}"),
            "createdAt": now.isoformat(),
            "completedAt": now.isoformat(),
            "customerReference": request.get("customerReference", ""),
            "journey": request.get("journey", ""),
            "channel": request.get("channel", ""),
            "stagesCompleted": stages,
            "fallbackTriggered": fallback_triggered,
            "reasonCodes": reason_codes,
            "validationResults": validation,
            "finalSduiHash": final_sdui_hash,
            "files": [f for f in all_files if f != "manifest.json"],
            "retentionClassification": "OPERATIONAL",
        }
        manifest["recordIntegrityHash"] = self._hash_content(json.dumps(manifest, default=str))
        self._write_json(record_dir / "manifest.json", manifest)

        return str(record_dir)
