"""Unit tests for UserService with in-memory fake repository."""

from uuid import uuid4

import pytest

from app.core.dependencies import PaginationParams
from app.core.exceptions import ConflictException, NotFoundException
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.user import UserService
from tests.services.conftest import FakeUserRepository


@pytest.fixture
def service(fake_user_repo: FakeUserRepository) -> UserService:
    return UserService(fake_user_repo)  # type: ignore[arg-type]


def _make_user(tg_id: int = 123456) -> User:
    return User(id=uuid4(), tg_id=tg_id)


class TestGetById:
    async def test_get_existing(
        self, service: UserService, fake_user_repo: FakeUserRepository,
    ) -> None:
        user = _make_user()
        await fake_user_repo.create(user)
        result = await service.get_by_id(user.id)
        assert result.id == user.id

    async def test_get_nonexistent_raises(self, service: UserService) -> None:
        with pytest.raises(NotFoundException):
            await service.get_by_id(uuid4())


class TestGetByTgId:
    async def test_found(
        self, service: UserService, fake_user_repo: FakeUserRepository,
    ) -> None:
        user = _make_user(tg_id=999)
        await fake_user_repo.create(user)
        result = await service.get_by_tg_id(999)
        assert result is not None
        assert result.tg_id == 999

    async def test_not_found(self, service: UserService) -> None:
        result = await service.get_by_tg_id(0)
        assert result is None


class TestList:
    async def test_returns_paginated(
        self, service: UserService, fake_user_repo: FakeUserRepository,
    ) -> None:
        await fake_user_repo.create(_make_user(tg_id=1))
        await fake_user_repo.create(_make_user(tg_id=2))
        result = await service.list(PaginationParams(limit=20, offset=0))
        assert result.total == 2
        assert len(result.items) == 2


class TestCreate:
    async def test_create_success(self, service: UserService) -> None:
        result = await service.create(UserCreate(tg_id=42))
        assert result.tg_id == 42
        assert result.id is not None

    async def test_duplicate_tg_id_raises_conflict(
        self, service: UserService, fake_user_repo: FakeUserRepository,
    ) -> None:
        await fake_user_repo.create(_make_user(tg_id=77))
        with pytest.raises(ConflictException):
            await service.create(UserCreate(tg_id=77))


class TestUpdate:
    async def test_update_username(
        self, service: UserService, fake_user_repo: FakeUserRepository,
    ) -> None:
        user = _make_user()
        await fake_user_repo.create(user)
        result = await service.update(user.id, UserUpdate(username="newname"))
        assert result.username == "newname"


class TestDelete:
    async def test_delete_existing(
        self, service: UserService, fake_user_repo: FakeUserRepository,
    ) -> None:
        user = _make_user()
        await fake_user_repo.create(user)
        await service.delete(user.id)
        with pytest.raises(NotFoundException):
            await service.get_by_id(user.id)

    async def test_delete_nonexistent_raises(self, service: UserService) -> None:
        with pytest.raises(NotFoundException):
            await service.delete(uuid4())
