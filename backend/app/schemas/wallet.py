from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class WalletTransactionResponse(BaseModel):
    id: str
    type: str
    description: str
    amount: float
    currency: str
    createdAt: datetime

    model_config = {"from_attributes": True}
