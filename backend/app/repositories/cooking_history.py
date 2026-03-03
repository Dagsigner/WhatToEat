"""Cooking history repository — data access for cooking records."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func

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

    async def has_record_today(self, user_id: UUID) -> bool:
        """Check if user already has a cooking history record for today."""
        today_start = datetime.combine(date.today(), time.min)
        result = await self.db.execute(
            select(CookingHistory.id)
            .where(
                CookingHistory.user_id == user_id,
                CookingHistory.cooked_at >= today_start,
            )
            .limit(1)
        )
        return result.first() is not None

    async def list_recent_by_user(self, user_id: UUID, days: int = 7) -> list[CookingHistory]:
        """Return cooking history records for the last N days with recipe data."""
        cutoff = datetime.combine(date.today(), time.min) - timedelta(days=days - 1)
        result = await self.db.execute(
            select(CookingHistory)
            .where(
                CookingHistory.user_id == user_id,
                CookingHistory.cooked_at >= cutoff,
            )
            .options(selectinload(CookingHistory.recipe))
            .order_by(CookingHistory.cooked_at.asc())
        )
        return list(result.scalars().all())
