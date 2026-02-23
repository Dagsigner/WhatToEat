"""Unit tests for RecipeService with in-memory fake repository."""

from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.core.dependencies import PaginationParams
from app.core.exceptions import NotFoundException
from app.models.recipe import Recipe
from app.schemas.recipe import RecipeCreate, RecipeUpdate
from app.services.recipe import RecipeService
from tests.services.conftest import FakeRecipeRepository


def _make_recipe(**overrides) -> Recipe:
    now = datetime.now(timezone.utc)
    defaults = dict(
        id=uuid4(), title="Test Recipe", photo_url="", description="desc",
        protein=None, fat=None, carbs=None, prep_time=10, cook_time=20,
        difficulty="medium", servings="2", slug="test-recipe",
        is_active=True, created_at=now, updated_at=now,
    )
    defaults.update(overrides)
    recipe = Recipe(**defaults)
    return recipe


@pytest.fixture
def service(fake_recipe_repo: FakeRecipeRepository) -> RecipeService:
    return RecipeService(fake_recipe_repo)  # type: ignore[arg-type]


class TestCreate:
    async def test_create_basic_recipe(self, service: RecipeService) -> None:
        data = RecipeCreate(
            title="Pasta", photo_url="", description="Italian pasta",
            prep_time=5, cook_time=15, difficulty="easy", servings="4",
            slug="pasta", is_active=True,
        )
        result = await service.create(data)
        assert result.title == "Pasta"
        assert result.id is not None

    async def test_create_with_category_ids(self, service: RecipeService) -> None:
        cat_id = uuid4()
        data = RecipeCreate(
            title="Salad", photo_url="", description="Fresh salad",
            prep_time=5, cook_time=0, difficulty="easy", servings="1",
            slug="salad", is_active=True, category_ids=[cat_id],
        )
        result = await service.create(data)
        assert result.title == "Salad"


class TestGetById:
    async def test_get_existing_recipe(
        self, service: RecipeService, fake_recipe_repo: FakeRecipeRepository,
    ) -> None:
        recipe = _make_recipe()
        fake_recipe_repo._store[recipe.id] = recipe
        result = await service.get_by_id(recipe.id)
        assert result.id == recipe.id

    async def test_get_nonexistent_raises(self, service: RecipeService) -> None:
        with pytest.raises(NotFoundException):
            await service.get_by_id(uuid4())


class TestList:
    async def test_list_returns_paginated(
        self, service: RecipeService, fake_recipe_repo: FakeRecipeRepository,
    ) -> None:
        r1 = _make_recipe(title="R1", slug="r1")
        r2 = _make_recipe(title="R2", slug="r2")
        fake_recipe_repo._store[r1.id] = r1
        fake_recipe_repo._store[r2.id] = r2

        pagination = PaginationParams(limit=20, offset=0)
        result = await service.list(pagination)

        assert result.total == 2
        assert len(result.items) == 2


class TestUpdate:
    async def test_update_title(
        self, service: RecipeService, fake_recipe_repo: FakeRecipeRepository,
    ) -> None:
        recipe = _make_recipe()
        fake_recipe_repo._store[recipe.id] = recipe

        data = RecipeUpdate(title="Updated Recipe")
        result = await service.update(recipe.id, data)
        assert result.title == "Updated Recipe"


class TestDelete:
    async def test_delete_existing(
        self, service: RecipeService, fake_recipe_repo: FakeRecipeRepository,
    ) -> None:
        recipe = _make_recipe()
        fake_recipe_repo._store[recipe.id] = recipe

        await service.delete(recipe.id)
        with pytest.raises(NotFoundException):
            await service.get_by_id(recipe.id)

    async def test_delete_nonexistent_raises(self, service: RecipeService) -> None:
        with pytest.raises(NotFoundException):
            await service.delete(uuid4())


class TestGetClient:
    async def test_get_client_returns_detail(
        self, service: RecipeService, fake_recipe_repo: FakeRecipeRepository,
    ) -> None:
        recipe = _make_recipe()
        fake_recipe_repo._store[recipe.id] = recipe

        user_id = uuid4()
        fake_recipe_repo._user_flags[(recipe.id, user_id)] = (True, False)

        result = await service.get_client(recipe.id, user_id)
        assert result.id == recipe.id
        assert result.is_favorited is True
        assert result.is_in_history is False
