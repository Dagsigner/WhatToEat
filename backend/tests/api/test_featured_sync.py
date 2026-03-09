"""Integration tests for featured sync endpoint."""

import uuid

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dismissed_featured import UserDismissedFeatured
from app.models.favorite import FavoriteRecipe
from app.models.featured_sync import FeaturedSyncConfig
from app.models.user import User


def _recipe_payload() -> dict:
    suffix = uuid.uuid4().hex[:8]
    return {
        "title": f"Sync Test {suffix}",
        "photo_url": "https://example.com/photo.jpg",
        "description": "A test recipe",
        "prep_time": 10,
        "cook_time": 20,
        "difficulty": "easy",
        "servings": "4",
        "slug": f"sync-test-{suffix}",
        "is_active": True,
    }


async def test_sync_featured_adds_new_recipes(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Sync should add newly featured recipes to all users' favorites."""
    # Create and feature a recipe
    r = await client.post("/api/v1/recipes/admin", json=_recipe_payload())
    assert r.status_code == 201
    recipe_id = r.json()["id"]

    await client.patch(f"/api/v1/recipes/{recipe_id}/admin/featured")

    # Run sync
    resp = await client.post("/api/v1/recipes/admin/sync-featured")
    assert resp.status_code == 200
    data = resp.json()
    assert data["added"] >= 1

    # Verify recipe is now in user's favorites
    favs = await db_session.execute(
        select(FavoriteRecipe).where(
            FavoriteRecipe.user_id == test_user.id,
            FavoriteRecipe.recipe_id == uuid.UUID(recipe_id),
        )
    )
    assert favs.scalar_one_or_none() is not None


async def test_sync_featured_no_duplicates(
    client: AsyncClient,
):
    """Second sync should not add duplicates."""
    r = await client.post("/api/v1/recipes/admin", json=_recipe_payload())
    recipe_id = r.json()["id"]
    await client.patch(f"/api/v1/recipes/{recipe_id}/admin/featured")

    # First sync
    resp1 = await client.post("/api/v1/recipes/admin/sync-featured")
    assert resp1.status_code == 200
    first_added = resp1.json()["added"]

    # Second sync — should add 0 (already synced, featured_at <= last_sync_at)
    resp2 = await client.post("/api/v1/recipes/admin/sync-featured")
    assert resp2.status_code == 200
    assert resp2.json()["added"] == 0


async def test_sync_skips_dismissed(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Sync should skip recipes that the user dismissed."""
    # Create, feature, and sync a recipe
    r = await client.post("/api/v1/recipes/admin", json=_recipe_payload())
    recipe_id = uuid.UUID(r.json()["id"])
    await client.patch(f"/api/v1/recipes/{recipe_id}/admin/featured")
    await client.post("/api/v1/recipes/admin/sync-featured")

    # User removes recipe from favorites (triggers dismissed)
    await client.delete(f"/api/v1/recipes/{recipe_id}/favorite")

    # Verify dismissed record exists
    dismissed = await db_session.execute(
        select(UserDismissedFeatured).where(
            UserDismissedFeatured.user_id == test_user.id,
            UserDismissedFeatured.recipe_id == recipe_id,
        )
    )
    assert dismissed.scalar_one_or_none() is not None

    # Un-feature and re-feature to get a new featured_at
    await client.patch(f"/api/v1/recipes/{recipe_id}/admin/featured")  # off
    await client.patch(f"/api/v1/recipes/{recipe_id}/admin/featured")  # on again

    # Sync again — should NOT re-add because it's dismissed
    resp = await client.post("/api/v1/recipes/admin/sync-featured")
    assert resp.status_code == 200

    # Verify recipe is NOT back in favorites
    favs = await db_session.execute(
        select(FavoriteRecipe).where(
            FavoriteRecipe.user_id == test_user.id,
            FavoriteRecipe.recipe_id == recipe_id,
        )
    )
    assert favs.scalar_one_or_none() is None


async def test_sync_preserves_user_own_favorites(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Sync should not remove recipes that the user added manually."""
    # User adds a non-featured recipe to favorites
    r = await client.post("/api/v1/recipes/admin", json=_recipe_payload())
    recipe_id = r.json()["id"]
    await client.post(f"/api/v1/recipes/{recipe_id}/favorite")

    # Run sync (for other featured recipes)
    await client.post("/api/v1/recipes/admin/sync-featured")

    # Verify user's manual favorite is still there
    favs = await db_session.execute(
        select(FavoriteRecipe).where(
            FavoriteRecipe.user_id == test_user.id,
            FavoriteRecipe.recipe_id == uuid.UUID(recipe_id),
        )
    )
    assert favs.scalar_one_or_none() is not None


async def test_sync_no_new_recipes_returns_zero(
    client: AsyncClient,
):
    """If no new featured recipes, sync should return 0."""
    resp = await client.post("/api/v1/recipes/admin/sync-featured")
    assert resp.status_code == 200
    assert resp.json()["added"] == 0
