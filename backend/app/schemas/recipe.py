"""Recipe Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.recipe import DifficultyEnum
from app.schemas.category import CategoryResponse
from app.schemas.ingredient import RecipeIngredientResponse
from app.schemas.step import StepResponse


class RecipeCreate(BaseModel):
    title: str = Field(..., max_length=500)
    photo_url: str = Field("", max_length=2048)
    description: str = Field(...)
    protein: Decimal | None = Field(None, ge=0)
    fat: Decimal | None = Field(None, ge=0)
    carbs: Decimal | None = Field(None, ge=0)
    prep_time: int = Field(..., ge=0)
    cook_time: int = Field(..., ge=0)
    difficulty: str = Field(DifficultyEnum.MEDIUM.value)
    servings: str = Field(..., max_length=50)
    slug: str = Field(..., max_length=255)
    is_active: bool = Field(True)
    ingredient_ids: list[dict] | None = Field(None)
    category_ids: list[UUID] | None = Field(None)


class RecipeUpdate(BaseModel):
    title: str | None = Field(None, max_length=500)
    photo_url: str | None = Field(None, max_length=2048)
    description: str | None = None
    protein: Decimal | None = None
    fat: Decimal | None = None
    carbs: Decimal | None = None
    prep_time: int | None = Field(None, ge=0)
    cook_time: int | None = Field(None, ge=0)
    difficulty: str | None = None
    servings: str | None = Field(None, max_length=50)
    slug: str | None = Field(None, max_length=255)
    is_active: bool | None = None
    categories: list[UUID] | None = Field(None)
    ingredients: list[dict] | None = Field(None)


class RecipeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    photo_url: str
    description: str
    protein: Decimal | None
    fat: Decimal | None
    carbs: Decimal | None
    prep_time: int
    cook_time: int
    difficulty: str
    servings: str
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    steps: list[StepResponse] = []
    recipe_ingredients: list[RecipeIngredientResponse] = []
    categories: list[CategoryResponse] = []


class RecipeClientListResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    photo_url: str
    prep_time: int
    cook_time: int
    difficulty: str
    servings: str
    is_favorited: bool = False
    is_in_history: bool = False


class RecipeAdminListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    photo_url: str
    protein: Decimal | None
    fat: Decimal | None
    carbs: Decimal | None
    prep_time: int
    cook_time: int
    difficulty: str
    servings: str
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class RecipeDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    photo_url: str
    description: str
    protein: Decimal | None
    fat: Decimal | None
    carbs: Decimal | None
    prep_time: int
    cook_time: int
    difficulty: str
    servings: str
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    steps: list[StepResponse] = []
    recipe_ingredients: list[RecipeIngredientResponse] = []
    categories: list[CategoryResponse] = []
    is_favorited: bool = False
    is_in_history: bool = False


class FavoriteToggleResponse(BaseModel):
    id: UUID
    is_favorited: bool


class HistoryToggleResponse(BaseModel):
    id: UUID
    is_in_history: bool


class RecipeDeleteResponse(BaseModel):
    id: UUID
    is_deleted: bool = True
