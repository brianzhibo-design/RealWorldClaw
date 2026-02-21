# Critical Fixes — 2026-02-21

**Author:** 美羊羊🎀 (CTO)  
**Status:** ✅ Complete

---

## C1: 硬编码测试 API Key（安全漏洞）

**File:** `platform/api/auth.py`

- ❌ `rwc-test-key-2026` 硬编码在 `_VALID_API_KEYS` 中
- ✅ 改为从 `os.environ["RWC_API_KEY"]` 读取
- ✅ 未设置时 `raise RuntimeError`，拒绝启动
- ✅ 更新 `platform/.env.example` 添加 `RWC_API_KEY` 字段

## C2: 缺少 CORS 中间件

**File:** `platform/api/main.py`

- ❌ `.env.example` 定义了 `CORS_ORIGINS` 但代码未使用
- ✅ 添加 `CORSMiddleware`，从 `CORS_ORIGINS` 环境变量读取（逗号分隔）
- ✅ 默认值 `http://localhost:3000`

## C3: API 文档 farms → makers

**File:** `docs/api-reference.md`

- ❌ 文档路由为 `/api/v1/farms/*`，代码已重构为 `/api/v1/makers/*`
- ✅ 全文替换：farms→makers, farm→maker, FarmPublicResponse→MakerPublicResponse 等
- ✅ 与代码路由 `platform/api/routers/makers.py` (prefix="/makers") 一致

## 额外：前端 API 路径缺少 `/api/v1` 前缀

**File:** `frontend/lib/api.ts`

- ❌ 所有 `apiFetch()` 调用使用 `/components`, `/makers`, `/orders` 等（无前缀）
- ✅ 全部补上 `/api/v1` 前缀，与后端路由一致

## 测试结果

```
RWC_API_KEY=rwc-test-key-2026 python3 -m pytest --ignore=printer -k "not test_full_build_requires_builder"
75 passed, 1 deselected, 1 warning in 5.05s
```

- `test_full_build_requires_builder` 为 **预存失败**（订单匹配逻辑问题），与本次修复无关
- `printer/` 目录因缺少 `aiohttp` 依赖跳过，与本次修复无关
