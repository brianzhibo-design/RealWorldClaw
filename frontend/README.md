# RealWorldClaw Frontend

开源娃娃机组件平台前端，基于 Next.js 14 + TypeScript + Tailwind CSS。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 页面结构

| 路由 | 说明 |
|------|------|
| `/` | 首页 — Hero + 特色组件 + 标准概览 |
| `/components` | 组件浏览 — 卡片网格 |
| `/components/[id]` | 组件详情 — BOM、打印参数、下载 |
| `/upload` | 上传页 — 表单骨架 |

## 技术栈

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (赛博朋克深色主题)
- Mock 数据（`lib/mock-data.ts`）

## Scripts

- `npm run dev` — 开发模式
- `npm run build` — 生产构建
- `npm start` — 启动生产服务
- `npm run lint` — ESLint 检查
