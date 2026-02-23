"""Ingredient and RecipeIngredient ORM models."""

from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Ingredient(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "ingredients"

    title: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    unit_of_measurement: Mapped[str] = mapped_column(String(50), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    recipe_ingredients: Mapped[list["RecipeIngredient"]] = relationship(
        back_populates="ingredient", lazy="raise",
    )


class RecipeIngredient(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "recipe_ingredients"
    __table_args__ = (
        Index("ix_recipe_ingredients_recipe", "recipe_id"),
        Index("ix_recipe_ingredients_ingredient", "ingredient_id"),
    )

    recipe_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False,
    )
    ingredient_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False,
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    recipe: Mapped["Recipe"] = relationship(back_populates="recipe_ingredients", lazy="raise")  # type: ignore[name-defined]  # noqa: F821
    ingredient: Mapped["Ingredient"] = relationship(back_populates="recipe_ingredients", lazy="raise")
