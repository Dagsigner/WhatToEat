"""Category Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    title: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    is_active: bool = Field(True)


class CategoryUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    slug: str | None = Field(None, max_length=255)
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CategoryAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CategoryClientResponse(BaseModel):
    id: UUID
    title: str
    is_active: bool
    recipes_count: int = 0


class CategoryDeleteResponse(BaseModel):
    id: UUID
    is_deleted: bool = True
