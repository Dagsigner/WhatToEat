"""Recipe service — business logic for recipe management."""

from __future__ import annotations

from uuid import UUID

import structlog

from app.core.dependencies import PaginationParams
from app.core.exceptions import NotFoundException
from app.models.category import RecipeCategory
from app.models.ingredient import RecipeIngredient
from app.models.recipe import Recipe
from app.repositories.recipe import RecipeRepository
from app.schemas.pagination import PaginatedResponse
from app.schemas.recipe import (
    RecipeClientListResponse,
    RecipeCreate,
    RecipeDetailResponse,
    RecipeUpdate,
)

logger = structlog.get_logger()


class RecipeService:
    def __init__(self, repo: RecipeRepository) -> None:
        self.repo = repo

    async def create(self, data: RecipeCreate) -> Recipe:
        """Create a recipe with optional ingredient and category associations."""
        recipe_data = data.model_dump(exclude={"ingredient_ids", "category_ids"})
        recipe = Recipe(**recipe_data)
        await self.repo.create(recipe)

        if data.ingredient_ids:
            for item in data.ingredient_ids:
                self.repo.add(RecipeIngredient(
                    recipe_id=recipe.id, ingredient_id=item["ingredient_id"], amount=item["amount"],
                ))

        if data.category_ids:
            for cid in data.category_ids:
                self.repo.add(RecipeCategory(recipe_id=recipe.id, category_id=cid))

        await self.repo.flush()
        logger.info("recipe_created", recipe_id=str(recipe.id), title=recipe.title)
        return recipe

    async def get_by_id(self, recipe_id: UUID) -> Recipe:
        """Fetch a recipe with all relations eagerly loaded; raises NotFoundException."""
        recipe = await self.repo.get_with_relations(recipe_id)
        if recipe is None:
            raise NotFoundException("Recipe", recipe_id)
        return recipe

    async def list(
        self, pagination: PaginationParams, *,
        difficulty: str | None = None, search: str | None = None,
        is_active: bool | None = None, category_id: UUID | None = None,
        slug: str | None = None,
    ) -> PaginatedResponse[Recipe]:
        """Return a paginated admin list of recipes with optional filters."""
        return await self.repo.list_admin(
            pagination, search=search, is_active=is_active, slug=slug,
            difficulty=difficulty, category_id=category_id,
        )

    async def list_client(
        self, pagination: PaginationParams, user_id: UUID, *,
        category_id: UUID | None = None, search: str | None = None, slug: str | None = None,
        is_in_history: bool | None = None, is_favorited: bool | None = None,
    ) -> PaginatedResponse[RecipeClientListResponse]:
        """Return a paginated client-facing recipe list with favorite/history flags."""
        rows, total = await self.repo.list_client(
            pagination.limit, pagination.offset, user_id,
            category_id=category_id, search=search, slug=slug,
            is_in_history=is_in_history, is_favorited=is_favorited,
        )
        items = [
            RecipeClientListResponse(
                id=r.id, slug=r.slug, title=r.title, photo_url=r.photo_url,
                prep_time=r.prep_time, cook_time=r.cook_time, difficulty=r.difficulty,
                servings=r.servings, is_favorited=r.is_favorited, is_in_history=r.is_in_history,
            )
            for r in rows
        ]
        return PaginatedResponse(items=items, total=total, limit=pagination.limit, offset=pagination.offset)

    async def get_client(self, recipe_id: UUID, user_id: UUID) -> RecipeDetailResponse:
        """Return full recipe detail for a client, including user-specific flags."""
        recipe = await self.get_by_id(recipe_id)
        is_favorited, is_in_history = await self.repo.get_user_flags(recipe_id, user_id)
        categories = [rc.category for rc in recipe.recipe_categories]

        return RecipeDetailResponse(
            id=recipe.id, title=recipe.title, photo_url=recipe.photo_url,
            description=recipe.description, protein=recipe.protein,
            fat=recipe.fat, carbs=recipe.carbs, prep_time=recipe.prep_time,
            cook_time=recipe.cook_time, difficulty=recipe.difficulty,
            servings=recipe.servings, slug=recipe.slug, is_active=recipe.is_active,
            created_at=recipe.created_at, updated_at=recipe.updated_at,
            steps=recipe.steps, recipe_ingredients=recipe.recipe_ingredients,
            categories=categories,
            is_favorited=is_favorited, is_in_history=is_in_history,
        )

    async def update(self, recipe_id: UUID, data: RecipeUpdate) -> Recipe:
        """Partially update a recipe, replacing categories/ingredients when provided."""
        recipe = await self.get_by_id(recipe_id)
        update_data = data.model_dump(exclude_unset=True, exclude={"categories", "ingredients"})

        for field, value in update_data.items():
            setattr(recipe, field, value)

        if data.categories is not None:
            await self.repo.replace_categories(recipe_id, data.categories)

        if data.ingredients is not None:
            await self.repo.replace_ingredients(recipe_id, data.ingredients)

        await self.repo.flush()
        logger.info("recipe_updated", recipe_id=str(recipe_id))
        return recipe

    async def delete(self, recipe_id: UUID) -> None:
        """Delete a recipe and all its associations; raises NotFoundException."""
        recipe = await self.get_by_id(recipe_id)
        await self.repo.delete(recipe)
        logger.info("recipe_deleted", recipe_id=str(recipe_id))
