"""RealWorldClaw — Pydantic数据模型"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Literal, Optional

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


class MakerAvailability(str, enum.Enum):
    open = "open"
    busy = "busy"
    offline = "offline"


# 保留旧名作为别名，避免其他地方引用报错
FarmAvailability = MakerAvailability


class OrderStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    printing = "printing"
    assembling = "assembling"
    quality_check = "quality_check"
    shipping = "shipping"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"


class OrderUrgency(str, enum.Enum):
    normal = "normal"
    express = "express"


class OrderType(str, enum.Enum):
    print_only = "print_only"
    full_build = "full_build"


class MessageSenderRole(str, enum.Enum):
    customer = "customer"
    maker = "maker"
    platform = "platform"


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
    compute: Optional[str] = None
    material: Optional[str] = None
    estimated_cost_cny: Optional[float] = None
    estimated_print_time: Optional[str] = None
    estimated_filament_g: Optional[float] = None
    manifest_json: Optional[str] = None
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
    vote_type: VoteDirection


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


# ─── Maker Models (Maker Network) ───────────────────────

class MakerRegisterRequest(BaseModel):
    maker_type: Literal["maker", "builder"] = "maker"
    printer_model: str = Field(..., min_length=1)
    printer_brand: str = Field(..., min_length=1)
    build_volume_x: float = Field(..., gt=0)
    build_volume_y: float = Field(..., gt=0)
    build_volume_z: float = Field(..., gt=0)
    materials: list[str] = Field(..., min_length=1)
    capabilities: Optional[list[str]] = None  # 自动根据maker_type设置
    location_province: str
    location_city: str
    location_district: str
    availability: MakerAvailability = MakerAvailability.open
    pricing_per_hour_cny: float = Field(..., gt=0)
    description: Optional[str] = None


class MakerUpdateRequest(BaseModel):
    maker_type: Optional[Literal["maker", "builder"]] = None
    printer_model: Optional[str] = None
    printer_brand: Optional[str] = None
    build_volume_x: Optional[float] = None
    build_volume_y: Optional[float] = None
    build_volume_z: Optional[float] = None
    materials: Optional[list[str]] = None
    capabilities: Optional[list[str]] = None
    location_province: Optional[str] = None
    location_city: Optional[str] = None
    location_district: Optional[str] = None
    pricing_per_hour_cny: Optional[float] = None
    description: Optional[str] = None


class MakerStatusUpdate(BaseModel):
    availability: MakerAvailability


class MakerPublicResponse(BaseModel):
    """公开视图——不暴露owner信息"""
    id: str
    maker_type: str  # 'maker' | 'builder'
    printer_brand: str
    printer_model: str
    build_volume_x: float
    build_volume_y: float
    build_volume_z: float
    materials: list[str]
    capabilities: list[str]
    location_province: str
    location_city: str
    availability: MakerAvailability
    pricing_per_hour_cny: float
    description: Optional[str] = None
    rating: float = 0.0
    total_orders: int = 0
    success_rate: float = 0.0
    verified: bool = False
    created_at: datetime


class MakerOwnerResponse(MakerPublicResponse):
    """Maker自己看到的完整视图"""
    location_district: str
    updated_at: datetime




# ─── Order Models (Maker Network) ────────────────────────

class OrderCreateRequest(BaseModel):
    component_id: Optional[str] = None
    order_type: OrderType = OrderType.print_only
    quantity: int = Field(..., ge=1)
    material_preference: Optional[str] = None
    delivery_province: str
    delivery_city: str
    delivery_district: str
    delivery_address: str = Field(..., min_length=5)
    urgency: OrderUrgency = OrderUrgency.normal
    notes: Optional[str] = None
    # New fields for enhanced order matching
    file_id: Optional[str] = None
    material: Optional[str] = None
    color: Optional[str] = None
    auto_match: bool = False


class OrderCreateResponse(BaseModel):
    order_id: str
    order_number: str
    order_type: OrderType
    estimated_price_cny: float
    platform_fee_cny: float
    estimated_time: Optional[str] = None
    matched_maker_region: str  # e.g. "广东省 深圳市" — no details
    status: OrderStatus


class OrderCustomerView(BaseModel):
    """买家视角——看不到Maker真实信息"""
    id: str
    order_number: str
    order_type: OrderType
    component_id: str
    quantity: int
    material: Optional[str] = None
    urgency: OrderUrgency
    status: OrderStatus
    notes: Optional[str] = None
    price_total_cny: float
    platform_fee_cny: float
    maker_display: str  # "深圳市 认证Maker" — anonymized
    shipping_tracking: Optional[str] = None
    shipping_carrier: Optional[str] = None
    estimated_completion: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class OrderMakerView(BaseModel):
    """Maker视角——看不到买家真实信息"""
    id: str
    order_number: str
    order_type: OrderType
    component_id: str
    quantity: int
    material: Optional[str] = None
    urgency: OrderUrgency
    status: OrderStatus
    notes: Optional[str] = None
    maker_income_cny: float
    delivery_province: str
    delivery_city: str
    # NO delivery_district, NO delivery_address
    estimated_completion: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class OrderAcceptRequest(BaseModel):
    estimated_hours: float = Field(..., gt=0)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderShippingUpdate(BaseModel):
    shipping_carrier: str
    shipping_tracking: str


class OrderReviewRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class OrderReviewResponse(BaseModel):
    id: str
    order_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime


class OrderMessageCreate(BaseModel):
    message: str = Field(..., min_length=1)


class OrderMessageResponse(BaseModel):
    id: str
    order_id: str
    sender_role: MessageSenderRole  # "customer" / "maker" / "platform"
    sender_display: str  # "客户" / "制造商" / "平台"
    message: str
    created_at: datetime


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
