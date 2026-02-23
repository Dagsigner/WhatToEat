"""Unit tests for ImageService with in-memory fake repository."""

from pathlib import Path
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.core.dependencies import PaginationParams
from app.core.exceptions import BadRequestException, NotFoundException
from app.models.image import Image
from app.services.image import ImageService
from tests.services.conftest import FakeImageRepository


@pytest.fixture
def service(fake_image_repo: FakeImageRepository) -> ImageService:
    return ImageService(fake_image_repo)  # type: ignore[arg-type]


def _make_upload_file(
    content: bytes = b"img",
    content_type: str = "image/jpeg",
    filename: str = "test.jpg",
) -> AsyncMock:
    mock = AsyncMock()
    mock.content_type = content_type
    mock.filename = filename
    mock.read = AsyncMock(return_value=content)
    return mock


def _make_image() -> Image:
    return Image(
        id=uuid4(), url="/uploads/test.jpg",
        filename="test.jpg", content_type="image/jpeg", size=100,
    )


class TestList:
    async def test_returns_paginated(
        self, service: ImageService, fake_image_repo: FakeImageRepository,
    ) -> None:
        await fake_image_repo.create(_make_image())
        result = await service.list(PaginationParams(limit=20, offset=0))
        assert result.total == 1
        assert len(result.items) == 1

    async def test_empty_store_returns_zero(self, service: ImageService) -> None:
        result = await service.list(PaginationParams(limit=20, offset=0))
        assert result.total == 0


class TestDelete:
    async def test_delete_existing(
        self, service: ImageService, fake_image_repo: FakeImageRepository,
    ) -> None:
        img = _make_image()
        await fake_image_repo.create(img)
        await service.delete(img.id)
        with pytest.raises(NotFoundException):
            await service.delete(img.id)

    async def test_delete_nonexistent_raises(self, service: ImageService) -> None:
        with pytest.raises(NotFoundException):
            await service.delete(uuid4())


class TestUpload:
    async def test_upload_valid_jpeg(
        self, service: ImageService, tmp_path: Path,
    ) -> None:
        file = _make_upload_file(b"fake-image-bytes", "image/jpeg", "photo.jpg")
        with patch("app.services.image.UPLOAD_DIR", tmp_path):
            result = await service.upload(file)
        assert result.content_type == "image/jpeg"
        assert result.filename == "photo.jpg"
        assert result.size == len(b"fake-image-bytes")
        assert result.id is not None

    async def test_upload_invalid_content_type_raises(
        self, service: ImageService, tmp_path: Path,
    ) -> None:
        file = _make_upload_file(b"data", "text/plain", "file.txt")
        with patch("app.services.image.UPLOAD_DIR", tmp_path):
            with pytest.raises(BadRequestException):
                await service.upload(file)

    async def test_upload_with_entity_type(
        self, service: ImageService, tmp_path: Path,
    ) -> None:
        file = _make_upload_file(b"bytes", "image/png", "avatar.png")
        with patch("app.services.image.UPLOAD_DIR", tmp_path):
            result = await service.upload(file, entity_type="recipes")
        assert "recipes" in result.url
