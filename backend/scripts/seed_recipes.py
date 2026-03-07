"""
Seed recipes from JSON files into the database.

Usage:
  DATABASE_URL=postgresql+asyncpg://... python scripts/seed_recipes.py

Reads all JSON files from backend/data/recipes/, creates categories,
ingredients, recipes, steps, and links them together.
Skips recipes that already exist (by slug).
"""

import asyncio
import json
import os
import re
import sys
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.user import User  # noqa: F401
from app.models.recipe import Recipe
from app.models.ingredient import Ingredient, RecipeIngredient
from app.models.category import Category, RecipeCategory
from app.models.step import Step
from app.models.favorite import FavoriteRecipe  # noqa: F401
from app.models.cooking_history import CookingHistory  # noqa: F401
from app.models.image import Image  # noqa: F401

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "recipes"


def slugify(text: str) -> str:
    """Transliterate and slugify a Russian string."""
    mapping = {
        "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
        "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
        "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
        "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
        "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    }
    result = []
    for ch in text.lower():
        if ch in mapping:
            result.append(mapping[ch])
        elif ch.isascii() and (ch.isalnum() or ch in "-_"):
            result.append(ch)
        else:
            result.append("-")
    slug = re.sub(r"-+", "-", "".join(result)).strip("-")
    return slug


async def seed(database_url: str):
    engine = create_async_engine(database_url, echo=False)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    json_files = sorted(DATA_DIR.glob("*.json"))
    if not json_files:
        print(f"No JSON files found in {DATA_DIR}")
        return

    all_recipes = []
    for jf in json_files:
        data = json.loads(jf.read_text(encoding="utf-8"))
        if data:
            all_recipes.extend(data)
            print(f"  {jf.name}: {len(data)} recipes loaded")

    if not all_recipes:
        print("No recipes to import.")
        return

    print(f"\nTotal recipes to import: {len(all_recipes)}")

    async with Session() as session:
        # 1. Collect and create categories
        category_titles = {r.get("category", "") for r in all_recipes if r.get("category")}
        category_map: dict[str, Category] = {}

        for cat_title in sorted(category_titles):
            cat_slug = slugify(cat_title)
            existing = await session.execute(
                select(Category).where(Category.slug == cat_slug)
            )
            cat = existing.scalar_one_or_none()
            if not cat:
                cat = Category(id=uuid4(), title=cat_title, slug=cat_slug, is_active=True)
                session.add(cat)
                print(f"  + Category: {cat_title}")
            else:
                print(f"  = Category exists: {cat_title}")
            category_map[cat_title] = cat

        await session.flush()

        # 2. Collect and create ingredients
        ingredient_map: dict[tuple[str, str], Ingredient] = {}

        for recipe_data in all_recipes:
            for ing in recipe_data.get("ingredients", []):
                key = (ing["title"].lower().strip(), ing.get("unit", "шт").strip())
                if key not in ingredient_map:
                    ing_slug = slugify(ing["title"])
                    # Check DB
                    existing = await session.execute(
                        select(Ingredient).where(Ingredient.slug == ing_slug)
                    )
                    db_ing = existing.scalar_one_or_none()
                    if not db_ing:
                        db_ing = Ingredient(
                            id=uuid4(),
                            title=ing["title"].lower().strip(),
                            unit_of_measurement=ing.get("unit", "шт").strip(),
                            slug=ing_slug,
                            is_active=True,
                        )
                        session.add(db_ing)
                    ingredient_map[key] = db_ing

        await session.flush()
        print(f"  Ingredients in DB: {len(ingredient_map)}")

        # 3. Create recipes with steps and links
        created = 0
        skipped = 0

        for recipe_data in all_recipes:
            recipe_slug = recipe_data.get("slug") or slugify(recipe_data["title"])

            # Check if recipe already exists
            existing = await session.execute(
                select(Recipe).where(Recipe.slug == recipe_slug)
            )
            if existing.scalar_one_or_none():
                skipped += 1
                continue

            recipe = Recipe(
                id=uuid4(),
                title=recipe_data["title"],
                slug=recipe_slug,
                description=recipe_data.get("description", ""),
                photo_url=recipe_data.get("photo_url", ""),
                protein=recipe_data.get("protein"),
                fat=recipe_data.get("fat"),
                carbs=recipe_data.get("carbs"),
                prep_time=recipe_data.get("prep_time", 0),
                cook_time=recipe_data.get("cook_time", 0),
                difficulty=recipe_data.get("difficulty", "medium"),
                servings=recipe_data.get("servings", "4 порции"),
                is_active=True,
            )
            session.add(recipe)
            await session.flush()

            # Link category
            cat_title = recipe_data.get("category")
            if cat_title and cat_title in category_map:
                rc = RecipeCategory(
                    id=uuid4(),
                    recipe_id=recipe.id,
                    category_id=category_map[cat_title].id,
                )
                session.add(rc)

            # Create steps
            for step_data in recipe_data.get("steps", []):
                step = Step(
                    id=uuid4(),
                    recipe_id=recipe.id,
                    step_number=step_data["step_number"],
                    title=step_data.get("title", ""),
                    description=step_data.get("description"),
                    is_active=True,
                )
                session.add(step)

            # Link ingredients
            for ing_data in recipe_data.get("ingredients", []):
                key = (ing_data["title"].lower().strip(), ing_data.get("unit", "шт").strip())
                db_ing = ingredient_map.get(key)
                if db_ing:
                    ri = RecipeIngredient(
                        id=uuid4(),
                        recipe_id=recipe.id,
                        ingredient_id=db_ing.id,
                        amount=ing_data.get("amount", 0),
                    )
                    session.add(ri)

            created += 1

        await session.commit()

    await engine.dispose()
    print(f"\nDone! Created: {created}, Skipped (already exist): {skipped}")


if __name__ == "__main__":
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        sys.exit("ERROR: DATABASE_URL environment variable is required.")
    asyncio.run(seed(db_url))
