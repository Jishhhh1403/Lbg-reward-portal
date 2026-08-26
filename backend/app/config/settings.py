from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/rewards"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/rewards"

    JWT_SECRET_KEY: str = "change-me-to-a-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
