"""Image ORM model."""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Image(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "images"

    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    filename: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    size: Mapped[int | None] = mapped_column(Integer, nullable=True)
