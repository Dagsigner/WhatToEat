"""Shared fixtures for service-layer unit tests — in-memory fake repositories."""

from __future__ import annotations

from typing import Any, Sequence
from uuid import UUID, uuid4

import pytest
from sqlalchemy import Row

from app.core.dependencies import PaginationParams
from app.core.exceptions import NotFoundException
from app.models.category import Category, RecipeCategory
from app.models.ingredient import RecipeIngredient
from app.models.recipe import Recipe
from app.models.user import Admin, User
from app.schemas.pagination import PaginatedResponse


class FakeRepository:
    """In-memory repository base for unit tests."""

    def __init__(self) -> None:
        self._store: dict[UUID, Any] = {}

    async def get_by_id(self, entity_id: UUID, *, options: list | None = None) -> Any:
        entity = self._store.get(entity_id)
        if entity is None:
            raise NotFoundException("Entity", entity_id)
        return entity

    async def get_or_none(self, entity_id: UUID) -> Any | None:
        return self._store.get(entity_id)

    async def create(self, entity: Any) -> Any:
        if not hasattr(entity, "id") or entity.id is None:
            entity.id = uuid4()
        self._store[entity.id] = entity
        return entity

    async def update(self, entity: Any, data: dict) -> Any:
        for field, value in data.items():
            setattr(entity, field, value)
        return entity

    async def delete(self, entity: Any) -> None:
        self._store.pop(entity.id, None)

    def add(self, entity: Any) -> None:
        pass

    async def flush(self) -> None:
        pass

    async def list(
        self, pagination: PaginationParams, *,
        base_query: Any = None, count_query: Any = None, order_by: Any = None,
    ) -> PaginatedResponse:
        items = list(self._store.values())
        return PaginatedResponse(
            items=items[pagination.offset : pagination.offset + pagination.limit],
            total=len(items),
            limit=pagination.limit,
            offset=pagination.offset,
        )


