from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.services.conversion_service import ConversionService

router = APIRouter()


class ConvertRequest(BaseModel):
    reward_id: str


@router.post("")
async def convert_reward(
    payload: ConvertRequest,
    _user: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        service = ConversionService(db)
        return await service.convert_reward(uuid.UUID(payload.reward_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
