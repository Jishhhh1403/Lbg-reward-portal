from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.reward_repository import RewardRepository
from app.schemas.reward import RewardResponse


class RewardService:
    def __init__(self, db: AsyncSession) -> None:
        self.reward_repo = RewardRepository(db)

    async def list_rewards_by_customer(
        self, customer_id: uuid.UUID, status: str = "EARNED", limit: int = 500
    ) -> list[RewardResponse]:
        rewards = await self.reward_repo.get_by_customer_and_status(customer_id, status, limit)
        return [
            RewardResponse(
                id=str(r.id),
                brandId=r.brand_id,
                rewardId=str(r.id),
                status=r.status.value if hasattr(r.status, "value") else r.status,
                points=r.points,
            )
            for r in rewards
        ]
