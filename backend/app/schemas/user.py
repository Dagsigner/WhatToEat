"""User Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserUpdate(BaseModel):
    username: str | None = Field(None, max_length=255)
    phone_number: str | None = Field(None, max_length=20)
    first_name: str | None = Field(None, max_length=255)
    last_name: str | None = Field(None, max_length=255)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tg_id: int
    tg_username: str | None
    username: str | None
    phone_number: str | None
    first_name: str | None
    last_name: str | None
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    tg_id: int = Field(...)
    tg_username: str | None = Field(None, max_length=255)
    username: str | None = Field(None, max_length=255)
    phone_number: str | None = Field(None, max_length=20)
    first_name: str | None = Field(None, max_length=255)
    last_name: str | None = Field(None, max_length=255)


class UserAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tg_id: int
    tg_username: str | None
    username: str | None
    phone_number: str | None
    first_name: str | None
    last_name: str | None
    created_at: datetime
    updated_at: datetime


class UserDeleteResponse(BaseModel):
    id: UUID
    is_deleted: bool = True
