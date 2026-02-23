"""Unit tests for StepService with in-memory fake repository."""

from uuid import UUID, uuid4

import pytest

from app.core.dependencies import PaginationParams
from app.core.exceptions import NotFoundException
from app.models.step import Step
from app.schemas.step import StepCreate, StepUpdate
from app.services.step import StepService
from tests.services.conftest import FakeStepRepository


@pytest.fixture
def service(fake_step_repo: FakeStepRepository) -> StepService:
    return StepService(fake_step_repo)  # type: ignore[arg-type]


def _make_step(
    recipe_id: UUID | None = None,
    step_number: int = 1,
    title: str = "Boil water",
) -> Step:
    return Step(
        id=uuid4(),
        recipe_id=recipe_id or uuid4(),
        step_number=step_number,
        title=title,
        description=None,
        photo_url=None,
        slug=None,
        is_active=True,
    )


class TestCreate:
    async def test_create_success(self, service: StepService) -> None:
        recipe_id = uuid4()
        data = StepCreate(recipe_id=recipe_id, step_number=1, title="Mix ingredients", is_active=True)
        result = await service.create(data)
        assert result.title == "Mix ingredients"
        assert result.recipe_id == recipe_id
        assert result.id is not None


class TestGetById:
    async def test_get_existing(
        self, service: StepService, fake_step_repo: FakeStepRepository,
    ) -> None:
        step = _make_step()
        await fake_step_repo.create(step)
        result = await service.get_by_id(step.id)
        assert result.id == step.id

    async def test_get_nonexistent_raises(self, service: StepService) -> None:
        with pytest.raises(NotFoundException):
            await service.get_by_id(uuid4())


class TestListAdmin:
    async def test_returns_paginated(
        self, service: StepService, fake_step_repo: FakeStepRepository,
    ) -> None:
        await fake_step_repo.create(_make_step(step_number=1, title="Step 1"))
        await fake_step_repo.create(_make_step(step_number=2, title="Step 2"))
        result = await service.list_admin(PaginationParams(limit=20, offset=0))
        assert result.total == 2
        assert len(result.items) == 2


class TestUpdate:
    async def test_update_title(
        self, service: StepService, fake_step_repo: FakeStepRepository,
    ) -> None:
        step = _make_step()
        await fake_step_repo.create(step)
        result = await service.update(step.id, StepUpdate(title="New title"))
        assert result.title == "New title"
        assert result.step_number == step.step_number


class TestDelete:
    async def test_delete_existing(
        self, service: StepService, fake_step_repo: FakeStepRepository,
    ) -> None:
        step = _make_step()
        await fake_step_repo.create(step)
        await service.delete(step.id)
        with pytest.raises(NotFoundException):
            await service.get_by_id(step.id)

    async def test_delete_nonexistent_raises(self, service: StepService) -> None:
        with pytest.raises(NotFoundException):
            await service.delete(uuid4())
