"""Shared FastAPI dependencies — DI wiring for sessions, auth, services."""

from collections.abc import AsyncGenerator

from fastapi import Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.redis import get_redis as _get_redis
from app.core.security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


# ── Session ──────────────────────────────────────────────────────────────────

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ── Redis ────────────────────────────────────────────────────────────────────

async def get_redis_dep() -> Redis:
    return await _get_redis()


# ── Auth ─────────────────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db_session),
):  # -> User (deferred to avoid circular import)
    from app.models.user import User
    from app.repositories.user import UserRepository

    if credentials is None:
        raise UnauthorizedException("Authorization header missing")

    user_id = decode_token(credentials.credentials, expected_type="access")

    repo = UserRepository(db)
    user: User | None = await repo.get_or_none(user_id)
    if user is None:
        raise UnauthorizedException("User not found")
    return user


async def get_current_admin(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):  # -> User (deferred to avoid circular import)
    from app.repositories.user import UserRepository

    repo = UserRepository(db)
    admin = await repo.get_admin_by_user_id(current_user.id)
    if admin is None:
        raise ForbiddenException("Admin access required")
    return current_user


# ── Pagination ───────────────────────────────────────────────────────────────

class PaginationParams:
    def __init__(
        self,
        limit: int = 20,
        offset: int = 0,
    ) -> None:
        self.limit = limit
        self.offset = offset


def get_pagination(
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
) -> PaginationParams:
    return PaginationParams(limit=limit, offset=offset)


# ── Service factories (Phase 4 DI) ──────────────────────────────────────────

async def get_user_service(db: AsyncSession = Depends(get_db_session)):
    from app.services.user import UserService
    from app.repositories.user import UserRepository
    return UserService(UserRepository(db))


async def get_category_service(db: AsyncSession = Depends(get_db_session)):
    from app.services.category import CategoryService
    from app.repositories.category import CategoryRepository
    return CategoryService(CategoryRepository(db))


async def get_ingredient_service(db: AsyncSession = Depends(get_db_session)):
    from app.services.ingredient import IngredientService
    from app.repositories.ingredient import IngredientRepository
    return IngredientService(IngredientRepository(db))


async def get_recipe_service(db: AsyncSession = Depends(get_db_session)):
    from app.services.recipe import RecipeService
    from app.repositories.recipe import RecipeRepository
    return RecipeService(RecipeRepository(db))


async def get_step_service(db: AsyncSession = Depends(get_db_session)):
    from app.services.step import StepService
    from app.repositories.step import StepRepository
    return StepService(StepRepository(db))


async def get_image_service(db: AsyncSession = Depends(get_db_session)):
    from app.services.image import ImageService
    from app.repositories.image import ImageRepository
    return ImageService(ImageRepository(db))


async def get_favorite_service(db: AsyncSession = Depends(get_db_session)):
    from app.services.favorite import FavoriteService
    from app.repositories.favorite import FavoriteRepository
    return FavoriteService(FavoriteRepository(db))


async def get_cooking_history_service(db: AsyncSession = Depends(get_db_session)):
    from app.services.cooking_history import CookingHistoryService
    from app.repositories.cooking_history import CookingHistoryRepository
    return CookingHistoryService(CookingHistoryRepository(db))


async def get_auth_service(
    db: AsyncSession = Depends(get_db_session),
    redis: Redis = Depends(get_redis_dep),
):
    from app.services.auth import AuthService
    from app.repositories.user import UserRepository
    return AuthService(UserRepository(db), redis)
