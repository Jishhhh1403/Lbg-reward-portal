from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.mock_provider import MockIntelligenceProvider
from services.db_client import (
    get_customer,
    list_customers as db_list_customers,
    update_customer_points,
    upsert_customer,
    list_brands,
    create_transaction,
    get_customer_transactions,
    log_dlt_audit,
    get_dlt_audit,
    get_pool,
    close_pool,
)
from services.dlt_client import dlt_client

logger = logging.getLogger(__name__)

app = FastAPI(title="Intelligence Layer API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

provider = MockIntelligenceProvider()


@app.on_event("startup")
async def startup():
    try:
        await get_pool()
        logger.info("[APP] Database pool initialized")
    except Exception as e:
        logger.warning("[APP] Database not available at startup: %s", e)


@app.on_event("shutdown")
async def shutdown():
    await close_pool()


@app.get("/intelligence/customer/{customer_id}")
async def get_customer_intelligence(customer_id: str):
    try:
        result = provider.get_customer_intelligence(customer_id)
        return result.model_dump(by_alias=True)
    except ValueError as e:
        return {"error": str(e)}, 404


@app.get("/intelligence/customers")
async def list_customers():
    try:
        customers = await db_list_customers()
        return customers
    except Exception:
        from personas.customer_data import CUSTOMER_DATA
        return [
            {"id": cid, "name": data["name"], "tier": data["tier"], "points": data["points"]}
            for cid, data in CUSTOMER_DATA.items()
        ]


@app.get("/brands")
async def get_brands():
    try:
        brands = await list_brands()
        return brands
    except Exception:
        return [
            {"brandKey": "alphamedical", "name": "AlphaMedical", "category": "Health & Wellness", "pointsPerGbp": 1.5, "rewardTypes": ["voucher", "cashback", "goal_linked"]},
            {"brandKey": "cavendish_online", "name": "Cavendish Online", "category": "Retail", "pointsPerGbp": 1.2, "rewardTypes": ["voucher", "instant", "cashback"]},
            {"brandKey": "coffee_house", "name": "The Coffee House", "category": "Food & Drink", "pointsPerGbp": 1.0, "rewardTypes": ["instant", "voucher"]},
            {"brandKey": "travel_plus", "name": "TravelPlus", "category": "Travel", "pointsPerGbp": 2.0, "rewardTypes": ["goal_linked", "voucher", "experience"]},
            {"brandKey": "fitness_first", "name": "FitnessFirst", "category": "Health & Wellness", "pointsPerGbp": 1.3, "rewardTypes": ["voucher", "goal_linked", "challenge"]},
        ]


class EarnPointsRequest(BaseModel):
    customer_id: str
    points: int
    description: str = ""
    brand_key: Optional[str] = None


class RedeemPointsRequest(BaseModel):
    customer_id: str
    points: int
    description: str = ""
    brand_key: Optional[str] = None
    reward_name: Optional[str] = None


class MintTokensRequest(BaseModel):
    customer_id: str
    points: int


@app.post("/earn")
async def earn_points(req: EarnPointsRequest):
    try:
        customer = await get_customer(req.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail=f"Customer {req.customer_id} not found")

        new_points = customer["points"] + req.points
        await update_customer_points(req.customer_id, new_points)

        tx = await create_transaction(
            customer_id=req.customer_id,
            tx_type="EARN",
            points=req.points,
            description=req.description,
            brand_key=req.brand_key,
        )

        # Mint LBG tokens on-chain via DLT service
        wallet = customer.get("wallet_address")
        dlt_result = None
        if wallet:
            dlt_resp = await dlt_client.mint(req.customer_id, wallet, req.points * 10**18)
            dlt_result = dlt_resp.get("blockchain", dlt_resp)
            await log_dlt_audit(
                customer_id=req.customer_id,
                operation="MINT",
                amount=req.points,
                to_address=wallet,
                tx_hash=dlt_result.get("tx_hash"),
                block_number=dlt_result.get("block_number"),
                gas_used=dlt_result.get("gas_used"),
                status=dlt_result.get("status", "SIMULATED"),
            )
            if dlt_result.get("tx_hash"):
                await create_transaction(
                    customer_id=req.customer_id,
                    tx_type="EARN",
                    points=req.points,
                    description=f"On-chain mint for: {req.description}",
                    status="COMPLETED",
                    dlt_tx_hash=dlt_result["tx_hash"],
                    blockchain_metadata=dlt_result,
                )

        return {
            "customer_id": req.customer_id,
            "points_earned": req.points,
            "new_balance": new_points,
            "transaction": tx,
            "dlt": dlt_result,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/redeem")
async def redeem_points(req: RedeemPointsRequest):
    try:
        customer = await get_customer(req.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail=f"Customer {req.customer_id} not found")

        if customer["points"] < req.points:
            raise HTTPException(status_code=400, detail="Insufficient points")

        new_points = customer["points"] - req.points
        await update_customer_points(req.customer_id, new_points)

        tx = await create_transaction(
            customer_id=req.customer_id,
            tx_type="REDEEM",
            points=req.points,
            description=req.description,
            brand_key=req.brand_key,
            reward_name=req.reward_name,
        )

        # Burn LBG tokens on-chain via DLT service
        wallet = customer.get("wallet_address")
        dlt_result = None
        if wallet:
            dlt_resp = await dlt_client.burn(req.customer_id, wallet, req.points * 10**18)
            dlt_result = dlt_resp.get("blockchain", dlt_resp)
            await log_dlt_audit(
                customer_id=req.customer_id,
                operation="BURN",
                amount=req.points,
                from_address=wallet,
                tx_hash=dlt_result.get("tx_hash"),
                block_number=dlt_result.get("block_number"),
                gas_used=dlt_result.get("gas_used"),
                status=dlt_result.get("status", "SIMULATED"),
            )
            if dlt_result.get("tx_hash"):
                await create_transaction(
                    customer_id=req.customer_id,
                    tx_type="REDEEM",
                    points=req.points,
                    description=f"On-chain burn for: {req.description}",
                    status="COMPLETED",
                    dlt_tx_hash=dlt_result["tx_hash"],
                    blockchain_metadata=dlt_result,
                )

        return {
            "customer_id": req.customer_id,
            "points_redeemed": req.points,
            "new_balance": new_points,
            "transaction": tx,
            "dlt": dlt_result,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/transactions/{customer_id}")
async def get_transactions(customer_id: str, limit: int = 50):
    try:
        txs = await get_customer_transactions(customer_id, limit)
        return txs
    except Exception:
        return []


@app.get("/dlt/audit/{customer_id}")
async def get_dlt_audit_log(customer_id: str, limit: int = 50):
    try:
        logs = await get_dlt_audit(customer_id, limit)
        return logs
    except Exception:
        return []


@app.get("/dlt/network")
async def get_dlt_network_info():
    return await dlt_client.get_network_info()


@app.get("/dlt/balance/{address}")
async def get_dlt_balance(address: str):
    return await dlt_client.get_balance(address)


@app.get("/health")
async def health():
    db_ok = False
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        db_ok = True
    except Exception:
        pass

    dlt_ok = False
    try:
        info = await dlt_client.get_network_info()
        dlt_ok = info.get("connected", False)
    except Exception:
        pass

    return {
        "status": "healthy",
        "service": "intelligence-layer",
        "database": "connected" if db_ok else "unavailable",
        "dlt_service": "connected" if dlt_ok else "unavailable",
    }
