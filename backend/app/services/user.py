"""User service — business logic for user management."""

from __future__ import annotations

from uuid import UUID

import structlog

from app.core.dependencies import PaginationParams
from app.core.exceptions import ConflictException
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import UserCreate, UserUpdate

logger = structlog.get_logger()


class UserService:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    async def get_by_id(self, user_id: UUID) -> User:
        """Return a user by primary key; raises NotFoundException if missing."""
        return await self.repo.get_by_id(user_id)

    async def get_by_tg_id(self, tg_id: int) -> User | None:
        """Look up a user by their Telegram ID, returning None when not found."""
        return await self.repo.get_by_tg_id(tg_id)

    async def list(
        self, pagination: PaginationParams, *, search: str | None = None,
    ) -> PaginatedResponse[User]:
        """Return a paginated list of users with optional full-text search."""
        return await self.repo.list_admin(pagination, search=search)

    async def create(self, data: UserCreate) -> User:
        """Create a new user; raises ConflictException if tg_id is already taken."""
        existing = await self.repo.get_by_tg_id(data.tg_id)
        if existing is not None:
            raise ConflictException(f"User with tg_id '{data.tg_id}' already exists")

        user = User(**data.model_dump())
        await self.repo.create(user)
        logger.info("user_created", user_id=str(user.id), tg_id=data.tg_id)
        return user

    async def update(self, user_id: UUID, data: UserUpdate) -> User:
        """Partially update a user, applying only the fields provided."""
        user = await self.repo.get_by_id(user_id)
        update_data = data.model_dump(exclude_unset=True)
        user = await self.repo.update(user, update_data)
        logger.info("user_updated", user_id=str(user_id), fields=list(update_data.keys()))
        return user

    async def delete(self, user_id: UUID) -> None:
        """Delete a user by ID; raises NotFoundException if missing."""
        user = await self.repo.get_by_id(user_id)
        await self.repo.delete(user)
        logger.info("user_deleted", user_id=str(user_id))
