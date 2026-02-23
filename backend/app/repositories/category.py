"""Category repository — data access for categories."""

from __future__ import annotations

from typing import Any, Sequence

from sqlalchemy import Row, func, select

from app.core.dependencies import PaginationParams
from app.models.category import Category, RecipeCategory
from app.repositories.base import BaseRepository
from app.schemas.pagination import PaginatedResponse


class CategoryRepository(BaseRepository[Category]):
    model = Category

    async def find_by_title_or_slug(self, title: str, slug: str) -> Category | None:
        result = await self.db.execute(
            select(Category).where((Category.title == title) | (Category.slug == slug))
        )
        return result.scalar_one_or_none()

    async def list_admin(
        self, pagination: PaginationParams, *,
        search: str | None = None, is_active: bool | None = None, slug: str | None = None,
    ) -> PaginatedResponse[Category]:
        filters: list[Any] = []
        if search:
            filters.append(Category.title.ilike(f"%{search}%"))
        if is_active is not None:
            filters.append(Category.is_active == is_active)
        if slug:
            filters.append(Category.slug == slug)

        query = select(Category)
        count_query = select(func.count()).select_from(Category)
        for f in filters:
            query = query.where(f)
            count_query = count_query.where(f)

        return await self.list(
            pagination, base_query=query, count_query=count_query,
            order_by=Category.title.asc(),
        )

    async def list_client_with_counts(self, *, query: str | None = None) -> Sequence[Row[Any]]:
        stmt = (
            select(
                Category.id, Category.title, Category.is_active,
                func.count(RecipeCategory.recipe_id).label("recipes_count"),
            )
            .outerjoin(RecipeCategory, RecipeCategory.category_id == Category.id)
            .where(Category.is_active.is_(True))
            .group_by(Category.id)
            .order_by(Category.title.asc())
        )
        if query:
            stmt = stmt.where(Category.title.ilike(f"%{query}%"))
        result = await self.db.execute(stmt)
        return result.all()
