# 深层审查（四）：全平台问题总表

**审查人:** 蛋蛋🥚  
**日期:** 2026-02-24 03:30  
**原则:** 只挖掘，不修复  

---

## 📊 数字总览

| 类别 | 问题数 |
|------|--------|
| 🔴 安全漏洞 | 9 |
| 🟠 业务逻辑缺陷 | 8 |
| 🟡 前后端契约断裂 | 12 |
| 🔵 代码质量 | 10 |
| 🟢 SEO/可发现性 | 7 |
| ⚫ 架构/基础设施 | 6 |
| **总计** | **52** |

---

## 🔴 安全漏洞 (9)

| # | 问题 | 严重程度 | 详情 |
|---|------|----------|------|
| S1 | 注册密码无最小长度(register endpoint) | 高 | `UserRegisterRequest`没有`min_length`验证，可以注册空密码 |
| S2 | 无注册频率限制 | 高 | 可以无限注册账号进行spam |
| S3 | 无邮箱验证 | 中 | 注册即激活，邮箱不验证真实性 |
| S4 | 无登录失败延迟/锁定 | 中 | 可以暴力破解密码 |
| S5 | 无评论/帖子频率限制 | 中 | 可以无限刷帖刷评论 |
| S6 | 无XSS过滤 | 中 | 帖子/评论内容不做sanitize，前端直接渲染 |
| S7 | 22条f-string SQL（注入风险中低） | 低 | 当前输入来自enum但模式脆弱 |
| S8 | 文件上传50MB无类型验证Content-Type | 低 | 只检查扩展名，不验证文件内容 |
| S9 | 3个孤儿maker（owner被删后maker仍在） | 低 | 无外键级联删除 |

## 🟠 业务逻辑缺陷 (8)

| # | 问题 | 详情 |
|---|------|------|
| B1 | 定价永远=0 | `PLATFORM_FEE_NORMAL=0.0`, `estimated_price`=pricing_per_hour×quantity×2，但大部分maker的pricing_per_hour可能也是0 |
| B2 | 无支付系统 | 即使有价格也无法收款 |
| B3 | 无通知系统 | 订单状态变更无邮件/推送 |
| B4 | 无争议解决 | 双向匿名但无仲裁机制 |
| B5 | 一个用户可注册无限maker | 无数量限制检查 |
| B6 | 订单评价API存在但前端无入口 | `POST /orders/{id}/review` 有但没有UI |
| B7 | Agent claim需要human_email | AI agent不一定有人类邮箱，这个验证不合理 |
| B8 | auto_match只匹配最近maker | 不考虑评分、负载、材料精确匹配 |

## 🟡 前后端契约断裂 (12)

| # | 问题 | 详情 |
|---|------|------|
| C1 | Order interface完全不匹配 | 前端有title/color/fill_rate/file_name，后端没有；后端有order_number/order_type/urgency/price，前端没有 |
| C2 | Order状态名不同 | 前端submitted/shipped vs 后端pending/shipping |
| C3 | CommunityPost缺author_name/author_type | 前端用`author`(string)，后端返回`author_id`+`author_name` |
| C4 | CommunityPost缺tags/budget/deadline | 前端有但后端不返回 |
| C5 | /orders/{id}返回{role,order} | 前端期望平级Order对象（已修） |
| C6 | /orders/available返回available_orders | 前端读orders（已修） |
| C7 | 投票字段vote_type vs direction | 已修 |
| C8 | 14处直接fetch + 21处apiFetch | 两套数据获取方式并存，风格不统一 |
| C9 | 5处直接操作localStorage | 应该统一用authStore |
| C10 | 16处使用`any`类型 | 类型安全缺失 |
| C11 | VoteButtons组件API调用被注释掉 | 投票是假的（已修） |
| C12 | /nodes/match只支持POST | 前端匹配流程可能期望GET |

## 🔵 代码质量 (10)

| # | 问题 | 详情 |
|---|------|------|
| Q1 | 7条宽泛except Exception | 吞掉所有异常，难以调试 |
| Q2 | 仅7条日志语句 | 整个后端几乎无日志 |
| Q3 | 13条console.log在生产前端 | 不专业 |
| Q4 | EmptyState/ErrorState/VoteButtons做了没用 | 21个页面缺空数据状态 |
| Q5 | 无自定义404页面 | 用户进入不存在的URL看到默认404 |
| Q6 | 无自定义error页面 | 渲染错误看到白屏 |
| Q7 | 无全局loading页面 | 路由切换无反馈 |
| Q8 | 256MB内存限制 | Fly.io最小配置，高并发时OOM |
| Q9 | 无数据库连接池 | 每次请求新建连接（SQLite限制） |
| Q10 | Dockerfile无multi-stage build | 包含开发依赖 |

## 🟢 SEO/可发现性 (7)

| # | 问题 | 详情 |
|---|------|------|
| E1 | 所有页面同一title | "RealWorldClaw — Global Manufacturing Network" ×25 |
| E2 | 无OG图片标签 | 分享到社交平台无预览图 |
| E3 | 无结构化数据(JSON-LD) | Google搜索结果无富片段 |
| E4 | Sitemap只有3个URL | 实际24个页面+动态内容 |
| E5 | 无favicon | 浏览器标签无图标 |
| E6 | 无PWA manifest | 不能添加到主屏 |
| E7 | SSR不足 | 首页数据全靠客户端fetch，SEO看到空壳 |

## ⚫ 架构/基础设施 (6)

| # | 问题 | 详情 |
|---|------|------|
| A1 | SQLite单点生产数据库 | 无法水平扩展，无备份策略 |
| A2 | 无CI/CD | 手动部署 |
| A3 | 无监控/告警 | 服务挂了没人知道 |
| A4 | 无staging环境 | 所有更改直接上生产 |
| A5 | API响应~1s（热态） | 数据库只有496KB但响应仍慢 |
| A6 | 无数据库外键约束 | 删除父记录不会级联，产生孤儿数据 |

---

## 🎯 skill.md虚假承诺

| 承诺 | 实际 |
|------|------|
| AI Design Assistant | ❌ 完全不存在 |
| Optimize for manufacturing | ❌ 不存在 |
| Check manufacturability | ❌ 不存在 |
| Set budget and timeline | ❌ 无字段 |
| Review maker profiles | ❌ 无页面 |
| Direct shipping | ❌ 无物流 |
| Leave reviews | ⚠️ API有但无UI |

**skill.md是平台对外的"简历"——其中60%是虚假描述。任何AI agent读了它来使用平台，都会发现承诺的功能不存在。**

---

## 📈 之前已修复的问题（本轮之前）

| 已修 | 问题 |
|------|------|
| ✅ | 订单详情{role,order}解包 |
| ✅ | 订单取消改POST /cancel |
| ✅ | 投票字段统一vote_type |
| ✅ | 帖子author_name JOIN |
| ✅ | Agent claim页面创建 |
| ✅ | /orders/available字段兼容 |
| ✅ | 测试数据清理（30→10用户，14→6帖子） |
| ✅ | 死代码归档（859行，26个路由） |
| ✅ | WS_BASE默认值修正 |
| ✅ | Order/CommunityPost类型对齐 |
| ✅ | VoteButtons接入真实API |
| ✅ | /submit链接修正 |

---

*蛋蛋🥚 | 2026-02-24 03:30 | 52个问题，不遗漏一个*
