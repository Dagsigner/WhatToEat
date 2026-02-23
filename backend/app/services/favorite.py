"""Favorite service — business logic for favorite recipes."""

from __future__ import annotations

from uuid import UUID

import structlog

from app.core.exceptions import ConflictException, NotFoundException
from app.models.favorite import FavoriteRecipe
from app.repositories.favorite import FavoriteRepository

logger = structlog.get_logger()


class FavoriteService:
    def __init__(self, repo: FavoriteRepository) -> None:
        self.repo = repo

    async def add(self, user_id: UUID, recipe_id: UUID) -> FavoriteRecipe:
        """Add a recipe to user's favorites; raises ConflictException if already added."""
        existing = await self.repo.find(user_id, recipe_id)
        if existing is not None:
            raise ConflictException("Recipe is already in favorites")

        favorite = FavoriteRecipe(user_id=user_id, recipe_id=recipe_id)
        await self.repo.create(favorite)
        logger.info("favorite_added", user_id=str(user_id), recipe_id=str(recipe_id))
        return favorite

    async def remove(self, user_id: UUID, recipe_id: UUID) -> None:
        """Remove a recipe from user's favorites; raises NotFoundException if not found."""
        favorite = await self.repo.find(user_id, recipe_id)
        if favorite is None:
            raise NotFoundException("FavoriteRecipe", recipe_id)

        await self.repo.delete(favorite)
        logger.info("favorite_removed", user_id=str(user_id), recipe_id=str(recipe_id))

    async def list_by_user(self, user_id: UUID) -> list[FavoriteRecipe]:
        """Return all favorite recipe records for a given user."""
        return await self.repo.list_by_user(user_id)

    async def is_favorite(self, user_id: UUID, recipe_id: UUID) -> bool:
        """Check whether a recipe is in the user's favorites."""
        return await self.repo.find(user_id, recipe_id) is not None
