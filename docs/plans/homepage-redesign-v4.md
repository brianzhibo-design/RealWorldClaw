# RealWorldClaw 首页改造执行稿 v4（仅文档，不改代码）

> 版本目标：在**保留 Typing Effect + 暗色科技风**的前提下，把首页定位从“制造平台叙事”收敛为“AI agents 迈入现实世界的开源讨论社区”。
>
> 文案配比：**50%事实数据 + 30%专业观点 + 20%情绪（轻宿命感）**，避免空话、避免天选叙事、避免通用 AI 套话。

---

## 0) 信息架构（6段）

1. Hero（定位 + Typing + 客观现状）
2. Reality Check（事实看板）
3. Evidence（演示入口 + 复现摘要 + 仓库）
4. Engineering Judgement（专业判断）
5. Community Feed（讨论与里程碑）
6. CTA + Footer（主次 CTA + 边界声明）

---

## 1) 各段具体文案（中英双语）

## 1. Hero

- **Section Label**
  - CN: 现实世界不是 API
  - EN: Reality Is Not an API

- **社区定位一句话（主标题第一行）**
  - CN: RealWorldClaw 是一个开源社区，专门讨论 AI agents 如何迈入现实世界。
  - EN: RealWorldClaw is an open community focused on how AI agents can enter the physical world.

- **主标题第二行（Typing Effect 容器）**
  - CN: 我们讨论的不是“能不能做”，而是“在约束下还能做多少”。
  - EN: We are not asking “if it can be done,” but “how much survives real constraints.”

- **副标题（客观现状）**
  - CN: 模型能力进步快于硬件可靠性、供应链稳定性与现场安全标准。大多数项目并非死于想法，而是死于最后 20% 的工程细节。
  - EN: Model capability is improving faster than hardware reliability, supply-chain stability, and field safety standards. Most projects do not fail on ideas—they fail in the final 20% of engineering detail.

- **Hero 状态条（替代当前“Platform Live”乐观口吻）**
  - CN: 当前阶段：公开验证中（数据每周更新，结论可被推翻）
  - EN: Current phase: open verification (weekly-updated data, conclusions are revisable)

- **Hero CTA**
  - 主 CTA
    - CN: 看演示与复现
    - EN: Watch Demo & Reproduce
  - 次 CTA
    - CN: 加入讨论
    - EN: Join Discussion

---

## 2. Reality Check（事实看板）

- **Section Label**
  - CN: 现实检查
  - EN: Reality Check

- **段标题**
  - CN: 先看事实，再谈愿景
  - EN: Facts first, vision later

- **段说明**
  - CN: 以下指标用于判断“AI agent 是否真正迈入现实世界”，不是宣传 KPI。
  - EN: These metrics evaluate whether an AI agent truly enters the physical world, not marketing KPIs.

- **看板卡片 A：项目评分（Project Score）**
  - CN 标题：项目评分
  - EN 标题：Project Score
  - CN 内容：6.4 / 10（样机可运行，但规模化与稳定性仍不足）
  - EN 内容：6.4 / 10 (prototypes run, but scale and reliability are not yet sufficient)

- **看板卡片 B：决策标准达成率（Decision Criteria Pass Rate）**
  - CN 标题：决策标准达成率
  - EN 标题：Decision Criteria Pass Rate
  - CN 内容：58%（7 项标准中通过 4 项，3 项未通过）
  - EN 内容：58% (4 of 7 criteria passed, 3 not passed)

- **看板卡片 C：当前阻断项（Current Blockers）**
  - CN 标题：当前阻断项
  - EN 标题：Current Blockers
  - CN 内容：
    1) 传感器漂移与校准链路不稳定
    2) 远程控制的安全边界不够严格
    3) 复现文档在跨地区设备条件下一致性不足
  - EN 内容：
    1) Sensor drift and unstable calibration pipeline
    2) Insufficiently strict safety boundaries for remote control
    3) Reproducibility docs are inconsistent across regions and hardware conditions

- **数据注释行**
  - CN: 注：以上为当前社区公开样本，不构成最终结论。
  - EN: Note: These are current public community samples, not final conclusions.

---

## 3. Evidence（演示 + 复现 + 仓库）

- **Section Label**
  - CN: 证据链
  - EN: Evidence

- **段标题**
  - CN: 没有证据，就不算进展
  - EN: No evidence, no progress

- **演示入口卡片（视频）**
  - CN 标题：硬件演示（原始录屏）
  - EN 标题：Hardware Demo (Raw Recording)
  - CN 描述：展示 agent 感知、决策、执行、回传完整链路；无剪辑版优先。
  - EN 描述：Shows full loop from sensing to decision, execution, and telemetry; uncut recordings preferred.
  - CN 按钮：查看演示视频
  - EN 按钮：Watch Demo

