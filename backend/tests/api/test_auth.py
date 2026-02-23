"""Tests for /api/v1/auth endpoints."""

from httpx import AsyncClient

from app.models.user import User


async def test_login_invalid_body(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422


async def test_login_admin_valid(
    client: AsyncClient,
    test_admin_with_password: tuple[User, str],
):
    user, password = test_admin_with_password
    response = await client.post(
        "/api/v1/auth/login/admin",
        json={"username": f"admin_{user.tg_id}", "password": password},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["username"] == f"admin_{user.tg_id}"


async def test_login_admin_wrong_password(
    client: AsyncClient,
    test_admin_with_password: tuple[User, str],
):
    user, _ = test_admin_with_password
    response = await client.post(
        "/api/v1/auth/login/admin",
        json={"username": f"admin_{user.tg_id}", "password": "wrong_password"},
    )
    assert response.status_code == 401


async def test_refresh_invalid_token(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid.token.here"},
    )
    assert response.status_code == 401


async def test_logout_authenticated(client: AsyncClient):
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert "message" in response.json()


async def test_logout_admin(client: AsyncClient):
    response = await client.post("/api/v1/auth/logout/admin")
    assert response.status_code == 200
    assert "message" in response.json()
