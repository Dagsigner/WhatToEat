"""Tests for /api/v1/files endpoints."""

import io

from httpx import AsyncClient


async def test_upload_file_admin(client: AsyncClient):
    fake_png = io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"\x00" * 64)
    response = await client.post(
        "/api/v1/files/upload",
        files={"file": ("test.png", fake_png, "image/png")},
    )
    assert response.status_code == 201
    data = response.json()
    assert "url" in data
    assert data["filename"] == "test.png"


async def test_upload_file_unauthenticated(unauthed_client: AsyncClient):
    fake_png = io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"\x00" * 64)
    response = await unauthed_client.post(
        "/api/v1/files/upload",
        files={"file": ("test.png", fake_png, "image/png")},
    )
    assert response.status_code in (401, 403)
