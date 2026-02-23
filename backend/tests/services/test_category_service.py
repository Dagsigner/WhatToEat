"""Unit tests for CategoryService with in-memory fake repository."""

from uuid import uuid4

import pytest

from app.core.dependencies import PaginationParams
from app.core.exceptions import ConflictException, NotFoundException
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.services.category import CategoryService
from tests.services.conftest import FakeCategoryRepository


@pytest.fixture
def service(fake_category_repo: FakeCategoryRepository) -> CategoryService:
    return CategoryService(fake_category_repo)  # type: ignore[arg-type]


@pytest.fixture
def sample_category() -> Category:
    return Category(id=uuid4(), title="Desserts", slug="desserts", is_active=True)


class TestCreate:
    async def test_create_success(self, service: CategoryService) -> None:
        data = CategoryCreate(title="Soups", slug="soups", is_active=True)
        result = await service.create(data)

        assert result.title == "Soups"
        assert result.slug == "soups"
        assert result.is_active is True

    async def test_create_duplicate_raises_conflict(
        self, service: CategoryService, fake_category_repo: FakeCategoryRepository,
    ) -> None:
        cat = Category(id=uuid4(), title="Soups", slug="soups", is_active=True)
        await fake_category_repo.create(cat)

        data = CategoryCreate(title="Soups", slug="soups-2", is_active=True)
        with pytest.raises(ConflictException):
            await service.create(data)


class TestGetById:
    async def test_get_existing(
        self, service: CategoryService, fake_category_repo: FakeCategoryRepository,
        sample_category: Category,
    ) -> None:
        await fake_category_repo.create(sample_category)
        result = await service.get_by_id(sample_category.id)
        assert result.id == sample_category.id

    async def test_get_nonexistent_raises(self, service: CategoryService) -> None:
        with pytest.raises(NotFoundException):
            await service.get_by_id(uuid4())


class TestList:
    async def test_list_returns_paginated(
        self, service: CategoryService, fake_category_repo: FakeCategoryRepository,
        sample_category: Category,
    ) -> None:
        await fake_category_repo.create(sample_category)
        pagination = PaginationParams(limit=20, offset=0)
        result = await service.list(pagination)

        assert result.total == 1
        assert len(result.items) == 1
        assert result.items[0].id == sample_category.id


class TestUpdate:
    async def test_update_partial(
        self, service: CategoryService, fake_category_repo: FakeCategoryRepository,
        sample_category: Category,
    ) -> None:
        await fake_category_repo.create(sample_category)
        data = CategoryUpdate(title="Updated Desserts")
        result = await service.update(sample_category.id, data)

        assert result.title == "Updated Desserts"
        assert result.slug == "desserts"


class TestDelete:
    async def test_delete_existing(
        self, service: CategoryService, fake_category_repo: FakeCategoryRepository,
        sample_category: Category,
    ) -> None:
        await fake_category_repo.create(sample_category)
        await service.delete(sample_category.id)

        with pytest.raises(NotFoundException):
            await service.get_by_id(sample_category.id)

    async def test_delete_nonexistent_raises(self, service: CategoryService) -> None:
        with pytest.raises(NotFoundException):
            await service.delete(uuid4())
