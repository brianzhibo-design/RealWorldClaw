#!/bin/bash
# RealWorldClaw 项目审查创建脚本

set -e

REVIEW_TYPE=${1:-monthly}
DATE=$(date +%Y-%m-%d)
REVIEW_DIR="docs/reviews/${DATE}-${REVIEW_TYPE}"

echo "🔍 创建项目审查: ${REVIEW_TYPE} (${DATE})"

# 创建审查目录
mkdir -p "$REVIEW_DIR/metrics"

# 创建审查模板文件
cat > "$REVIEW_DIR/00-executive-summary.md" << EOF
# 项目审查执行摘要

**审查日期**: ${DATE}  
**审查类型**: ${REVIEW_TYPE}  
**审查负责人**: 慢羊羊🧓  

## 关键发现
1. 
2. 
3. 

## 项目评分
- **当前评分**: _/10
- **上次评分**: _/10
- **变化趋势**: ↗️/↘️/➡️

## 紧急行动项
- [ ] P0: 
- [ ] P0: 

## 下阶段重点
1. 
2. 
3. 

---
*生成时间: $(date)*
EOF

cat > "$REVIEW_DIR/01-technical-review.md" << EOF
# 技术架构审查

**审查人**: 美羊羊🎀 (前端) + 沸羊羊🐏 (后端)  
**评分**: _/10

## 架构健康度
- [ ] API 设计合理性
- [ ] 数据库性能
- [ ] 前端组件复用
- [ ] 部署稳定性
- [ ] 监控完整性

## 技术债务
| 优先级 | 问题 | 影响 | 预估工时 |
|--------|------|------|----------|
| P0 | | | |
| P1 | | | |

## 改进建议
1. 
2. 
3. 

## 风险预警
- 
EOF

cat > "$REVIEW_DIR/02-business-review.md" << EOF
# 商业模式审查

**审查人**: 花羊羊🌸  
**评分**: _/10

## 市场定位
- **目标用户**: 
- **价值主张**: 
- **差异化优势**: 

## 竞争分析
| 竞品 | 优势 | 劣势 | 威胁程度 |
|------|------|------|----------|
| | | | |

## 商业指标
- **用户增长**: 
- **留存率**: 
- **获客成本**: 

## 改进建议
1. 
2. 
3. 
EOF

cat > "$REVIEW_DIR/03-ux-review.md" << EOF
# 用户体验审查

**审查人**: 美羊羊🎀 + 喜羊羊☀️  
**评分**: _/10

## 用户旅程分析
- **新手上手**: 
- **开发体验**: 
- **文档质量**: 

## 痛点识别
1. 
2. 
3. 

## 体验改进
- [ ] 
- [ ] 
- [ ] 

## 用户反馈
- 
EOF

cat > "$REVIEW_DIR/04-quality-review.md" << EOF
# 质量与测试审查

**审查人**: 暖羊羊🐑  
**评分**: _/10

## 测试覆盖率
- **后端API**: _%
- **前端组件**: _%  
- **集成测试**: _%

## 质量指标
- **Bug密度**: 
- **平均修复时间**: 
- **线上可用性**: 

## 安全评估
- [ ] 权限模型
- [ ] 数据加密
- [ ] 输入验证
- [ ] 审计日志

## 改进计划
1. 
2. 
3. 
EOF

cat > "$REVIEW_DIR/05-recommendations.md" << EOF
# 综合建议与行动计划

**整合人**: 慢羊羊🧓

## 优先级建议
### P0 - 立即执行 (本周)
- [ ] 
- [ ] 

### P1 - 短期 (30天)
- [ ] 
- [ ] 

### P2 - 中期 (90天)
- [ ] 
- [ ] 

## 资源分配
- **技术团队**: 
- **产品团队**: 
- **运营团队**: 

## 下次审查
- **日期**: 
- **触发条件**: 
- **重点关注**: 
EOF

# 收集基础指标
echo "📊 收集项目指标..."

# Git 提交统计
git log --since="30 days ago" --oneline | wc -l > "$REVIEW_DIR/metrics/commits-30d.txt"

# 测试覆盖率（如果有）
if [ -f "platform/coverage.xml" ]; then
    cp platform/coverage.xml "$REVIEW_DIR/metrics/"
fi

# API 健康检查
curl -s https://realworldclaw-api.fly.dev/api/v1/health > "$REVIEW_DIR/metrics/api-health.json" 2>/dev/null || echo "API unreachable" > "$REVIEW_DIR/metrics/api-health.txt"

echo "✅ 审查模板创建完成: $REVIEW_DIR"
echo ""
echo "📋 下一步:"
echo "1. 分配审查任务给各团队成员"
echo "2. 72小时内完成各组审查"
echo "3. 慢羊羊🧓整合最终报告"
echo ""
echo "🚀 开始审查: cd $REVIEW_DIR && ls -la"