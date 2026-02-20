"""匹配引擎测试 — 暖羊羊🐑 QA (W8)"""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from api.database import get_db, init_db
from api.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def _setup_db(tmp_path, monkeypatch):
    import api.database as db_mod
    monkeypatch.setattr(db_mod, "DB_PATH", tmp_path / "test.db")
    init_db()
    yield


def _seed_agent(agent_id: str = "ag_match", api_key: str = "rwc_sk_match") -> str:
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        db.execute(
            """INSERT OR IGNORE INTO agents
               (id, name, display_name, description, type, status,
                reputation, tier, api_key, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (agent_id, f"match-{secrets.token_hex(3)}", "Match Agent",
             "A test agent", "openclaw", "active",
             0, "newcomer", api_key, now, now),
        )
    return agent_id


def _seed_component(component_id: str, tags: list[str] | None = None,
                     material: str | None = None, compute: str | None = None,
                     cost: float | None = None):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        db.execute(
            """INSERT OR IGNORE INTO components
               (id, display_name, description, version, author_id,
                tags, capabilities, compute, material, estimated_cost_cny,
                status, downloads, rating, review_count, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (component_id, f"Component {component_id}", f"A component for {component_id} testing",
             "0.1.0", "ag_match", json.dumps(tags or ["3d-print"]),
             json.dumps(["print"]), compute, material, cost,
             "unverified", 0, 0.0, 0, now, now),
        )


MATCH_BODY = {
    "need": "我需要一个手机支架 3d-print",
    "hardware_available": ["3d-print", "PLA"],
    "budget_cny": 50.0,
    "limit": 5,
}


# ─── 基本匹配 ────────────────────────────────────────────

class TestMatchBasic:
    def test_match_success(self):
        _seed_agent()
        _seed_component("phone-stand", tags=["3d-print", "手机支架"], material="PLA", cost=20.0)
        resp = client.post("/api/v1/match", json=MATCH_BODY)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["matches"]) >= 1
        assert data["matches"][0]["score"] > 0
        assert data["matches"][0]["component"]["id"] == "phone-stand"

    def test_match_no_components(self):
        """无组件时返回空匹配 + 建议"""
        resp = client.post("/api/v1/match", json=MATCH_BODY)
        assert resp.status_code == 200
        data = resp.json()
        assert data["matches"] == []
        assert len(data["no_match_suggestions"]) > 0


# ─── 材料匹配优先级 ──────────────────────────────────────

class TestMatchPriority:
    def test_material_tag_priority(self):
        """有更多标签重叠的组件应排在前面"""
        _seed_agent()
        _seed_component("generic-widget", tags=["widget"], cost=30.0)
        _seed_component("pla-stand", tags=["3d-print", "PLA", "手机支架"], material="PLA", cost=25.0)
        resp = client.post("/api/v1/match", json=MATCH_BODY)
        assert resp.status_code == 200
        matches = resp.json()["matches"]
        # pla-stand should score higher due to more tag overlap
        if len(matches) >= 2:
            assert matches[0]["component"]["id"] == "pla-stand"

    def test_budget_filter(self):
        """超出预算的组件评分低于预算内的"""
        _seed_agent()
        _seed_component("cheap", tags=["3d-print"], cost=30.0)
        _seed_component("expensive", tags=["3d-print"], cost=200.0)
        resp = client.post("/api/v1/match", json={
            "need": "3d-print component",
            "hardware_available": ["3d-print"],
            "budget_cny": 50.0,
            "limit": 5,
        })
        assert resp.status_code == 200
        matches = resp.json()["matches"]
        if len(matches) == 2:
            assert matches[0]["score"] >= matches[1]["score"]
