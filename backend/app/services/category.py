"""Category service — business logic for category management."""

from __future__ import annotations

from uuid import UUID

import structlog

from app.core.dependencies import PaginationParams
from app.core.exceptions import ConflictException
from app.models.category import Category
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryClientResponse, CategoryCreate, CategoryUpdate
from app.schemas.pagination import PaginatedResponse

logger = structlog.get_logger()


class CategoryService:
    def __init__(self, repo: CategoryRepository) -> None:
        self.repo = repo

    async def create(self, data: CategoryCreate) -> Category:
        """Create a category; raises ConflictException if title or slug already exists."""
        existing = await self.repo.find_by_title_or_slug(data.title, data.slug)
        if existing is not None:
            raise ConflictException(f"Category '{data.title}' or slug '{data.slug}' already exists")

        category = Category(**data.model_dump())
        await self.repo.create(category)
        logger.info("category_created", category_id=str(category.id), title=data.title)
        return category

    async def get_by_id(self, category_id: UUID) -> Category:
        """Return a category by primary key; raises NotFoundException if missing."""
        return await self.repo.get_by_id(category_id)

    async def list(
        self, pagination: PaginationParams, *,
        search: str | None = None, is_active: bool | None = None, slug: str | None = None,
    ) -> PaginatedResponse[Category]:
        """Return a paginated admin list of categories with optional filters."""
        return await self.repo.list_admin(
            pagination, search=search, is_active=is_active, slug=slug,
        )

    async def list_client(self, *, query: str | None = None) -> list[CategoryClientResponse]:
        """Return active categories with their recipe counts for client-facing UI."""
        rows = await self.repo.list_client_with_counts(query=query)
        return [
            CategoryClientResponse(id=r.id, title=r.title, is_active=r.is_active, recipes_count=r.recipes_count)
            for r in rows
        ]

    async def update(self, category_id: UUID, data: CategoryUpdate) -> Category:
        """Partially update a category, applying only the fields provided."""
        category = await self.repo.get_by_id(category_id)
        update_data = data.model_dump(exclude_unset=True)
        category = await self.repo.update(category, update_data)
        logger.info("category_updated", category_id=str(category_id))
        return category

    async def delete(self, category_id: UUID) -> None:
        """Delete a category by ID; raises NotFoundException if missing."""
        category = await self.repo.get_by_id(category_id)
        await self.repo.delete(category)
        logger.info("category_deleted", category_id=str(category_id))
