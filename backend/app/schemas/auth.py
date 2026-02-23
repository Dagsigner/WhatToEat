"""Auth Pydantic schemas."""

from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import TOKEN_TYPE


class TelegramAuthData(BaseModel):
    id: int = Field(..., description="Telegram user ID")
    first_name: str | None = Field(None)
    last_name: str | None = Field(None)
    username: str | None = Field(None)
    photo_url: str | None = Field(None)
    auth_date: int = Field(...)
    hash: str = Field(...)
    phone_number: str | None = Field(None)
    tg_username: str | None = Field(None)


class AdminLoginRequest(BaseModel):
    username: str = Field(...)
    password: str = Field(...)


class LoginResponse(BaseModel):
    user_id: UUID
    tg_id: int
    tg_username: str | None = None
    phone_number: str | None = None
    access_token: str
    refresh_token: str
    token_type: str = TOKEN_TYPE
    expires_in: int


class AdminLoginResponse(BaseModel):
    user_id: UUID
    access_token: str
    refresh_token: str
    token_type: str = TOKEN_TYPE
    expires_in: int
    username: str


class RefreshRequest(BaseModel):
    refresh_token: str = Field(...)


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = TOKEN_TYPE
    expires_in: int


class LogoutRequest(BaseModel):
    refresh_token: str | None = Field(None)


class LogoutResponse(BaseModel):
    message: str
