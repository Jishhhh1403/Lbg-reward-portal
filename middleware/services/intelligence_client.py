import logging
import os

import httpx

logger = logging.getLogger(__name__)


class IntelligenceClient:
    """Fetches customer intelligence via the Intelligence Layer service."""

    def __init__(self, base_url: str = None):
        self.base_url = (
            base_url
            or os.getenv("INTELLIGENCE_SERVICE_URL")
            or os.getenv("INTELLIGENCE_LAYER_URL")
            or "http://localhost:8001"
        )
        self.dlt_url = os.getenv("DLT_SERVICE_URL", "http://dlt:8000")

    async def get_customer_intelligence(self, customer_id: str) -> dict:
        if not customer_id:
            logger.warning("[INTELLIGENCE] No customer reference provided")
            return {"available": False, "error": "No customer reference provided"}

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self.base_url}/intelligence/customer/{customer_id}"
                )
                resp.raise_for_status()
                data = resp.json()

            if isinstance(data, dict) and data.get("error"):
                logger.warning(
                    "[INTELLIGENCE] Customer %s: service returned error: %s",
                    customer_id, data["error"],
                )
                return {"available": False, "error": data["error"]}

            logger.info("[INTELLIGENCE] Customer %s: loaded successfully", customer_id)
            return {"available": True, **data}
        except Exception as e:
            logger.warning(
                "[INTELLIGENCE] Customer %s: fetch failed: %s", customer_id, e,
            )
            return {"available": False, "error": str(e)}

    async def list_customers(self) -> list[dict]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/intelligence/customers")
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[INTELLIGENCE] list_customers failed: %s", e)
            return []

    async def list_brands(self) -> list[dict]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/brands")
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[INTELLIGENCE] list_brands failed: %s", e)
            return []

    async def earn_points(self, customer_id: str, points: int, description: str = "", brand_key: str = None) -> dict:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/earn",
                    json={
                        "customer_id": customer_id,
                        "points": points,
                        "description": description,
                        "brand_key": brand_key,
                    },
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[INTELLIGENCE] earn_points failed: %s", e)
            return {"error": str(e)}

    async def redeem_points(self, customer_id: str, points: int, description: str = "", brand_key: str = None, reward_name: str = None) -> dict:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/redeem",
                    json={
                        "customer_id": customer_id,
                        "points": points,
                        "description": description,
                        "brand_key": brand_key,
                        "reward_name": reward_name,
                    },
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[INTELLIGENCE] redeem_points failed: %s", e)
            return {"error": str(e)}

    async def get_transactions(self, customer_id: str, limit: int = 50) -> list[dict]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self.base_url}/transactions/{customer_id}",
                    params={"limit": limit},
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[INTELLIGENCE] get_transactions failed: %s", e)
            return []

    async def get_dlt_audit(self, customer_id: str, limit: int = 50) -> list[dict]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self.dlt_url}/dlt/audit/{customer_id}",
                    params={"limit": limit},
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[DLT] get_dlt_audit failed: %s", e)
            return []

    async def get_dlt_network_info(self) -> dict:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.dlt_url}/dlt/network")
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[DLT] get_dlt_network_info failed: %s", e)
            return {"error": str(e)}

    async def get_dlt_balance(self, address: str) -> dict:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.dlt_url}/dlt/balance/{address}")
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[DLT] get_dlt_balance failed: %s", e)
            return {"balance_wei": 0, "balance_lbg": 0}
