"""Step API router — admin endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import (
    PaginationParams,
    get_current_admin,
    get_pagination,
    get_step_service,
)
from app.models.step import Step
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.schemas.step import StepAdminResponse, StepCreate, StepDeleteResponse, StepUpdate
from app.services.step import StepService

router = APIRouter(prefix="/steps", tags=["steps"])


@router.get("/admin", response_model=PaginatedResponse[StepAdminResponse], status_code=200)
async def list_steps_admin(
    pagination: PaginationParams = Depends(get_pagination),
    search: str | None = Query(None),
    slug: str | None = Query(None),
    is_active: bool | None = Query(None),
    recipe_id: UUID | None = Query(None, description="Filter by recipe ID"),
    _admin: User = Depends(get_current_admin),
    service: StepService = Depends(get_step_service),
) -> PaginatedResponse[Step]:
    return await service.list_admin(
        pagination, search=search, slug=slug, is_active=is_active, recipe_id=recipe_id,
    )


@router.get("/{step_id}/admin", response_model=StepAdminResponse, status_code=200)
async def get_step_admin(
    step_id: UUID,
    _admin: User = Depends(get_current_admin),
    service: StepService = Depends(get_step_service),
) -> Step:
    return await service.get_by_id(step_id)


@router.post("/admin", response_model=StepAdminResponse, status_code=201)
async def create_step_admin(
    data: StepCreate,
    _admin: User = Depends(get_current_admin),
    service: StepService = Depends(get_step_service),
) -> Step:
    return await service.create(data)


@router.patch("/{step_id}/admin", response_model=StepAdminResponse, status_code=200)
async def update_step_admin(
    step_id: UUID,
    data: StepUpdate,
    _admin: User = Depends(get_current_admin),
    service: StepService = Depends(get_step_service),
) -> Step:
    return await service.update(step_id, data)


@router.delete("/{step_id}/admin", response_model=StepDeleteResponse, status_code=200)
async def delete_step_admin(
    step_id: UUID,
    _admin: User = Depends(get_current_admin),
    service: StepService = Depends(get_step_service),
) -> StepDeleteResponse:
    await service.delete(step_id)
    return StepDeleteResponse(id=step_id, is_deleted=True)
