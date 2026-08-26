import os
import httpx


class IntelligenceClient:
    """Fetches customer intelligence from the Intelligence Layer service."""

    def __init__(self, base_url: str = None):
        self.base_url = (
            base_url
            or os.getenv("INTELLIGENCE_SERVICE_URL")
            or os.getenv("INTELLIGENCE_LAYER_URL")
            or "http://localhost:8001"
        )

    async def get_customer_intelligence(self, customer_id: str) -> dict:
        if not customer_id:
            return {"available": False, "error": "No customer reference provided"}

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self.base_url}/intelligence/customer/{customer_id}"
                )
                resp.raise_for_status()
                data = resp.json()

            if isinstance(data, dict) and data.get("error"):
                return {"available": False, "error": data["error"]}

            return {"available": True, **data}
        except Exception as e:
            return {"available": False, "error": str(e)}
