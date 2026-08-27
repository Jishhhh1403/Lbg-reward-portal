from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class AlphaMedicolSummaryResponse(BaseModel):
    hasAccount: bool
    alphamedicolPoints: float
    totalLbgPoints: float
    phone: str | None = None


class AlphaMedicolTransferRequest(BaseModel):
    customer_email: str
    points_to_transfer: float
    idempotency_key: str | None = None


class AlphaMedicolTransferResponse(BaseModel):
    transactionId: str
    pointsTransferred: float
    lbgCoinsIssued: float
    completedAt: datetime

    model_config = {"from_attributes": True}
