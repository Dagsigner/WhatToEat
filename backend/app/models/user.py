"""User and Admin ORM models."""

from uuid import UUID

from sqlalchemy import BigInteger, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    tg_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    tg_username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    admin: Mapped["Admin | None"] = relationship(
        back_populates="user", uselist=False, lazy="raise",
    )
    favorite_recipes: Mapped[list["FavoriteRecipe"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="user", lazy="raise",
    )
    cooking_history: Mapped[list["CookingHistory"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="user", lazy="raise",
    )


class Admin(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "admins"
    __table_args__ = (Index("ix_admins_user_id", "user_id", unique=True),)

    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    username: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user: Mapped["User"] = relationship(back_populates="admin", lazy="raise")
