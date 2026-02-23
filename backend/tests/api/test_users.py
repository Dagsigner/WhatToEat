"""Tests for /api/v1/users endpoints."""

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from tests.factories.user import UserFactory


async def test_get_me_authenticated(client: AsyncClient, test_user: User):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == str(test_user.id)
    assert data["tg_id"] == test_user.tg_id
    assert data["first_name"] == test_user.first_name
    assert data["tg_username"] == test_user.tg_username
    assert "email" not in data


async def test_get_me_unauthenticated(unauthed_client: AsyncClient):
    response = await unauthed_client.get("/api/v1/users/me")
    assert response.status_code == 401


async def test_patch_me(client: AsyncClient, test_user: User):
    response = await client.patch(
        "/api/v1/users/me",
        json={"username": "new_name"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "new_name"


async def test_list_users_admin(client: AsyncClient):
    response = await client.get("/api/v1/users/admin")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


async def test_get_user_by_id_admin(client: AsyncClient, test_user: User):
    response = await client.get(f"/api/v1/users/{test_user.id}/admin")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_user.id)


async def test_create_user_admin(client: AsyncClient):
    response = await client.post(
        f"/api/v1/users/00000000-0000-0000-0000-000000000000/admin",
        json={
            "tg_id": 999999,
            "tg_username": "created_user",
            "username": "created_user",
            "first_name": "Created",
            "last_name": "User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["tg_id"] == 999999


async def test_delete_user_admin(
    client: AsyncClient,
    db_session: AsyncSession,
):
    user = UserFactory.build()
    db_session.add(user)
    await db_session.flush()

    response = await client.delete(f"/api/v1/users/{user.id}/admin")
    assert response.status_code == 200
    data = response.json()
    assert data["is_deleted"] is True
    assert data["id"] == str(user.id)
