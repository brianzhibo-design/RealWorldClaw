"""RealWorldClaw Platform API — FastAPI入口"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from .database import init_db
from .routers import agents, components, match, posts

VERSION = "0.1.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化数据库
    init_db()
    print("🐾 RealWorldClaw API ready!")
    yield
    print("👋 Shutting down...")


app = FastAPI(
    title="RealWorldClaw Platform API",
    description="Agent驱动的3D打印组件平台 — 让AI帮你造东西",
    version=VERSION,
    lifespan=lifespan,
)

# 注册路由
app.include_router(agents.router, prefix="/v1")
app.include_router(components.router, prefix="/v1")
app.include_router(posts.router, prefix="/v1")
app.include_router(match.router, prefix="/v1")


@app.get("/")
def root():
    return {"name": "RealWorldClaw", "version": VERSION, "message": "🐾 Welcome to RealWorldClaw!"}


@app.get("/health")
def health():
    from .database import get_db
    try:
        with get_db() as db:
            db.execute("SELECT 1")
        db_status = "connected"
    except Exception:
        db_status = "error"
    return {"status": "ok", "version": VERSION, "database": db_status}
