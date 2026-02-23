"""Pagination response schema."""

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)

    items: list[T]
    total: int
    limit: int
    offset: int
