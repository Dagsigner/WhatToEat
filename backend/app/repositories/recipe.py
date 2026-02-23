"""Recipe repository — data access for recipes and related joins."""

from __future__ import annotations

from typing import Any, Sequence
from uuid import UUID

from sqlalchemy import Row, Select, delete, exists, func, select
from sqlalchemy.orm import selectinload

from app.core.dependencies import PaginationParams
from app.models.category import RecipeCategory
from app.models.cooking_history import CookingHistory
from app.models.favorite import FavoriteRecipe
from app.models.ingredient import RecipeIngredient
from app.models.recipe import Recipe
from app.models.step import Step
from app.repositories.base import BaseRepository
from app.schemas.pagination import PaginatedResponse


class RecipeRepository(BaseRepository[Recipe]):
    model = Recipe

    async def get_with_relations(self, recipe_id: UUID) -> Recipe | None:
        result = await self.db.execute(
            select(Recipe)
            .where(Recipe.id == recipe_id)
            .options(
                selectinload(Recipe.steps),
                selectinload(Recipe.recipe_ingredients).selectinload(RecipeIngredient.ingredient),
                selectinload(Recipe.recipe_categories).selectinload(RecipeCategory.category),
            )
        )
        return result.scalar_one_or_none()

    async def list_admin(
        self, pagination: PaginationParams, *,
        search: str | None = None, is_active: bool | None = None,
        slug: str | None = None, difficulty: str | None = None,
        category_id: UUID | None = None,
    ) -> PaginatedResponse[Recipe]:
        filters: list[Any] = []
        if search:
            filters.append(Recipe.title.ilike(f"%{search}%"))
        if is_active is not None:
            filters.append(Recipe.is_active == is_active)
        if slug:
            filters.append(Recipe.slug == slug)
        if difficulty:
            filters.append(Recipe.difficulty == difficulty)

        query: Select[tuple[Recipe]] = select(Recipe)
        count_query = select(func.count()).select_from(Recipe)

        for f in filters:
            query = query.where(f)
            count_query = count_query.where(f)

        if category_id:
            query = query.join(RecipeCategory).where(RecipeCategory.category_id == category_id)
            count_query = select(func.count()).select_from(Recipe).join(RecipeCategory).where(
                RecipeCategory.category_id == category_id,
            )
            for f in filters:
                count_query = count_query.where(f)

        return await self.list(
            pagination, base_query=query, count_query=count_query,
            order_by=Recipe.created_at.desc(),
        )

    async def list_client(
        self, limit: int, offset: int, user_id: UUID, *,
        category_id: UUID | None = None, search: str | None = None, slug: str | None = None,
        is_in_history: bool | None = None, is_favorited: bool | None = None,
    ) -> tuple[Sequence[Row[Any]], int]:
        history_exists = exists(
            select(CookingHistory.id).where(
                CookingHistory.recipe_id == Recipe.id, CookingHistory.user_id == user_id,
            )
        )

        favorite_exists = exists(
            select(FavoriteRecipe.id).where(
                FavoriteRecipe.recipe_id == Recipe.id, FavoriteRecipe.user_id == user_id,
            )
        )

        query = select(
            Recipe.id, Recipe.slug, Recipe.title, Recipe.photo_url,
            Recipe.prep_time, Recipe.cook_time, Recipe.difficulty, Recipe.servings,
            favorite_exists.label("is_favorited"),
            history_exists.label("is_in_history"),
        ).where(Recipe.is_active.is_(True))

        count_query = select(func.count()).select_from(Recipe).where(Recipe.is_active.is_(True))

        if is_in_history is True:
            query = query.where(history_exists)
            count_query = count_query.where(history_exists)
        elif is_in_history is False:
            query = query.where(~history_exists)
            count_query = count_query.where(~history_exists)

        if is_favorited is True:
            query = query.where(favorite_exists)
            count_query = count_query.where(favorite_exists)
        elif is_favorited is False:
            query = query.where(~favorite_exists)
            count_query = count_query.where(~favorite_exists)

        if category_id:
            query = query.join(RecipeCategory).where(RecipeCategory.category_id == category_id)
            count_query = count_query.join(RecipeCategory).where(RecipeCategory.category_id == category_id)
        if search:
            query = query.where(Recipe.title.ilike(f"%{search}%"))
            count_query = count_query.where(Recipe.title.ilike(f"%{search}%"))
        if slug:
            query = query.where(Recipe.slug == slug)
            count_query = count_query.where(Recipe.slug == slug)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        query = query.offset(offset).limit(limit).order_by(Recipe.created_at.desc())
        result = await self.db.execute(query)
        return result.all(), total

    async def get_user_flags(self, recipe_id: UUID, user_id: UUID) -> tuple[bool, bool]:
        fav = await self.db.execute(
            select(FavoriteRecipe.id).where(
                FavoriteRecipe.recipe_id == recipe_id, FavoriteRecipe.user_id == user_id,
            )
        )
        hist = await self.db.execute(
            select(CookingHistory.id).where(
                CookingHistory.recipe_id == recipe_id, CookingHistory.user_id == user_id,
            )
        )
        return fav.scalar_one_or_none() is not None, hist.scalar_one_or_none() is not None

    async def replace_categories(self, recipe_id: UUID, category_ids: list[UUID]) -> None:
        await self.db.execute(delete(RecipeCategory).where(RecipeCategory.recipe_id == recipe_id))
        for cid in category_ids:
            self.db.add(RecipeCategory(recipe_id=recipe_id, category_id=cid))

    async def replace_ingredients(self, recipe_id: UUID, ingredients: list[dict]) -> None:
        await self.db.execute(delete(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id))
        for item in ingredients:
            ingredient_id = item["ingredient_id"]
            if isinstance(ingredient_id, str):
                ingredient_id = UUID(ingredient_id)
            self.db.add(RecipeIngredient(
                recipe_id=recipe_id,
                ingredient_id=ingredient_id,
                amount=item["amount"],
            ))
