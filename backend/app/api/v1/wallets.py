from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.repositories.wallet_repository import WalletRepository
from app.schemas.wallet import WalletTransactionResponse
from app.services.wallet_service import WalletService

router = APIRouter()


@router.get("/{customer_id}/transactions", response_model=list[WalletTransactionResponse])
async def list_transactions(
    customer_id: str,
    limit: int = Query(25),
    _user: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[WalletTransactionResponse]:
    wallet_repo = WalletRepository(db)
    wallet = await wallet_repo.get_by_customer_id(uuid.UUID(customer_id))
    if not wallet:
        return []
    service = WalletService(db)
    return await service.list_transactions(wallet.id, limit)
