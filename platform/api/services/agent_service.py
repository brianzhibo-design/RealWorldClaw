"""RealWorldClaw — Agent智能化服务

提供设备状态查询、控制命令执行、基于规则的自动化等功能。
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from ..database import get_db


@dataclass
class DeviceStatus:
    """设备状态信息"""
    device_id: str
    name: str
    type: str
    status: str
    health: str
    last_seen_at: Optional[str]
    recent_telemetry: List[Dict[str, Any]]
    capabilities: List[str]


@dataclass
class TelemetryData:
    """遥测数据"""
    sensor_type: str
    value: float
    unit: str
    timestamp: str
    device_id: str
    device_name: str


@dataclass
class AutomationRule:
    """自动化规则"""
    id: str
    name: str
    description: str
    condition: Dict[str, Any]  # 条件表达式
    action: Dict[str, Any]     # 执行动作
    enabled: bool
    created_by: str
    created_at: str


class AgentService:
    """Agent智能化核心服务"""

    def __init__(self):
        self.operators = {
            '>': lambda x, y: float(x) > float(y),
            '<': lambda x, y: float(x) < float(y),
            '>=': lambda x, y: float(x) >= float(y),
            '<=': lambda x, y: float(x) <= float(y),
            '==': lambda x, y: str(x) == str(y),
            '!=': lambda x, y: str(x) != str(y),
            'in': lambda x, y: str(x) in str(y),
            'contains': lambda x, y: str(y) in str(x),
        }

    def query_device_status(self, device_id: Optional[str] = None) -> List[DeviceStatus]:
        """查询设备状态信息"""
        with get_db() as db:
            if device_id:
                devices = db.execute(
                    "SELECT * FROM devices WHERE device_id = ?", (device_id,)
                ).fetchall()
            else:
                devices = db.execute("SELECT * FROM devices ORDER BY name").fetchall()

            result = []
            for device in devices:
                # 获取最近的遥测数据
                telemetry = db.execute(
                    """SELECT sensor_type, value, unit, timestamp, received_at
                       FROM telemetry WHERE device_id = ? 
                       ORDER BY received_at DESC LIMIT 5""",
                    (device["id"],)
                ).fetchall()

                # 计算健康状态
                health = self._calculate_device_health(device["last_seen_at"])

                device_status = DeviceStatus(
                    device_id=device["device_id"],
                    name=device["name"],
                    type=device["type"],
                    status=device["status"],
                    health=health,
                    last_seen_at=device["last_seen_at"],
                    recent_telemetry=[dict(t) for t in telemetry],
                    capabilities=json.loads(device["capabilities"] or "[]")
                )
                result.append(device_status)

            return result

    def get_latest_telemetry(self, 
                           device_id: Optional[str] = None,
                           sensor_type: Optional[str] = None,
                           limit: int = 10) -> List[TelemetryData]:
        """获取最新的遥测数据"""
        with get_db() as db:
            query = """
                SELECT t.sensor_type, t.value, t.unit, t.timestamp, 
                       d.device_id, d.name as device_name
                FROM telemetry t
                JOIN devices d ON t.device_id = d.id
            """
            params = []

            conditions = []
            if device_id:
                conditions.append("d.device_id = ?")
                params.append(device_id)
            if sensor_type:
                conditions.append("t.sensor_type = ?")
                params.append(sensor_type)

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += " ORDER BY t.received_at DESC LIMIT ?"
            params.append(limit)

            rows = db.execute(query, params).fetchall()

            return [
                TelemetryData(
                    sensor_type=row["sensor_type"],
                    value=row["value"],
                    unit=row["unit"],
                    timestamp=row["timestamp"],
                    device_id=row["device_id"],
                    device_name=row["device_name"]
                )
                for row in rows
            ]

    def execute_device_command(self, device_id: str, command: str, 
                             parameters: Dict[str, Any], requester_agent_id: str) -> str:
        """执行设备控制命令"""
        valid_commands = {"relay_on", "relay_off", "reboot", "ping", "set_config"}
        if command not in valid_commands:
            raise ValueError(f"Invalid command '{command}'. Valid commands: {', '.join(sorted(valid_commands))}")

        now = datetime.now(timezone.utc).isoformat()
        command_id = str(uuid.uuid4())

        with get_db() as db:
            # 检查设备是否存在
            device = db.execute("SELECT * FROM devices WHERE device_id = ?", (device_id,)).fetchone()
            if not device:
                raise ValueError(f"Device '{device_id}' not found")

            # 记录命令
            db.execute(
                """INSERT INTO device_commands (id, device_id, command, parameters, 
                                               requester_agent_id, status, created_at)
                   VALUES (?, ?, ?, ?, ?, 'pending', ?)""",
                (command_id, device["id"], command, json.dumps(parameters), requester_agent_id, now)
            )

        return command_id

    def process_natural_language_query(self, query: str) -> Dict[str, Any]:
        """处理自然语言查询设备状态"""
        query_lower = query.lower()
        
        # 简单的关键词匹配（实际项目中可以使用NLP模型）
        result = {"query": query, "results": []}

        # 温度查询
        if any(keyword in query_lower for keyword in ["温度", "temperature", "temp"]):
            telemetry = self.get_latest_telemetry(sensor_type="temperature", limit=5)
            result["results"].extend([
                {
                    "type": "telemetry",
                    "device": t.device_name,
                    "device_id": t.device_id,
                    "sensor": t.sensor_type,
                    "value": t.value,
                    "unit": t.unit,
                    "timestamp": t.timestamp
                }
                for t in telemetry
            ])

        # 湿度查询
        if any(keyword in query_lower for keyword in ["湿度", "humidity"]):
            telemetry = self.get_latest_telemetry(sensor_type="humidity", limit=5)
            result["results"].extend([
                {
                    "type": "telemetry", 
                    "device": t.device_name,
                    "device_id": t.device_id,
                    "sensor": t.sensor_type,
                    "value": t.value,
                    "unit": t.unit,
                    "timestamp": t.timestamp
                }
                for t in telemetry
            ])

        # 设备状态查询
        if any(keyword in query_lower for keyword in ["状态", "status", "health", "在线"]):
            devices = self.query_device_status()
            result["results"].extend([
                {
                    "type": "device_status",
                    "device": d.name,
                    "device_id": d.device_id,
                    "status": d.status,
                    "health": d.health,
                    "last_seen": d.last_seen_at
                }
                for d in devices
            ])

        # 继电器相关查询
        if any(keyword in query_lower for keyword in ["继电器", "relay", "开关", "switch"]):
            relay_devices = self.query_device_status()
            result["results"].extend([
                {
                    "type": "device_status",
                    "device": d.name,
                    "device_id": d.device_id,
                    "type": d.type,
                    "capabilities": d.capabilities,
                    "status": d.status
                }
                for d in relay_devices if d.type == "relay" or "relay" in d.capabilities
            ])

        return result

    def create_automation_rule(self, name: str, description: str,
                             condition: Dict[str, Any], action: Dict[str, Any],
                             created_by: str) -> str:
        """创建自动化规则"""
        rule_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        with get_db() as db:
            # 创建automation_rules表（如果不存在）
            db.execute("""
                CREATE TABLE IF NOT EXISTS automation_rules (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    condition TEXT NOT NULL,  -- JSON
                    action TEXT NOT NULL,     -- JSON
                    enabled INTEGER NOT NULL DEFAULT 1,
                    created_by TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)

            db.execute(
                """INSERT INTO automation_rules (id, name, description, condition, action,
                                               enabled, created_by, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)""",
                (rule_id, name, description, json.dumps(condition), json.dumps(action),
                 created_by, now, now)
            )

        return rule_id

    def get_automation_rules(self, enabled_only: bool = True) -> List[AutomationRule]:
        """获取自动化规则列表"""
        with get_db() as db:
            # 确保表存在
            db.execute("""
                CREATE TABLE IF NOT EXISTS automation_rules (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    condition TEXT NOT NULL,  -- JSON
                    action TEXT NOT NULL,     -- JSON
                    enabled INTEGER NOT NULL DEFAULT 1,
                    created_by TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)

            query = "SELECT * FROM automation_rules"
            if enabled_only:
                query += " WHERE enabled = 1"
            query += " ORDER BY created_at DESC"

            rows = db.execute(query).fetchall()

            return [
                AutomationRule(
                    id=row["id"],
                    name=row["name"],
                    description=row["description"],
                    condition=json.loads(row["condition"]),
                    action=json.loads(row["action"]),
                    enabled=bool(row["enabled"]),
                    created_by=row["created_by"],
                    created_at=row["created_at"]
                )
                for row in rows
            ]

    def evaluate_automation_rules(self) -> List[Dict[str, Any]]:
        """评估并执行自动化规则"""
        rules = self.get_automation_rules(enabled_only=True)
        executed_actions = []

        for rule in rules:
            try:
                if self._evaluate_condition(rule.condition):
                    action_result = self._execute_action(rule.action)
                    executed_actions.append({
                        "rule_id": rule.id,
                        "rule_name": rule.name,
                        "condition": rule.condition,
                        "action": rule.action,
                        "result": action_result,
                        "executed_at": datetime.now(timezone.utc).isoformat()
                    })
            except Exception as e:
                executed_actions.append({
                    "rule_id": rule.id,
                    "rule_name": rule.name,
                    "error": str(e),
                    "executed_at": datetime.now(timezone.utc).isoformat()
                })

        return executed_actions

    def _calculate_device_health(self, last_seen_at: Optional[str]) -> str:
        """计算设备健康状态"""
        if not last_seen_at:
            return "unknown"

        try:
            last_seen = datetime.fromisoformat(last_seen_at)
            delta = (datetime.now(timezone.utc) - last_seen).total_seconds()
            
            if delta < 300:  # 5分钟内
                return "healthy"
            elif delta < 3600:  # 1小时内
                return "degraded"
            else:
                return "offline"
        except ValueError:
            return "unknown"

    def _evaluate_condition(self, condition: Dict[str, Any]) -> bool:
        """评估条件表达式"""
        condition_type = condition.get("type")

        if condition_type == "telemetry":
            device_id = condition.get("device_id")
            sensor_type = condition.get("sensor_type")
            operator = condition.get("operator", ">")
            threshold = condition.get("threshold")

            if not all([device_id, sensor_type, threshold]):
                return False

            # 获取最新遥测数据
            telemetry = self.get_latest_telemetry(device_id=device_id, sensor_type=sensor_type, limit=1)
            if not telemetry:
                return False

            latest = telemetry[0]
            op_func = self.operators.get(operator)
            if not op_func:
                return False

            return op_func(latest.value, threshold)

        elif condition_type == "device_status":
            device_id = condition.get("device_id")
            expected_status = condition.get("status")

            if not all([device_id, expected_status]):
                return False

            devices = self.query_device_status(device_id=device_id)
            if not devices:
                return False

            return devices[0].status == expected_status

        return False

    def _execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """执行动作"""
        action_type = action.get("type")

        if action_type == "device_command":
            device_id = action.get("device_id")
            command = action.get("command")
            parameters = action.get("parameters", {})
            agent_id = action.get("agent_id", "automation_system")

            if not all([device_id, command]):
                raise ValueError("Missing required action parameters")

            command_id = self.execute_device_command(device_id, command, parameters, agent_id)
            return {"command_id": command_id, "status": "executed"}

        else:
            raise ValueError(f"Unknown action type: {action_type}")