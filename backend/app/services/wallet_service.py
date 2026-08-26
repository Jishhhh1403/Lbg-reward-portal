from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.wallet_repository import WalletRepository
from app.schemas.wallet import WalletTransactionResponse


class WalletService:
    def __init__(self, db: AsyncSession) -> None:
        self.wallet_repo = WalletRepository(db)

    async def list_transactions(self, wallet_id: uuid.UUID, limit: int = 25) -> list[WalletTransactionResponse]:
        txs = await self.wallet_repo.get_transactions(wallet_id, limit)
        return [
            WalletTransactionResponse(
                id=str(tx.id),
                type=tx.type.value if hasattr(tx.type, "value") else tx.type,
                description=tx.description,
                amount=tx.amount,
                currency=tx.currency.value if hasattr(tx.currency, "value") else tx.currency,
                createdAt=tx.created_at,
            )
            for tx in txs
        ]
