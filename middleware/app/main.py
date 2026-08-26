import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(str(Path(__file__).parent.parent / ".env"))

from services.orchestration_service import OrchestrationService


class PersonalizationRequest(BaseModel):
    requestId: str = ""
    correlationId: str = ""
    customerReference: str = ""
    journey: str = "rewards-overview"
    channel: str = "mobile"
    locale: str = "en-US"
    jurisdiction: str = "US"
    applicationVersion: str = "1.0"
    rendererVersion: str = "1.0"
    currentSessionContext: dict = Field(default_factory=dict)
    permittedCustomerSignals: list = Field(default_factory=list)
    declaredPreferences: dict = Field(default_factory=dict)
    accessibilityPreferences: dict = Field(default_factory=dict)
    consentEnvelope: dict = Field(default_factory=lambda: {"valid": True, "scope": ["rewards-personalization"]})
    purposeOfUse: str = "rewards-personalization"
    componentRegistryVersion: str = "1.0"
    contentRegistryVersion: str = "1.0"
    designTokenVersion: str = "1.0"
    uiConstitutionVersion: str = "1.0"
    sduiSchemaVersion: str = "1.0"
    modelVersions: dict = Field(default_factory=dict)
    policyVersions: dict = Field(default_factory=dict)
    latencyBudgetMs: int = 5000


orchestration_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global orchestration_service
    gemini_keys = []
    for i in range(1, 4):
        key = os.getenv(f"GEMINI_API_KEY_{i}", "")
        if key:
            gemini_keys.append(key)
    if not gemini_keys:
        raise RuntimeError("No GEMINI_API_KEY found in environment (set GEMINI_API_KEY_1 at minimum)")
    groq_key = os.getenv("GROQ_API_KEY", "")
    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    print(f"[STARTUP] Gemini keys configured: {len(gemini_keys)}")
    if groq_key:
        print("[STARTUP] Groq failover enabled (activates when all Gemini keys are exhausted)")
    else:
        print("[STARTUP] GROQ_API_KEY not set — running Gemini only, no failover")
    orchestration_service = OrchestrationService(
        gemini_api_keys=gemini_keys,
        groq_api_key=groq_key,
        groq_model=groq_model,
    )
    yield


