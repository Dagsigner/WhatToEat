"""Tests for /api/v1/recipes endpoints."""

import uuid

from httpx import AsyncClient


def _recipe_payload(slug_suffix: str = "") -> dict:
    """Build a valid RecipeCreate JSON body with a unique slug."""
    suffix = slug_suffix or uuid.uuid4().hex[:8]
    return {
        "title": f"Test Recipe {suffix}",
        "photo_url": "https://example.com/photo.jpg",
        "description": "A test recipe description",
        "prep_time": 10,
        "cook_time": 20,
        "difficulty": "easy",
        "servings": "4",
        "slug": f"test-recipe-{suffix}",
        "is_active": True,
    }


async def _create_recipe(client: AsyncClient) -> dict:
    """Helper: create a recipe via admin endpoint and return response body."""
    resp = await client.post("/api/v1/recipes/admin", json=_recipe_payload())
    assert resp.status_code == 201
    return resp.json()


async def test_list_recipes_client(client: AsyncClient):
    response = await client.get("/api/v1/recipes")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


async def test_list_recipes_admin(client: AsyncClient):
    response = await client.get("/api/v1/recipes/admin")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


async def test_create_recipe_admin(client: AsyncClient):
    payload = _recipe_payload("create")
    response = await client.post("/api/v1/recipes/admin", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["slug"] == payload["slug"]


async def test_get_recipe_client(client: AsyncClient):
    recipe = await _create_recipe(client)
    response = await client.get(f"/api/v1/recipes/{recipe['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == recipe["id"]


async def test_get_recipe_admin(client: AsyncClient):
    recipe = await _create_recipe(client)
    response = await client.get(f"/api/v1/recipes/{recipe['id']}/admin")
    assert response.status_code == 200
    assert response.json()["id"] == recipe["id"]


async def test_patch_recipe_admin(client: AsyncClient):
    recipe = await _create_recipe(client)
    response = await client.patch(
        f"/api/v1/recipes/{recipe['id']}/admin",
        json={"title": "Updated Title"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


async def test_delete_recipe_admin(client: AsyncClient):
    recipe = await _create_recipe(client)
    response = await client.delete(f"/api/v1/recipes/{recipe['id']}/admin")
    assert response.status_code == 200
    data = response.json()
    assert data["is_deleted"] is True
    assert data["id"] == recipe["id"]


async def test_add_favorite(client: AsyncClient):
    recipe = await _create_recipe(client)
    response = await client.post(f"/api/v1/recipes/{recipe['id']}/favorite")
    assert response.status_code == 200
    data = response.json()
    assert data["is_favorited"] is True
    assert data["id"] == recipe["id"]


async def test_remove_favorite(client: AsyncClient):
    recipe = await _create_recipe(client)
    await client.post(f"/api/v1/recipes/{recipe['id']}/favorite")

    response = await client.delete(f"/api/v1/recipes/{recipe['id']}/favorite")
    assert response.status_code == 200
    data = response.json()
    assert data["is_favorited"] is False


async def test_record_history(client: AsyncClient):
    recipe = await _create_recipe(client)
    response = await client.post(f"/api/v1/recipes/{recipe['id']}/history")
    assert response.status_code == 200
    data = response.json()
    assert data["is_in_history"] is True
    assert data["id"] == recipe["id"]


async def test_toggle_featured(client: AsyncClient):
    recipe = await _create_recipe(client)

    # Initially not featured
    resp = await client.patch(f"/api/v1/recipes/{recipe['id']}/admin/featured")
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_featured"] is True
    assert data["id"] == recipe["id"]

    # Toggle back off
    resp = await client.patch(f"/api/v1/recipes/{recipe['id']}/admin/featured")
    assert resp.status_code == 200
    assert resp.json()["is_featured"] is False


async def test_list_recipes_admin_filter_featured(client: AsyncClient):
    r1 = await _create_recipe(client)
    r2 = await _create_recipe(client)

    # Make r1 featured
    await client.patch(f"/api/v1/recipes/{r1['id']}/admin/featured")

    # Filter featured only
    resp = await client.get("/api/v1/recipes/admin", params={"is_featured": "true"})
    assert resp.status_code == 200
    data = resp.json()
    ids = [item["id"] for item in data["items"]]
    assert r1["id"] in ids
    assert r2["id"] not in ids

    # Filter non-featured
    resp = await client.get("/api/v1/recipes/admin", params={"is_featured": "false"})
    assert resp.status_code == 200
    data = resp.json()
    ids = [item["id"] for item in data["items"]]
    assert r1["id"] not in ids
    assert r2["id"] in ids


async def test_admin_list_includes_is_featured_field(client: AsyncClient):
    await _create_recipe(client)
    resp = await client.get("/api/v1/recipes/admin")
    assert resp.status_code == 200
    item = resp.json()["items"][0]
    assert "is_featured" in item
    assert item["is_featured"] is False
