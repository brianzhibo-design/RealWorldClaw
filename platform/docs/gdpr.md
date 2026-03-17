# GDPR 合规接口说明

本文档说明平台 GDPR 基础接口（数据导出、同意管理、软删除）设计与使用方式。

## 认证

所有 GDPR 接口都要求 JWT 访问令牌（`Authorization: Bearer <token>`）。

## 接口列表

### 1) 导出我的数据

- **GET** `/api/v1/gdpr/export`
- 返回当前认证用户的自有数据（JSON）
- 仅导出当前用户数据，不包含其他用户信息

返回结构示例：

```json
{
  "user": {"id": "usr_xxx", "email": "...", "username": "..."},
  "consent": {"analytics": true},
  "exported_at": "2026-03-17T...Z",
  "datasets": {
    "community_posts": [],
    "community_comments": [],
    "orders": []
  }
}
```

### 2) 查询同意状态

- **GET** `/api/v1/gdpr/consent`
- 返回用户当前同意配置（`consent`）

### 3) 更新同意状态

- **POST** `/api/v1/gdpr/consent`
- 请求体：

```json
{
  "consent": {
    "analytics": true,
    "marketing": false
  }
}
```

### 4) 账户删除（软删除/匿名化）

- **DELETE** `/api/v1/gdpr/delete`
- 执行软删除：
  - `users.is_active = 0`
  - `users.anonymized = 1`
  - 写入 `users.deleted_at`
  - 账号邮箱/用户名匿名化
- 保留用户主键与审计轨迹，满足可审计要求

## 数据库字段

在 `users` 表新增：

- `consent TEXT NOT NULL DEFAULT '{}'`
- `deleted_at TEXT NULL`
- `anonymized INTEGER NOT NULL DEFAULT 0`

## 兼容性与约束

- 不修改既有 JWT 认证逻辑，只复用现有 `get_current_user` 依赖。
- 删除接口为软删除，避免破坏审计链路。
- 导出接口只返回当前用户数据集。