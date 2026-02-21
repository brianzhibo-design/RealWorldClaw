# RealWorldClaw 社区冷启动方案

> Prepared by 喜羊羊☀️ (COO) | 2026-02-21
> Core narrative: **"Help Your AI Grow a Body"**

---

## 1. 社交媒体账号规划

### Twitter/X

| 优先级 | 账号名 | 说明 |
|--------|--------|------|
| 🥇 | **@realworldclaw** | 品牌一致，简洁，与域名匹配 |
| 🥈 | @rwclaw | 短版备选 |
| 🥉 | @realworld_claw | 如果首选被占 |

**Bio 建议:** `Modular AI hardware you can actually build. 🧱🤖 Help your AI grow a body. Open source. | Founded by @brianzhibo`

### GitHub Discussions 分区

| Category | 用途 |
|----------|------|
| 📣 Announcements | 官方发布、里程碑 |
| 💡 Ideas & Feature Requests | 社区提案，模块需求 |
| 🛠️ Show & Tell | 用户展示自己的 build |
| ❓ Q&A | 技术问题（硬件、固件、3D打印） |
| 🧩 Module Design | 模块设计讨论（机械/电气/软件接口） |
| 🗣️ General | 闲聊、自我介绍 |

### Discord Server 频道规划

```
📌 INFO
  #welcome-rules
  #announcements
  #roadmap

💬 COMMUNITY
  #general
  #introductions
  #off-topic

🔧 ENGINEERING
  #hardware-design
  #firmware-esp32
  #3d-printing
  #module-ideas

🎨 SHOWCASE
  #builds-gallery
  #work-in-progress

🆘 SUPPORT
  #help-troubleshooting
  #faq

🧪 CONTRIBUTORS
  #dev-chat (gated role)
  #pull-requests
```

### Reddit 目标 Subreddits

**Tier 1 — 高相关，优先发布：**
- r/robotics (3.5M) — 核心受众
- r/3Dprinting (2M+) — 展示打印件
- r/esp32 (120K) — 固件/硬件讨论
- r/arduino (1.5M) — maker 入门群体

**Tier 2 — 扩展曝光：**
- r/functionalprint — 展示实用3D打印件
- r/raspberry_pi — 交叉受众
- r/embedded — 嵌入式工程师
- r/OpenSourceHardware — 开源硬件社区
- r/maker — DIY/maker 文化

**Tier 3 — 话题性投放：**
- r/singularity / r/LocalLLaMA — AI + 物理世界叙事
- r/cyberdeck — 审美共鸣
- r/SideProject — indie hacker 故事

---

## 2. 发布时间线（4周计划）

### Week 1: 预热 🔥
| Day | Action |
|-----|--------|
| Mon | 注册 @realworldclaw Twitter，完善 bio/banner/pinned tweet |
| Mon | 发布首条推文（愿景宣言） |
| Tue-Fri | 每日1条开发过程推文（3D打印、PCB、模块设计） |
| Wed | GitHub repo 设为 public（但暂不宣传），完善 README |
| Fri | 关注并互动 20+ 目标 KOL/maker 账号 |
| Weekend | 准备 Show HN 帖子草稿 |

### Week 2: GitHub 公开 🚀
| Day | Action |
|-----|--------|
| Mon | GitHub README 最终打磨，添加 badge、GIF demo |
| Tue | 推文宣布 GitHub 开源 + repo link |
| Wed | 设置 GitHub Discussions，发首个 welcome post |
| Thu | 准备 Show HN 标题 + 正文（A/B 两个版本） |
| Fri | 在 r/esp32 或 r/3Dprinting 发一个"正常的"技术帖（非宣传，纯分享技术细节） |
| Weekend | 最终审阅 Show HN 帖子 |

### Week 3: 社区首发 📢
| Day | Action |
|-----|--------|
| Mon | **Show HN** 发布（美西时间早上 8-9 点） |
| Mon | 同步发推，全力回复 HN 评论 |
| Tue | 根据 HN 反馈发 follow-up 推文 |
| Wed | Reddit r/robotics 帖子 |
| Thu | Reddit r/3Dprinting 帖子（不同角度：展示打印件） |
| Fri | Reddit r/esp32 帖子（固件/硬件角度） |
| Weekend | 整理所有反馈，更新 FAQ |

### Week 4: 社区建设 🏠
| Day | Action |
|-----|--------|
| Mon | 开放 Discord，发邀请链接 |
| Tue | 推文邀请早期用户加入 Discord |
| Wed | Discord 首个 AMA / 设计讨论 |
| Thu | 发布首个 "Module Design Challenge"（社区共创） |
| Fri | 整理第一批 contributor 名单，发感谢推文 |
| Weekend | 月度回顾，规划下月内容 |

