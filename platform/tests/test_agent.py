"""Tests for Agent AI functionality - RealWorldClaw Team

测试覆盖：
1. 自然语言查询设备状态
2. 创建和管理自动化规则
3. 手动执行设备动作
4. 遥测数据查询
5. 设备状态查询
6. 规则条件评估
7. 动作执行
8. 错误处理
"""
from __future__ import annotations

from datetime import datetime, timezone

API = "/api/v1"


class TestAgentQuery:
    """测试自然语言查询功能"""
    
    def _setup_test_data(self, client, admin_headers):
        """创建测试用的设备和遥测数据"""
        # 注册温度传感器
        device_resp = client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": "temp-sensor-001",
            "name": "温度传感器1号",
            "type": "sensor",
            "capabilities": ["temperature", "humidity"]
        })
        temp_token = device_resp.json()["device_token"]
        
        # 注册继电器
        relay_resp = client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": "relay-001",
            "name": "智能继电器1号",
            "type": "relay",
            "capabilities": ["relay", "switch"]
        })
        relay_token = relay_resp.json()["device_token"]
        
        # 添加遥测数据
        client.post(f"{API}/devices/temp-sensor-001/telemetry",
                   headers={"Authorization": f"Bearer {temp_token}"},
                   json={
                       "timestamp": datetime.now(timezone.utc).isoformat(),
                       "sensor_type": "temperature",
                       "value": 25.5,
                       "unit": "°C"
                   })
        
        client.post(f"{API}/devices/temp-sensor-001/telemetry",
                   headers={"Authorization": f"Bearer {temp_token}"},
                   json={
                       "timestamp": datetime.now(timezone.utc).isoformat(),
                       "sensor_type": "humidity",
                       "value": 60.0,
                       "unit": "%"
                   })
        
        return temp_token, relay_token
    
    def test_temperature_query(self, client, admin_headers, tmp_db):
        """测试温度查询"""
        self._setup_test_data(client, admin_headers)
        
        r = client.post(f"{API}/agent/query", headers=admin_headers, json={
            "query": "所有设备的温度是多少？"
        })
        
        assert r.status_code == 200
        data = r.json()
        assert data["query"] == "所有设备的温度是多少？"
        assert len(data["results"]) > 0
        
        # 验证返回的温度数据
        temp_results = [r for r in data["results"] if r["type"] == "telemetry" and r["sensor"] == "temperature"]
        assert len(temp_results) > 0
        assert temp_results[0]["value"] == 25.5
        assert temp_results[0]["unit"] == "°C"
    
    def test_device_status_query(self, client, admin_headers, tmp_db):
        """测试设备状态查询"""
        self._setup_test_data(client, admin_headers)
        
        r = client.post(f"{API}/agent/query", headers=admin_headers, json={
            "query": "所有设备的状态如何？"
        })
        
        assert r.status_code == 200
        data = r.json()
        
        status_results = [r for r in data["results"] if r["type"] == "device_status"]
        assert len(status_results) >= 2  # 至少有温度传感器和继电器
        
        for result in status_results:
            assert "device" in result
            assert "device_id" in result
            assert "status" in result
            assert "health" in result
    
    def test_relay_query(self, client, admin_headers, tmp_db):
        """测试继电器查询"""
        self._setup_test_data(client, admin_headers)
        
        r = client.post(f"{API}/agent/query", headers=admin_headers, json={
            "query": "继电器设备有哪些？"
        })
        
        assert r.status_code == 200
        data = r.json()
        
        relay_results = [r for r in data["results"] if r.get("type") == "relay" or "relay" in str(r.get("capabilities", []))]
        assert len(relay_results) > 0
    
    def test_empty_query_results(self, client, admin_headers, tmp_db):
        """测试无匹配结果的查询"""
        r = client.post(f"{API}/agent/query", headers=admin_headers, json={
            "query": "不相关的查询内容"
        })
        
        assert r.status_code == 200
        data = r.json()
        assert data["results"] == []


