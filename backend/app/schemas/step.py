"""Step Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StepCreate(BaseModel):
    recipe_id: UUID = Field(...)
    step_number: int = Field(..., ge=1)
    title: str = Field(..., max_length=500)
    description: str | None = Field(None)
    photo_url: str | None = Field(None, max_length=2048)
    slug: str | None = Field(None, max_length=255)
    is_active: bool = Field(True)


class StepUpdate(BaseModel):
    step_number: int | None = Field(None, ge=1)
    title: str | None = Field(None, max_length=500)
    description: str | None = None
    photo_url: str | None = Field(None, max_length=2048)
    slug: str | None = Field(None, max_length=255)
    is_active: bool | None = None


class StepResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipe_id: UUID
    step_number: int
    title: str
    description: str | None
    photo_url: str | None
    created_at: datetime
    updated_at: datetime


class StepAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipe_id: UUID
    step_number: int
    title: str
    description: str | None
    photo_url: str | None
    is_active: bool
    slug: str | None
    created_at: datetime
    updated_at: datetime


class StepDeleteResponse(BaseModel):
    id: UUID
    is_deleted: bool = True
