"""Unit tests for IngredientService with in-memory fake repository."""

from uuid import uuid4

import pytest

from app.core.dependencies import PaginationParams
from app.core.exceptions import ConflictException, NotFoundException
from app.models.ingredient import Ingredient
from app.schemas.ingredient import IngredientCreate, IngredientUpdate
from app.services.ingredient import IngredientService
from tests.services.conftest import FakeIngredientRepository


@pytest.fixture
def service(fake_ingredient_repo: FakeIngredientRepository) -> IngredientService:
    return IngredientService(fake_ingredient_repo)  # type: ignore[arg-type]


def _make_ingredient(title: str = "Salt", slug: str = "salt") -> Ingredient:
    return Ingredient(id=uuid4(), title=title, unit_of_measurement="g", slug=slug, is_active=True)


class TestCreate:
    async def test_create_success(self, service: IngredientService) -> None:
        data = IngredientCreate(title="Sugar", unit_of_measurement="g", slug="sugar", is_active=True)
        result = await service.create(data)
        assert result.title == "Sugar"
        assert result.id is not None

    async def test_duplicate_title_raises_conflict(
        self, service: IngredientService, fake_ingredient_repo: FakeIngredientRepository,
    ) -> None:
        await fake_ingredient_repo.create(_make_ingredient(title="Salt", slug="salt"))
        data = IngredientCreate(title="Salt", unit_of_measurement="g", slug="salt-2", is_active=True)
        with pytest.raises(ConflictException):
            await service.create(data)

    async def test_duplicate_slug_raises_conflict(
        self, service: IngredientService, fake_ingredient_repo: FakeIngredientRepository,
    ) -> None:
        await fake_ingredient_repo.create(_make_ingredient(title="Salt", slug="salt"))
        data = IngredientCreate(title="Sea Salt", unit_of_measurement="g", slug="salt", is_active=True)
        with pytest.raises(ConflictException):
            await service.create(data)


class TestGetById:
    async def test_get_existing(
        self, service: IngredientService, fake_ingredient_repo: FakeIngredientRepository,
    ) -> None:
        ing = _make_ingredient()
        await fake_ingredient_repo.create(ing)
        result = await service.get_by_id(ing.id)
        assert result.id == ing.id

    async def test_get_nonexistent_raises(self, service: IngredientService) -> None:
        with pytest.raises(NotFoundException):
            await service.get_by_id(uuid4())


class TestList:
    async def test_returns_paginated(
        self, service: IngredientService, fake_ingredient_repo: FakeIngredientRepository,
    ) -> None:
        await fake_ingredient_repo.create(_make_ingredient("Salt", "salt"))
        await fake_ingredient_repo.create(_make_ingredient("Pepper", "pepper"))
        result = await service.list(PaginationParams(limit=20, offset=0))
        assert result.total == 2
        assert len(result.items) == 2


class TestUpdate:
    async def test_update_title(
        self, service: IngredientService, fake_ingredient_repo: FakeIngredientRepository,
    ) -> None:
        ing = _make_ingredient()
        await fake_ingredient_repo.create(ing)
        result = await service.update(ing.id, IngredientUpdate(title="Sea Salt"))
        assert result.title == "Sea Salt"
        assert result.slug == "salt"


class TestDelete:
    async def test_delete_existing(
        self, service: IngredientService, fake_ingredient_repo: FakeIngredientRepository,
    ) -> None:
        ing = _make_ingredient()
        await fake_ingredient_repo.create(ing)
        await service.delete(ing.id)
        with pytest.raises(NotFoundException):
            await service.get_by_id(ing.id)

    async def test_delete_nonexistent_raises(self, service: IngredientService) -> None:
        with pytest.raises(NotFoundException):
            await service.delete(uuid4())
