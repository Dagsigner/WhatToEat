"""Ingredient service — business logic for ingredient management."""

from __future__ import annotations

from uuid import UUID

import structlog

from app.core.dependencies import PaginationParams
from app.core.exceptions import ConflictException
from app.models.ingredient import Ingredient
from app.repositories.ingredient import IngredientRepository
from app.schemas.ingredient import IngredientCreate, IngredientUpdate
from app.schemas.pagination import PaginatedResponse

logger = structlog.get_logger()


class IngredientService:
    def __init__(self, repo: IngredientRepository) -> None:
        self.repo = repo

    async def create(self, data: IngredientCreate) -> Ingredient:
        """Create an ingredient; raises ConflictException if title or slug exists."""
        existing = await self.repo.find_by_title_or_slug(data.title, data.slug)
        if existing is not None:
            raise ConflictException(f"Ingredient '{data.title}' or slug '{data.slug}' already exists")

        ingredient = Ingredient(**data.model_dump())
        await self.repo.create(ingredient)
        logger.info("ingredient_created", ingredient_id=str(ingredient.id), title=data.title)
        return ingredient

    async def get_by_id(self, ingredient_id: UUID) -> Ingredient:
        """Return an ingredient by primary key; raises NotFoundException if missing."""
        return await self.repo.get_by_id(ingredient_id)

    async def list(
        self, pagination: PaginationParams, *,
        search: str | None = None, is_active: bool | None = None, slug: str | None = None,
    ) -> PaginatedResponse[Ingredient]:
        """Return a paginated list of ingredients with optional filters."""
        return await self.repo.list_admin(
            pagination, search=search, is_active=is_active, slug=slug,
        )

    async def update(self, ingredient_id: UUID, data: IngredientUpdate) -> Ingredient:
        """Partially update an ingredient, applying only the fields provided."""
        ingredient = await self.repo.get_by_id(ingredient_id)
        update_data = data.model_dump(exclude_unset=True)
        ingredient = await self.repo.update(ingredient, update_data)
        logger.info("ingredient_updated", ingredient_id=str(ingredient_id))
        return ingredient

    async def delete(self, ingredient_id: UUID) -> None:
        """Delete an ingredient by ID; raises NotFoundException if missing."""
        ingredient = await self.repo.get_by_id(ingredient_id)
        await self.repo.delete(ingredient)
        logger.info("ingredient_deleted", ingredient_id=str(ingredient_id))
