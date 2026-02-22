#!/usr/bin/env python3
"""RealWorldClaw Agent智能化功能演示

演示Agent Service的核心功能：
1. 设备状态查询
2. 遥测数据获取  
3. 自然语言查询处理
4. 自动化规则创建和评估
5. 设备控制命令执行
"""

import json
from datetime import datetime, timezone

from api.services.agent_service import AgentService
from api.database import init_db


def demo_agent_service():
    """演示Agent Service功能"""
    print("🎀 美羊羊Agent智能化功能演示")
    print("=" * 50)
    
    # 初始化数据库
    init_db()
    agent_service = AgentService()
    
    print("\n1. 查询设备状态")
    print("-" * 30)
    devices = agent_service.query_device_status()
    if devices:
        for device in devices[:3]:  # 显示前3个
            print(f"设备: {device.name} ({device.device_id})")
            print(f"  类型: {device.type}")
            print(f"  状态: {device.status}")
            print(f"  健康: {device.health}")
            print(f"  最后连接: {device.last_seen_at}")
            print(f"  能力: {device.capabilities}")
            print()
    else:
        print("当前没有已注册的设备")
    
    print("\n2. 获取最新遥测数据")
    print("-" * 30)
    telemetry_data = agent_service.get_latest_telemetry(limit=5)
    if telemetry_data:
        for data in telemetry_data:
            print(f"设备: {data.device_name} ({data.device_id})")
            print(f"  传感器: {data.sensor_type}")
            print(f"  数值: {data.value} {data.unit}")
            print(f"  时间: {data.timestamp}")
            print()
    else:
        print("当前没有遥测数据")
    
    print("\n3. 自然语言查询演示")
    print("-" * 30)
    queries = [
        "所有设备的温度是多少？",
        "继电器设备状态如何？",
        "设备健康状况怎样？"
    ]
    
    for query in queries:
        print(f"查询: {query}")
        result = agent_service.process_natural_language_query(query)
        print(f"结果: 找到 {len(result['results'])} 条相关信息")
        for r in result['results'][:2]:  # 显示前2个结果
            print(f"  - {r.get('type', 'unknown')}: {r}")
        print()
    
    print("\n4. 自动化规则演示")
    print("-" * 30)
    
    # 创建示例规则
    example_rule = {
        "name": "高温报警规则",
        "description": "温度超过35°C时自动开启继电器",
        "condition": {
            "type": "telemetry",
            "device_id": "temp-sensor-001",
            "sensor_type": "temperature",
            "operator": ">",
            "threshold": 35.0
        },
        "action": {
            "type": "device_command",
            "device_id": "relay-001",
            "command": "relay_on",
            "parameters": {"duration": 60}
        }
    }
    
    try:
        rule_id = agent_service.create_automation_rule(
            name=example_rule["name"],
            description=example_rule["description"],
            condition=example_rule["condition"],
            action=example_rule["action"],
            created_by="demo_user"
        )
        print(f"✅ 创建规则成功: {rule_id}")
    except Exception as e:
        print(f"⚠️  创建规则失败: {e}")
    
    # 获取规则列表
    rules = agent_service.get_automation_rules()
    print(f"\n当前共有 {len(rules)} 条规则:")
    for rule in rules[:3]:  # 显示前3条
        print(f"  - {rule.name}: {rule.description}")
        print(f"    条件: {rule.condition}")
        print(f"    动作: {rule.action}")
        print()
    
    print("\n5. 规则评估演示")
    print("-" * 30)
    evaluation_results = agent_service.evaluate_automation_rules()
    print(f"评估了 {len(evaluation_results)} 条规则")
    for result in evaluation_results:
        if "error" in result:
            print(f"  规则 {result['rule_name']} 执行失败: {result['error']}")
        else:
            print(f"  规则 {result['rule_name']} 执行成功")
    
    print("\n6. 设备命令执行演示")
    print("-" * 30)
    try:
        # 这里会失败，因为没有实际的设备，但展示了API
        command_id = agent_service.execute_device_command(
            device_id="demo-relay-001",
            command="relay_on",
            parameters={"duration": 10},
            requester_agent_id="demo_agent"
        )
        print(f"✅ 命令已发送，ID: {command_id}")
    except Exception as e:
        print(f"⚠️  命令执行失败（预期，因为设备不存在）: {e}")
    
    print("\n" + "=" * 50)
    print("🎀 演示完成！Agent智能化功能已就绪")


if __name__ == "__main__":
    demo_agent_service()