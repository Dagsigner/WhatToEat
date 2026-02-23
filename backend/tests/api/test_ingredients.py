"""Tests for /api/v1/ingredients endpoints."""

from httpx import AsyncClient


async def test_list_ingredients_client(client: AsyncClient):
    response = await client.get("/api/v1/ingredients")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


async def test_get_ingredient_client(client: AsyncClient):
    create = await client.post(
        "/api/v1/ingredients/admin",
        json={
            "title": "Salt",
            "slug": "salt-client",
            "unit_of_measurement": "g",
            "is_active": True,
        },
    )
    ing_id = create.json()["id"]

    response = await client.get(f"/api/v1/ingredients/{ing_id}")
    assert response.status_code == 200
    assert response.json()["id"] == ing_id


async def test_list_ingredients_admin(client: AsyncClient):
    response = await client.get("/api/v1/ingredients/admin")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


async def test_create_ingredient_admin(client: AsyncClient):
    response = await client.post(
        "/api/v1/ingredients/admin",
        json={
            "title": "Sugar",
            "slug": "sugar",
            "unit_of_measurement": "g",
            "is_active": True,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Sugar"
    assert data["slug"] == "sugar"


async def test_get_ingredient_admin(client: AsyncClient):
    create = await client.post(
        "/api/v1/ingredients/admin",
        json={
            "title": "Pepper",
            "slug": "pepper",
            "unit_of_measurement": "g",
            "is_active": True,
        },
    )
    ing_id = create.json()["id"]

    response = await client.get(f"/api/v1/ingredients/{ing_id}/admin")
    assert response.status_code == 200
    assert response.json()["id"] == ing_id


async def test_patch_ingredient_admin(client: AsyncClient):
    create = await client.post(
        "/api/v1/ingredients/admin",
        json={
            "title": "Butter",
            "slug": "butter",
            "unit_of_measurement": "g",
            "is_active": True,
        },
    )
    ing_id = create.json()["id"]

    response = await client.patch(
        f"/api/v1/ingredients/{ing_id}/admin",
        json={"title": "Updated Butter"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Butter"


async def test_delete_ingredient_admin(client: AsyncClient):
    create = await client.post(
        "/api/v1/ingredients/admin",
        json={
            "title": "To Delete",
            "slug": "to-delete-ing",
            "unit_of_measurement": "ml",
            "is_active": True,
        },
    )
    ing_id = create.json()["id"]

    response = await client.delete(f"/api/v1/ingredients/{ing_id}/admin")
    assert response.status_code == 200
    data = response.json()
    assert data["is_deleted"] is True
    assert data["id"] == ing_id
