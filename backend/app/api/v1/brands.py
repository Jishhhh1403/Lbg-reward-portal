from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.brand import BrandResponse
from app.services.brand_service import BrandService

router = APIRouter()


@router.get("", response_model=list[BrandResponse])
async def list_brands(
    _user: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BrandResponse]:
    service = BrandService(db)
    return await service.list_brands()
