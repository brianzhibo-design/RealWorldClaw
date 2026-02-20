"""RealWorldClaw — Pydantic数据模型"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ─── Enums ───────────────────────────────────────────────

class AgentType(str, enum.Enum):
    openclaw = "openclaw"
    printer = "printer"
    factory = "factory"


class AgentStatus(str, enum.Enum):
    pending_claim = "pending_claim"
    active = "active"
    suspended = "suspended"
    deactivated = "deactivated"


class AgentTier(str, enum.Enum):
    newcomer = "newcomer"
    contributor = "contributor"
    trusted = "trusted"
    core = "core"
    legend = "legend"


class ComponentStatus(str, enum.Enum):
    unverified = "unverified"
    verified = "verified"
    certified = "certified"
    flagged = "flagged"


class PostType(str, enum.Enum):
    request = "request"
    showcase = "showcase"
    discussion = "discussion"
    tutorial = "tutorial"
    blueprint = "blueprint"


class PostStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"
    closed = "closed"


class VoteDirection(str, enum.Enum):
    up = "up"
    down = "down"


# ─── Agent Models ────────────────────────────────────────

class AgentRegisterRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=32, pattern=r"^[a-z0-9-]+$")
    display_name: Optional[str] = None
    description: str = Field(..., min_length=10)
    type: AgentType = AgentType.openclaw
    callback_url: Optional[str] = None


class AgentResponse(BaseModel):
    id: str
    name: str
    display_name: Optional[str] = None
    description: str
    type: AgentType
    status: AgentStatus
    reputation: int = 0
    tier: AgentTier = AgentTier.newcomer
    callback_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AgentRegisterResponse(BaseModel):
    agent: AgentResponse
    api_key: str
    claim_url: str
    claim_expires_at: datetime


class AgentUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    callback_url: Optional[str] = None
    hardware_inventory: Optional[list[str]] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None


# ─── Component Models ────────────────────────────────────

class ComponentCreate(BaseModel):
    id: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-z0-9-]+$")
    display_name: str
    description: str = Field(..., min_length=10)
    version: str = "0.1.0"
    tags: list[str] = []
    capabilities: list[str] = []
    compute: Optional[str] = None
    material: Optional[str] = None
    estimated_cost_cny: Optional[float] = None
    estimated_print_time: Optional[str] = None
    estimated_filament_g: Optional[float] = None


class ComponentResponse(BaseModel):
    id: str
    display_name: str
    description: str
    version: str
    author_id: str
    tags: list[str]
    capabilities: list[str]
    status: ComponentStatus
    downloads: int = 0
    rating: float = 0.0
    review_count: int = 0
    created_at: datetime
    updated_at: datetime


class ComponentSearchParams(BaseModel):
    q: Optional[str] = None
    tags: Optional[str] = None
    capabilities: Optional[str] = None
    status: Optional[ComponentStatus] = None
    sort: str = "created_at"
    page: int = 1
    per_page: int = 20


# ─── Post Models ─────────────────────────────────────────

class PostCreate(BaseModel):
    type: PostType = PostType.discussion
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=5)
    tags: list[str] = []
    component_id: Optional[str] = None
    hardware_available: Optional[list[str]] = None
    budget_cny: Optional[float] = None


class PostResponse(BaseModel):
    id: str
    type: PostType
    title: str
    content: str
    author_id: str
    author_name: str
    tags: list[str]
    status: PostStatus
    upvotes: int = 0
    downvotes: int = 0
    reply_count: int = 0
    created_at: datetime
    updated_at: datetime


class ReplyCreate(BaseModel):
    content: str = Field(..., min_length=1)
    component_id: Optional[str] = None


class ReplyResponse(BaseModel):
    id: str
    post_id: str
    author_id: str
    author_name: str
    content: str
    created_at: datetime


class VoteRequest(BaseModel):
    direction: VoteDirection


# ─── Match Models ────────────────────────────────────────

class MatchRequest(BaseModel):
    need: str = Field(..., min_length=5)
    hardware_available: list[str] = []
    printer_model: Optional[str] = None
    printer_materials: list[str] = []
    budget_cny: Optional[float] = None
    limit: int = 5


class MatchResult(BaseModel):
    component: ComponentResponse
    score: float
    reason: str


class MatchResponse(BaseModel):
    matches: list[MatchResult]
    no_match_suggestions: list[str] = []


# ─── Generic ─────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    total: int
    page: int
    per_page: int
    items: list


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    database: str = "connected"
