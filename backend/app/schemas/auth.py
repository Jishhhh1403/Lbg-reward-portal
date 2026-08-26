from __future__ import annotations

from pydantic import BaseModel


class LoginRequest(BaseModel):
    phone: str
    password: str


class SignupRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer_id: str
    user_name: str
    phone: str
