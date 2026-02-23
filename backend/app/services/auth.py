"""Auth service — Telegram authentication, admin login, and token management."""

from __future__ import annotations

from datetime import datetime, timezone

import bcrypt
import structlog
from redis.asyncio import Redis

from app.core.config import get_settings
from app.core.constants import REDIS_BLACKLIST_VALUE, TOKEN_TYPE
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    decode_token_payload,
    verify_telegram_hash,
)
from app.models.user import Admin, User
from app.repositories.user import UserRepository
from app.schemas.auth import (
    AdminLoginResponse,
    LoginResponse,
    LogoutResponse,
    RefreshResponse,
    TelegramAuthData,
)

logger = structlog.get_logger()

TOKEN_BLACKLIST_PREFIX = "bl:"


class AuthService:
    def __init__(self, repo: UserRepository, redis: Redis) -> None:
        self.repo = repo
        self.redis = redis

    async def authenticate_telegram(self, auth_data: TelegramAuthData) -> LoginResponse:
        """Verify Telegram hash, find-or-create user, and issue token pair."""
        settings = get_settings()
        data_dict = auth_data.model_dump(mode="json")
        data_str = {k: str(v) for k, v in data_dict.items() if v is not None}

        if not verify_telegram_hash(data_str, settings.telegram_bot_token):
            raise BadRequestException("Invalid Telegram authentication data")

        user = await self._get_or_create_user(auth_data)

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)

        logger.info("user_authenticated", user_id=str(user.id), tg_id=auth_data.id)
        return LoginResponse(
            user_id=user.id, tg_id=user.tg_id, tg_username=user.tg_username,
            phone_number=user.phone_number, access_token=access_token,
            refresh_token=refresh_token, token_type=TOKEN_TYPE,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

    async def authenticate_admin(self, username: str, password: str) -> AdminLoginResponse:
        """Validate admin credentials and return an access/refresh token pair."""
        settings = get_settings()
        admin = await self.repo.get_admin_by_username(username)

        if admin is None or admin.password_hash is None:
            raise UnauthorizedException("Invalid username or password")

        if not bcrypt.checkpw(password.encode("utf-8"), admin.password_hash.encode("utf-8")):
            raise UnauthorizedException("Invalid username or password")

        access_token = create_access_token(admin.user_id)
        refresh_token = create_refresh_token(admin.user_id)

        logger.info("admin_authenticated", user_id=str(admin.user_id), username=username)
        return AdminLoginResponse(
            user_id=admin.user_id, access_token=access_token,
            refresh_token=refresh_token, token_type=TOKEN_TYPE,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
            username=admin.username or username,
        )

    async def refresh_tokens(self, refresh_token: str) -> RefreshResponse:
        """Issue a new access token after verifying the refresh token is not blacklisted."""
        settings = get_settings()

        payload = decode_token_payload(refresh_token)
        jti = payload.get("jti")
        if jti and await self._is_blacklisted(jti):
            raise UnauthorizedException("Token has been revoked")

        user_id = decode_token(refresh_token, expected_type="refresh")
        user = await self.repo.get_or_none(user_id)
        if user is None:
            raise UnauthorizedException("User not found")

        access_token = create_access_token(user.id)
        logger.info("tokens_refreshed", user_id=str(user.id))
        return RefreshResponse(
            access_token=access_token, token_type=TOKEN_TYPE,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

    async def logout(self, refresh_token: str | None = None) -> LogoutResponse:
        """Blacklist the refresh token (if provided) so it cannot be reused."""
        if refresh_token:
            await self._blacklist_token(refresh_token)
        logger.info("user_logged_out")
        return LogoutResponse(message="Successfully logged out")

    async def _blacklist_token(self, token: str) -> None:
        """Add a token's jti to the Redis blacklist with TTL = remaining lifetime."""
        try:
            payload = decode_token_payload(token)
        except Exception:
            return

        jti = payload.get("jti")
        if not jti:
            return

        exp = payload.get("exp", 0)
        ttl = max(int(exp - datetime.now(timezone.utc).timestamp()), 0)
        if ttl > 0:
            await self.redis.setex(f"{TOKEN_BLACKLIST_PREFIX}{jti}", ttl, REDIS_BLACKLIST_VALUE)

    async def _is_blacklisted(self, jti: str) -> bool:
        return await self.redis.exists(f"{TOKEN_BLACKLIST_PREFIX}{jti}") > 0

    async def _get_or_create_user(self, auth_data: TelegramAuthData) -> User:
        user = await self.repo.get_by_tg_id(auth_data.id)

        if user is not None:
            user.tg_username = auth_data.username
            user.first_name = auth_data.first_name
            user.last_name = auth_data.last_name
            await self.repo.flush()
            return user

        user = User(
            tg_id=auth_data.id, tg_username=auth_data.username,
            first_name=auth_data.first_name, last_name=auth_data.last_name,
        )
        await self.repo.create(user)
        logger.info("user_created", user_id=str(user.id), tg_id=auth_data.id)
        return user
