from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BrandPointsLedger, Customer, Reward, RewardStatus, Wallet
from app.repositories.brand_repository import BrandRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.reward_repository import RewardRepository
from app.repositories.wallet_repository import WalletRepository
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse
from app.schemas.customer import CustomerSummaryResponse, DashboardDataResponse, PointsProviderResponse
from app.utils import hash_password, verify_password
from app.services.jwt import create_access_token
from app.database.seed import reseed_customer_demo_balance


class CustomerService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.customer_repo = CustomerRepository(db)
        self.wallet_repo = WalletRepository(db)
        self.reward_repo = RewardRepository(db)
        self.brand_repo = BrandRepository(db)

    async def signup(self, payload: SignupRequest) -> TokenResponse:
        if await self.customer_repo.get_by_phone(payload.phone):
            raise ValueError("Phone number already registered")
        if await self.customer_repo.get_by_email(payload.email):
            raise ValueError("Email already registered")

        customer = Customer(
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            password_hash=hash_password(payload.password),
        )
        customer = await self.customer_repo.create(customer)

        wallet = Wallet(customer_id=customer.id, lbg_coin_balance=0.0)
        await self.wallet_repo.create(wallet)

        token = create_access_token(str(customer.id))
        return TokenResponse(
            access_token=token,
            customer_id=str(customer.id),
            user_name=customer.name,
            phone=customer.phone,
        )

    async def login_with_password(self, payload: LoginRequest) -> TokenResponse:
        customer = await self.customer_repo.get_by_phone(payload.phone)
        if not customer or not verify_password(payload.password, customer.password_hash):
            raise ValueError("Invalid phone number or password")

        # Restore the seeded demo balances so every login re-shows a fresh demo.
        await reseed_customer_demo_balance(self.db, customer)

        token = create_access_token(str(customer.id))
        return TokenResponse(
            access_token=token,
            customer_id=str(customer.id),
            user_name=customer.name,
            phone=customer.phone,
        )

    async def get_dashboard_summary(self, customer_id: uuid.UUID) -> DashboardDataResponse:
        return await self._build_summary(lambda: self.customer_repo.get_by_id(customer_id))

    async def get_dashboard_summary_by_customer_id(self, customer_id: str) -> DashboardDataResponse:
        # Persona (demo) login path: seed fresh balances before building the summary.
        customer = await self.customer_repo.get_by_customer_id(customer_id)
        if customer:
            await reseed_customer_demo_balance(self.db, customer)
        return await self._build_summary(lambda: customer)

    async def _build_summary(self, loader) -> DashboardDataResponse:
        customer = await loader()
        if not customer:
            raise ValueError("Customer not found")

        wallet = await self.wallet_repo.get_by_customer_id(customer.id)
        brand_points = await self.reward_repo.get_brand_points_by_customer(customer.id)

        total_brand_points = sum(bp.available_points for bp in brand_points)
        brands_connected = len(brand_points)

        points_by_brand: list[PointsProviderResponse] = []
        for bp in brand_points:
            brand = await self.brand_repo.get_by_id(bp.brand_id)
            if brand:
                points_by_brand.append(PointsProviderResponse(
                    brandId=brand.id,
                    brandName=brand.name,
                    category=brand.category,
                    points=bp.available_points,
                    color=brand.color,
                    logoText=brand.logo_text,
                    logoUrl=brand.logo_url,
                    redirectUrl=brand.redirect_url,
                ))

        summary = CustomerSummaryResponse(
            customerId=str(customer.id),
            userName=customer.name,
            phone=customer.phone,
            email=customer.email,
            totalLbgCoins=wallet.lbg_coin_balance if wallet else 0.0,
            totalBrandPoints=total_brand_points,
            brandsConnected=brands_connected,
            tier=customer.tier,
            lastSyncedAt=datetime.now(timezone.utc),
        )

        return DashboardDataResponse(customer=summary, pointsByBrand=points_by_brand)

    async def get_dashboard_summary_by_phone(self, phone: str) -> DashboardDataResponse:
        customer = await self.customer_repo.get_by_phone(phone)
        if not customer:
            raise ValueError("Customer not found")
        return await self.get_dashboard_summary(customer.id)
