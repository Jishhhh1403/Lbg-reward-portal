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


def _row_to_dict(row: asyncpg.Record | None) -> dict | None:
    if row is None:
        return None
    d = dict(row)
    for key in d:
        if isinstance(d[key], (json,)):
            pass
    return d


def _parse_jsonb(val: Any) -> Any:
    if val is None:
        return None
    if isinstance(val, str):
        try:
            return json.loads(val)
        except (json.JSONDecodeError, TypeError):
            return val
    return val


async def get_customer(customer_id: str) -> dict | None:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT customer_id, name, email, points, tier, engagement_score,
               behaviors, signals, rewards_history, expiring_points,
               days_until_expiry, goals, challenges_completed, badges,
               streak_days, leaderboard_rank, personality_insights,
               motive_scores, wallet_address
        FROM customers
        WHERE customer_id = $1
        """,
        customer_id,
    )
    if not row:
        return None

    d = dict(row)
    result = {
        "id": d["customer_id"],
        "name": d["name"],
        "email": d["email"],
        "points": d["points"],
        "tier": d["tier"],
        "engagement_score": float(d["engagement_score"]),
        "behaviors": _parse_jsonb(d["behaviors"]),
        "signals": _parse_jsonb(d["signals"]),
        "rewards_history": _parse_jsonb(d["rewards_history"]),
        "expiring_points": d["expiring_points"],
        "days_until_expiry": d["days_until_expiry"],
        "goals": _parse_jsonb(d["goals"]),
        "challenges_completed": d["challenges_completed"],
        "badges": d["badges"],
        "streak_days": d["streak_days"],
        "leaderboard_rank": d["leaderboard_rank"],
        "personality_insights": _parse_jsonb(d["personality_insights"]),
        "motive_scores": _parse_jsonb(d["motive_scores"]),
        "wallet_address": d["wallet_address"],
    }
    return result


async def list_customers() -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT customer_id, name, points, tier FROM customers ORDER BY customer_id"
    )
    return [
        {"id": r["customer_id"], "name": r["name"], "points": r["points"], "tier": r["tier"]}
        for r in rows
    ]


async def update_customer_points(customer_id: str, new_points: int) -> bool:
    pool = await get_pool()
    result = await pool.execute(
        "UPDATE customers SET points = $1 WHERE customer_id = $2",
        new_points,
        customer_id,
    )
    return result == "UPDATE 1"


async def upsert_customer(customer_id: str, data: dict) -> bool:
    pool = await get_pool()
    await pool.execute(
        """
        INSERT INTO customers (
            customer_id, name, email, points, tier, engagement_score,
            behaviors, signals, rewards_history, expiring_points,
            days_until_expiry, goals, challenges_completed, badges,
            streak_days, leaderboard_rank, personality_insights, motive_scores
        ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7::jsonb, $8::jsonb, $9::jsonb, $10,
            $11, $12::jsonb, $13, $14, $15, $16,
            $17::jsonb, $18::jsonb
        )
        ON CONFLICT (customer_id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            points = EXCLUDED.points,
            tier = EXCLUDED.tier,
            engagement_score = EXCLUDED.engagement_score,
            behaviors = EXCLUDED.behaviors,
            signals = EXCLUDED.signals,
            rewards_history = EXCLUDED.rewards_history,
            expiring_points = EXCLUDED.expiring_points,
            days_until_expiry = EXCLUDED.days_until_expiry,
            goals = EXCLUDED.goals,
            challenges_completed = EXCLUDED.challenges_completed,
            badges = EXCLUDED.badges,
            streak_days = EXCLUDED.streak_days,
            leaderboard_rank = EXCLUDED.leaderboard_rank,
            personality_insights = EXCLUDED.personality_insights,
            motive_scores = EXCLUDED.motive_scores
        """,
        customer_id,
        data.get("name", ""),
        data.get("email", ""),
        data.get("points", 0),
        data.get("tier", "Silver"),
        data.get("engagement_score", 0.0),
        json.dumps(data.get("behaviors", {})),
        json.dumps(data.get("signals", [])),
        json.dumps(data.get("rewards_history", [])),
        data.get("expiring_points", 0),
        data.get("days_until_expiry"),
        json.dumps(data.get("goals", [])),
        data.get("challenges_completed", 0),
        data.get("badges", 0),
        data.get("streak_days", 0),
        data.get("leaderboard_rank"),
        json.dumps(data.get("personality_insights", {})),
        json.dumps(data.get("motive_scores", {})),
    )
    return True


async def list_brands() -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT brand_key, name, logo_url, category, points_per_gbp, reward_types FROM brands WHERE is_active = TRUE ORDER BY brand_key"
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


async def get_dlt_audit(customer_id: str, limit: int = 50) -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT id, customer_id, operation, amount, from_address, to_address,
               tx_hash, block_number, block_timestamp, gas_used,
               gas_price_gwei, network, status, created_at
        FROM dlt_audit
        WHERE customer_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        customer_id,
        limit,
    )
    return [dict(r) for r in rows]
