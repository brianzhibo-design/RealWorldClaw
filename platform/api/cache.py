"""Redis cache layer with graceful fallback for local/dev environments."""

from __future__ import annotations

import asyncio
import functools
import hashlib
import inspect
import json
import logging
import os
from typing import Any, Callable

logger = logging.getLogger(__name__)

try:
    from redis.asyncio import Redis
except Exception:  # pragma: no cover - only used when redis package is missing
    Redis = None  # type: ignore[assignment]


class CacheClient:
    """Small async cache client wrapper with no-op fallback behavior."""

    def __init__(self) -> None:
        self._redis: Redis | None = None
        self.enabled = False

    async def connect(self) -> None:
        redis_url = os.getenv("REDIS_URL", "").strip()
        if not redis_url:
            logger.info("Redis disabled: REDIS_URL is not set")
            self.enabled = False
            return

        if Redis is None:
            logger.warning("Redis disabled: redis package not installed")
            self.enabled = False
            return

        try:
            client = Redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
            await client.ping()
            self._redis = client
            self.enabled = True
            logger.info("Redis cache enabled")
        except Exception as exc:  # pragma: no cover - depends on external redis
            logger.warning("Redis unavailable, running without cache: %s", exc)
            self._redis = None
            self.enabled = False

    async def close(self) -> None:
        if self._redis is not None:
            try:
                await self._redis.close()
            except Exception:
                logger.debug("Redis close failed", exc_info=True)
        self._redis = None
        self.enabled = False

    async def get(self, key: str) -> Any | None:
        if not self.enabled or self._redis is None:
            return None
        try:
            raw = await self._redis.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception:
            logger.debug("Redis get failed for key=%s", key, exc_info=True)
            return None

    async def set(self, key: str, value: Any, ttl: int) -> None:
        if not self.enabled or self._redis is None:
            return
        try:
            payload = json.dumps(value, ensure_ascii=False)
            await self._redis.set(key, payload, ex=ttl)
        except Exception:
            logger.debug("Redis set failed for key=%s", key, exc_info=True)

    async def increment(self, key: str, ttl: int) -> int | None:
        """Atomic increment helper for rate limiting counters."""
        if not self.enabled or self._redis is None:
            return None

        try:
            value = await self._redis.incr(key)
            if value == 1:
                await self._redis.expire(key, ttl)
            return int(value)
        except Exception:
            logger.debug("Redis increment failed for key=%s", key, exc_info=True)
            return None


cache_client = CacheClient()


async def init_cache() -> None:
    await cache_client.connect()


async def close_cache() -> None:
    await cache_client.close()


def _build_cache_key(func: Callable[..., Any], args: tuple[Any, ...], kwargs: dict[str, Any]) -> str:
    material = f"{func.__module__}:{func.__qualname__}:{args!r}:{sorted(kwargs.items())!r}"
    digest = hashlib.sha256(material.encode("utf-8")).hexdigest()
    return f"api-cache:{digest}"


def cache_response(
    ttl: int = 60,
    key_builder: Callable[[Callable[..., Any], tuple[Any, ...], dict[str, Any]], str] | None = None,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Cache API function responses with configurable TTL.

    - When Redis is unavailable, the decorated function executes normally.
    - Supports both async and sync callables.
    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        builder = key_builder or _build_cache_key

        if inspect.iscoroutinefunction(func):

            @functools.wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                key = builder(func, args, kwargs)
                cached = await cache_client.get(key)
                if cached is not None:
                    return cached

                result = await func(*args, **kwargs)
                await cache_client.set(key, result, ttl=ttl)
                return result

            return async_wrapper

        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            if not cache_client.enabled:
                return func(*args, **kwargs)

            key = builder(func, args, kwargs)

            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop and loop.is_running():
                # Running in an event loop thread; skip sync cache bridge for safety.
                return func(*args, **kwargs)

            cached = asyncio.run(cache_client.get(key))
            if cached is not None:
                return cached

            result = func(*args, **kwargs)
            asyncio.run(cache_client.set(key, result, ttl=ttl))
            return result

        return sync_wrapper

    return decorator