class FakeRecipeRepository(FakeRepository):
    def __init__(self) -> None:
        super().__init__()
        self._user_flags: dict[tuple[UUID, UUID], tuple[bool, bool]] = {}

    async def get_with_relations(self, recipe_id: UUID) -> Recipe | None:
        return self._store.get(recipe_id)

    async def list_admin(
        self, pagination: PaginationParams, **kwargs: Any,
    ) -> PaginatedResponse[Recipe]:
        items = list(self._store.values())
        return PaginatedResponse(
            items=items[pagination.offset : pagination.offset + pagination.limit],
            total=len(items),
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def list_client(
        self, limit: int, offset: int, user_id: UUID, **kwargs: Any,
    ) -> tuple[Sequence[Row[Any]], int]:
        return [], 0

    async def get_user_flags(self, recipe_id: UUID, user_id: UUID) -> tuple[bool, bool]:
        return self._user_flags.get((recipe_id, user_id), (False, False))

    async def replace_categories(self, recipe_id: UUID, category_ids: list[UUID]) -> None:
        pass

    async def replace_ingredients(self, recipe_id: UUID, ingredients: list[dict]) -> None:
        pass


class FakeCategoryRepository(FakeRepository):
    async def find_by_title_or_slug(self, title: str, slug: str) -> Category | None:
        for cat in self._store.values():
            if cat.title == title or cat.slug == slug:
                return cat
        return None

    async def list_admin(
        self, pagination: PaginationParams, **kwargs: Any,
    ) -> PaginatedResponse[Category]:
        items = list(self._store.values())
        return PaginatedResponse(
            items=items[pagination.offset : pagination.offset + pagination.limit],
            total=len(items),
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def list_client_with_counts(self, *, query: str | None = None) -> Sequence[Any]:
        return []


class FakeUserRepository(FakeRepository):
    def __init__(self) -> None:
        super().__init__()
        self._admins: dict[str, Admin] = {}
        self._admins_by_user_id: dict[UUID, Admin] = {}
        self._by_tg_id: dict[int, User] = {}

    async def create(self, entity: Any) -> Any:
        result = await super().create(entity)
        if isinstance(entity, User) and entity.tg_id is not None:
            self._by_tg_id[entity.tg_id] = entity
        return result

    async def get_by_tg_id(self, tg_id: int) -> User | None:
        return self._by_tg_id.get(tg_id)

    def build_search_filter(self, search: str) -> Any:
        return None

    async def list_admin(
        self, pagination: PaginationParams, **kwargs: Any,
    ) -> PaginatedResponse[User]:
        items = list(self._store.values())
        return PaginatedResponse(
            items=items[pagination.offset : pagination.offset + pagination.limit],
            total=len(items),
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def get_admin_by_username(self, username: str) -> Admin | None:
        return self._admins.get(username)

    async def get_admin_by_user_id(self, user_id: UUID) -> Admin | None:
        return self._admins_by_user_id.get(user_id)

    def add_admin(self, admin: Admin) -> None:
        if admin.username:
            self._admins[admin.username] = admin
        self._admins_by_user_id[admin.user_id] = admin


class FakeIngredientRepository(FakeRepository):
    async def find_by_title_or_slug(self, title: str, slug: str) -> Any | None:
        for item in self._store.values():
            if item.title == title or item.slug == slug:
                return item
        return None

    async def list_admin(
        self, pagination: PaginationParams, **kwargs: Any,
    ) -> PaginatedResponse:
        items = list(self._store.values())
        return PaginatedResponse(
            items=items[pagination.offset : pagination.offset + pagination.limit],
            total=len(items),
            limit=pagination.limit,
            offset=pagination.offset,
        )


class FakeStepRepository(FakeRepository):
    async def list_admin(
        self, pagination: PaginationParams, **kwargs: Any,
    ) -> PaginatedResponse:
        items = list(self._store.values())
        return PaginatedResponse(
            items=items[pagination.offset : pagination.offset + pagination.limit],
            total=len(items),
            limit=pagination.limit,
            offset=pagination.offset,
        )


class FakeImageRepository(FakeRepository):
    pass


class FakeFavoriteRepository(FakeRepository):
    async def find(self, user_id: UUID, recipe_id: UUID) -> Any | None:
        for item in self._store.values():
            if item.user_id == user_id and item.recipe_id == recipe_id:
                return item
        return None

    async def list_by_user(self, user_id: UUID) -> list:
        return [item for item in self._store.values() if item.user_id == user_id]


class FakeCookingHistoryRepository(FakeRepository):
    async def list_by_user(self, user_id: UUID) -> list:
        return [item for item in self._store.values() if item.user_id == user_id]


class FakeRedis:
    """Minimal Redis stub for auth service tests."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[str, int | None]] = {}

    async def setex(self, key: str, ttl: int, value: str) -> None:
        self._store[key] = (value, ttl)

    async def exists(self, key: str) -> int:
        return 1 if key in self._store else 0

    async def get(self, key: str) -> str | None:
        pair = self._store.get(key)
        return pair[0] if pair else None


@pytest.fixture
def fake_recipe_repo() -> FakeRecipeRepository:
    return FakeRecipeRepository()


@pytest.fixture
def fake_category_repo() -> FakeCategoryRepository:
    return FakeCategoryRepository()


@pytest.fixture
def fake_user_repo() -> FakeUserRepository:
    return FakeUserRepository()


@pytest.fixture
def fake_ingredient_repo() -> FakeIngredientRepository:
    return FakeIngredientRepository()


@pytest.fixture
def fake_step_repo() -> FakeStepRepository:
    return FakeStepRepository()


@pytest.fixture
def fake_image_repo() -> FakeImageRepository:
    return FakeImageRepository()


@pytest.fixture
def fake_favorite_repo() -> FakeFavoriteRepository:
    return FakeFavoriteRepository()


@pytest.fixture
def fake_cooking_history_repo() -> FakeCookingHistoryRepository:
    return FakeCookingHistoryRepository()


@pytest.fixture
def fake_redis() -> FakeRedis:
    return FakeRedis()
