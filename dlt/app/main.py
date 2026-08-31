"""
DLT Service API - Hyperledger Besu blockchain integration for LBG Coin.

Handles minting, burning, transferring LBG tokens on-chain
and logging all blockchain operations to the dlt_audit table.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.blockchain.client import besu_client
from app.db_client import (
    get_pool,
    close_pool,
    log_dlt_audit,
    get_dlt_audit,
    get_all_dlt_audit,
)
from app.models import MintRequest, BurnRequest, TransferRequest, AuditLogRequest

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await get_pool()
        logger.info("[DLT] Database pool initialized")
    except Exception as e:
        logger.warning("[DLT] Database not available at startup: %s", e)

    if besu_client.connected:
        try:
            besu_client.load_or_deploy_contract()
            logger.info("[DLT] Contract loaded/deployed")
        except Exception as e:
            logger.warning("[DLT] Contract deploy failed (will use simulation): %s", e)
    else:
        logger.warning("[DLT] Besu not connected - running in simulation mode")

    yield
    await close_pool()


app = FastAPI(
    title="DLT Service API",
    description="Hyperledger Besu blockchain integration for LBG Coin token operations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    return {
        "status": "healthy",
        "service": "dlt",
        "database": "connected" if db_ok else "unavailable",
        "besu": "connected" if besu_client.connected else "simulated",
        "chain_id": settings.chain_id,
        "contract": besu_client._contract.address if besu_client._contract else None,
    }


@app.get("/dlt/network")
async def get_network_info():
    return besu_client.get_network_info()


@app.get("/dlt/balance/{address}")
async def get_balance(address: str):
    balance = besu_client.get_balance(address)
    return {
        "address": address,
        "balance_wei": balance,
        "balance_lbg": balance / 10**18 if balance else 0,
    }


@app.get("/dlt/supply")
async def get_total_supply():
    supply = besu_client.get_total_supply()
    return {
        "total_supply_wei": supply,
        "total_supply_lbg": supply / 10**18 if supply else 0,
    }


@app.post("/dlt/mint")
async def mint_tokens(req: MintRequest):
    try:
        result = besu_client.mint(req.to_address, req.amount)

        await log_dlt_audit(
            customer_id=req.customer_id,
            operation="MINT",
            amount=req.amount,
            to_address=req.to_address,
            tx_hash=result.get("tx_hash"),
            block_number=result.get("block_number"),
            gas_used=result.get("gas_used"),
            network="besu-local",
            status=result.get("status", "SIMULATED"),
        )

        return {
            "customer_id": req.customer_id,
            "operation": "MINT",
            "amount": req.amount,
            "to_address": req.to_address,
            "blockchain": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/dlt/burn")
async def burn_tokens(req: BurnRequest):
    try:
        result = besu_client.burn(req.from_address, req.amount)

        await log_dlt_audit(
            customer_id=req.customer_id,
            operation="BURN",
            amount=req.amount,
            from_address=req.from_address,
            tx_hash=result.get("tx_hash"),
            block_number=result.get("block_number"),
            gas_used=result.get("gas_used"),
            network="besu-local",
            status=result.get("status", "SIMULATED"),
        )

        return {
            "customer_id": req.customer_id,
            "operation": "BURN",
            "amount": req.amount,
            "from_address": req.from_address,
            "blockchain": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/dlt/transfer")
async def transfer_tokens(req: TransferRequest):
    try:
        result = besu_client.transfer(req.from_address, req.to_address, req.amount)

        await log_dlt_audit(
            customer_id=req.customer_id,
            operation="TRANSFER",
            amount=req.amount,
            from_address=req.from_address,
            to_address=req.to_address,
            tx_hash=result.get("tx_hash"),
            block_number=result.get("block_number"),
            gas_used=result.get("gas_used"),
            network="besu-local",
            status=result.get("status", "SIMULATED"),
        )

        return {
            "customer_id": req.customer_id,
            "operation": "TRANSFER",
            "amount": req.amount,
            "from_address": req.from_address,
            "to_address": req.to_address,
            "blockchain": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dlt/audit/{customer_id}")
async def get_customer_audit(customer_id: str, limit: int = 50):
    try:
        return await get_dlt_audit(customer_id, limit)
    except Exception:
        return []


@app.get("/dlt/audit")
async def get_all_audit(limit: int = 100):
    try:
        return await get_all_dlt_audit(limit)
    except Exception:
        return []


@app.post("/dlt/audit")
async def log_audit(req: AuditLogRequest):
    try:
        result = await log_dlt_audit(
            customer_id=req.customer_id,
            operation=req.operation,
            amount=req.amount,
            from_address=req.from_address,
            to_address=req.to_address,
            tx_hash=req.tx_hash,
            block_number=req.block_number,
            block_timestamp=req.block_timestamp,
            gas_used=req.gas_used,
            gas_price_gwei=req.gas_price_gwei,
            network=req.network,
            status=req.status,
            error_message=req.error_message,
            metadata=req.metadata,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
