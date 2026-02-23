"""Recipe API router — client and admin endpoints, favorite and history."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import (
    PaginationParams,
    get_cooking_history_service,
    get_current_admin,
    get_current_user,
    get_favorite_service,
    get_pagination,
    get_recipe_service,
)
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.cooking_history import CookingHistoryCreate
from app.schemas.pagination import PaginatedResponse
from app.schemas.recipe import (
    FavoriteToggleResponse,
    HistoryToggleResponse,
    RecipeAdminListResponse,
    RecipeClientListResponse,
    RecipeCreate,
    RecipeDeleteResponse,
    RecipeDetailResponse,
    RecipeResponse,
    RecipeUpdate,
)
from app.services.cooking_history import CookingHistoryService
from app.services.favorite import FavoriteService
from app.services.recipe import RecipeService

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("", response_model=PaginatedResponse[RecipeClientListResponse], status_code=200)
async def list_recipes(
    pagination: PaginationParams = Depends(get_pagination),
    category_id: UUID | None = Query(None),
    search: str | None = Query(None),
    slug: str | None = Query(None),
    is_in_history: bool | None = Query(None),
    is_favorited: bool | None = Query(None),
    current_user: User = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service),
) -> PaginatedResponse[RecipeClientListResponse]:
    return await service.list_client(
        pagination, current_user.id,
        category_id=category_id, search=search, slug=slug,
        is_in_history=is_in_history, is_favorited=is_favorited,
    )


@router.get("/admin", response_model=PaginatedResponse[RecipeAdminListResponse], status_code=200)
async def list_recipes_admin(
    pagination: PaginationParams = Depends(get_pagination),
    search: str | None = Query(None),
    slug: str | None = Query(None),
    is_active: bool | None = Query(None),
    category_id: UUID | None = Query(None),
    _admin: User = Depends(get_current_admin),
    service: RecipeService = Depends(get_recipe_service),
) -> PaginatedResponse[Recipe]:
    return await service.list(
        pagination, search=search, slug=slug, is_active=is_active, category_id=category_id,
    )


@router.get("/{recipe_id}/admin", response_model=RecipeResponse, status_code=200)
async def get_recipe_admin(
    recipe_id: UUID,
    _admin: User = Depends(get_current_admin),
    service: RecipeService = Depends(get_recipe_service),
) -> Recipe:
    return await service.get_by_id(recipe_id)


@router.post("/admin", response_model=RecipeResponse, status_code=201)
async def create_recipe_admin(
    data: RecipeCreate,
    _admin: User = Depends(get_current_admin),
    service: RecipeService = Depends(get_recipe_service),
) -> Recipe:
    recipe = await service.create(data)
    return await service.get_by_id(recipe.id)


@router.patch("/{recipe_id}/admin", response_model=RecipeResponse, status_code=200)
async def update_recipe_admin(
    recipe_id: UUID,
    data: RecipeUpdate,
    _admin: User = Depends(get_current_admin),
    service: RecipeService = Depends(get_recipe_service),
) -> Recipe:
    await service.update(recipe_id, data)
    return await service.get_by_id(recipe_id)


@router.delete("/{recipe_id}/admin", response_model=RecipeDeleteResponse, status_code=200)
async def delete_recipe_admin(
    recipe_id: UUID,
    _admin: User = Depends(get_current_admin),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeDeleteResponse:
    await service.delete(recipe_id)
    return RecipeDeleteResponse(id=recipe_id, is_deleted=True)


@router.get("/{recipe_id}", response_model=RecipeDetailResponse, status_code=200)
async def get_recipe(
    recipe_id: UUID,
    current_user: User = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeDetailResponse:
    return await service.get_client(recipe_id, current_user.id)


@router.post("/{recipe_id}/favorite", response_model=FavoriteToggleResponse, status_code=200)
async def add_favorite(
    recipe_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FavoriteService = Depends(get_favorite_service),
) -> FavoriteToggleResponse:
    await service.add(current_user.id, recipe_id)
    return FavoriteToggleResponse(id=recipe_id, is_favorited=True)


@router.delete("/{recipe_id}/favorite", response_model=FavoriteToggleResponse, status_code=200)
async def remove_favorite(
    recipe_id: UUID,
    current_user: User = Depends(get_current_user),
    service: FavoriteService = Depends(get_favorite_service),
) -> FavoriteToggleResponse:
    await service.remove(current_user.id, recipe_id)
    return FavoriteToggleResponse(id=recipe_id, is_favorited=False)


@router.post("/{recipe_id}/history", response_model=HistoryToggleResponse, status_code=200)
async def record_history(
    recipe_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CookingHistoryService = Depends(get_cooking_history_service),
) -> HistoryToggleResponse:
    await service.record(current_user.id, CookingHistoryCreate(recipe_id=recipe_id))
    return HistoryToggleResponse(id=recipe_id, is_in_history=True)
