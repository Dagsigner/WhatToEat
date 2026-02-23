"""Ingredient repository — data access for ingredients."""

from __future__ import annotations

from typing import Any

from sqlalchemy import func, select

from app.core.dependencies import PaginationParams
from app.models.ingredient import Ingredient
from app.repositories.base import BaseRepository
from app.schemas.pagination import PaginatedResponse


class IngredientRepository(BaseRepository[Ingredient]):
    model = Ingredient

    async def find_by_title_or_slug(self, title: str, slug: str) -> Ingredient | None:
        result = await self.db.execute(
            select(Ingredient).where((Ingredient.title == title) | (Ingredient.slug == slug))
        )
        return result.scalar_one_or_none()

    async def list_admin(
        self, pagination: PaginationParams, *,
        search: str | None = None, is_active: bool | None = None, slug: str | None = None,
    ) -> PaginatedResponse[Ingredient]:
        filters: list[Any] = []
        if search:
            filters.append(Ingredient.title.ilike(f"%{search}%"))
        if is_active is not None:
            filters.append(Ingredient.is_active == is_active)
        if slug:
            filters.append(Ingredient.slug == slug)

        query = select(Ingredient)
        count_query = select(func.count()).select_from(Ingredient)
        for f in filters:
            query = query.where(f)
            count_query = count_query.where(f)

        return await self.list(
            pagination, base_query=query, count_query=count_query,
            order_by=Ingredient.title.asc(),
        )
