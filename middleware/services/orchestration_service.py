import json
import asyncio
from datetime import datetime, timezone, timedelta

from schemas.request_response import FinalResponse, ValidationSummary, StatusEnum
from workflow.graph import build_quest_ui_graph
from explainability.writer import ExplainabilityWriter
from services.intelligence_client import IntelligenceClient
from services.card_rule_engine import evaluate_rules

from services.llm_router import build_failover_llm
from services.sdui_cache import SDUICache


class OrchestrationService:
    def __init__(self, gemini_api_keys: list[str] | None = None, groq_api_key: str = "", groq_model: str = ""):
        self.llm = build_failover_llm(
            gemini_api_keys=gemini_api_keys or [],
            groq_api_key=groq_api_key,
            groq_model=groq_model,
        )
        self.graph = build_quest_ui_graph(self.llm)
        self.explainability_writer = ExplainabilityWriter()
        self.intelligence_client = IntelligenceClient()
        self.cache = SDUICache(ttl_seconds=3600)

    async def generate_sdui(self, request: dict) -> dict:
        correlation_id = request.get("correlationId", "unknown")
        request_id = request.get("requestId", "unknown")
        customer_id = request.get("customerReference", "")

        cached = self.cache.get(customer_id)
        if cached is not None:
            print(f"[CACHE HIT] customer={customer_id} — returning cached SDUI")
            return cached
        print(f"[CACHE MISS] customer={customer_id} — running full pipeline")

        intelligence_data = await self.intelligence_client.get_customer_intelligence(
            request.get("customerReference", "")
        )

        card_rules = evaluate_rules(intelligence_data)
        if card_rules.active:
            print(f"[CARD RULES] Matched: {', '.join(card_rules.matched_rules)} ({len(card_rules.ordered_stack)} mandatory stack cards)")

        initial_state = {
            "request_id": request_id,
            "correlation_id": correlation_id,
            "customer_ref": request.get("customerReference", ""),
            "journey": request.get("journey", "rewards-overview"),
            "channel": request.get("channel", "mobile"),
            "locale": request.get("locale", "en-US"),
            "jurisdiction": request.get("jurisdiction", "US"),
            "latency_budget_ms": request.get("latencyBudgetMs", 5000),
            "consent_envelope": request.get("consentEnvelope", {"valid": True, "scope": ["rewards-personalization"]}),
            "purpose_of_use": request.get("purposeOfUse", "rewards-personalization"),
            "declared_preferences": request.get("declaredPreferences", {}),
            "accessibility_preferences": request.get("accessibilityPreferences", {}),
            "current_session_context": request.get("currentSessionContext", {}),
            "intelligence_data": intelligence_data,
            "card_rules": {
                "matched_rules": card_rules.matched_rules,
                "ordered_stack": card_rules.ordered_stack,
                "suppressions": card_rules.suppressions,
                "banned_types": sorted(card_rules.banned_types),
                "sanitize_technical_language": card_rules.sanitize_technical_language,
                "preview_mode": card_rules.preview_mode,
                "guaranteed_baseline": card_rules.guaranteed_baseline,
                "tone": card_rules.tone,
                "relevance_boosts": card_rules.relevance_boosts,
            },
            "stages_completed": [],
            "reason_codes": [],
            "candidate_compositions": [],
            "all_messages": [],
            "llm_transcript": [],
            "message_sequence": 0,
        }

        max_retries = 3
        result = None
        for attempt in range(max_retries):
            try:
                result = await self.graph.ainvoke(initial_state)
                break
            except Exception as e:
                error_str = str(e)
                print(f"[GRAPH ERROR] attempt {attempt + 1}: {type(e).__name__}: {error_str[:300]}")
                if "429" in error_str or "quota" in error_str.lower() or "rate" in error_str.lower():
                    wait = 35 * (attempt + 1)
                    print(f"[RETRY] Rate limited, waiting {wait}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait)
                    continue
                result = {**initial_state, "fallback_triggered": True, "stage_failure": error_str}
                break

        if result is None:
            result = {**initial_state, "fallback_triggered": True, "stage_failure": "All retries exhausted"}

        if self.llm.active_provider == "groq":
            result["reason_codes"] = list(result.get("reason_codes", [])) + ["GEMINI_QUOTA_GROQ_FAILOVER"]

        final_sdui = result.get("final_sdui") or result.get("fallback_sdui") or {}
        fallback_triggered = result.get("fallback_triggered", False)

        if fallback_triggered:
            final_sdui = result.get("fallback_sdui", {
                "schemaVersion": "1.0",
                "decisionId": f"fallback-{correlation_id}",
                "correlationId": correlation_id,
                "components": [
                    {
                        "id": "points-balance-default",
                        "type": "POINTS_BALANCE",
                        "version": "1.0",
                        "priority": 1,
                        "props": {"points": 0, "tier": "Standard", "name": "Member"},
                        "actions": [],
                    }
                ],
            })

        validation_summary = self._build_validation_summary(result)

        now = datetime.now(timezone.utc)
        expires_at = (now + timedelta(hours=1)).isoformat()

        response = FinalResponse(
            status=StatusEnum.FALLBACK if fallback_triggered else StatusEnum.PERSONALIZED,
            correlationId=correlation_id,
            decisionId=final_sdui.get("decisionId", f"decision-{correlation_id}"),
            sdui=final_sdui,
            fallbackApplied=fallback_triggered,
            reasonCodes=result.get("reason_codes", []),
            confidence=result.get("selected_candidate", {}).get("confidence", 0.0),
            expiresAt=expires_at,
            validationSummary=validation_summary,
        )

        try:
            record_path = self.explainability_writer.write_record(correlation_id, request, result)
            response.explainabilityRecordRef = record_path
        except Exception:
            response.explainabilityRecordRef = "write-failed"

        response_dict = response.model_dump()
        response_dict["intelligence"] = intelligence_data

        self.cache.set(customer_id, response_dict)
        print(f"[CACHE STORE] customer={customer_id} — cached for 1 hour")

        return response_dict

    def _build_validation_summary(self, state: dict) -> ValidationSummary:
        compiled = state.get("compiled_sdui", {})
        validation = compiled.get("validationResults", {})
        release_check = state.get("release_check", {})

        return ValidationSummary(
            schemaValidation="PASS" if validation.get("schemaValid", False) else "FAIL",
            uiConstitution="PASS" if not state.get("fallback_triggered", False) else "FAIL",
            componentRegistry="PASS" if validation.get("componentRegistryValid", False) else "FAIL",
            contentRegistry="PASS" if validation.get("contentRegistryValid", False) else "FAIL",
            accessibility="PASS" if validation.get("accessibilityValid", True) else "FAIL",
            consent="PASS" if not state.get("stage_failure", "").endswith("CONSENT") else "FAIL",
            conduct="PASS" if not state.get("stage_failure", "").endswith("RISK") else "FAIL",
        )
