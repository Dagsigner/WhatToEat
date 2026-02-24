"""FastAPI application entry point."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.redis import close_redis, get_redis

from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.files import router as files_router
from app.api.images import router as images_router
from app.api.ingredients import router as ingredients_router
from app.api.recipes import router as recipes_router
from app.api.steps import router as steps_router
from app.api.users import router as users_router

logger = structlog.get_logger()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info("app_starting", env=settings.app_env)
    yield
    await close_redis()
    logger.info("app_shutting_down")


app = FastAPI(
    title="WhatToEat API",
    version="0.1.0",
    lifespan=lifespan,
    debug=settings.app_debug,
)

_cors_origins = (
    [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    if settings.cors_origins
    else ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(ingredients_router, prefix="/api/v1")
app.include_router(recipes_router, prefix="/api/v1")
app.include_router(steps_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")
app.include_router(images_router, prefix="/api/v1")


_uploads_dir = Path("uploads")
_uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    status = {"app": "ok"}
    try:
        redis = await get_redis()
        await redis.ping()
        status["redis"] = "ok"
    except Exception:
        status["redis"] = "unavailable"
    return status
