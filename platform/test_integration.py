#!/usr/bin/env python3
"""
RealWorldClaw 平台 MVP 集成测试
沸羊羊💪 | 2026-02-20

直接运行: python3 test_integration.py
"""

import sqlite3
import sys
import traceback
from datetime import datetime
from pathlib import Path
from uuid import uuid4

# ── 路径设置 ──────────────────────────────────────────────
PLATFORM_DIR = Path(__file__).parent
DATA_DIR = PLATFORM_DIR / "data"
DB_PATH = DATA_DIR / "test_integration.db"  # 用独立测试库，不污染正式数据
SEED_SQL = DATA_DIR / "seed-data.sql"

# 让 api 包可被导入
sys.path.insert(0, str(PLATFORM_DIR))


# ── 测试框架 ──────────────────────────────────────────────
class TestReport:
    def __init__(self):
        self.results: list[tuple[str, bool, str]] = []

    def record(self, name: str, passed: bool, detail: str = ""):
        self.results.append((name, passed, detail))
        icon = "✅" if passed else "❌"
        print(f"  {icon} {name}" + (f" — {detail}" if detail else ""))

    def summary(self):
        total = len(self.results)
        passed = sum(1 for _, p, _ in self.results if p)
        failed = total - passed
        print("\n" + "=" * 50)
        print(f"📊 测试报告: {passed}/{total} 通过, {failed} 失败")
        if failed:
            print("❌ 失败项:")
            for name, p, detail in self.results:
                if not p:
                    print(f"   - {name}: {detail}")
        else:
            print("🎉 全部通过！沸羊羊说：MVP数据验证完美💪")
        print("=" * 50)
        return failed == 0


report = TestReport()


def run_test(name):
    """装饰器，自动捕获异常"""
    def decorator(fn):
        def wrapper():
            try:
                fn()
            except Exception as e:
                report.record(name, False, f"异常: {e}")
                traceback.print_exc()
        return wrapper
    return decorator


# ── 辅助：获取测试数据库连接 ─────────────────────────────
def get_test_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


# ── 1. 种子数据导入测试 ──────────────────────────────────
@run_test("种子数据SQL导入")
def test_seed_import():
    """导入 seed-data.sql 到测试数据库，验证数据完整性"""
    if DB_PATH.exists():
        DB_PATH.unlink()
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    conn = get_test_db()
    sql = SEED_SQL.read_text(encoding="utf-8")
    conn.executescript(sql)

    # 验证组件数
    count = conn.execute("SELECT COUNT(*) FROM components").fetchone()[0]
    assert count == 2, f"期望2个组件，实际{count}"

    # 验证 rwc-one
    one = conn.execute("SELECT * FROM components WHERE id='rwc-one'").fetchone()
    assert one is not None, "rwc-one 未找到"
    assert one["category"] == "robot"
    assert one["difficulty"] == "beginner"

    # 验证变体
    variants = conn.execute("SELECT COUNT(*) FROM component_variants WHERE component_id='rwc-one'").fetchone()[0]
    assert variants == 3, f"期望3个变体，实际{variants}"

    # 验证传感器
    sensors = conn.execute("SELECT COUNT(*) FROM component_sensors WHERE component_id='rwc-one'").fetchone()[0]
    assert sensors == 5, f"期望5个传感器，实际{sensors}"

    # 验证能力
    caps = conn.execute("SELECT COUNT(*) FROM component_capabilities WHERE component_id='rwc-one'").fetchone()[0]
    assert caps == 8, f"期望8个能力，实际{caps}"

    # 验证MQTT
    topics = conn.execute("SELECT COUNT(*) FROM mqtt_topics WHERE component_id='rwc-one'").fetchone()[0]
    assert topics == 6, f"期望6个MQTT主题，实际{topics}"

    # 验证 rwc-temp-monitor
    tm = conn.execute("SELECT * FROM components WHERE id='rwc-temp-monitor'").fetchone()
    assert tm is not None, "rwc-temp-monitor 未找到"
    assert tm["category"] == "sensor"

    conn.close()
    report.record("种子数据SQL导入", True, "2个组件、变体、传感器、能力、MQTT全部验证通过")


