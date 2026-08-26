from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse
from app.schemas.customer import DashboardDataResponse
from app.services.customer_service import CustomerService

router = APIRouter()


@router.post("/login/password", response_model=TokenResponse)
async def login_with_password(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    try:
        service = CustomerService(db)
        return await service.login_with_password(payload)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/signup", response_model=TokenResponse)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    try:
        service = CustomerService(db)
        return await service.signup(payload)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/lookup/summary", response_model=DashboardDataResponse)
async def get_summary_by_phone(
    phone: str = Query(...),
    _user: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardDataResponse:
    try:
        service = CustomerService(db)
        return await service.get_dashboard_summary_by_phone(phone)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{customer_id}/summary", response_model=DashboardDataResponse)
async def get_summary_by_id(
    customer_id: str,
    _user: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardDataResponse:
    try:
        service = CustomerService(db)
        return await service.get_dashboard_summary(uuid.UUID(customer_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
