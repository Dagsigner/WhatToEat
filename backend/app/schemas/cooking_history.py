"""Cooking history Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CookingHistoryCreate(BaseModel):
    recipe_id: UUID = Field(...)
    cooked_at: datetime | None = Field(None)


class CookingHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    recipe_id: UUID
    cooked_at: datetime
    created_at: datetime
