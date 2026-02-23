"""User repository — data access for users and admins."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import ColumnElement, func, or_, select

from app.core.dependencies import PaginationParams
from app.models.user import Admin, User
from app.repositories.base import BaseRepository
from app.schemas.pagination import PaginatedResponse


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_tg_id(self, tg_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.tg_id == tg_id))
        return result.scalar_one_or_none()

    def build_search_filter(self, search: str) -> ColumnElement[bool]:
        pattern = f"%{search}%"
        return or_(
            User.username.ilike(pattern),
            User.first_name.ilike(pattern),
            User.last_name.ilike(pattern),
        )

    async def list_admin(
        self, pagination: PaginationParams, *, search: str | None = None,
    ) -> PaginatedResponse[User]:
        query = select(User)
        count_query = select(func.count()).select_from(User)

        if search:
            search_filter = self.build_search_filter(search)
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        return await self.list(
            pagination, base_query=query, count_query=count_query,
            order_by=User.created_at.desc(),
        )

    async def get_admin_by_username(self, username: str) -> Admin | None:
        result = await self.db.execute(select(Admin).where(Admin.username == username))
        return result.scalar_one_or_none()

    async def get_admin_by_user_id(self, user_id: UUID) -> Admin | None:
        result = await self.db.execute(select(Admin).where(Admin.user_id == user_id))
        return result.scalar_one_or_none()
