"""Tests for /api/v1/images endpoints."""

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.image import Image


async def test_list_images_admin(client: AsyncClient):
    response = await client.get("/api/v1/images")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


async def test_delete_image_admin(
    client: AsyncClient,
    db_session: AsyncSession,
):
    image = Image(
        url="https://example.com/test.jpg",
        filename="test.jpg",
        content_type="image/jpeg",
        size=1024,
    )
    db_session.add(image)
    await db_session.flush()

    response = await client.delete(f"/api/v1/images/{image.id}")
    assert response.status_code == 204
