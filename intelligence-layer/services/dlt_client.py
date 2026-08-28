import logging
import os

import httpx

logger = logging.getLogger(__name__)

DLT_SERVICE_URL = os.getenv("DLT_SERVICE_URL", "http://dlt:8000")


class DLTServiceClient:
    """Client for calling the DLT service API."""

    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or DLT_SERVICE_URL

    async def mint(self, customer_id: str, to_address: str, amount: int) -> dict:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/dlt/mint",
                    json={"customer_id": customer_id, "to_address": to_address, "amount": amount},
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[DLT-SERVICE] mint failed: %s", e)
            return {"blockchain": {"status": "FAILED", "error": str(e)}}

    async def burn(self, customer_id: str, from_address: str, amount: int) -> dict:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/dlt/burn",
                    json={"customer_id": customer_id, "from_address": from_address, "amount": amount},
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[DLT-SERVICE] burn failed: %s", e)
            return {"blockchain": {"status": "FAILED", "error": str(e)}}

    async def get_balance(self, address: str) -> dict:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/dlt/balance/{address}")
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[DLT-SERVICE] get_balance failed: %s", e)
            return {"balance_wei": 0, "balance_lbg": 0}

    async def get_network_info(self) -> dict:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/dlt/network")
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[DLT-SERVICE] get_network_info failed: %s", e)
            return {"error": str(e)}

    async def get_audit(self, customer_id: str, limit: int = 50) -> list[dict]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self.base_url}/dlt/audit/{customer_id}",
                    params={"limit": limit},
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.warning("[DLT-SERVICE] get_audit failed: %s", e)
            return []


dlt_client = DLTServiceClient()
