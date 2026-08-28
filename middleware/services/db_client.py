import json
import logging
import os
from typing import Any

import asyncpg

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://ilrp:ilrp_dev_2024@localhost:5432/ilrp",
)


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None or _pool._closed:
        _pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=10)
        logger.info("[DB] Connection pool created")
    return _pool


async def close_pool():
    global _pool
    if _pool and not _pool._closed:
        await _pool.close()
        _pool = None
        logger.info("[DB] Connection pool closed")


def _parse_jsonb(val: Any) -> Any:
    if val is None:
        return None
    if isinstance(val, str):
        try:
            return json.loads(val)
        except (json.JSONDecodeError, TypeError):
            return val
    return val


async def get_customer_by_email(email: str) -> dict | None:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT customer_id, name, email, points, tier, alphamed_points,
               cavendish_points, wallet_address
        FROM customers
        WHERE email = $1
        """,
        email,
    )
    if not row:
        return None
    d = dict(row)
    return {
        "customer_id": d["customer_id"],
        "name": d["name"],
        "email": d["email"],
        "points": d["points"],
        "tier": d["tier"],
        "alphamed_points": d["alphamed_points"],
        "cavendish_points": d.get("cavendish_points", 0) or 0,
        "wallet_address": d["wallet_address"],
    }


async def get_customer_by_id(customer_id: str) -> dict | None:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT customer_id, name, email, points, tier, alphamed_points,
               cavendish_points, wallet_address
        FROM customers
        WHERE customer_id = $1
        """,
        customer_id,
    )
    if not row:
        return None
    d = dict(row)
    return {
        "customer_id": d["customer_id"],
        "name": d["name"],
        "email": d["email"],
        "points": d["points"],
        "tier": d["tier"],
        "alphamed_points": d["alphamed_points"],
        "cavendish_points": d.get("cavendish_points", 0) or 0,
        "wallet_address": d["wallet_address"],
    }


async def update_customer_points(customer_id: str, new_points: int) -> bool:
    pool = await get_pool()
    result = await pool.execute(
        "UPDATE customers SET points = $1 WHERE customer_id = $2",
        new_points,
        customer_id,
    )
    return result == "UPDATE 1"


async def update_alphamed_points(customer_id: str, new_points: int) -> bool:
    pool = await get_pool()
    result = await pool.execute(
        "UPDATE customers SET alphamed_points = $1 WHERE customer_id = $2",
        new_points,
        customer_id,
    )
    return result == "UPDATE 1"


async def update_cavendish_points(customer_id: str, new_points: int) -> bool:
    pool = await get_pool()
    result = await pool.execute(
        "UPDATE customers SET cavendish_points = $1 WHERE customer_id = $2",
        new_points,
        customer_id,
    )
    return result == "UPDATE 1"


async def create_transaction(
    customer_id: str,
    tx_type: str,
    points: int,
    description: str = "",
    brand_key: str | None = None,
    reward_name: str | None = None,
    status: str = "COMPLETED",
    dlt_tx_hash: str | None = None,
    blockchain_metadata: dict | None = None,
) -> dict:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO transactions (
            customer_id, tx_type, points, description, brand_key,
            reward_name, status, dlt_tx_hash, blockchain_metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        RETURNING id, customer_id, tx_type, points, description, brand_key,
                  reward_name, status, dlt_tx_hash, created_at
        """,
        customer_id,
        tx_type,
        points,
        description,
        brand_key,
        reward_name,
        status,
        dlt_tx_hash,
        json.dumps(blockchain_metadata or {}),
    )
    return dict(row)


async def get_customer_transactions(
    customer_id: str, limit: int = 50
) -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT id, customer_id, tx_type, points, description, brand_key,
               reward_name, status, dlt_tx_hash, created_at
        FROM transactions
        WHERE customer_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        customer_id,
        limit,
    )
    return [dict(r) for r in rows]


async def list_brands() -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT brand_key, name, logo_url, category, points_per_gbp, reward_types
        FROM brands WHERE is_active = TRUE ORDER BY brand_key
        """
    )
    return [
        {
            "brandKey": r["brand_key"],
            "name": r["name"],
            "logoUrl": r["logo_url"],
            "category": r["category"],
            "pointsPerGbp": float(r["points_per_gbp"]),
            "rewardTypes": _parse_jsonb(r["reward_types"]),
        }
        for r in rows
    ]


async def log_dlt_audit(
    customer_id: str,
    operation: str,
    amount: int,
    from_address: str | None = None,
    to_address: str | None = None,
    tx_hash: str | None = None,
    block_number: int | None = None,
    block_timestamp: str | None = None,
    gas_used: int | None = None,
    gas_price_gwei: float | None = None,
    network: str = "besu-local",
    status: str = "CONFIRMED",
    error_message: str | None = None,
    metadata: dict | None = None,
) -> dict:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO dlt_audit (
            customer_id, operation, amount, from_address, to_address,
            tx_hash, block_number, block_timestamp, gas_used,
            gas_price_gwei, network, status, error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
        RETURNING id, customer_id, operation, amount, tx_hash, status, created_at
        """,
        customer_id,
        operation,
        amount,
        from_address,
        to_address,
        tx_hash,
        block_number,
        block_timestamp,
        gas_used,
        gas_price_gwei,
        network,
        status,
        error_message,
        json.dumps(metadata or {}),
    )
    return dict(row)
