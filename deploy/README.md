# Docker Compose 多实例部署（platform + nginx）

本目录提供 `docker-compose.multi.yml`，用于在单机上运行：

- `platform-1`、`platform-2`：2 个 API 实例
- `nginx`：反向代理 + 负载均衡入口
- `postgres`：数据库
- `redis`：缓存

> 注意：该方案不会修改项目根目录已有的 `docker-compose.yml`。

## 1) 启动

在项目根目录执行：

```bash
cd ~/openclaw-data/realworldclaw
docker compose -f deploy/docker-compose.multi.yml up -d --build
```

启动后访问：

- 统一入口（nginx）：`http://localhost:8080`
- 健康检查：`http://localhost:8080/health`
- API 健康检查（经 nginx 转发）：`http://localhost:8080/api/v1/health`

## 2) 查看状态

```bash
docker compose -f deploy/docker-compose.multi.yml ps
```

可进一步查看日志：

```bash
docker compose -f deploy/docker-compose.multi.yml logs -f nginx platform-1 platform-2
```

## 3) 停止与清理

```bash
docker compose -f deploy/docker-compose.multi.yml down
```

如需连同卷（PostgreSQL 数据）一起清理：

```bash
docker compose -f deploy/docker-compose.multi.yml down -v
```

## 4) 关键说明

- nginx upstream 同时指向 `platform-1:8000` 与 `platform-2:8000`。
- `postgres`、`redis` 与 platform 服务均包含健康检查。
- platform 服务默认使用：
  - `DATABASE_URL=postgresql://<user>:<pass>@postgres:5432/<db>`
  - `REDIS_URL=redis://redis:6379/0`
