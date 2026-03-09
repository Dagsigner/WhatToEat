"""UserDismissedFeatured ORM model — tracks featured recipes removed by user."""

from uuid import UUID

from sqlalchemy import ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class UserDismissedFeatured(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "user_dismissed_featured"
    __table_args__ = (
        UniqueConstraint("user_id", "recipe_id", name="uq_user_recipe_dismissed"),
        Index("ix_dismissed_featured_user", "user_id"),
        Index("ix_dismissed_featured_recipe", "recipe_id"),
    )

    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    recipe_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False,
    )
