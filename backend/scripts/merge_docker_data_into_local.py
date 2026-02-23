"""
Merge data between two PostgreSQL databases (e.g. local vs Docker).

By default: SOURCE = Local (5432), TARGET = Docker (5433) — перенос рецептов
из локальной БД в общую (Docker). Запуск из backend: python scripts/merge_docker_data_into_local.py

To merge Docker -> Local instead, set:
  MERGE_SOURCE_URL=...@127.0.0.1:5433/whattoeat
  MERGE_TARGET_URL=...@127.0.0.1:5432/whattoeat

Inserts with ON CONFLICT DO NOTHING so existing target data is kept.
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Default: Local (5432) -> Docker (5433) — одна общая база в Docker
SOURCE_URL = os.getenv(
    "MERGE_SOURCE_URL",
    "postgresql+asyncpg://whattoeat:whattoeat_secret@127.0.0.1:5432/whattoeat",
)
TARGET_URL = os.getenv(
    "MERGE_TARGET_URL",
    "postgresql+asyncpg://whattoeat:whattoeat_secret@127.0.0.1:5433/whattoeat",
)

# Tables in dependency order (FK-safe)
TABLES = [
    "users",
    "admins",
    "categories",
    "ingredients",
    "images",
    "recipes",
    "recipe_categories",
    "recipe_ingredients",
    "steps",
    "cooking_history",
    "favorite_recipes",
]


async def merge():
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

    source_engine = create_async_engine(SOURCE_URL, echo=False)
    target_engine = create_async_engine(TARGET_URL, echo=False)
    SourceSession = async_sessionmaker(source_engine, class_=AsyncSession, expire_on_commit=False)
    TargetSession = async_sessionmaker(target_engine, class_=AsyncSession, expire_on_commit=False)

    async with SourceSession() as src, TargetSession() as tgt:
        for table in TABLES:
            async with src.begin():
                r = await src.execute(text(f"SELECT * FROM {table}"))
                rows = r.mappings().all()
            if not rows:
                print(f"  {table}: 0 rows (skip)")
                continue
            cols = list(rows[0].keys())
            cols_str = ", ".join(cols)
            placeholders = ", ".join(f":{c}" for c in cols)
            conflict_cols = "id" if "id" in cols else None
            if not conflict_cols:
                conflict_cols = list(rows[0].keys())[:2]
                conflict_cols = ", ".join(conflict_cols)
            else:
                conflict_cols = "id"
            sql = (
                f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders}) "
                f"ON CONFLICT ({conflict_cols}) DO NOTHING"
            )
            inserted = 0
            for row in rows:
                d = dict(row)
                try:
                    async with tgt.begin():
                        await tgt.execute(text(sql), d)
                    inserted += 1
                except Exception as e:
                    if "UniqueViolation" in str(e) or "unique" in str(e).lower():
                        print(f"  {table}: skip duplicate (e.g. same title/slug) {d.get('id')}")
                    else:
                        print(f"  {table} row {d.get('id', d)} error: {e}")
            print(f"  {table}: {len(rows)} from source, {inserted} inserted into target")

    await source_engine.dispose()
    await target_engine.dispose()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(merge())
