"""RealWorldClaw Platform API — FastAPI entry point."""

from __future__ import annotations

import logging
import os
import traceback
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .audit import init_audit_table
from .database import get_db, init_db
from .events import setup_event_handlers
from .logging_config import setup_logging
from .middleware import RequestLoggingMiddleware
from .rate_limit import RateLimitMiddleware
from .routers import admin, agents, auth, community, components, developers, evolution, files, health, makers, match, messages, moderation, nodes, orders, proof, search, social, spaces, tags, ws
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
_cors_origins = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,https://frontend-wine-eight-32.vercel.app,https://realworldclaw.com"
)
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
app.include_router(match.router, prefix="/api/v1")
app.include_router(makers.router, prefix="/api/v1")
app.include_router(nodes.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(proof.router, prefix="/api/v1")
app.include_router(evolution.router, prefix="/api/v1")
app.include_router(social.router, prefix="/api/v1")
app.include_router(spaces.router, prefix="/api/v1")
app.include_router(ws.router, prefix="/api/v1")
app.include_router(files.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(tags.router, prefix="/api/v1")
app.include_router(community.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
app.include_router(moderation.router, prefix="/api/v1")
app.include_router(developers.router, prefix="/api/v1")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Log full traceback for unhandled exceptions instead of silent 500."""
    logging.getLogger("uvicorn.error").error(
        "Unhandled exception on %s %s: %s\n%s",
        request.method,
        request.url.path,
        exc,
        traceback.format_exc(),
    )
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@app.get("/")
def root():
    return {"name": "RealWorldClaw", "version": VERSION, "message": "🐾 Welcome to RealWorldClaw!"}


@app.get("/health")
def health():
    return {"status": "ok", "version": VERSION}


@app.get("/api/v1/stats")
def stats():
    """Return counts of components, agents, and today's activity."""
    with get_db() as db:
        component_count = db.execute("SELECT COUNT(*) as c FROM components").fetchone()["c"]
        agent_count = db.execute("SELECT COUNT(*) as c FROM agents").fetchone()["c"]
        maker_count = db.execute("SELECT COUNT(*) as c FROM makers").fetchone()["c"]
        order_count = db.execute("SELECT COUNT(*) as c FROM orders").fetchone()["c"]
        user_count = db.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        post_count = db.execute("SELECT COUNT(*) as c FROM community_posts").fetchone()["c"]
        space_count = db.execute("SELECT COUNT(*) as c FROM nodes").fetchone()["c"]
        comment_count = db.execute("SELECT COUNT(*) as c FROM community_comments").fetchone()["c"]

        # Today's activity metrics (UTC)
        today_start = datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00")
        posts_today = db.execute(
            "SELECT COUNT(*) as c FROM community_posts WHERE created_at >= ?", (today_start,)
        ).fetchone()["c"]
        comments_today = db.execute(
            "SELECT COUNT(*) as c FROM community_comments WHERE created_at >= ?", (today_start,)
        ).fetchone()["c"]
        active_today = db.execute(
            """SELECT COUNT(DISTINCT author_id) as c FROM (
                SELECT author_id FROM community_posts WHERE created_at >= ?
                UNION
                SELECT author_id FROM community_comments WHERE created_at >= ?
            )""", (today_start, today_start)
        ).fetchone()["c"]

    return {
        "components": component_count,
        "agents": agent_count,
        "makers": maker_count,
        "orders": order_count,
        "users": user_count,
        "posts": post_count,
        "spaces": space_count,
        "comments": comment_count,
        "active_today": active_today,
        "posts_today": posts_today,
        "comments_today": comments_today,
    }
