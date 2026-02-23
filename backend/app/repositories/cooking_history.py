"""Cooking history repository — data access for cooking records."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.cooking_history import CookingHistory
from app.repositories.base import BaseRepository


class CookingHistoryRepository(BaseRepository[CookingHistory]):
    model = CookingHistory

    async def list_by_user(self, user_id: UUID) -> list[CookingHistory]:
        result = await self.db.execute(
            select(CookingHistory)
            .where(CookingHistory.user_id == user_id)
            .options(selectinload(CookingHistory.recipe))
            .order_by(CookingHistory.cooked_at.desc())
        )
        return list(result.scalars().all())