# ── 2. Agent注册测试（使用 database.py 的 schema）───────
@run_test("Agent注册（database.py schema）")
def test_agent_registration():
    """测试 database.py 中定义的 agents 表 CRUD"""
    # 猴子补丁：让 database.py 用测试库
    from api import database
    original_path = database.DB_PATH
    database.DB_PATH = DB_PATH

    try:
        # 初始化 database.py 的表结构（会在测试库上创建 agents 等表）
        database.init_db()

        now = datetime.now(tz=None).isoformat()
        agent_id = f"agent-test-{uuid4().hex[:8]}"
        api_key = f"rwc-key-{uuid4().hex[:12]}"

        with database.get_db() as db:
            # 注册
            db.execute("""
                INSERT INTO agents (id, name, display_name, description, type, status,
                                    reputation, tier, api_key, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (agent_id, f"test-agent-{agent_id[-4:]}", "沸羊羊测试Agent",
                  "集成测试创建的Agent", "openclaw", "active", 0, "newcomer", api_key, now, now))

            # 查询
            row = db.execute("SELECT * FROM agents WHERE id=?", (agent_id,)).fetchone()
            assert row is not None, "Agent 注册后查询失败"
            assert row["display_name"] == "沸羊羊测试Agent"
            assert row["status"] == "active"
            assert row["api_key"] == api_key

            # 更新声望
            db.execute("UPDATE agents SET reputation=10, tier='contributor' WHERE id=?", (agent_id,))
            row2 = db.execute("SELECT reputation, tier FROM agents WHERE id=?", (agent_id,)).fetchone()
            assert row2["reputation"] == 10
            assert row2["tier"] == "contributor"

        report.record("Agent注册（database.py schema）", True, f"注册/查询/更新通过, id={agent_id}")
    finally:
        database.DB_PATH = original_path


# ── 3. 组件搜索测试 ─────────────────────────────────────
@run_test("组件搜索")
def test_component_search():
    """测试在 database.py 的 components 表中搜索"""
    from api import database
    original_path = database.DB_PATH
    database.DB_PATH = DB_PATH

    try:
        # seed-data.sql 的 components 表 schema 与 database.py 不同（title vs display_name）
        # 需要先删掉 seed 版本的 components 表，让 init_db 重建平台版本
        with database.get_db() as db:
            db.execute("PRAGMA foreign_keys=OFF")
            db.execute("DROP TABLE IF EXISTS components")
            db.execute("PRAGMA foreign_keys=ON")
        database.init_db()

        now = datetime.now(tz=None).isoformat()
        # 先确保有 agent 作为 author
        with database.get_db() as db:
            author_id = "author-meiyangyang"
            db.execute("""
                INSERT OR IGNORE INTO agents (id, name, display_name, description, type, status,
                                              reputation, tier, api_key, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (author_id, "meiyangyang", "美羊羊", "组件作者", "openclaw", "active",
                  50, "contributor", f"key-{uuid4().hex[:8]}", now, now))

            # 插入测试组件
            for i, (cid, name, desc, tags, caps) in enumerate([
                ("comp-temp-1", "温度监控器", "基于ESP32的温度监控", '["esp32","temperature","sensor"]', '["temperature_sensing","wifi"]'),
                ("comp-led-1", "RGB灯控", "智能LED灯带控制器", '["esp32","led","lighting"]', '["led_control","wifi","mqtt"]'),
                ("comp-cam-1", "摄像头模块", "ESP32-CAM监控", '["esp32-cam","camera","security"]', '["video_stream","wifi"]'),
            ]):
                db.execute("""
                    INSERT OR IGNORE INTO components (id, display_name, description, version, author_id,
                        tags, capabilities, compute, material, estimated_cost_cny,
                        status, downloads, rating, review_count, created_at, updated_at)
                    VALUES (?, ?, ?, '1.0.0', ?, ?, ?, 'esp32', 'PLA', ?, 'verified', ?, ?, ?, ?, ?)
                """, (cid, name, desc, author_id, tags, caps, 30 + i * 10,
                      10 * (i + 1), 3.5 + i * 0.5, i + 1, now, now))

        # 搜索测试
        with database.get_db() as db:
            # 按标签搜索
            rows = db.execute("SELECT * FROM components WHERE tags LIKE ?", ('%temperature%',)).fetchall()
            assert len(rows) >= 1, f"温度标签搜索应至少1条，实际{len(rows)}"

            # 按名称搜索
            rows2 = db.execute("SELECT * FROM components WHERE display_name LIKE ?", ('%灯控%',)).fetchall()
            assert len(rows2) >= 1, "名称搜索'灯控'应有结果"

            # 全量查询
            all_rows = db.execute("SELECT * FROM components").fetchall()
            assert len(all_rows) >= 3, f"应至少3个组件，实际{len(all_rows)}"

        report.record("组件搜索", True, f"标签搜索/名称搜索/全量查询通过, 共{len(all_rows)}个组件")
    finally:
        database.DB_PATH = original_path


# ── 4. 匹配引擎测试 ─────────────────────────────────────
@run_test("匹配引擎")
def test_match_engine():
    """直接测试 match.py 中的 _compute_score 逻辑"""
    from api import database
    original_path = database.DB_PATH
    database.DB_PATH = DB_PATH

    try:
        # 构造 MatchRequest-like 对象（不依赖 FastAPI）
        class FakeMatchReq:
            def __init__(self, need, hardware, budget=None, limit=5):
                self.need = need
                self.hardware_available = hardware
                self.budget_cny = budget
                self.limit = limit

        from api.routers.match import _compute_score

        # 模拟组件行
        comp_temp = {
            "id": "comp-temp-1", "display_name": "温度监控器",
            "description": "基于ESP32的温度监控",
            "tags": '["esp32","temperature","sensor"]',
            "capabilities": '["temperature_sensing","wifi"]',
            "compute": "esp32", "estimated_cost_cny": 30,
            "rating": 4.0, "review_count": 2,
        }
        comp_led = {
            "id": "comp-led-1", "display_name": "RGB灯控",
            "description": "智能LED灯带控制器",
            "tags": '["esp32","led","lighting"]',
            "capabilities": '["led_control","wifi","mqtt"]',
            "compute": "esp32", "estimated_cost_cny": 40,
            "rating": 4.5, "review_count": 3,
        }

        # Case 1: 搜索"温度 sensor" + 有 esp32 硬件
        req1 = FakeMatchReq("温度 sensor", ["esp32"], budget=50)
        score1, reason1 = _compute_score(comp_temp, req1)
        assert score1 > 0.3, f"温度组件对'温度 sensor'应>0.3, 实际{score1}"

        # Case 2: 搜索"温度" 对 LED 组件应低分
        score2, reason2 = _compute_score(comp_led, req1)
        assert score1 > score2, f"温度组件({score1})应高于LED组件({score2})"

        # Case 3: 预算不足
        req3 = FakeMatchReq("LED lighting", ["esp32"], budget=20)
        score3, _ = _compute_score(comp_led, req3)
        req4 = FakeMatchReq("LED lighting", ["esp32"], budget=100)
        score4, _ = _compute_score(comp_led, req4)
        assert score4 >= score3, f"预算充足({score4})应>=预算不足({score3})"

        # Case 4: 无硬件匹配
        req5 = FakeMatchReq("温度", ["raspberry-pi"], budget=50)
        score5, _ = _compute_score(comp_temp, req5)
        assert score5 < score1, f"硬件不匹配({score5})应低于匹配({score1})"

        report.record("匹配引擎", True,
                      f"评分逻辑验证通过: 关键词匹配={score1:.3f}, 交叉低分={score2:.3f}, "
                      f"预算对比={score3:.3f}vs{score4:.3f}")
    finally:
        database.DB_PATH = original_path


# ── 5. 种子数据与平台schema一致性测试 ────────────────────
@run_test("Schema一致性检查")
def test_schema_consistency():
    """检查 seed-data.sql 和 database.py 的表是否都能在同一库中共存"""
    conn = get_test_db()

    # seed-data 创建的表
    seed_tables = {"components", "component_variants", "component_sensors",
                   "component_capabilities", "mqtt_topics"}
    # database.py 创建的表
    db_tables = {"agents", "components", "posts", "replies", "votes"}

    existing = {row[0] for row in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()}

    missing_seed = seed_tables - existing
    missing_db = db_tables - existing

    assert not missing_seed, f"种子数据表缺失: {missing_seed}"
    assert not missing_db, f"database.py表缺失: {missing_db}"

    conn.close()
    report.record("Schema一致性检查", True,
                  f"共{len(existing)}张表, 种子表和平台表均存在")


# ── 主流程 ────────────────────────────────────────────────
def main():
    print("=" * 50)
    print("🔥 沸羊羊💪 RealWorldClaw 平台 MVP 集成测试")
    print(f"   时间: {datetime.now().isoformat()}")
    print(f"   测试库: {DB_PATH}")
    print("=" * 50)
    print()

    print("📦 1/5 种子数据导入")
    test_seed_import()
    print()

    print("🤖 2/5 Agent注册")
    test_agent_registration()
    print()

    print("🔍 3/5 组件搜索")
    test_component_search()
    print()

    print("🎯 4/5 匹配引擎")
    test_match_engine()
    print()

    print("🔗 5/5 Schema一致性")
    test_schema_consistency()

    all_passed = report.summary()

    # 清理测试库
    if DB_PATH.exists():
        DB_PATH.unlink()
        print(f"\n🧹 已清理测试数据库: {DB_PATH}")

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
