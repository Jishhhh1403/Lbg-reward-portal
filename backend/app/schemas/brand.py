from __future__ import annotations

from pydantic import BaseModel


class BrandResponse(BaseModel):
    id: str
    name: str
    category: str
    logoText: str
    color: str
    minRedeem: int | None = None
    logoUrl: str | None = None
    redirectUrl: str | None = None

    model_config = {"from_attributes": True}
