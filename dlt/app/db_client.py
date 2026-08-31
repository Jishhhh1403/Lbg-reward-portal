import json
import logging
import os

import asyncpg

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://ilrp:ilrp_dev_2024@postgres:5432/ilrp",
)


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None or _pool._closed:
        _pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=10)
        logger.info("[DLT-DB] Connection pool created")
    return _pool


async def close_pool():
    global _pool
    if _pool and not _pool._closed:
        await _pool.close()
        _pool = None
        logger.info("[DLT-DB] Connection pool closed")


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


async def get_all_dlt_audit(limit: int = 100) -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT id, customer_id, operation, amount, from_address, to_address,
               tx_hash, block_number, block_timestamp, gas_used,
               gas_price_gwei, network, status, created_at
        FROM dlt_audit
        ORDER BY created_at DESC
        LIMIT $1
        """,
        limit,
    )
    return [dict(r) for r in rows]


async def update_dlt_audit_status(tx_hash: str, status: str, error_message: str | None = None) -> bool:
    pool = await get_pool()
    result = await pool.execute(
        "UPDATE dlt_audit SET status = $1, error_message = $2 WHERE tx_hash = $3",
        status,
        error_message,
        tx_hash,
    )
    return result == "UPDATE 1"
