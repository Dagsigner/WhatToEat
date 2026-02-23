"""Cooking history service — business logic for cooking records."""

from __future__ import annotations

from uuid import UUID

import structlog

from app.models.cooking_history import CookingHistory
from app.repositories.cooking_history import CookingHistoryRepository
from app.schemas.cooking_history import CookingHistoryCreate

logger = structlog.get_logger()


class CookingHistoryService:
    def __init__(self, repo: CookingHistoryRepository) -> None:
        self.repo = repo

    async def record(self, user_id: UUID, data: CookingHistoryCreate) -> CookingHistory:
        """Record that a user cooked a recipe (creates a new history entry)."""
        record_data = data.model_dump(exclude_unset=True)
        record_data["user_id"] = user_id

        history = CookingHistory(**record_data)
        await self.repo.create(history)
        logger.info("cooking_recorded", user_id=str(user_id), recipe_id=str(data.recipe_id))
        return history

    async def list_by_user(self, user_id: UUID) -> list[CookingHistory]:
        """Return all cooking history records for a given user."""
        return await self.repo.list_by_user(user_id)