- **复现摘要卡片（步骤）**
  - CN 标题：最小复现路径（30–60 分钟）
  - EN 标题：Minimal Reproduction Path (30–60 min)
  - CN 步骤：
    1) 拉取仓库并按 BOM 准备硬件
    2) 烧录固件并连接节点
    3) 运行示例 agent，触发一次真实动作
    4) 对照日志检查输入、决策、执行、回传是否闭环
  - EN 步骤：
    1) Clone repo and prepare hardware by BOM
    2) Flash firmware and connect node
    3) Run sample agent and trigger one real action
    4) Verify closed-loop integrity in logs: input → decision → actuation → telemetry
  - CN 按钮：查看复现文档
  - EN 按钮：Read Reproduction Guide

- **仓库入口卡片**
  - CN 标题：开源仓库
  - EN 标题：Open Repository
  - CN 描述：代码、硬件设计、讨论记录公开；欢迎复现实验并提交反例。
  - EN 描述：Code, hardware design, and discussion logs are public; counterexamples are welcome.
  - CN 按钮：前往 GitHub
  - EN 按钮：Open GitHub

---

## 4. Engineering Judgement（专业观点）

- **Section Label**
  - CN: 工程判断
  - EN: Engineering Judgement

- **段标题**
  - CN: 为什么这些挑战值得反复做
  - EN: Why these challenges deserve repeated work

- **段落正文（建议 3 列观点卡）**

1) **可靠性不是锦上添花，是入场券**
- CN: 在现实世界，95% 准确率并不等于可部署。一次误触发可能造成设备损坏、生产中断或安全事故。
- EN: In the physical world, 95% accuracy is not deployment-grade. A single false trigger can damage equipment, halt production, or create safety incidents.

2) **可复现性决定讨论是否有意义**
- CN: 如果结果只能在一台“幸运设备”上成立，那不是能力，只是偶然。跨设备、跨地区、跨操作者复现，才是工程证据。
- EN: If results only work on one “lucky machine,” that is not capability—it is coincidence. Cross-device, cross-region, and cross-operator reproduction is real engineering evidence.

3) **边界感比能力感更重要**
- CN: agent 越强，越需要清晰边界：哪些动作可自动执行、哪些必须人工确认、哪些场景应直接拒绝。
- EN: The stronger the agent, the clearer the boundaries must be: which actions are autonomous, which require human confirmation, and which scenarios must be denied.

- **收束句**
  - CN: 我们不押注“很快全面落地”，我们押注“每周多一条可验证的证据”。
  - EN: We do not bet on immediate full-scale deployment; we bet on one more verifiable piece of evidence every week.

---

## 5. Community Feed（最新讨论/进展/里程碑）

- **Section Label**
  - CN: 社区现场
  - EN: Community Feed

- **段标题**
  - CN: 最新讨论、失败记录与里程碑
  - EN: Latest discussions, failure logs, and milestones

- **列表项模板文案（供动态数据渲染）**
  - 类型标签：
    - CN: 失败复盘 / 复现通过 / 安全边界 / 里程碑
    - EN: Failure Review / Reproduction Passed / Safety Boundary / Milestone
  - 元信息模板：
    - CN: {作者} · {时间} · {标签}
    - EN: {Author} · {Time} · {Tag}
  - 空状态：
    - CN: 暂无可公开样本。欢迎提交首个复现实验。
    - EN: No public samples yet. Submit the first reproducible experiment.

- **频道按钮**
  - CN: 查看全部讨论
  - EN: View All Discussions

---

## 6. CTA + Footer（主次 CTA + 边界声明）

- **CTA 标题**
  - CN: 下一步，不是相信我们，而是复现我们
  - EN: Next step is not to trust us, but to reproduce us

- **CTA 描述**
  - CN: 如果你关心 AI agents 如何真正进入现实世界，请先看演示、按文档复现，再参与讨论。
  - EN: If you care about how AI agents truly enter the physical world, start with the demo, reproduce with docs, then join the discussion.

- **按钮**
  - 主 CTA
    - CN: 看演示 / 复现
    - EN: Demo / Reproduce
  - 次 CTA
    - CN: 加入讨论
    - EN: Join Discussion

- **边界声明（Footer 顶部醒目短句）**
  - CN: RealWorldClaw 是开放讨论与实验社区，不提供生产级安全保证；任何现实部署需由操作者独立评估并承担责任。
  - EN: RealWorldClaw is an open discussion-and-experiment community, not a production safety guarantee. Any real-world deployment must be independently evaluated and owned by the operator.

- **版权行补充（替换“Made with ❤️ for AI everywhere”）**
  - CN: 为现实约束而构建，不为幻觉叙事背书。
  - EN: Built for real constraints, not for narrative hype.

---

## 2) Typing Effect 新词组列表（现实约束导向）

> 建议 8 组，短促、硬约束、可读性强；中英可按语言环境切换。

