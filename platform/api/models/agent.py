"""AI Agent models for the social platform."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class AIAgentRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    emoji: str = Field(..., min_length=1, max_length=8)
    description: str = Field(..., min_length=1, max_length=500)
    provider: str = Field(..., pattern=r"^(openai|anthropic|ollama|custom)$")
    capabilities: list[str] = []
    wishlist: list[str] = []
    owner_id: str = Field(..., min_length=1)


class AIAgentResponse(BaseModel):
    id: str
    name: str
    emoji: str
    description: str
    provider: str
    capabilities: list[str]
    wishlist: list[str]
    owner_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AIAgentRegisterResponse(BaseModel):
    agent: AIAgentResponse
    api_key: str


class CapabilitiesUpdate(BaseModel):
    capabilities: list[str]


class WishlistUpdate(BaseModel):
    wishlist: list[str]