---

## 3. 内容日历（前2周每日推文）

### Week 1: Origin Story & Vision

**Day 1 (Mon):**
> We're building the LEGO of AI hardware.
>
> Modular. Open source. 3D-printable.
>
> Your AI deserves a body. We're making it easy to build one.
>
> This is RealWorldClaw. 🧱🤖
>
> realworldclaw.com

**Day 2 (Tue):**
> First module: Energy Core.
>
> Think of it as the Arc Reactor for your robot — a standardized power module that snaps into any RealWorldClaw frame.
>
> Why did we start here? Because every robot needs a heart. ❤️⚡
>
> [photo of Energy Core prototype]

**Day 3 (Wed):**
> Hot take: The reason most people never build a robot isn't skill — it's that starting from scratch every time is exhausting.
>
> What if you could snap together modules like LEGO instead?
>
> That's the whole idea. Modular AI hardware for the rest of us.

**Day 4 (Thu):**
> 3D printing the latest Energy Core housing iteration.
>
> V1 → too thick, wasted filament
> V2 → snap-fit tabs kept breaking
> V3 → finally got the tolerance right at 0.2mm clearance
>
> The boring iteration is where the magic happens 🔧
>
> [photo of 3 iterations side by side]

**Day 5 (Fri):**
> Our module interface spec (v0.1):
>
> • 4-pin power connector (5V/12V selectable)
> • I2C data bus for module discovery
> • Magnetic snap alignment
> • All 3D-printable mounting
>
> Everything is open source. We want you to design modules too.
>
> [diagram of connector spec]

**Day 6 (Sat):**
> Weekend vibes: testing servo modules on the workbench.
>
> There's something deeply satisfying about watching hardware you designed actually move.
>
> Building in public means you see the messy parts too. This is one of the fun ones. 🎥
>
> [short video clip]

**Day 7 (Sun):**
> Why "Help Your AI Grow a Body"?
>
> LLMs are incredible minds trapped in a box. Robotics kits exist but they're closed, expensive, or one-trick.
>
> We want a world where giving your AI agent hands, eyes, and legs is as easy as plugging in modules.
>
> That's the mission. 🌍

### Week 2: Technical Deep Dives & GitHub Launch

**Day 8 (Mon):**
> This week we're going open source. 🎉
>
> Cleaning up the repo, writing docs, and making sure anyone can clone → print → build.
>
> Sneak peek at the README:
>
> [screenshot of README header with diagram]

**Day 9 (Tue):**
> 🚀 It's live.
>
> RealWorldClaw is now open source on GitHub.
>
> → CAD files for every module
> → ESP32 firmware
> → Assembly guides
> → Module interface spec
>
> Star it. Fork it. Build with us.
>
> github.com/brianzhibo-design/RealWorldClaw

**Day 10 (Wed):**
> Tech stack breakdown:
>
> 🧠 ESP32-S3 — brains of each module
> 🖨️ PLA/PETG — all structural parts printable
> 🔌 USB-C + I2C — power & data
> 📡 WiFi/BLE — wireless module coordination
>
> No custom PCBs required for v1. All off-the-shelf components.
>
> [photo of component layout]

**Day 11 (Thu):**
> The module discovery protocol:
>
> When you snap a new module onto the frame, it announces itself over I2C:
>
> "Hey, I'm a gripper. I have 2 servos. Here's my capability JSON."
>
> The brain module auto-registers it. Plug and play, for real.
>
> [code snippet screenshot]

**Day 12 (Fri):**
> Just posted a deep-dive on r/esp32 about our I2C module bus implementation.
>
> The fun challenge: hot-swapping modules without resetting the whole system.
>
> Solution: heartbeat polling + graceful disconnect events.
>
> Thread in replies 🧵

**Day 13 (Sat):**
> Print settings that actually work for snap-fit modules:
>
> • 0.2mm layer height
> • 3 walls minimum
> • 15% gyroid infill
> • PETG for anything structural
> • PLA fine for cosmetic shells
>
> Tested on Bambu P2S. Should work on any well-tuned printer.
>
> [photo of test prints]

**Day 14 (Sun):**
> Week 2 recap:
>
> ✅ GitHub live with full source
> ✅ First external contributor (!!!)
> ✅ 3 subreddit posts, great feedback
> ⭐ [X] GitHub stars
>
> Next week: Show HN + Reddit launch.
>
> If you want to be an early builder, DM us or jump into GitHub Discussions.

---

## 4. KOL / 种子用户策略

### 3D Printing Community

