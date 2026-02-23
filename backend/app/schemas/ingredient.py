"""Ingredient Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class IngredientCreate(BaseModel):
    title: str = Field(..., max_length=255)
    unit_of_measurement: str = Field(..., max_length=50)
    slug: str = Field(..., max_length=255)
    is_active: bool = Field(True)


class IngredientUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    unit_of_measurement: str | None = Field(None, max_length=50)
    slug: str | None = Field(None, max_length=255)
    is_active: bool | None = None


class IngredientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    unit_of_measurement: str
    slug: str


class IngredientAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    unit_of_measurement: str
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class IngredientDeleteResponse(BaseModel):
    id: UUID
    is_deleted: bool = True


class RecipeIngredientCreate(BaseModel):
    ingredient_id: UUID
    amount: Decimal = Field(..., ge=0)


class RecipeIngredientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ingredient_id: UUID
    amount: Decimal
    ingredient: IngredientResponse | None = None
