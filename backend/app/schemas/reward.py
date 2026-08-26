from __future__ import annotations

from pydantic import BaseModel


class RewardResponse(BaseModel):
    id: str
    brandId: str
    rewardId: str | None = None
    status: str
    points: float

    model_config = {"from_attributes": True}
