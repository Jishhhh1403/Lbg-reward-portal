from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.reward import RewardResponse
from app.services.reward_service import RewardService

router = APIRouter()


@router.get("", response_model=list[RewardResponse])
async def list_rewards(
    customer_id: str = Query(...),
    status: str = Query("EARNED"),
    limit: int = Query(500),
    _user: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[RewardResponse]:
    service = RewardService(db)
    return await service.list_rewards_by_customer(uuid.UUID(customer_id), status, limit)
