"""Image Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    filename: str | None
    content_type: str | None
    size: int | None
    created_at: datetime
    updated_at: datetime


class ImageUploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    filename: str | None
    content_type: str | None
    size: int | None
    created_at: datetime
