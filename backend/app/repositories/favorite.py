"""Favorite repository — data access for favorite recipes."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload

from app.models.favorite import FavoriteRecipe
from app.repositories.base import BaseRepository


class FavoriteRepository(BaseRepository[FavoriteRecipe]):
    model = FavoriteRecipe

    async def find(self, user_id: UUID, recipe_id: UUID) -> FavoriteRecipe | None:
        result = await self.db.execute(
            select(FavoriteRecipe).where(
                and_(FavoriteRecipe.user_id == user_id, FavoriteRecipe.recipe_id == recipe_id)
            )
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: UUID) -> list[FavoriteRecipe]:
        result = await self.db.execute(
            select(FavoriteRecipe)
            .where(FavoriteRecipe.user_id == user_id)
            .options(selectinload(FavoriteRecipe.recipe))
            .order_by(FavoriteRecipe.created_at.desc())
        )
        return list(result.scalars().all())
