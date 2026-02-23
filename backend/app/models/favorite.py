"""FavoriteRecipe ORM model."""

from uuid import UUID

from sqlalchemy import ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class FavoriteRecipe(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "favorite_recipes"
    __table_args__ = (
        UniqueConstraint("user_id", "recipe_id", name="uq_user_recipe_favorite"),
        Index("ix_favorite_recipes_user", "user_id"),
        Index("ix_favorite_recipes_recipe", "recipe_id"),
    )

    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    recipe_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="favorite_recipes", lazy="raise")  # type: ignore[name-defined]  # noqa: F821
    recipe: Mapped["Recipe"] = relationship(back_populates="favorite_recipes", lazy="raise")  # type: ignore[name-defined]  # noqa: F821
