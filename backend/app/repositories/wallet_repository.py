from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Wallet, WalletTransaction
from app.repositories.base import BaseRepository


class WalletRepository(BaseRepository[Wallet]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Wallet, db)

    async def get_by_customer_id(self, customer_id: uuid.UUID) -> Wallet | None:
        result = await self.db.execute(select(Wallet).where(Wallet.customer_id == customer_id))
        return result.scalar_one_or_none()

    async def get_transactions(self, wallet_id: uuid.UUID, limit: int = 25) -> list[WalletTransaction]:
        result = await self.db.execute(
            select(WalletTransaction)
            .where(WalletTransaction.wallet_id == wallet_id)
            .order_by(WalletTransaction.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
