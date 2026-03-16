# 深层审查（五）：12盲区全覆盖

**日期:** 2026-02-24 03:45  

---

## 1. 移动端适配 — 评分 7/10
- ✅ Header有响应式断点（sm/md/lg）、overflow-x-auto
- ✅ 各页面有断点类（dashboard最多48个）
- ✅ 地图宽度100%自适应
- ⚠️ WorldMap硬编码`width={1200} height={600}`，小屏可能溢出
- ⚠️ nav导航5个项目在小屏幕可能需要滚动
- ❌ 没有移动端底部导航（大人之前要求过web desktop style，这OK）

## 2. 可访问性(a11y) — 评分 3/10
- ❌ **87个button缺aria-label**
- ❌ 61处text-slate-500（对比度~3.2:1，低于WCAG AA的4.5:1）
- ❌ 仅5处focus-visible样式
- ⚠️ 46个表单元素有44个label（基本覆盖）
- ✅ 无img缺alt（因为几乎没有img标签）

## 3. 国际化 — 评分 2/10
- ❌ 无i18n框架
- ❌ 所有UI文本硬编码英文
- ⚠️ 前端仅6处中文（spaces页面注释）
- ⚠️ 后端有少量中文注释和字符串（"待匹配"、"客户"、"制造商"等）
- **中文用户看到全英文界面，英文用户看到偶尔蹦出中文** — 两头不讨好

## 4. 开发者体验 — 评分 6/10
- ✅ .env.example存在（前端+后端）
- ✅ CONTRIBUTING.md存在
- ✅ package.json有标准scripts
- ✅ requirements.txt有16个依赖
- ⚠️ docker-compose.yml存在但需验证是否能用
- ❌ README安装指南仅4行提及
- ❌ 无quickstart指南（"5分钟跑起来"）

## 5. 依赖健康 — 评分 5/10
- ❌ Next.js 14 → 16（major版本落后）
- ❌ 3个unused依赖（d3-geo, d3-geo-projection, @types/d3-geo）
- ❌ 3个unused devDependencies（@types/node, autoprefixer, postcss）
- ⚠️ 后端依赖都用>=不锁版本
- ⚠️ 后端有pytest但在requirements.txt里（应该在dev依赖）

## 6. 后端代码重复 — 评分 6/10
- ⚠️ `SELECT * FROM orders WHERE id = ?` 出现8次
- ⚠️ `SELECT * FROM makers WHERE id = ?` 出现4次
- ⚠️ 两个 `update_me` 函数（auth和agents各一个）
- 总体不算严重，但缺少通用的CRUD helper

## 7. 并发/边缘case — 评分 3/10
- ❌ **accept_order无锁** — 两个maker同时接单会竞态
- ❌ 注册无username格式验证（UserRegisterRequest找不到Field约束）
- ❌ 帖子/评论内容无max_length（可以发巨长内容）
- ⚠️ Agent名有pattern验证（^[a-z0-9-]+$）
- ⚠️ 帖子标题有max_length=200

## 8. 合规性 — 评分 0/10
- ❌ **无隐私政策**
- ❌ **无服务条款**
- ❌ **无Cookie声明**
- ❌ **无用户数据删除功能**（GDPR"被遗忘权"）
- ❌ **注册页面无条款同意checkbox**
- **如果面向欧洲用户，这是法律风险**

## 9. 品牌一致性 — 评分 7/10
- ✅ sky色系为主（sky-500/600/400占主导）
- ✅ 字体统一用Inter
- ⚠️ 有orange-500(13处)和green-500(21处)的混入
- ⚠️ 按钮风格：bg-sky-600(61处)为主但有bg-green-500(12处)和bg-blue-500(6处)
- ⚠️ 缺少设计tokens/CSS变量——颜色全部硬编码在Tailwind类名中

## 10. 文档完整度 — 评分 6/10
- ✅ Swagger(/docs)和ReDoc(/redoc)可用
- ✅ 150+个md文件（大部分在archive）
- ✅ 7个specs规范文档
- ⚠️ archive里有大量v1-v4废弃文档（94个文件）——信息噪音
- ❌ 无架构图
- ❌ 无当前版本的CHANGELOG

## 11. Landing Page说服力 — 评分 4/10
- ✅ CTA按钮存在（Explore Map、Join Community）
- ❌ 无社会证明（testimonials/partner logos/用户数）
- ❌ 无demo视频
- ❌ 无"How it works"清晰步骤（skill.md有但首页没有）
- ❌ 无定价/FAQ
- **访客看到首页后不知道"这对我有什么用"**

## 12. 开源社区准备度 — 评分 7/10
- ✅ MIT License
- ✅ CONTRIBUTING.md
- ✅ CODE_OF_CONDUCT.md
- ✅ Issue templates (bug+feature)
- ✅ PR template
- ✅ 4个GitHub Actions (CI, CodeQL, Pages, Release)
- ❌ SECURITY.md
- ❌ CHANGELOG.md

---

## 全平台评分汇总

| 维度 | 评分 | 权重 |
|------|------|------|
| 移动端适配 | 7/10 | 中 |
| 可访问性 | **3/10** | 高 |
| 国际化 | **2/10** | 中 |
| 开发者体验 | 6/10 | 高 |
| 依赖健康 | 5/10 | 中 |
| 代码重复 | 6/10 | 低 |
| 并发安全 | **3/10** | 高 |
| 合规性 | **0/10** | 高 |
| 品牌一致性 | 7/10 | 中 |
| 文档完整度 | 6/10 | 中 |
| Landing说服力 | **4/10** | 高 |
| 开源准备度 | 7/10 | 中 |
| **加权平均** | **~4.5/10** | |

---

*蛋蛋🥚 | 2026-02-24 03:45*