app = FastAPI(
    title="QUEST-UI Orchestrator Middleware",
    version="2.0.0",
    description="Multi-agent committee middleware for personalized SDUI generation",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/sdui/generate")
async def generate_sdui(request: PersonalizationRequest):
    try:
        result = await orchestration_service.generate_sdui(request.model_dump(by_alias=True))
        return result
    except Exception as e:
        return {
            "status": "REJECTED",
            "correlationId": request.correlationId,
            "decisionId": "",
            "sdui": {},
            "fallbackApplied": True,
            "reasonCodes": ["SERVICE_ERROR"],
            "confidence": 0.0,
            "expiresAt": "",
            "explainabilityRecordRef": "",
            "validationSummary": {
                "schemaValidation": "FAIL",
                "uiConstitution": "FAIL",
                "componentRegistry": "FAIL",
                "contentRegistry": "FAIL",
                "accessibility": "FAIL",
                "consent": "FAIL",
                "conduct": "FAIL",
            },
            "error": str(e),
        }


@app.get("/experience/customer/{customer_id}")
async def get_experience(customer_id: str):
    try:
        import uuid
        corr_id = str(uuid.uuid4())[:8]
        request = {
            "requestId": f"req-{customer_id}-{corr_id}",
            "correlationId": corr_id,
            "customerReference": customer_id,
            "journey": "rewards-overview",
            "channel": "mobile",
            "locale": "en-US",
            "jurisdiction": "US",
            "consentEnvelope": {"valid": True, "scope": ["rewards-personalization"]},
            "purposeOfUse": "rewards-personalization",
            "declaredPreferences": {},
            "accessibilityPreferences": {},
            "currentSessionContext": {},
            "latencyBudgetMs": 5000,
        }
        result = await orchestration_service.generate_sdui(request)

        sdui = result.get("sdui", {})
        components = sdui.get("components", [])
        intelligence = result.get("intelligence", {})

        persona = _infer_persona(components)
        if intelligence.get("available") and intelligence.get("persona"):
            persona = intelligence["persona"]

        return {
            "screen": {
                "schemaVersion": sdui.get("schemaVersion", "1.0"),
                "experienceId": sdui.get("decisionId", f"exp-{corr_id}"),
                "customerId": customer_id,
                "persona": persona,
                "components": components,
                "narrative": sdui.get("narrative"),
            },
            "validation": {
                "valid": result.get("status") == "PERSONALIZED",
                "errors": [],
                "warnings": result.get("reasonCodes", []),
            },
            "trace": {
                "customerId": customer_id,
                "intelligenceOutput": {
                    "status": result.get("status", "UNKNOWN"),
                    "decisionId": result.get("decisionId", ""),
                    "confidence": result.get("confidence", 0),
                    "fallbackApplied": result.get("fallbackApplied", False),
                    "reasonCodes": result.get("reasonCodes", []),
                    "validationSummary": result.get("validationSummary", {}),
                    "explainabilityRecordRef": result.get("explainabilityRecordRef", ""),
                    "personaProfile": {
                        "available": intelligence.get("available", False),
                        "error": intelligence.get("error"),
                        "persona": intelligence.get("persona"),
                        "personaConfidence": intelligence.get("confidence"),
                        "motivation": intelligence.get("motivation"),
                        "priority": intelligence.get("priority"),
                        "signals": intelligence.get("signals", []),
                        "recommendations": [str(r) for r in intelligence.get("recommendations", [])],
                        "goal": intelligence.get("goal"),
                        "risk": intelligence.get("risk"),
                        "customerProfile": intelligence.get("customerProfile"),
                    },
                },
                "experienceStrategy": result.get("status", "UNKNOWN"),
                "componentCount": len(components),
                "validationStatus": "VALID" if result.get("status") == "PERSONALIZED" else "FALLBACK",
            },
        }
    except Exception as e:
        return {"error": str(e)}, 500


def _infer_persona(components: list) -> str:
    types = {c.get("type", "") for c in components}
    goal_types = {"GOAL_PROGRESS_CARD", "GOAL_MILESTONE_CARD"}
    long_term_types = {"FUTURE_VALUE_CARD", "PROJECTION_CHART", "LONG_TERM_GOAL_CARD"}
    gamification_types = {"STREAK_CARD", "CHALLENGE_CARD", "LEADERBOARD"}
    instant_types = {"INSTANT_REWARD_POPUP", "FLASH_REWARD_BANNER", "QUICK_REDEEM_CARD"}
    risk_types = {"EXPIRING_POINTS_ALERT", "COUNTDOWN_CARD"}
    has_goal = bool(types & goal_types)
    has_long_term = bool(types & long_term_types)
    has_gamification = bool(types & gamification_types)
    has_instant = bool(types & instant_types)
    has_risk = bool(types & risk_types)
    if has_risk and has_long_term:
        return "PLANNER_AT_RISK_MIX"
    if has_risk and has_instant:
        return "INSTANT_AT_RISK_MIX"
    if "INSTANT_REWARD_POPUP" in types or "FLASH_REWARD_BANNER" in types:
        return "INSTANT_GRATIFICATION"
    if has_risk:
        return "CHURN_RISK"
    if sum([has_goal, has_long_term, has_gamification]) >= 2:
        return "MIXED_PROFILE"
    if has_goal:
        return "GOAL_ORIENTED_SAVER"
    if has_long_term:
        return "LONG_TERM_PLANNER"
    if has_gamification:
        return "GAMIFICATION_MOTIVATED"
    return "PERSONALIZED"


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "quest-ui-orchestrator",
        "version": "2.0.0",
        "agents": [
            "orchestrator",
            "context-analyst",
            "consent-guardian",
            "journey-intent",
            "reward-psychology",
            "accessibility",
            "component-planner",
            "constitution-guardian",
            "risk-guardian",
            "personalization-synth",
            "red-team",
            "sdui-compiler",
            "customer-story-architect",
            "journey-composer",
            "narrative-sequencer",
            "coherence-guardian",
            "session-continuity",
        ],
    }