### 中文版（优先）
1. 在噪声中校准
2. 在延迟里决策
3. 在失效前降级
4. 在边界内执行
5. 在误差下闭环
6. 在现场中复现
7. 在风险前止损
8. 在约束下前进

### English fallback
1. Calibrate in noise
2. Decide under latency
3. Degrade before failure
4. Execute within bounds
5. Close loops under error
6. Reproduce in the field
7. Cut loss before risk spreads
8. Move forward under constraints

---

## 3) 布局说明（复用 vs 新增）

## 3.1 组件复用（保持视觉连续性）

- 全局暗色背景、网格光效、glow、按钮体系（`btn-cta / btn-outline / btn-primary`）
- Hero 的 Typing Effect 交互机制（打字+删除+光标闪烁）
- 统计卡片与社区 feed 卡片的基础样式骨架
- 页面滚动 reveal 动效节奏

## 3.2 组件新增（为新定位服务）

1) `RealityCheckBoard`（新）
- 三卡并列：项目评分、标准达成率、阻断项
- 支持注释行和“数据更新时间”

2) `EvidencePanel`（新）
- 视频入口卡 + 复现步骤卡 + 仓库卡
- 支持“原始演示 / 复现文档 / 仓库”三个一跳入口

3) `EngineeringJudgementCards`（新）
- 三列专业观点卡，强调“可靠性/复现性/边界”

4) `BoundaryStatement`（新）
- CTA 下方高对比声明条（风险边界）

## 3.3 区块删改方向（避免定位跑偏）

- 弱化或移除“电商/下单/全球制造网络”的消费叙事文案
- 弱化“无限可能”等过度乐观表达
- 保留社区与证据导向的数据化表达

---

## 4) 相对 `landing/index.html` 的 diff 说明

## 4.1 保留
- 保留暗色科技风设计语言（颜色、发光、网格、卡片质感）
- 保留 Hero 的 Typing Effect 技术实现方式
- 保留 Community Feed 的动态数据加载机制（可继续调用 API）
- 保留最终 CTA 区域的结构（标题 + 双按钮 + 辅助链接）

## 4.2 替换/重写
1) **Hero 文案重写**
- 由“AI Controls Physical World / Build it now”改为“现实约束导向社区定位”
- Badge 语气改为“公开验证中”而非“平台已成”

2) **How It Works / For Everyone / Live Manufacturing Map / Module Catalog / Trust**
- 以上现有中段大多偏“平台推介”
- 调整为：`Reality Check + Evidence + Engineering Judgement`
- Community 段保留，但标题与标签体系调整为“讨论/复现/失败复盘”

3) **Final CTA 与 Footer 语气改写**
- CTA 从“Ready to give AI a body?”调整为“先复现再讨论”
- Footer 增加“边界声明”，删除过度乐观句式

## 4.3 导航建议
- 现有 nav：How It Works / Modules / Community
- 新 nav：Reality Check / Evidence / Judgement / Community
- 保留 GitHub 链接；“Get Started”按钮文案改为“看演示 / 复现”

---

## 5) 与 `frontend/app/page.tsx` 的关系说明

## 5.1 当前状态观察
- `frontend/app/page.tsx` 目前已是 React/Next 版本首页，但内容混合了“社区定位”与“制造平台叙事”（如 Upload Design / Maker 匹配等）。
- 文件内已有可复用能力：
  - TypingEffect 组件
  - AnimatedCounter / 数据拉取模式
  - 社区帖子卡片渲染
  - 暗色主题视觉体系

## 5.2 对齐策略
- 本文档作为**内容与结构基线**，后续实现时优先改 `frontend/app/page.tsx`（生产主路径），`landing/index.html` 作为静态落地页对齐版本。
- 实施顺序建议：
  1) 先在 `page.tsx` 落地 6 段结构与文案
  2) 再将 `landing/index.html` 同步为营销静态页（结构一致，数据可降级）

## 5.3 组件映射建议（page.tsx）
- `TypingEffect`：保留，替换词组为本稿列表
- 新增 section 组件：
  - `RealityCheckSection`
  - `EvidenceSection`
  - `EngineeringJudgementSection`
  - `BoundaryFooterNotice`
- 复用 section：
  - `Community Preview`（改文案标签）
  - `Bottom CTA`（改主次按钮与边界声明）

---

## 6) 语气与审核清单（落地前自检）

- [ ] 是否有“空喊愿景”句子（删）
- [ ] 是否有“天选/必然胜利”叙事（删）
- [ ] 是否出现“通用 AI 官话”（删）
- [ ] 每段是否至少包含可验证信息点
- [ ] 是否保留暗色科技风与 Typing Effect
- [ ] CTA 是否明确主次：先看演示复现，再加入讨论

---

## 7) 一句话总结

本版首页不再兜售“AI 能做一切”，而是把 RealWorldClaw 讲清楚为：一个围绕**现实约束、证据链、工程判断**持续推进的开源社区。