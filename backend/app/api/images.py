"""Image API router — admin-only endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Response

from app.core.dependencies import get_current_admin, get_image_service, get_pagination, PaginationParams
from app.models.image import Image
from app.models.user import User
from app.schemas.image import ImageResponse
from app.schemas.pagination import PaginatedResponse
from app.services.image import ImageService

router = APIRouter(prefix="/images", tags=["images"])


@router.get("", response_model=PaginatedResponse[ImageResponse], status_code=200)
async def list_images(
    pagination: PaginationParams = Depends(get_pagination),
    _admin: User = Depends(get_current_admin),
    service: ImageService = Depends(get_image_service),
) -> PaginatedResponse[Image]:
    return await service.list(pagination)


@router.delete("/{image_id}", status_code=204)
async def delete_image(
    image_id: UUID,
    _admin: User = Depends(get_current_admin),
    service: ImageService = Depends(get_image_service),
) -> Response:
    await service.delete(image_id)
    return Response(status_code=204)
