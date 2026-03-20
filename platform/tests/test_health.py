"""Health endpoint tests."""


def test_health_basic(client):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_health_detailed(client):
    resp = client.get("/api/v1/health/detailed")
    assert resp.status_code == 200
    data = resp.json()
    assert data["database"] == "connected"
    assert "disk" in data
    assert "uptime_seconds" in data
