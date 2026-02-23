"""CookingHistory ORM model."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class CookingHistory(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "cooking_history"
    __table_args__ = (
        Index("ix_cooking_history_user", "user_id"),
        Index("ix_cooking_history_recipe", "recipe_id"),
        Index("ix_cooking_history_cooked_at", "cooked_at"),
    )

    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    recipe_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False,
    )
    cooked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="cooking_history", lazy="raise")  # type: ignore[name-defined]  # noqa: F821
    recipe: Mapped["Recipe"] = relationship(back_populates="cooking_history", lazy="raise")  # type: ignore[name-defined]  # noqa: F821
