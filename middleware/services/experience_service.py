import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx
from transformers.composer import ExperienceComposer
from validators.sdui_validator import SDUIValidator

INTELLIGENCE_SERVICE_URL = "http://localhost:8001"


class ExperienceService:
    def __init__(self):
        self.composer = ExperienceComposer()
        self.validator = SDUIValidator()
        self._customer_data_cache = {}

    async def get_experience(self, customer_id: str) -> dict:
        intelligence = await self._fetch_intelligence(customer_id)
        customer_data = await self._fetch_customer_data(customer_id)

        screen = self.composer.compose(intelligence, customer_data)

        validation = self.validator.validate(screen)

        return {
            "screen": screen.model_dump(by_alias=True),
            "validation": validation.to_dict(),
            "trace": {
                "customerId": customer_id,
                "intelligenceOutput": intelligence,
                "experienceStrategy": intelligence["persona"],
                "componentCount": len(screen.components),
                "validationStatus": "VALID" if validation.is_valid else "INVALID",
            },
        }

    async def _fetch_intelligence(self, customer_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{INTELLIGENCE_SERVICE_URL}/intelligence/customer/{customer_id}"
            )
            response.raise_for_status()
            return response.json()

    async def _fetch_customer_data(self, customer_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{INTELLIGENCE_SERVICE_URL}/intelligence/customers"
            )
            response.raise_for_status()
            customers = response.json()
            for c in customers:
                if c["id"] == customer_id:
                    return c
        return {"id": customer_id, "name": "Unknown", "tier": "Silver", "points": 0}
