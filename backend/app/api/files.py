"""Files API router — upload endpoint."""

from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.core.dependencies import get_current_admin, get_image_service
from app.models.user import User
from app.schemas.image import ImageUploadResponse
from app.services.image import ImageService

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", response_model=ImageUploadResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    entity_type: str | None = Query(None),
    _admin: User = Depends(get_current_admin),
    service: ImageService = Depends(get_image_service),
) -> ImageUploadResponse:
    return await service.upload(file, entity_type)