class TestAutomationRules:
    """测试自动化规则功能"""
    
    def _register_temp_sensor(self, client, admin_headers):
        """注册温度传感器"""
        r = client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": "temp-001",
            "name": "温度传感器",
            "type": "sensor",
            "capabilities": ["temperature"]
        })
        return r.json()["device_token"]
    
    def _register_relay(self, client, admin_headers):
        """注册继电器"""
        client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": "relay-001", 
            "name": "继电器",
            "type": "relay",
            "capabilities": ["relay"]
        })
    
    def test_create_temperature_rule(self, client, admin_headers, tmp_db):
        """测试创建温度规则"""
        self._register_temp_sensor(client, admin_headers)
        self._register_relay(client, admin_headers)
        
        r = client.post(f"{API}/agent/rules", headers=admin_headers, json={
            "name": "高温自动开启继电器",
            "description": "温度超过30°C时自动开启继电器",
            "condition": {
                "type": "telemetry",
                "device_id": "temp-001",
                "sensor_type": "temperature",
                "operator": ">",
                "threshold": 30.0
            },
            "action": {
                "type": "device_command",
                "device_id": "relay-001",
                "command": "relay_on",
                "parameters": {}
            }
        })
        
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "高温自动开启继电器"
        assert "rule_id" in data
    
    def test_create_rule_invalid_condition(self, client, admin_headers, tmp_db):
        """测试创建无效条件的规则"""
        r = client.post(f"{API}/agent/rules", headers=admin_headers, json={
            "name": "无效规则",
            "description": "测试无效条件",
            "condition": {
                "type": "telemetry",
                # 缺少必要字段
            },
            "action": {
                "type": "device_command",
                "device_id": "test-device",
                "command": "test_command"
            }
        })
        
        assert r.status_code == 400
    
    def test_list_rules(self, client, admin_headers, tmp_db):
        """测试列出规则"""
        self._register_temp_sensor(client, admin_headers)
        self._register_relay(client, admin_headers)
        
        # 创建测试规则
        client.post(f"{API}/agent/rules", headers=admin_headers, json={
            "name": "测试规则1",
            "description": "测试规则描述1",
            "condition": {
                "type": "telemetry",
                "device_id": "temp-001",
                "sensor_type": "temperature",
                "operator": ">",
                "threshold": 25.0
            },
            "action": {
                "type": "device_command",
                "device_id": "relay-001", 
                "command": "relay_on"
            }
        })
        
        # 获取规则列表
        r = client.get(f"{API}/agent/rules", headers=admin_headers)
        
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 1
        assert len(data["rules"]) >= 1
        assert data["rules"][0]["name"] == "测试规则1"
    
    def test_list_rules_enabled_only(self, client, admin_headers, tmp_db):
        """测试只列出启用的规则"""
        r = client.get(f"{API}/agent/rules?enabled_only=true", headers=admin_headers)
        assert r.status_code == 200
        
        r2 = client.get(f"{API}/agent/rules?enabled_only=false", headers=admin_headers)
        assert r2.status_code == 200


class TestManualExecution:
    """测试手动执行功能"""
    
    def _register_relay(self, client, admin_headers):
        """注册继电器设备"""
        client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": "manual-relay-001",
            "name": "手动测试继电器",
            "type": "relay",
            "capabilities": ["relay"]
        })
    
    def test_execute_relay_on(self, client, admin_headers, tmp_db):
        """测试执行继电器开启命令"""
        self._register_relay(client, admin_headers)
        
        r = client.post(f"{API}/agent/execute", headers=admin_headers, json={
            "device_id": "manual-relay-001",
            "command": "relay_on",
            "parameters": {"duration": 10}
        })
        
        assert r.status_code == 200
        data = r.json()
        assert data["device_id"] == "manual-relay-001"
        assert data["command"] == "relay_on"
        assert "command_id" in data
    
    def test_execute_invalid_command(self, client, admin_headers, tmp_db):
        """测试执行无效命令"""
        self._register_relay(client, admin_headers)
        
        r = client.post(f"{API}/agent/execute", headers=admin_headers, json={
            "device_id": "manual-relay-001",
            "command": "invalid_command",
            "parameters": {}
        })
        
        assert r.status_code == 400
    
    def test_execute_nonexistent_device(self, client, admin_headers, tmp_db):
        """测试对不存在设备执行命令"""
        r = client.post(f"{API}/agent/execute", headers=admin_headers, json={
            "device_id": "nonexistent-device",
            "command": "relay_on",
            "parameters": {}
        })
        
        assert r.status_code == 400


