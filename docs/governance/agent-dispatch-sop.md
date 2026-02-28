# 蛋蛋派工SOP（1页执行版）

**生效**：2026-02-28 | **制定**：蛋蛋×慢羊羊协商 | **监督**：慢羊羊

## 派工（每次）

```
sessions_spawn(agentId="真实ID", task="...", label="TASK-xxx")
```

- agentId 必须是真实agent ID（见对照表）
- 禁止用通用子agent + prompt冒充

## 验收（分级）

| 级别 | 判定 | 验收要求 |
|------|------|---------|
| **S** (<5min) | 改1-2个文件的小修 | ① childSessionKey含`agent:xxx` ② 结果符合要求 |
| **M** (5-30min) | 多文件/新功能 | S + ③ agent自报agentId和model |
| **L** (>30min) | 重大/跨模块 | M + ④ 完整4类证据（身份/工作区/隔离/执行） |

## 必查项（每次，零例外）

✅ `childSessionKey` 包含 `agent:真实agentId`
→ 不含 = 无效，直接重派

## 首次调用验真（每个agent首次使用时做一次）

要求agent回传：
1. Agent ID + Session ID + Model
2. pwd（工作目录）
3. SOUL.md 首段摘要
4. 尝试读其他agent文件（报告可见边界）

结果记录存档，后续同agent不重复。

## 违规

- 首次：打回 + 复盘 + 重派
- 30天内2次：暂停派工权1天
- 30天内3次：上报大人

## Agent ID 对照表

| agentId | 角色 |
|---------|------|
| meiyangyang | 美羊羊🎀 CTO |
| xiaohuihui | 小灰灰🐺 硬件 |
| feiyangyang | 沸羊羊🐏 后端 |
| huayangyang | 花羊羊🌸 设计 |
| xiyangyang | 喜羊羊☀️ 运营 |
| nuanyangyang | 暖羊羊🐑 测试 |
| manyangyang | 慢羊羊🧓 副总 |
| daoyang | 刀羊🗡️ 采购 |
| arch | 灰太狼🐺 架构 |
| pmo | 智羊羊🎓 PMO |
| sre-release | 红太狼🚦 SRE |

## 口令

> 无agentId不派工；childSessionKey必含agent:xxx；有冒充一律打回。
