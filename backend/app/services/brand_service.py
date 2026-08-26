from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.brand_repository import BrandRepository
from app.schemas.brand import BrandResponse


class BrandService:
    def __init__(self, db: AsyncSession) -> None:
        self.brand_repo = BrandRepository(db)

    async def list_brands(self) -> list[BrandResponse]:
        brands = await self.brand_repo.get_all(limit=100)
        return [
            BrandResponse(
                id=b.id,
                name=b.name,
                category=b.category,
                logoText=b.logo_text,
                color=b.color,
                minRedeem=b.min_redeem,
                logoUrl=b.logo_url,
                redirectUrl=b.redirect_url,
            )
            for b in brands
        ]