class TestDeviceStatusEndpoint:
    """测试设备状态端点"""
    
    def _setup_devices(self, client, admin_headers):
        """设置测试设备"""
        client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": "status-test-001",
            "name": "状态测试设备",
            "type": "sensor",
            "capabilities": ["temperature"]
        })
    
    def test_get_all_devices_status(self, client, admin_headers, tmp_db):
        """测试获取所有设备状态"""
        self._setup_devices(client, admin_headers)
        
        r = client.get(f"{API}/agent/devices/status", headers=admin_headers)
        
        assert r.status_code == 200
        data = r.json()
        assert "devices" in data
        assert "total" in data
        assert data["total"] >= 1
    
    def test_get_specific_device_status(self, client, admin_headers, tmp_db):
        """测试获取特定设备状态"""
        self._setup_devices(client, admin_headers)
        
        r = client.get(f"{API}/agent/devices/status?device_id=status-test-001", headers=admin_headers)
        
        assert r.status_code == 200
        data = r.json()
        assert len(data["devices"]) == 1
        assert data["devices"][0]["device_id"] == "status-test-001"


class TestTelemetryEndpoint:
    """测试遥测数据端点"""
    
    def _setup_telemetry_data(self, client, admin_headers):
        """设置遥测测试数据"""
        # 注册设备
        r = client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": "tele-test-001",
            "name": "遥测测试设备",
            "type": "sensor", 
            "capabilities": ["temperature", "humidity"]
        })
        token = r.json()["device_token"]
        
        # 添加遥测数据
        client.post(f"{API}/devices/tele-test-001/telemetry",
                   headers={"Authorization": f"Bearer {token}"},
                   json={
                       "timestamp": datetime.now(timezone.utc).isoformat(),
                       "sensor_type": "temperature",
                       "value": 22.5,
                       "unit": "°C"
                   })
        
        return token
    
    def test_get_latest_telemetry(self, client, admin_headers, tmp_db):
        """测试获取最新遥测数据"""
        self._setup_telemetry_data(client, admin_headers)
        
        r = client.get(f"{API}/agent/telemetry/latest", headers=admin_headers)
        
        assert r.status_code == 200
        data = r.json()
        assert "telemetry" in data
        assert "total" in data
        assert len(data["telemetry"]) >= 1
    
    def test_get_telemetry_by_device(self, client, admin_headers, tmp_db):
        """测试按设备获取遥测数据"""
        self._setup_telemetry_data(client, admin_headers)
        
        r = client.get(f"{API}/agent/telemetry/latest?device_id=tele-test-001", headers=admin_headers)
        
        assert r.status_code == 200
        data = r.json()
        assert all(t["device_id"] == "tele-test-001" for t in data["telemetry"])
    
    def test_get_telemetry_by_sensor_type(self, client, admin_headers, tmp_db):
        """测试按传感器类型获取遥测数据"""
        self._setup_telemetry_data(client, admin_headers)
        
        r = client.get(f"{API}/agent/telemetry/latest?sensor_type=temperature", headers=admin_headers)
        
        assert r.status_code == 200
        data = r.json()
        assert all(t["sensor_type"] == "temperature" for t in data["telemetry"])


class TestRuleEvaluation:
    """测试规则评估功能"""
    
    def test_evaluate_rules_empty(self, client, admin_headers, tmp_db):
        """测试评估空规则集"""
        r = client.post(f"{API}/agent/rules/evaluate", headers=admin_headers)
        
        assert r.status_code == 200
        data = r.json()
        assert "executed_rules" in data
        assert "total_executed" in data
        assert data["total_executed"] == 0


class TestAgentAuth:
    """测试Agent功能的认证"""
    
    def test_query_requires_auth(self, client):
        """测试查询需要认证"""
        r = client.post(f"{API}/agent/query", json={"query": "test"})
        assert r.status_code in (401, 422)
    
    def test_rules_require_auth(self, client):
        """测试规则管理需要认证"""
        r1 = client.get(f"{API}/agent/rules")
        assert r1.status_code in (401, 422)
        
        r2 = client.post(f"{API}/agent/rules", json={})
        assert r2.status_code in (401, 422)
    
    def test_execute_requires_auth(self, client):
        """测试执行命令需要认证"""
        r = client.post(f"{API}/agent/execute", json={})
        assert r.status_code in (401, 422)