"""Generic base repository — reusable CRUD operations."""

from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base
from app.core.dependencies import PaginationParams
from app.core.exceptions import NotFoundException
from app.schemas.pagination import PaginatedResponse

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """Generic async repository with standard CRUD operations."""

    model: type[ModelT]

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, entity_id: UUID, *, options: list | None = None) -> ModelT:
        stmt = select(self.model).where(self.model.id == entity_id)  # type: ignore[attr-defined]
        if options:
            for opt in options:
                stmt = stmt.options(opt)
        result = await self.db.execute(stmt)
        entity = result.scalar_one_or_none()
        if entity is None:
            raise NotFoundException(self.model.__tablename__, entity_id)
        return entity

    async def get_or_none(self, entity_id: UUID) -> ModelT | None:
        result = await self.db.execute(
            select(self.model).where(self.model.id == entity_id)  # type: ignore[attr-defined]
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        pagination: PaginationParams,
        *,
        base_query: Select | None = None,
        count_query: Select | None = None,
        order_by: Any = None,
    ) -> PaginatedResponse[ModelT]:
        q = base_query if base_query is not None else select(self.model)
        cq = count_query if count_query is not None else select(func.count()).select_from(self.model)

        total_result = await self.db.execute(cq)
        total = total_result.scalar_one()

        if order_by is not None:
            q = q.order_by(order_by)

        q = q.offset(pagination.offset).limit(pagination.limit)
        result = await self.db.execute(q)
        items = list(result.scalars().all())

        return PaginatedResponse(
            items=items, total=total,
            limit=pagination.limit, offset=pagination.offset,
        )

    async def count(self, stmt: Select | None = None) -> int:
        q = stmt if stmt is not None else select(func.count()).select_from(self.model)
        result = await self.db.execute(q)
        return result.scalar_one()

    async def create(self, entity: ModelT) -> ModelT:
        self.db.add(entity)
        await self.db.flush()
        return entity

    async def update(self, entity: ModelT, data: dict) -> ModelT:
        for field, value in data.items():
            setattr(entity, field, value)
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def delete(self, entity: ModelT) -> None:
        await self.db.delete(entity)
        await self.db.flush()

    async def execute(self, stmt: Select) -> Any:
        return await self.db.execute(stmt)

    def add(self, entity: Any) -> None:
        self.db.add(entity)

    async def flush(self) -> None:
        await self.db.flush()
