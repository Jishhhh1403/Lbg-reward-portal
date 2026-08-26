from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Customer
from app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Customer, db)

    async def get_by_phone(self, phone: str) -> Customer | None:
        result = await self.db.execute(select(Customer).where(Customer.phone == phone))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Customer | None:
        result = await self.db.execute(select(Customer).where(Customer.email == email))
        return result.scalar_one_or_none()
