"""RealWorldClaw — Agent智能化API端点

提供自然语言查询、自动化规则管理、手动执行等功能。
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..deps import get_current_user
from ..services.agent_service import AgentService

router = APIRouter(prefix="/agent", tags=["agent"])

# ── Pydantic schemas ────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str = Field(..., description="自然语言查询内容")


class QueryResponse(BaseModel):
    query: str
    results: List[Dict[str, Any]]
    timestamp: str


class RuleCondition(BaseModel):
    type: str = Field(..., description="条件类型: telemetry, device_status")
    device_id: Optional[str] = Field(None, description="设备ID")
    sensor_type: Optional[str] = Field(None, description="传感器类型，如temperature")
    operator: Optional[str] = Field(">", description="比较操作符: >, <, >=, <=, ==, !=, in, contains")
    threshold: Optional[float] = Field(None, description="阈值")
    status: Optional[str] = Field(None, description="期望的设备状态")


class RuleAction(BaseModel):
    type: str = Field(..., description="动作类型: device_command")
    device_id: Optional[str] = Field(None, description="目标设备ID")
    command: Optional[str] = Field(None, description="命令: relay_on, relay_off, reboot等")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="命令参数")
    agent_id: Optional[str] = Field("automation_system", description="执行者Agent ID")


class CreateRuleRequest(BaseModel):
    name: str = Field(..., description="规则名称")
    description: str = Field(..., description="规则描述")
    condition: RuleCondition = Field(..., description="触发条件")
    action: RuleAction = Field(..., description="执行动作")


class CreateRuleResponse(BaseModel):
    rule_id: str
    name: str
    status: str = "created"


class RuleInfo(BaseModel):
    id: str
    name: str
    description: str
    condition: Dict[str, Any]
    action: Dict[str, Any]
    enabled: bool
    created_by: str
    created_at: str


class ListRulesResponse(BaseModel):
    rules: List[RuleInfo]
    total: int


class ExecuteActionRequest(BaseModel):
    device_id: str = Field(..., description="目标设备ID")
    command: str = Field(..., description="命令名称")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="命令参数")


class ExecuteActionResponse(BaseModel):
    command_id: str
    device_id: str
    command: str
    status: str = "executed"
    message: str


class DeviceStatusInfo(BaseModel):
    device_id: str
    name: str
    type: str
    status: str
    health: str
    last_seen_at: Optional[str]
    recent_telemetry: List[Dict[str, Any]]
    capabilities: List[str]


class TelemetryInfo(BaseModel):
    sensor_type: str
    value: float
    unit: str
    timestamp: str
    device_id: str
    device_name: str


# ── Endpoints ────────────────────────────────────────────────────

@router.post("/query", response_model=QueryResponse)
def query_devices(req: QueryRequest, user: dict = Depends(get_current_user)):
    """自然语言查询设备状态和遥测数据"""
    try:
        agent_service = AgentService()
        result = agent_service.process_natural_language_query(req.query)
        
        from datetime import datetime, timezone
        return QueryResponse(
            query=result["query"],
            results=result["results"],
            timestamp=datetime.now(timezone.utc).isoformat()
        )
    except Exception as e:
        logger.exception("Unexpected error in process_query: %s", e)
        raise HTTPException(status_code=500, detail=f"查询处理失败: {str(e)}")


@router.post("/rules", response_model=CreateRuleResponse)
def create_automation_rule(req: CreateRuleRequest, user: dict = Depends(get_current_user)):
    """创建自动化规则"""
    try:
        agent_service = AgentService()
        
        # 验证条件和动作
        condition_dict = req.condition.model_dump()
        action_dict = req.action.model_dump()
        
        # 基本验证
        if condition_dict["type"] == "telemetry":
            required_fields = ["device_id", "sensor_type", "threshold"]
            missing_fields = [f for f in required_fields if not condition_dict.get(f)]
            if missing_fields:
                raise HTTPException(
                    status_code=400, 
                    detail=f"telemetry条件需要以下字段: {', '.join(missing_fields)}"
                )
        
        if action_dict["type"] == "device_command":
            required_fields = ["device_id", "command"]
            missing_fields = [f for f in required_fields if not action_dict.get(f)]
            if missing_fields:
                raise HTTPException(
                    status_code=400,
                    detail=f"device_command动作需要以下字段: {', '.join(missing_fields)}"
                )
        
        rule_id = agent_service.create_automation_rule(
            name=req.name,
            description=req.description,
            condition=condition_dict,
            action=action_dict,
            created_by=user["id"]
        )
        
        return CreateRuleResponse(rule_id=rule_id, name=req.name)
        
    except HTTPException:
        raise  # 重新抛出HTTP异常
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in create_automation_rule: %s", e)
        raise HTTPException(status_code=500, detail=f"创建规则失败: {str(e)}")


@router.get("/rules", response_model=ListRulesResponse)
def list_automation_rules(enabled_only: bool = True, user: dict = Depends(get_current_user)):
    """列出自动化规则"""
    try:
        agent_service = AgentService()
        rules = agent_service.get_automation_rules(enabled_only=enabled_only)
        
        rule_infos = [
            RuleInfo(
                id=rule.id,
                name=rule.name,
                description=rule.description,
                condition=rule.condition,
                action=rule.action,
                enabled=rule.enabled,
                created_by=rule.created_by,
                created_at=rule.created_at
            )
            for rule in rules
        ]
        
        return ListRulesResponse(rules=rule_infos, total=len(rule_infos))
        
    except Exception as e:
        logger.exception("Unexpected error in list_automation_rules: %s", e)
        raise HTTPException(status_code=500, detail=f"获取规则列表失败: {str(e)}")


@router.post("/execute", response_model=ExecuteActionResponse)
def execute_manual_action(req: ExecuteActionRequest, user: dict = Depends(get_current_user)):
    """手动执行设备动作"""
    try:
        agent_service = AgentService()
        command_id = agent_service.execute_device_command(
            device_id=req.device_id,
            command=req.command,
            parameters=req.parameters,
            requester_agent_id=user["id"]
        )
        
        return ExecuteActionResponse(
            command_id=command_id,
            device_id=req.device_id,
            command=req.command,
            message=f"命令'{req.command}'已发送给设备{req.device_id}"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error in execute_manual_action: %s", e)
        raise HTTPException(status_code=500, detail=f"执行命令失败: {str(e)}")


# ── 额外的查询端点 ──────────────────────────────────────────────

@router.get("/devices/status")
def get_all_devices_status(device_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    """获取设备状态信息"""
    try:
        agent_service = AgentService()
        devices = agent_service.query_device_status(device_id=device_id)
        
        return {
            "devices": [
                DeviceStatusInfo(
                    device_id=d.device_id,
                    name=d.name,
                    type=d.type,
                    status=d.status,
                    health=d.health,
                    last_seen_at=d.last_seen_at,
                    recent_telemetry=d.recent_telemetry,
                    capabilities=d.capabilities
                ).model_dump()
                for d in devices
            ],
            "total": len(devices)
        }
    except Exception as e:
        logger.exception("Unexpected error in get_all_devices_status: %s", e)
        raise HTTPException(status_code=500, detail=f"获取设备状态失败: {str(e)}")


@router.get("/telemetry/latest")
def get_latest_telemetry(
    device_id: Optional[str] = None,
    sensor_type: Optional[str] = None,
    limit: int = 10,
    user: dict = Depends(get_current_user)
):
    """获取最新遥测数据"""
    try:
        agent_service = AgentService()
        telemetry_data = agent_service.get_latest_telemetry(
            device_id=device_id,
            sensor_type=sensor_type,
            limit=min(limit, 100)  # 限制最大数量
        )
        
        return {
            "telemetry": [
                TelemetryInfo(
                    sensor_type=t.sensor_type,
                    value=t.value,
                    unit=t.unit,
                    timestamp=t.timestamp,
                    device_id=t.device_id,
                    device_name=t.device_name
                ).model_dump()
                for t in telemetry_data
            ],
            "total": len(telemetry_data)
        }
    except Exception as e:
        logger.exception("Unexpected error in get_latest_telemetry: %s", e)
        raise HTTPException(status_code=500, detail=f"获取遥测数据失败: {str(e)}")


@router.post("/rules/evaluate")
def evaluate_automation_rules(user: dict = Depends(get_current_user)):
    """手动评估和执行自动化规则（用于测试）"""
    try:
        agent_service = AgentService()
        results = agent_service.evaluate_automation_rules()
        
        return {
            "executed_rules": results,
            "total_executed": len(results)
        }
    except Exception as e:
        logger.exception("Unexpected error in evaluate_automation_rules: %s", e)
        raise HTTPException(status_code=500, detail=f"评估规则失败: {str(e)}")