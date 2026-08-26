from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Brand
from app.repositories.base import BaseRepository


class BrandRepository(BaseRepository[Brand]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Brand, db)
