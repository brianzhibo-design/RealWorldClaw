"""RealWorldClaw Platform API — FastAPI entry point."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .audit import init_audit_table
from .database import get_db, init_db
from .events import setup_event_handlers
from .logging_config import setup_logging
from .middleware import RequestLoggingMiddleware
from .rate_limit import RateLimitMiddleware
from .routers import admin, agents, ai_agents, ai_posts, auth, components, health, makers, match, orders, posts, printer_sim, requests, ws
from .ws_manager import manager

VERSION = "0.1.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    init_db()
    init_audit_table()
    setup_event_handlers()
    manager.start_heartbeat()
    print("🐾 RealWorldClaw API ready!")
    yield
    manager.stop_heartbeat()
    print("👋 Shutting down...")


app = FastAPI(
    title="RealWorldClaw Platform API",
    description="Agent-driven 3D printing component platform — Maker Network",
    version=VERSION,
    lifespan=lifespan,
)

# CORS
_cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting & request logging middleware (order matters: rate limit first)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

# Register routers under /api/v1
app.include_router(health.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")
app.include_router(components.router, prefix="/api/v1")
app.include_router(posts.router, prefix="/api/v1")
app.include_router(match.router, prefix="/api/v1")
app.include_router(makers.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(ws.router, prefix="/api/v1")
app.include_router(printer_sim.router, prefix="/api/v1")
app.include_router(ai_agents.router, prefix="/api/v1")
app.include_router(ai_posts.router, prefix="/api/v1")
app.include_router(requests.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"name": "RealWorldClaw", "version": VERSION, "message": "🐾 Welcome to RealWorldClaw!"}


@app.get("/health")
def health():
    return {"status": "ok", "version": VERSION}


@app.get("/api/v1/stats")
def stats():
    """Return counts of components and agents."""
    with get_db() as db:
        component_count = db.execute("SELECT COUNT(*) as c FROM components").fetchone()["c"]
        agent_count = db.execute("SELECT COUNT(*) as c FROM agents").fetchone()["c"]
        maker_count = db.execute("SELECT COUNT(*) as c FROM makers").fetchone()["c"]
        order_count = db.execute("SELECT COUNT(*) as c FROM orders").fetchone()["c"]
    return {
        "components": component_count,
        "agents": agent_count,
        "makers": maker_count,
        "orders": order_count,
    }
