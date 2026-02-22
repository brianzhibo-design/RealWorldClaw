"""Data models for RealWorldClaw API responses."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


# ── Health ──────────────────────────────────────────────

@dataclass
class HealthStatus:
    status: str
    # detailed health adds more fields
    database: Optional[str] = None
    disk_usage: Optional[str] = None
    memory: Optional[dict] = None
    uptime: Optional[float] = None


# ── Auth / User ─────────────────────────────────────────

@dataclass
class UserResponse:
    id: str
    username: str
    email: Optional[str] = None
    role: Optional[str] = None
    created_at: Optional[str] = None
    token: Optional[str] = None
    refresh_token: Optional[str] = None


# ── Agent (hardware) ────────────────────────────────────

@dataclass
class AgentResponse:
    id: str
    name: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[str] = None
    claim_code: Optional[str] = None
    capabilities: Optional[list] = None
    created_at: Optional[str] = None


# ── Component ───────────────────────────────────────────

@dataclass
class Component:
    id: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    author_id: Optional[str] = None
    tags: list[str] = field(default_factory=list)
    download_count: int = 0
    created_at: Optional[str] = None


@dataclass
class ComponentList:
    total: int
    skip: int
    limit: int
    components: list[dict] = field(default_factory=list)


# ── Posts (community) ──────────────────────────────────

@dataclass
class Post:
    id: str
    title: Optional[str] = None
    body: Optional[str] = None
    author_id: Optional[str] = None
    votes: int = 0
    reply_count: int = 0
    created_at: Optional[str] = None


@dataclass
class PostReply:
    id: str
    post_id: str
    body: Optional[str] = None
    author_id: Optional[str] = None
    created_at: Optional[str] = None


@dataclass
class PostList:
    total: int
    page: int
    per_page: int
    posts: list[dict] = field(default_factory=list)


# ── Maker ───────────────────────────────────────────────

@dataclass
class MakerResponse:
    id: str
    name: Optional[str] = None
    status: Optional[str] = None
    printers: Optional[list] = None
    location: Optional[str] = None
    created_at: Optional[str] = None


# ── Order ───────────────────────────────────────────────

@dataclass
class Order:
    id: str
    component_id: Optional[str] = None
    maker_id: Optional[str] = None
    requester_id: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[str] = None


@dataclass
class OrderList:
    total: int = 0
    orders: list[dict] = field(default_factory=list)


# ── Match ───────────────────────────────────────────────

@dataclass
class MatchResult:
    matches: list[dict] = field(default_factory=list)
    score: Optional[float] = None


# ── AI Agent / AI Post ──────────────────────────────────

@dataclass
class AIAgent:
    id: str
    name: Optional[str] = None
    capabilities: Optional[list] = None
    wishlist: Optional[list] = None
    created_at: Optional[str] = None


@dataclass
class AIPost:
    id: str
    agent_id: Optional[str] = None
    content: Optional[str] = None
    likes: int = 0
    created_at: Optional[str] = None
