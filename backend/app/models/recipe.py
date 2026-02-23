"""Recipe ORM model."""

import enum

from sqlalchemy import Boolean, CheckConstraint, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class DifficultyEnum(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Recipe(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "recipes"
    __table_args__ = (
        CheckConstraint("difficulty IN ('easy', 'medium', 'hard')", name="ck_recipes_difficulty"),
        Index("ix_recipes_difficulty", "difficulty"),
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    photo_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    protein: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    fat: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    carbs: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    prep_time: Mapped[int] = mapped_column(Integer, nullable=False)
    cook_time: Mapped[int] = mapped_column(Integer, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(10), nullable=False, default=DifficultyEnum.MEDIUM.value)
    servings: Mapped[str] = mapped_column(String(50), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    steps: Mapped[list["Step"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="recipe", lazy="raise", order_by="Step.step_number",
    )
    recipe_ingredients: Mapped[list["RecipeIngredient"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="recipe", lazy="raise",
    )
    recipe_categories: Mapped[list["RecipeCategory"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="recipe", lazy="raise",
    )

    @property
    def categories(self) -> list["Category"]:  # type: ignore[name-defined]  # noqa: F821
        return [rc.category for rc in self.recipe_categories]
    favorite_recipes: Mapped[list["FavoriteRecipe"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="recipe", lazy="raise",
    )
    cooking_history: Mapped[list["CookingHistory"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="recipe", lazy="raise",
    )