| KOL | Platform | Why |
|-----|----------|-----|
| **Makers Muse** (Mark Angus) | YouTube/Twitter | Functional print focus, loves modular designs |
| **Teaching Tech** | YouTube | Detailed technical reviews, large maker audience |
| **Zack Freedman** (Voidstar Lab) | YouTube/Twitter | Cyberpunk aesthetic, custom hardware projects |
| **Joel Telling** (3D Printing Nerd) | YouTube | Enthusiastic, loves showcasing community projects |
| **Thomas Sanladerer** | YouTube/Twitter | Technical rigor, open source advocate |
| **Made with Layers** (@maboroshi3d) | Twitter | Active 3D printing community voice |

### ESP32 / Arduino / Embedded Community

| KOL | Platform | Why |
|-----|----------|-----|
| **Andreas Spiess** | YouTube | "Swiss guy" — ESP32 deep dives, huge embedded audience |
| **Ralph Bacon** | YouTube | Arduino/ESP32 tutorials, engaged community |
| **Brian Lough** (Unexpected Maker) | YouTube/Twitter | ESP32 board designer, community leader |
| **Dronebot Workshop** | YouTube | Robotics + microcontroller projects |
| **bitluni** | YouTube | Creative ESP32 projects |

### Robotics / AI Hardware

| KOL | Platform | Why |
|-----|----------|-----|
| **James Bruton** | YouTube | DIY robotics legend, open source advocate |
| **Skyentific** | YouTube | Robot arm builds, modular approach |
| **Michael Rechtin** (@michaelrechtin) | Twitter | Indie robotics, frequent builder |
| **Simone Giertz** | YouTube | If she notices us we win (maker celebrity) |

### 接触策略（Genuine Engagement, Not Spam）

**Phase 1 — 先给再要（Week 1-2）：**
1. 关注目标 KOL，真诚互动他们的内容（回复、点赞、有价值的评论）
2. 在他们发相关内容时，分享有用的技术观点（不提自己项目）
3. 参与他们的 Discord/社区，做有贡献的成员

**Phase 2 — 自然曝光（Week 2-3）：**
1. 在自己推文中 @提及相关 KOL（仅当内容与他们真正相关时）
   - 例：分享3D打印参数时 tag @MakersMuse "your snap-fit tolerance video helped us nail this"
2. 在 Reddit 帖子中引用他们的教程/方法（自然 credit）
3. 把 Energy Core STL 文件发到 Printables/Thingiverse，用相关 tag

**Phase 3 — 直接接触（Week 3-4）：**
1. **DM 模板（不是群发，每条都个性化）：**

   > Hey [name]! Been following your [specific recent project] — loved the [specific detail].
   >
   > We're building an open source modular robotics platform (think LEGO for AI hardware). Your work on [relevant topic] is actually what inspired our [specific module].
   >
   > Would love to send you an Energy Core kit to play with — no strings, just think you'd find it interesting. Happy to chat if you're curious!

2. **关键原则：**
   - 每条 DM 必须引用他们的具体作品（证明你真的看过）
   - 提供实物样品，不要求任何回报
   - 不群发，每天最多联系 2-3 人
   - 如果没回复，不追。一次就好。

**Phase 4 — 社区种子用户（Week 4+）：**
1. 在 GitHub Discussions 发 "Early Builder Program" 帖子
2. 前 20 名 builder 获得：
   - Discord 特殊 role（`🌱 Early Builder`）
   - 在 README 中列名
   - 优先获得新模块测试机会
3. 鼓励他们发 Show & Tell（推文、帖子、视频）
4. 转发/amplify 所有社区内容

---

## 5. 关键指标（4周目标）

| Metric | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|
| Twitter followers | 50 | 150 | 500 | 800 |
| GitHub stars | — | 50 | 200 | 400 |
| Discord members | — | — | — | 50 |
| Reddit post karma | — | — | 200+ | 300+ |
| Contributors | — | — | 1-2 | 3-5 |

*These are stretch targets. Reality will vary. Focus on engagement quality over vanity numbers.*

---

## 6. 执行 Checklist

- [ ] 注册 @realworldclaw Twitter 账号
- [ ] 设计 Twitter banner（与 landing page 风格一致）
- [ ] GitHub repo README 最终版
- [ ] GitHub Discussions 开启并创建分区
- [ ] Discord server 创建并配置频道
- [ ] 准备 10 张高质量产品/过程照片
- [ ] 录制 1 段 30s demo 视频
- [ ] 写好 Show HN 帖子（2个版本 A/B）
- [ ] 每个目标 subreddit 的帖子草稿
- [ ] KOL 接触名单（个性化 DM 草稿）
- [ ] Early Builder Program 页面/帖子

---

*"The best community isn't built by marketing — it's built by showing up every day with something real."*
