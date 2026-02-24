"""Application configuration via environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = Field(
        ...,
        min_length=1,
        description="PostgreSQL connection URL (required)",
    )
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL",
    )

    jwt_secret_key: str = Field(
        ...,
        min_length=16,
        description="JWT signing key (required, min 16 chars)",
    )
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 30

    telegram_bot_token: str = ""

    cors_origins: str = ""

    app_env: str = "development"
    app_debug: bool = True


@lru_cache
def get_settings() -> Settings:
    """Cached singleton settings instance."""
    return Settings()
