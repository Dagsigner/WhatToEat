"""User API router — profile and admin CRUD endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import (
    PaginationParams,
    get_current_admin,
    get_current_user,
    get_pagination,
    get_user_service,
)
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import (
    UserAdminResponse,
    UserCreate,
    UserDeleteResponse,
    UserResponse,
    UserUpdate,
)
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse, status_code=200)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserResponse, status_code=200)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
) -> User:
    return await service.update(current_user.id, data)


@router.get("/admin", response_model=PaginatedResponse[UserAdminResponse], status_code=200)
async def list_users_admin(
    pagination: PaginationParams = Depends(get_pagination),
    search: str | None = Query(None),
    _admin: User = Depends(get_current_admin),
    service: UserService = Depends(get_user_service),
) -> PaginatedResponse[User]:
    return await service.list(pagination, search=search)


@router.get("/{user_id}/admin", response_model=UserAdminResponse, status_code=200)
async def get_user_admin(
    user_id: UUID,
    _admin: User = Depends(get_current_admin),
    service: UserService = Depends(get_user_service),
) -> User:
    return await service.get_by_id(user_id)


@router.post("/{user_id}/admin", response_model=UserAdminResponse, status_code=201)
async def create_user_admin(
    data: UserCreate,
    _admin: User = Depends(get_current_admin),
    service: UserService = Depends(get_user_service),
) -> User:
    return await service.create(data)


@router.patch("/{user_id}/admin", response_model=UserAdminResponse, status_code=200)
async def update_user_admin(
    user_id: UUID,
    data: UserUpdate,
    _admin: User = Depends(get_current_admin),
    service: UserService = Depends(get_user_service),
) -> User:
    return await service.update(user_id, data)


@router.delete("/{user_id}/admin", response_model=UserDeleteResponse, status_code=200)
async def delete_user_admin(
    user_id: UUID,
    _admin: User = Depends(get_current_admin),
    service: UserService = Depends(get_user_service),
) -> UserDeleteResponse:
    await service.delete(user_id)
    return UserDeleteResponse(id=user_id, is_deleted=True)
