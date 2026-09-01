import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(str(Path(__file__).parent.parent / ".env"))

from services.orchestration_service import OrchestrationService
from services.objective_service import ObjectiveService
from schemas.objective import (
    ObjectiveGenerateRequest,
    ObjectiveGenerateResponse,
)
from services.db_client import (
    get_pool,
    close_pool,
    get_customer_by_email,
    get_customer_by_id,
    update_customer_points,
    update_alphamed_points,
    update_cavendish_points,
    create_transaction,
    get_customer_transactions,
    list_brands,
    log_dlt_audit,
)


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
objective_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global orchestration_service, objective_service
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
    objective_service = ObjectiveService()
    try:
        await get_pool()
        print("[STARTUP] Database pool initialized")
    except Exception as e:
        print(f"[STARTUP] Database not available at startup: {e}")
    yield
    await close_pool()


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


@app.post("/objective/generate")
async def generate_objective(request: ObjectiveGenerateRequest):
    try:
        if objective_service is None:
            raise RuntimeError("ObjectiveService not initialized")
        result = await objective_service.generate(request)
        return result
    except Exception as e:
        return ObjectiveGenerateResponse(
            status="REJECTED",
            components=[],
            reasonCodes=["SERVICE_ERROR"],
            error=str(e),
        ).model_dump()


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
    cache_stats = orchestration_service.cache.stats() if orchestration_service else {}
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
        "cache": cache_stats,
    }


# ------------------------------------------------------------------
# SDUI Cache Management
# ------------------------------------------------------------------


@app.get("/sdui/cache/stats")
async def cache_stats():
    """Debug: show cache stats."""
    if not orchestration_service:
        return {"error": "service not initialized"}
    return orchestration_service.cache.stats()


@app.delete("/sdui/cache/{customer_id}")
async def invalidate_customer_cache(customer_id: str):
    """Manual: clear cached SDUI for one customer."""
    if not orchestration_service:
        return {"error": "service not initialized"}
    removed = orchestration_service.cache.invalidate(customer_id)
    return {"customer_id": customer_id, "removed": removed}


@app.delete("/sdui/cache")
async def invalidate_all_cache():
    """Manual: flush all cached SDUIs."""
    if not orchestration_service:
        return {"error": "service not initialized"}
    count = orchestration_service.cache.invalidate_all()
    return {"flushed": count}


# ------------------------------------------------------------------
# AlphaMed Transfer API
# ------------------------------------------------------------------

ALPHAMED_TO_LBG_RATE = 5
COINS_PER_POUND = 100
CAVENDISH_REWARD_RATE = 5


