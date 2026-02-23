"""Image service — business logic for image management."""

from __future__ import annotations

import uuid as uuid_mod
from pathlib import Path
from uuid import UUID

import structlog
from fastapi import UploadFile

from app.core.constants import DEFAULT_UPLOAD_SUBDIR, UPLOADS_DIR
from app.core.dependencies import PaginationParams
from app.core.exceptions import BadRequestException, NotFoundException
from app.models.image import Image
from app.repositories.image import ImageRepository
from app.schemas.pagination import PaginatedResponse

logger = structlog.get_logger()

UPLOAD_DIR = Path(UPLOADS_DIR)
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


class ImageService:
    def __init__(self, repo: ImageRepository) -> None:
        self.repo = repo

    async def list(self, pagination: PaginationParams) -> PaginatedResponse[Image]:
        """Return a paginated list of uploaded images, newest first."""
        return await self.repo.list(pagination, order_by=Image.created_at.desc())

    async def delete(self, image_id: UUID) -> None:
        """Delete an image record by ID; raises NotFoundException if missing."""
        image = await self.repo.get_by_id(image_id)
        await self.repo.delete(image)
        logger.info("image_deleted", image_id=str(image_id))

    async def upload(self, file: UploadFile, entity_type: str | None = None) -> Image:
        """Save uploaded file to disk and create an Image record; validates content type."""
        if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
            raise BadRequestException(
                f"Unsupported file type: {file.content_type}. "
                f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}"
            )

        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        file_ext = ""
        if file.filename:
            file_ext = Path(file.filename).suffix
        unique_name = f"{uuid_mod.uuid4().hex}{file_ext}"

        sub_dir = UPLOAD_DIR / (entity_type or DEFAULT_UPLOAD_SUBDIR)
        sub_dir.mkdir(parents=True, exist_ok=True)

        file_path = sub_dir / unique_name
        contents = await file.read()
        file_path.write_bytes(contents)

        url = f"/{UPLOADS_DIR}/{entity_type or DEFAULT_UPLOAD_SUBDIR}/{unique_name}"

        image = Image(
            url=url, filename=file.filename,
            content_type=file.content_type, size=len(contents),
        )
        await self.repo.create(image)

        logger.info(
            "image_uploaded", image_id=str(image.id),
            filename=file.filename, size=len(contents), entity_type=entity_type,
        )
        return image
