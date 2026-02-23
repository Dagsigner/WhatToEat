"""Redis client — lazy singleton connection."""

from redis.asyncio import Redis

from app.core.config import get_settings

_redis_client: Redis | None = None


async def get_redis() -> Redis:
    """Return a shared Redis client, creating it on first call."""
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        _redis_client = Redis.from_url(
            settings.redis_url,
            decode_responses=True,
        )
    return _redis_client


async def close_redis() -> None:
    """Close the Redis connection if it exists."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
