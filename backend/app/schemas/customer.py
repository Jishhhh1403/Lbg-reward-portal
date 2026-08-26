from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models import TierName


class CustomerSummaryResponse(BaseModel):
    customerId: str
    userName: str
    phone: str
    totalLbgCoins: float
    totalBrandPoints: float
    brandsConnected: int
    tier: TierName
    lastSyncedAt: datetime

    model_config = {"from_attributes": True}


class PointsProviderResponse(BaseModel):
    brandId: str
    brandName: str
    category: str
    points: float
    color: str
    logoText: str
    logoUrl: str | None = None
    redirectUrl: str | None = None

    model_config = {"from_attributes": True}


class DashboardDataResponse(BaseModel):
    customer: CustomerSummaryResponse
    pointsByBrand: list[PointsProviderResponse]

    model_config = {"from_attributes": True}
