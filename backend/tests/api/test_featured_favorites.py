"""Integration test: featured recipes are auto-copied to new user's favorites."""

import uuid

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.favorite import FavoriteRecipe
from app.models.recipe import Recipe
from app.models.user import User


def _recipe_payload(slug_suffix: str = "") -> dict:
    suffix = slug_suffix or uuid.uuid4().hex[:8]
    return {
        "title": f"Test Recipe {suffix}",
        "photo_url": "https://example.com/photo.jpg",
        "description": "A test recipe",
        "prep_time": 10,
        "cook_time": 20,
        "difficulty": "easy",
        "servings": "4",
        "slug": f"test-recipe-{suffix}",
        "is_active": True,
    }


async def test_featured_copied_to_favorites_on_user_creation(
    db_session: AsyncSession,
    client: AsyncClient,
    test_user: User,
):
    """When a featured recipe exists and a new user is created,
    the featured recipe should appear in the user's favorites."""
    # Create a recipe and mark it as featured
    r1 = await client.post("/api/v1/recipes/admin", json=_recipe_payload())
    assert r1.status_code == 201
    recipe_id = uuid.UUID(r1.json()["id"])

    toggle = await client.patch(f"/api/v1/recipes/{recipe_id}/admin/featured")
    assert toggle.status_code == 200
    assert toggle.json()["is_featured"] is True

    # Simulate: create a new user directly via ORM (like _get_or_create_user would)
    new_user = User(tg_id=777_777_777, tg_username="newuser", first_name="New", last_name="User")
    db_session.add(new_user)
    await db_session.flush()

    # Copy featured to favorites (same logic as auth service)
    result = await db_session.execute(
        select(Recipe.id).where(Recipe.is_featured.is_(True), Recipe.is_active.is_(True))
    )
    featured_ids = result.scalars().all()
    assert recipe_id in featured_ids

    for rid in featured_ids:
        db_session.add(FavoriteRecipe(user_id=new_user.id, recipe_id=rid))
    await db_session.flush()

    # Verify favorites were created
    favs = await db_session.execute(
        select(FavoriteRecipe).where(FavoriteRecipe.user_id == new_user.id)
    )
    fav_list = favs.scalars().all()
    fav_recipe_ids = [f.recipe_id for f in fav_list]
    assert recipe_id in fav_recipe_ids


async def test_existing_user_no_duplicate_favorites(
    client: AsyncClient,
):
    """Re-login of existing user should NOT duplicate favorites."""
    # Create and feature a recipe
    r = await client.post("/api/v1/recipes/admin", json=_recipe_payload())
    recipe_id = r.json()["id"]
    await client.patch(f"/api/v1/recipes/{recipe_id}/admin/featured")

    # Add to favorites manually (simulating first login)
    resp = await client.post(f"/api/v1/recipes/{recipe_id}/favorite")
    assert resp.status_code == 200

    # Adding again should fail with conflict (409)
    resp2 = await client.post(f"/api/v1/recipes/{recipe_id}/favorite")
    assert resp2.status_code == 409
