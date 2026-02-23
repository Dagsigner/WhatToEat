"""Tests for /api/v1/steps endpoints."""

import uuid

from httpx import AsyncClient


async def _create_recipe(client: AsyncClient) -> str:
    """Helper: create a minimal recipe and return its id."""
    resp = await client.post(
        "/api/v1/recipes/admin",
        json={
            "title": f"Step-test recipe {uuid.uuid4().hex[:8]}",
            "photo_url": "https://example.com/photo.jpg",
            "description": "Recipe for step tests",
            "prep_time": 5,
            "cook_time": 10,
            "difficulty": "easy",
            "servings": "2",
            "slug": f"step-recipe-{uuid.uuid4().hex[:8]}",
            "is_active": True,
        },
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def test_list_steps_admin(client: AsyncClient):
    response = await client.get("/api/v1/steps/admin")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


async def test_create_step_admin(client: AsyncClient):
    recipe_id = await _create_recipe(client)
    response = await client.post(
        "/api/v1/steps/admin",
        json={
            "recipe_id": recipe_id,
            "step_number": 1,
            "title": "Boil water",
            "description": "Bring water to a boil",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Boil water"
    assert data["step_number"] == 1


async def test_get_step_admin(client: AsyncClient):
    recipe_id = await _create_recipe(client)
    create = await client.post(
        "/api/v1/steps/admin",
        json={"recipe_id": recipe_id, "step_number": 1, "title": "Mix"},
    )
    step_id = create.json()["id"]

    response = await client.get(f"/api/v1/steps/{step_id}/admin")
    assert response.status_code == 200
    assert response.json()["id"] == step_id


async def test_patch_step_admin(client: AsyncClient):
    recipe_id = await _create_recipe(client)
    create = await client.post(
        "/api/v1/steps/admin",
        json={"recipe_id": recipe_id, "step_number": 1, "title": "Chop"},
    )
    step_id = create.json()["id"]

    response = await client.patch(
        f"/api/v1/steps/{step_id}/admin",
        json={"title": "Updated Chop"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Chop"


async def test_delete_step_admin(client: AsyncClient):
    recipe_id = await _create_recipe(client)
    create = await client.post(
        "/api/v1/steps/admin",
        json={"recipe_id": recipe_id, "step_number": 1, "title": "To delete"},
    )
    step_id = create.json()["id"]

    response = await client.delete(f"/api/v1/steps/{step_id}/admin")
    assert response.status_code == 200
    data = response.json()
    assert data["is_deleted"] is True
    assert data["id"] == step_id
