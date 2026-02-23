"""Shared test fixtures for the WhatToEat backend test suite."""

import os
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock

import bcrypt
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.database import Base
from app.core.dependencies import get_current_admin, get_current_user, get_db_session
from app.main import app
from app.models.user import Admin, User
from tests.factories.user import UserFactory

ADMIN_TEST_PASSWORD = os.getenv("ADMIN_TEST_PASSWORD", "testpass123")

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise RuntimeError("TEST_DATABASE_URL is not set. Check your .env file.")


@pytest.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture(scope="session")
async def async_session_maker(test_engine):
    return async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False,
    )


@pytest.fixture
async def db_session(async_session_maker) -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        async with session.begin():
            yield session
            await session.rollback()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = UserFactory.build()
    db_session.add(user)
    await db_session.flush()
    return user


@pytest.fixture
async def test_admin(db_session: AsyncSession) -> User:
    user = UserFactory.build()
    db_session.add(user)
    await db_session.flush()

    admin = Admin(user_id=user.id, username=f"admin_{user.tg_id}", password_hash=None)
    db_session.add(admin)
    await db_session.flush()

    return user


@pytest.fixture
async def test_admin_with_password(db_session: AsyncSession) -> tuple[User, str]:
    user = UserFactory.build()
    db_session.add(user)
    await db_session.flush()

    hashed = bcrypt.hashpw(
        ADMIN_TEST_PASSWORD.encode("utf-8"), bcrypt.gensalt(),
    ).decode("utf-8")
    admin = Admin(
        user_id=user.id, username=f"admin_{user.tg_id}", password_hash=hashed,
    )
    db_session.add(admin)
    await db_session.flush()

    return user, ADMIN_TEST_PASSWORD


@pytest.fixture
async def client(
    db_session: AsyncSession,
    test_user: User,
    test_admin: User,
) -> AsyncGenerator[AsyncClient, None]:
    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db
    app.dependency_overrides[get_current_user] = lambda: test_user
    app.dependency_overrides[get_current_admin] = lambda: test_admin

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.pop(get_db_session, None)
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_current_admin, None)


@pytest.fixture
async def unauthed_client(
    db_session: AsyncSession,
) -> AsyncGenerator[AsyncClient, None]:
    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.pop(get_db_session, None)