@app.get("/api/v1/customers/lookup/summary")
async def lookup_customer_summary(email: str = Query(...)):
    try:
        customer = await get_customer_by_email(email)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return {
            "hasAccount": True,
            "customerId": customer["customer_id"],
            "alphamedicolPoints": customer["alphamed_points"],
            "cavendishPoints": customer.get("cavendish_points", 0) or 0,
            "totalLbgPoints": customer["points"],
            "phone": "",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TransferRequest(BaseModel):
    customer_email: str
    points_to_transfer: int
    idempotency_key: str = ""


@app.post("/api/v1/customers/transfer/alphamedicol")
async def transfer_alphamedicol(req: TransferRequest):
    try:
        customer = await get_customer_by_email(req.customer_email)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        if customer["alphamed_points"] < req.points_to_transfer:
            raise HTTPException(
                status_code=400,
                detail="Insufficient AlphaMed points",
            )

        if req.points_to_transfer <= 0:
            raise HTTPException(status_code=400, detail="Transfer amount must be positive")

        new_alphamed = customer["alphamed_points"] - req.points_to_transfer
        lbg_issued = req.points_to_transfer * ALPHAMED_TO_LBG_RATE
        new_lbg = customer["points"] + lbg_issued

        await update_alphamed_points(customer["customer_id"], new_alphamed)
        await update_customer_points(customer["customer_id"], new_lbg)

        tx = await create_transaction(
            customer_id=customer["customer_id"],
            tx_type="CONVERT",
            points=req.points_to_transfer,
            description=f"AlphaMed points converted to {lbg_issued} LBG coins",
            brand_key="alphamedical",
            reward_name="AlphaMed-to-LBG Conversion",
        )

        wallet = customer.get("wallet_address")
        dlt_result = None
        if wallet:
            try:
                import httpx as _httpx
                dlt_url = os.getenv("DLT_SERVICE_URL", "http://dlt:8000")
                async with _httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        f"{dlt_url}/dlt/mint",
                        json={
                            "customer_id": customer["customer_id"],
                            "to_address": wallet,
                            "amount": lbg_issued * 10**18,
                        },
                    )
                    resp.raise_for_status()
                    dlt_result = resp.json()
                    blockchain = dlt_result.get("blockchain", dlt_result)
                    await log_dlt_audit(
                        customer_id=customer["customer_id"],
                        operation="MINT",
                        amount=lbg_issued,
                        to_address=wallet,
                        tx_hash=blockchain.get("tx_hash"),
                        block_number=blockchain.get("block_number"),
                        gas_used=blockchain.get("gas_used"),
                        status=blockchain.get("status", "SIMULATED"),
                        metadata={"source": "alphamed_transfer", "idempotency_key": req.idempotency_key},
                    )
            except Exception as e:
                print(f"[TRANSFER] DLT mint failed (non-blocking): {e}")

        transaction_id = f"AMX-{tx['id']:06d}"

        return {
            "transactionId": transaction_id,
            "pointsTransferred": req.points_to_transfer,
            "lbgCoinsIssued": lbg_issued,
            "remainingPoints": new_alphamed,
            "updatedLbgPoints": new_lbg,
            "completedAt": tx["created_at"].isoformat() if hasattr(tx["created_at"], "isoformat") else str(tx["created_at"]),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------------
# Cavendish Online Payment API
# ------------------------------------------------------------------


class CavendishPaymentRequest(BaseModel):
    customer_email: str
    coins_to_redeem: int
    payment_amount_gbp: float
    payment_method: str = "card"


@app.post("/api/v1/customers/pay/cavendish")
async def pay_cavendish(req: CavendishPaymentRequest):
    try:
        customer = await get_customer_by_email(req.customer_email)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        if req.coins_to_redeem < 0:
            raise HTTPException(status_code=400, detail="Coins to redeem must be non-negative")

        if req.coins_to_redeem > customer["points"]:
            raise HTTPException(
                status_code=400,
                detail="Insufficient LBG coins",
            )

        new_points = customer["points"] - req.coins_to_redeem
        reward_coins = round(req.payment_amount_gbp * CAVENDISH_REWARD_RATE)
        current_cavendish = customer.get("cavendish_points", 0) or 0

        tx1 = await create_transaction(
            customer_id=customer["customer_id"],
            tx_type="REDEEM",
            points=req.coins_to_redeem,
            description=f"LBG Coins redeemed at Cavendish Online (£{req.coins_to_redeem / COINS_PER_POUND:.2f} discount)",
            brand_key="cavendish_online",
            reward_name="Cavendish Payment Redemption",
        )

        if reward_coins > 0:
            final_points = new_points + reward_coins
            new_cavendish = current_cavendish + reward_coins
            await update_customer_points(customer["customer_id"], final_points)
            await update_cavendish_points(customer["customer_id"], new_cavendish)
            tx2 = await create_transaction(
                customer_id=customer["customer_id"],
                tx_type="EARN",
                points=reward_coins,
                description=f"Earned {reward_coins} LBG Coins from Cavendish payment",
                brand_key="cavendish_online",
                reward_name="Cavendish Payment Reward",
            )
        else:
            await update_customer_points(customer["customer_id"], new_points)
            final_points = new_points
            new_cavendish = current_cavendish

        transaction_id = f"CVX-{tx1['id']:06d}"

        return {
            "transactionId": transaction_id,
            "coinsRedeemed": req.coins_to_redeem,
            "coinsEarned": reward_coins,
            "coinDiscount": round(req.coins_to_redeem / COINS_PER_POUND, 2),
            "amountPayable": round(req.payment_amount_gbp, 2),
            "paymentMethod": req.payment_method,
            "updatedLbgPoints": final_points,
            "updatedCavendishPoints": new_cavendish,
            "completedAt": tx1["created_at"].isoformat() if hasattr(tx1["created_at"], "isoformat") else str(tx1["created_at"]),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/customers/{customer_id}/summary")
async def get_customer_summary(customer_id: str):
    try:
        customer = await get_customer_by_id(customer_id)
        if not customer:
            customer = await get_customer_by_email(f"{customer_id}@example.com")
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        brand_list = []
        try:
            brand_list = await list_brands()
        except Exception:
            pass

        points_by_brand = []
        for brand in brand_list:
            points = 0
            if brand["brandKey"] == "alphamedical":
                points = customer["alphamed_points"]
            elif brand["brandKey"] == "cavendish_online":
                points = customer.get("cavendish_points", 0) or 0
            else:
                points = max(0, customer["points"] // max(1, len(brand_list)))

            points_by_brand.append({
                "brandId": f"brd_{brand['brandKey']}",
                "brandName": brand["name"],
                "category": brand["category"],
                "points": points,
                "color": "#0e7490",
                "logoText": brand["name"][:2].upper(),
            })

        tier = customer["tier"]
        return {
            "customer": {
                "customerId": customer["customer_id"],
                "userName": customer["name"],
                "phone": "",
                "totalLbgCoins": customer["points"],
                "totalBrandPoints": sum(p["points"] for p in points_by_brand),
                "brandsConnected": len(points_by_brand),
                "tier": tier,
                "lastSyncedAt": "",
            },
            "pointsByBrand": points_by_brand,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/wallet/{customer_id}/transactions")
async def get_wallet_transactions(customer_id: str, limit: int = Query(25)):
    try:
        txs = await get_customer_transactions(customer_id, limit)
        result = []
        for tx in txs:
            amount = tx["points"]
            if tx["tx_type"] == "REDEEM":
                amount = -amount
            elif tx["tx_type"] == "EXPIRE":
                amount = -amount
            elif tx["tx_type"] == "CONVERT":
                amount = tx["points"]
            elif tx["tx_type"] == "TRANSFER":
                amount = tx["points"]

            currency = "LBG_COIN" if tx["tx_type"] in ("EARN", "CONVERT", "REDEEM") else "BRAND_POINT"
            if tx["brand_key"] in ("alphamedical", "cavendish_online"):
                currency = "LBG_COIN"

            result.append({
                "id": f"tx_{tx['id']}",
                "type": tx["tx_type"],
                "description": tx["description"] or f"{tx['tx_type']} transaction",
                "amount": amount,
                "currency": currency,
                "createdAt": tx["created_at"].isoformat() if hasattr(tx["created_at"], "isoformat") else str(tx["created_at"]),
            })
        return result
    except Exception:
        return []
