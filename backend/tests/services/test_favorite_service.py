"""Unit tests for FavoriteService with in-memory fake repository."""

from uuid import uuid4

import pytest

from app.core.exceptions import ConflictException, NotFoundException
from app.models.favorite import FavoriteRecipe
from app.services.favorite import FavoriteService
from tests.services.conftest import FakeFavoriteRepository


@pytest.fixture
def service(fake_favorite_repo: FakeFavoriteRepository) -> FavoriteService:
    return FavoriteService(fake_favorite_repo)  # type: ignore[arg-type]


class TestAdd:
    async def test_add_success(self, service: FavoriteService) -> None:
        user_id = uuid4()
        recipe_id = uuid4()
        result = await service.add(user_id, recipe_id)
        assert result.user_id == user_id
        assert result.recipe_id == recipe_id

    async def test_add_duplicate_raises_conflict(
        self, service: FavoriteService, fake_favorite_repo: FakeFavoriteRepository,
    ) -> None:
        user_id = uuid4()
        recipe_id = uuid4()
        fav = FavoriteRecipe(id=uuid4(), user_id=user_id, recipe_id=recipe_id)
        await fake_favorite_repo.create(fav)
        with pytest.raises(ConflictException):
            await service.add(user_id, recipe_id)


class TestRemove:
    async def test_remove_success(
        self, service: FavoriteService, fake_favorite_repo: FakeFavoriteRepository,
    ) -> None:
        user_id = uuid4()
        recipe_id = uuid4()
        fav = FavoriteRecipe(id=uuid4(), user_id=user_id, recipe_id=recipe_id)
        await fake_favorite_repo.create(fav)
        await service.remove(user_id, recipe_id)
        assert await fake_favorite_repo.find(user_id, recipe_id) is None

    async def test_remove_not_found_raises(self, service: FavoriteService) -> None:
        with pytest.raises(NotFoundException):
            await service.remove(uuid4(), uuid4())


class TestListByUser:
    async def test_returns_only_user_favorites(
        self, service: FavoriteService, fake_favorite_repo: FakeFavoriteRepository,
    ) -> None:
        user_id = uuid4()
        fav1 = FavoriteRecipe(id=uuid4(), user_id=user_id, recipe_id=uuid4())
        fav2 = FavoriteRecipe(id=uuid4(), user_id=user_id, recipe_id=uuid4())
        other = FavoriteRecipe(id=uuid4(), user_id=uuid4(), recipe_id=uuid4())
        for f in [fav1, fav2, other]:
            await fake_favorite_repo.create(f)
        result = await service.list_by_user(user_id)
        assert len(result) == 2


class TestIsFavorite:
    async def test_is_favorite_true(
        self, service: FavoriteService, fake_favorite_repo: FakeFavoriteRepository,
    ) -> None:
        user_id = uuid4()
        recipe_id = uuid4()
        fav = FavoriteRecipe(id=uuid4(), user_id=user_id, recipe_id=recipe_id)
        await fake_favorite_repo.create(fav)
        assert await service.is_favorite(user_id, recipe_id) is True

    async def test_is_favorite_false(self, service: FavoriteService) -> None:
        assert await service.is_favorite(uuid4(), uuid4()) is False
