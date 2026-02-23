"""Category and RecipeCategory ORM models."""

from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Category(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "categories"

    title: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    recipe_categories: Mapped[list["RecipeCategory"]] = relationship(
        back_populates="category", lazy="raise",
    )


class RecipeCategory(UUIDMixin, Base):
    __tablename__ = "recipe_categories"
    __table_args__ = (
        UniqueConstraint("recipe_id", "category_id", name="uq_recipe_category"),
        Index("ix_recipe_categories_recipe", "recipe_id"),
        Index("ix_recipe_categories_category", "category_id"),
    )

    recipe_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False,
    )
    category_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False,
    )

    recipe: Mapped["Recipe"] = relationship(back_populates="recipe_categories", lazy="raise")  # type: ignore[name-defined]  # noqa: F821
    category: Mapped["Category"] = relationship(back_populates="recipe_categories", lazy="raise")
