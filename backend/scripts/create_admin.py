"""Create first admin for local development. Run: docker compose exec app python scripts/create_admin.py"""

import asyncio
import os
import sys

# Add project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.database import Base
from app.models.user import User, Admin

# Ensure all models are loaded for relationship resolution
import app.models.category  # noqa: F401
import app.models.ingredient  # noqa: F401
import app.models.recipe  # noqa: F401
import app.models.step  # noqa: F401
import app.models.image  # noqa: F401
import app.models.favorite  # noqa: F401
import app.models.cooking_history  # noqa: F401

DEV_USERNAME = os.getenv("DEV_ADMIN_USERNAME", "admin")
DEV_PASSWORD = os.getenv("DEV_ADMIN_PASSWORD")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    sys.exit("ERROR: DATABASE_URL is not set. Check your .env file.")
if not DEV_PASSWORD:
    sys.exit("ERROR: DEV_ADMIN_PASSWORD is not set. Check your .env file.")


async def main() -> None:
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(select(Admin).where(Admin.username == DEV_USERNAME))
        existing = result.scalar_one_or_none()
        hashed = bcrypt.hashpw(DEV_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        if existing:
            existing.password_hash = hashed
            await session.commit()
            print("Admin password updated.")
        else:
            user = User(
                tg_id=999999999,
                tg_username="admin",
                username="admin",
                first_name="Admin",
                last_name="User",
            )
            session.add(user)
            await session.flush()
            admin = Admin(user_id=user.id, username=DEV_USERNAME, password_hash=hashed)
            session.add(admin)
            await session.commit()
            print("Admin created.")

    print(f"  Username: {DEV_USERNAME}")
    print(f"  Password: {DEV_PASSWORD}")
    print("  Login at http://localhost:5174 (or your frontend URL)")


if __name__ == "__main__":
    asyncio.run(main())
