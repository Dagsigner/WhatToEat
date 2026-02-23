"""Step service — business logic for recipe steps."""

from __future__ import annotations

from uuid import UUID

import structlog

from app.core.dependencies import PaginationParams
from app.models.step import Step
from app.repositories.step import StepRepository
from app.schemas.pagination import PaginatedResponse
from app.schemas.step import StepCreate, StepUpdate

logger = structlog.get_logger()


class StepService:
    def __init__(self, repo: StepRepository) -> None:
        self.repo = repo

    async def create(self, data: StepCreate) -> Step:
        """Create a recipe step with the given step number and content."""
        step = Step(**data.model_dump())
        await self.repo.create(step)
        logger.info("step_created", step_id=str(step.id), recipe_id=str(data.recipe_id))
        return step

    async def get_by_id(self, step_id: UUID) -> Step:
        """Return a step by primary key; raises NotFoundException if missing."""
        return await self.repo.get_by_id(step_id)

    async def list_admin(
        self, pagination: PaginationParams, *,
        search: str | None = None, is_active: bool | None = None, slug: str | None = None,
        recipe_id: UUID | None = None,
    ) -> PaginatedResponse[Step]:
        """Return a paginated admin list of steps with optional filters."""
        return await self.repo.list_admin(
            pagination, search=search, is_active=is_active, slug=slug, recipe_id=recipe_id,
        )

    async def update(self, step_id: UUID, data: StepUpdate) -> Step:
        """Partially update a step, applying only the fields provided."""
        step = await self.repo.get_by_id(step_id)
        update_data = data.model_dump(exclude_unset=True)
        step = await self.repo.update(step, update_data)
        logger.info("step_updated", step_id=str(step_id))
        return step

    async def delete(self, step_id: UUID) -> None:
        """Delete a step by ID; raises NotFoundException if missing."""
        step = await self.repo.get_by_id(step_id)
        await self.repo.delete(step)
        logger.info("step_deleted", step_id=str(step_id))
