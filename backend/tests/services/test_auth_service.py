"""Unit tests for AuthService with in-memory fakes."""

from uuid import uuid4

import bcrypt
import pytest

from app.core.exceptions import UnauthorizedException
from app.core.security import create_access_token, create_refresh_token
from app.models.user import Admin, User
from app.services.auth import AuthService
from tests.services.conftest import FakeRedis, FakeUserRepository


@pytest.fixture
def service(fake_user_repo: FakeUserRepository, fake_redis: FakeRedis) -> AuthService:
    return AuthService(fake_user_repo, fake_redis)  # type: ignore[arg-type]


def _make_user(**overrides) -> User:
    defaults = dict(
        id=uuid4(), tg_id=123456, tg_username="testuser",
        username="testuser", first_name="Test", last_name="User",
        phone_number=None,
    )
    defaults.update(overrides)
    return User(**defaults)


def _make_admin(user: User, password: str) -> Admin:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    return Admin(
        id=uuid4(), user_id=user.id,
        username=f"admin_{user.tg_id}", password_hash=hashed,
    )


class TestAuthenticateAdmin:
    async def test_valid_credentials(
        self, service: AuthService, fake_user_repo: FakeUserRepository,
    ) -> None:
        user = _make_user()
        await fake_user_repo.create(user)
        admin = _make_admin(user, "secret123")
        fake_user_repo.add_admin(admin)

        result = await service.authenticate_admin(admin.username, "secret123")
        assert result.user_id == user.id
        assert result.access_token
        assert result.refresh_token

    async def test_wrong_password_raises(
        self, service: AuthService, fake_user_repo: FakeUserRepository,
    ) -> None:
        user = _make_user()
        await fake_user_repo.create(user)
        admin = _make_admin(user, "secret123")
        fake_user_repo.add_admin(admin)

        with pytest.raises(UnauthorizedException):
            await service.authenticate_admin(admin.username, "wrongpassword")

    async def test_nonexistent_admin_raises(self, service: AuthService) -> None:
        with pytest.raises(UnauthorizedException):
            await service.authenticate_admin("nobody", "pass")


class TestRefreshTokens:
    async def test_refresh_success(
        self, service: AuthService, fake_user_repo: FakeUserRepository,
    ) -> None:
        user = _make_user()
        await fake_user_repo.create(user)

        refresh = create_refresh_token(user.id)
        result = await service.refresh_tokens(refresh)
        assert result.access_token
        assert result.token_type == "Bearer"

    async def test_refresh_with_blacklisted_token_raises(
        self, service: AuthService, fake_user_repo: FakeUserRepository,
        fake_redis: FakeRedis,
    ) -> None:
        user = _make_user()
        await fake_user_repo.create(user)

        refresh = create_refresh_token(user.id)
        from app.core.security import decode_token_payload
        payload = decode_token_payload(refresh)
        jti = payload["jti"]
        await fake_redis.setex(f"bl:{jti}", 3600, "1")

        with pytest.raises(UnauthorizedException):
            await service.refresh_tokens(refresh)


class TestLogout:
    async def test_logout_without_token(self, service: AuthService) -> None:
        result = await service.logout(None)
        assert result.message == "Successfully logged out"

    async def test_logout_with_token_blacklists(
        self, service: AuthService, fake_user_repo: FakeUserRepository,
        fake_redis: FakeRedis,
    ) -> None:
        user = _make_user()
        await fake_user_repo.create(user)
        refresh = create_refresh_token(user.id)

        result = await service.logout(refresh)
        assert result.message == "Successfully logged out"

        from app.core.security import decode_token_payload
        payload = decode_token_payload(refresh)
        jti = payload["jti"]
        assert await fake_redis.exists(f"bl:{jti}") == 1
