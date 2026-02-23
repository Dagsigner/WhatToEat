"""Step repository — data access for recipe steps."""

from __future__ import annotations

from typing import Any

from sqlalchemy import func, select

from app.core.dependencies import PaginationParams
from app.models.step import Step
from app.repositories.base import BaseRepository
from app.schemas.pagination import PaginatedResponse


class StepRepository(BaseRepository[Step]):
    model = Step

    async def list_admin(
        self, pagination: PaginationParams, *,
        search: str | None = None, is_active: bool | None = None, slug: str | None = None,
        recipe_id: Any | None = None,
    ) -> PaginatedResponse[Step]:
        filters: list[Any] = []
        if search:
            filters.append(Step.title.ilike(f"%{search}%"))
        if is_active is not None:
            filters.append(Step.is_active == is_active)
        if slug:
            filters.append(Step.slug == slug)
        if recipe_id is not None:
            filters.append(Step.recipe_id == recipe_id)

        query = select(Step)
        count_query = select(func.count()).select_from(Step)
        for f in filters:
            query = query.where(f)
            count_query = count_query.where(f)

        return await self.list(
            pagination, base_query=query, count_query=count_query,
            order_by=Step.created_at.desc(),
        )
