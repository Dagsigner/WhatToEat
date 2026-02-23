"""Category API router — client and admin endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import (
    PaginationParams,
    get_category_service,
    get_current_admin,
    get_current_user,
    get_pagination,
)
from app.models.category import Category
from app.models.user import User
from app.schemas.category import (
    CategoryAdminResponse,
    CategoryClientResponse,
    CategoryCreate,
    CategoryDeleteResponse,
    CategoryResponse,
    CategoryUpdate,
)
from app.schemas.pagination import PaginatedResponse
from app.services.category import CategoryService

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryClientResponse], status_code=200)
async def list_categories(
    query: str | None = Query(None),
    _user: User = Depends(get_current_user),
    service: CategoryService = Depends(get_category_service),
) -> list[CategoryClientResponse]:
    return await service.list_client(query=query)


@router.get("/admin", response_model=PaginatedResponse[CategoryAdminResponse], status_code=200)
async def list_categories_admin(
    pagination: PaginationParams = Depends(get_pagination),
    search: str | None = Query(None),
    slug: str | None = Query(None),
    is_active: bool | None = Query(None),
    _admin: User = Depends(get_current_admin),
    service: CategoryService = Depends(get_category_service),
) -> PaginatedResponse[Category]:
    return await service.list(pagination, search=search, slug=slug, is_active=is_active)


@router.get("/{category_id}/admin", response_model=CategoryAdminResponse, status_code=200)
async def get_category_admin(
    category_id: UUID,
    _admin: User = Depends(get_current_admin),
    service: CategoryService = Depends(get_category_service),
) -> Category:
    return await service.get_by_id(category_id)


@router.post("/admin", response_model=CategoryAdminResponse, status_code=201)
async def create_category_admin(
    data: CategoryCreate,
    _admin: User = Depends(get_current_admin),
    service: CategoryService = Depends(get_category_service),
) -> Category:
    return await service.create(data)


@router.patch("/{category_id}/admin", response_model=CategoryAdminResponse, status_code=200)
async def update_category_admin(
    category_id: UUID,
    data: CategoryUpdate,
    _admin: User = Depends(get_current_admin),
    service: CategoryService = Depends(get_category_service),
) -> Category:
    return await service.update(category_id, data)


@router.delete("/{category_id}/admin", response_model=CategoryDeleteResponse, status_code=200)
async def delete_category_admin(
    category_id: UUID,
    _admin: User = Depends(get_current_admin),
    service: CategoryService = Depends(get_category_service),
) -> CategoryDeleteResponse:
    await service.delete(category_id)
    return CategoryDeleteResponse(id=category_id, is_deleted=True)
