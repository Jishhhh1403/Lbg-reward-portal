from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BrandPointsLedger, Reward
from app.repositories.base import BaseRepository


class RewardRepository(BaseRepository[Reward]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Reward, db)

    async def get_by_customer_and_status(
        self, customer_id: uuid.UUID, status: str, limit: int = 500
    ) -> list[Reward]:
        result = await self.db.execute(
            select(Reward)
            .where(Reward.customer_id == customer_id, Reward.status == status)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_brand_points_by_customer(self, customer_id: uuid.UUID) -> list[BrandPointsLedger]:
        result = await self.db.execute(
            select(BrandPointsLedger).where(BrandPointsLedger.customer_id == customer_id)
        )
        return list(result.scalars().all())
