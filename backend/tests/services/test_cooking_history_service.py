"""Unit tests for CookingHistoryService with in-memory fake repository."""

from uuid import uuid4

import pytest

from app.models.cooking_history import CookingHistory
from app.schemas.cooking_history import CookingHistoryCreate
from app.services.cooking_history import CookingHistoryService
from tests.services.conftest import FakeCookingHistoryRepository


@pytest.fixture
def service(fake_cooking_history_repo: FakeCookingHistoryRepository) -> CookingHistoryService:
    return CookingHistoryService(fake_cooking_history_repo)  # type: ignore[arg-type]


class TestRecord:
    async def test_record_creates_entry(self, service: CookingHistoryService) -> None:
        user_id = uuid4()
        recipe_id = uuid4()
        result = await service.record(user_id, CookingHistoryCreate(recipe_id=recipe_id))
        assert result.user_id == user_id
        assert result.recipe_id == recipe_id

    async def test_record_sets_user_id(self, service: CookingHistoryService) -> None:
        user_id = uuid4()
        result = await service.record(user_id, CookingHistoryCreate(recipe_id=uuid4()))
        assert result.user_id == user_id


class TestListByUser:
    async def test_returns_only_user_records(
        self,
        service: CookingHistoryService,
        fake_cooking_history_repo: FakeCookingHistoryRepository,
    ) -> None:
        user_id = uuid4()
        h1 = CookingHistory(id=uuid4(), user_id=user_id, recipe_id=uuid4())
        h2 = CookingHistory(id=uuid4(), user_id=user_id, recipe_id=uuid4())
        other = CookingHistory(id=uuid4(), user_id=uuid4(), recipe_id=uuid4())
        for h in [h1, h2, other]:
            await fake_cooking_history_repo.create(h)
        result = await service.list_by_user(user_id)
        assert len(result) == 2

    async def test_empty_for_unknown_user(self, service: CookingHistoryService) -> None:
        result = await service.list_by_user(uuid4())
        assert result == []
