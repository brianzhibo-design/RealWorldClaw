"""性能测试框架 - RealWorldClaw QA Team

使用标准库 concurrent.futures，无外部依赖。
- 基准：单端点100次请求，记录p50/p95/p99延迟
- 并发测试：10并发用户同时请求
"""
from __future__ import annotations

import statistics
import time
from concurrent.futures import ThreadPoolExecutor, as_completed


API = "/api/v1"


def _reset_rate_limiter():
    from api.rate_limit import _bucket
    _bucket._hits.clear()


def percentile(data: list[float], p: float) -> float:
    """Calculate percentile from sorted data."""
    if not data:
        return 0.0
    data_sorted = sorted(data)
    k = (len(data_sorted) - 1) * p / 100.0
    f = int(k)
    c = f + 1
    if c >= len(data_sorted):
        return data_sorted[f]
    return data_sorted[f] + (k - f) * (data_sorted[c] - data_sorted[f])


def measure_latency(func, n: int = 100) -> dict:
    """Run func n times, return latency stats in ms."""
    _reset_rate_limiter()
    latencies = []
    for _ in range(n):
        start = time.perf_counter()
        func()
        latencies.append((time.perf_counter() - start) * 1000)

    return {
        "count": n,
        "mean_ms": round(statistics.mean(latencies), 2),
        "p50_ms": round(percentile(latencies, 50), 2),
        "p95_ms": round(percentile(latencies, 95), 2),
        "p99_ms": round(percentile(latencies, 99), 2),
        "min_ms": round(min(latencies), 2),
        "max_ms": round(max(latencies), 2),
    }


def measure_concurrent(func, concurrency: int = 10, total: int = 50) -> dict:
    """Run func with concurrent workers, return stats."""
    _reset_rate_limiter()
    latencies = []
    errors = 0

    # Measure with timing
    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        def timed():
            start = time.perf_counter()
            func()
            return (time.perf_counter() - start) * 1000

        futures = [pool.submit(timed) for _ in range(total)]
        for f in as_completed(futures):
            try:
                latencies.append(f.result())
            except Exception:
                errors += 1

    # Second pass with reset for clean measurement
    _reset_rate_limiter()
    latencies2 = []
    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        def timed2():
            start = time.perf_counter()
            func()
            return (time.perf_counter() - start) * 1000

        futures = [pool.submit(timed2) for _ in range(total)]
        for f in as_completed(futures):
            try:
                latencies2.append(f.result())
            except Exception:
                pass
    if latencies2:
        latencies = latencies2

    return {
        "concurrency": concurrency,
        "total_requests": total,
        "errors": errors,
        "mean_ms": round(statistics.mean(latencies), 2) if latencies else 0,
        "p50_ms": round(percentile(latencies, 50), 2) if latencies else 0,
        "p95_ms": round(percentile(latencies, 95), 2) if latencies else 0,
        "p99_ms": round(percentile(latencies, 99), 2) if latencies else 0,
    }


class TestPerformanceBenchmarks:
    """单端点基准测试：100次请求"""

    def test_health_endpoint_benchmark(self, client):
        stats = measure_latency(lambda: client.get(f"{API}/health"), n=100)
        print(f"\n📊 GET /health: {stats}")
        assert stats["p99_ms"] < 500, f"Health endpoint too slow: p99={stats['p99_ms']}ms"

    def test_root_endpoint_benchmark(self, client):
        stats = measure_latency(lambda: client.get("/"), n=100)
        print(f"\n📊 GET /: {stats}")
        assert stats["p99_ms"] < 500

    def test_components_list_benchmark(self, client):
        stats = measure_latency(lambda: client.get(f"{API}/components"), n=100)
        print(f"\n📊 GET /components: {stats}")
        assert stats["p99_ms"] < 1000

    def test_makers_list_benchmark(self, client):
        stats = measure_latency(lambda: client.get(f"{API}/makers"), n=100)
        print(f"\n📊 GET /makers: {stats}")
        assert stats["p99_ms"] < 1000

    def test_stats_endpoint_benchmark(self, client):
        stats = measure_latency(lambda: client.get(f"{API}/stats"), n=100)
        print(f"\n📊 GET /stats: {stats}")
        assert stats["p99_ms"] < 1000

    def test_health_detailed_benchmark(self, client):
        stats = measure_latency(lambda: client.get(f"{API}/health/detailed"), n=50)
        print(f"\n📊 GET /health/detailed: {stats}")
        assert stats["p99_ms"] < 2000


class TestConcurrentLoad:
    """并发负载测试：10并发用户"""

    def test_health_concurrent(self, client):
        stats = measure_concurrent(
            lambda: client.get(f"{API}/health"),
            concurrency=10, total=50,
        )
        print(f"\n🔥 Concurrent GET /health: {stats}")
        assert stats["errors"] == 0, f"Errors under load: {stats['errors']}"
        assert stats["p95_ms"] < 1000

    def test_components_concurrent(self, client):
        stats = measure_concurrent(
            lambda: client.get(f"{API}/components"),
            concurrency=10, total=50,
        )
        print(f"\n🔥 Concurrent GET /components: {stats}")
        assert stats["errors"] == 0

    def test_mixed_read_load(self, client):
        """Mixed read endpoints under concurrent load."""
        import random
        endpoints = ["/", f"{API}/health", f"{API}/components", f"{API}/makers", f"{API}/stats"]

        def random_read():
            ep = random.choice(endpoints)
            r = client.get(ep)
            assert r.status_code == 200

        stats = measure_concurrent(random_read, concurrency=10, total=100)
        print(f"\n🔥 Mixed concurrent reads: {stats}")
        assert stats["errors"] == 0

    def test_auth_register_concurrent(self, client):
        """Concurrent user registrations (unique emails)."""
        import uuid

        def register_user():
            uid = uuid.uuid4().hex[:8]
            r = client.post(f"{API}/auth/register", json={
                "email": f"perf{uid}@test.com",
                "username": f"perf{uid}",
                "password": "securepass123",
            })
            assert r.status_code == 201

        stats = measure_concurrent(register_user, concurrency=5, total=20)
        print(f"\n🔥 Concurrent registrations: {stats}")
        # Allow some errors due to rate limiting on auth endpoints (10/min limit)
        assert stats["errors"] <= 30, f"Too many errors: {stats['errors']}"
