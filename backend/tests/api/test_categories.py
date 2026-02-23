"""Tests for /api/v1/categories endpoints."""

from httpx import AsyncClient


async def test_list_categories_client(client: AsyncClient):
    response = await client.get("/api/v1/categories")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


async def test_list_categories_admin(client: AsyncClient):
    response = await client.get("/api/v1/categories/admin")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


async def test_create_category_admin(client: AsyncClient):
    response = await client.post(
        "/api/v1/categories/admin",
        json={"title": "Desserts", "slug": "desserts", "is_active": True},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Desserts"
    assert data["slug"] == "desserts"
    assert data["is_active"] is True


async def test_get_category_admin(client: AsyncClient):
    create = await client.post(
        "/api/v1/categories/admin",
        json={"title": "Soups", "slug": "soups", "is_active": True},
    )
    cat_id = create.json()["id"]

    response = await client.get(f"/api/v1/categories/{cat_id}/admin")
    assert response.status_code == 200
    assert response.json()["id"] == cat_id


async def test_patch_category_admin(client: AsyncClient):
    create = await client.post(
        "/api/v1/categories/admin",
        json={"title": "Salads", "slug": "salads", "is_active": True},
    )
    cat_id = create.json()["id"]

    response = await client.patch(
        f"/api/v1/categories/{cat_id}/admin",
        json={"title": "Updated Salads"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Salads"


async def test_delete_category_admin(client: AsyncClient):
    create = await client.post(
        "/api/v1/categories/admin",
        json={"title": "To Delete", "slug": "to-delete-cat", "is_active": True},
    )
    cat_id = create.json()["id"]

    response = await client.delete(f"/api/v1/categories/{cat_id}/admin")
    assert response.status_code == 200
    data = response.json()
    assert data["is_deleted"] is True
    assert data["id"] == cat_id
