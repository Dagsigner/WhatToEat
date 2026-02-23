"""Step ORM model."""

from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Step(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "steps"
    __table_args__ = (Index("ix_steps_recipe_number", "recipe_id", "step_number"),)

    recipe_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False,
    )
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    slug: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    recipe: Mapped["Recipe"] = relationship(back_populates="steps", lazy="raise")  # type: ignore[name-defined]  # noqa: F821
