from __future__ import annotations

import asyncio

from api.cache import cache_client, cache_response


def test_cache_connect_without_redis_url_disables(monkeypatch):
    monkeypatch.delenv("REDIS_URL", raising=False)

    asyncio.run(cache_client.connect())

    assert cache_client.enabled is False
    asyncio.run(cache_client.close())


def test_cache_response_graceful_fallback_when_cache_disabled(monkeypatch):
    monkeypatch.setattr(cache_client, "enabled", False)

    calls = {"count": 0}

    @cache_response(ttl=30)
    async def expensive(value: int):
        calls["count"] += 1
        return {"value": value}

    result_1 = asyncio.run(expensive(1))
    result_2 = asyncio.run(expensive(1))

    assert result_1 == {"value": 1}
    assert result_2 == {"value": 1}
    assert calls["count"] == 2


def test_cache_response_uses_backend_when_enabled(monkeypatch):
    storage: dict[str, dict] = {}
    ttl_used = {"ttl": None}

    async def fake_get(key: str):
        return storage.get(key)

    async def fake_set(key: str, value, ttl: int):
        storage[key] = value
        ttl_used["ttl"] = ttl

    monkeypatch.setattr(cache_client, "enabled", True)
    monkeypatch.setattr(cache_client, "get", fake_get)
    monkeypatch.setattr(cache_client, "set", fake_set)

    calls = {"count": 0}

    @cache_response(ttl=45)
    async def expensive(value: int):
        calls["count"] += 1
        return {"value": value}

    result_1 = asyncio.run(expensive(2))
    result_2 = asyncio.run(expensive(2))

    assert result_1 == {"value": 2}
    assert result_2 == {"value": 2}
    assert calls["count"] == 1
    assert ttl_used["ttl"] == 45


def test_cache_increment_graceful_fallback_when_disabled(monkeypatch):
    monkeypatch.setattr(cache_client, "enabled", False)
    assert asyncio.run(cache_client.increment("rate-limit:127.0.0.1", ttl=60)) is None
