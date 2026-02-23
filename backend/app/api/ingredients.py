"""Ingredient API router — client and admin endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import (
    PaginationParams,
    get_current_admin,
    get_current_user,
    get_ingredient_service,
    get_pagination,
)
from app.models.ingredient import Ingredient
from app.models.user import User
from app.schemas.ingredient import (
    IngredientAdminResponse,
    IngredientCreate,
    IngredientDeleteResponse,
    IngredientResponse,
    IngredientUpdate,
)
from app.schemas.pagination import PaginatedResponse
from app.services.ingredient import IngredientService

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.get("", response_model=PaginatedResponse[IngredientResponse], status_code=200)
async def list_ingredients(
    pagination: PaginationParams = Depends(get_pagination),
    search: str | None = Query(None),
    slug: str | None = Query(None),
    _user: User = Depends(get_current_user),
    service: IngredientService = Depends(get_ingredient_service),
) -> PaginatedResponse[Ingredient]:
    return await service.list(pagination, search=search, slug=slug, is_active=True)


@router.get("/admin", response_model=PaginatedResponse[IngredientAdminResponse], status_code=200)
async def list_ingredients_admin(
    pagination: PaginationParams = Depends(get_pagination),
    search: str | None = Query(None),
    slug: str | None = Query(None),
    is_active: bool | None = Query(None),
    _admin: User = Depends(get_current_admin),
    service: IngredientService = Depends(get_ingredient_service),
) -> PaginatedResponse[Ingredient]:
    return await service.list(pagination, search=search, slug=slug, is_active=is_active)


@router.get("/{ingredient_id}/admin", response_model=IngredientAdminResponse, status_code=200)
async def get_ingredient_admin(
    ingredient_id: UUID,
    _admin: User = Depends(get_current_admin),
    service: IngredientService = Depends(get_ingredient_service),
) -> Ingredient:
    return await service.get_by_id(ingredient_id)


@router.post("/admin", response_model=IngredientAdminResponse, status_code=201)
async def create_ingredient_admin(
    data: IngredientCreate,
    _admin: User = Depends(get_current_admin),
    service: IngredientService = Depends(get_ingredient_service),
) -> Ingredient:
    return await service.create(data)


@router.patch("/{ingredient_id}/admin", response_model=IngredientAdminResponse, status_code=200)
async def update_ingredient_admin(
    ingredient_id: UUID,
    data: IngredientUpdate,
    _admin: User = Depends(get_current_admin),
    service: IngredientService = Depends(get_ingredient_service),
) -> Ingredient:
    return await service.update(ingredient_id, data)


@router.delete("/{ingredient_id}/admin", response_model=IngredientDeleteResponse, status_code=200)
async def delete_ingredient_admin(
    ingredient_id: UUID,
    _admin: User = Depends(get_current_admin),
    service: IngredientService = Depends(get_ingredient_service),
) -> IngredientDeleteResponse:
    await service.delete(ingredient_id)
    return IngredientDeleteResponse(id=ingredient_id, is_deleted=True)


@router.get("/{ingredient_id}", response_model=IngredientResponse, status_code=200)
async def get_ingredient(
    ingredient_id: UUID,
    _user: User = Depends(get_current_user),
    service: IngredientService = Depends(get_ingredient_service),
) -> Ingredient:
    return await service.get_by_id(ingredient_id)
