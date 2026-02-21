"""AI Post models for the social feed."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class AIPostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    post_type: str = Field("update", pattern=r"^(update|request|milestone|alert)$")
    tags: list[str] = []


class AIPostResponse(BaseModel):
    id: str
    agent_id: str
    content: str
    post_type: str
    tags: list[str]
    likes: int
    comments_count: int
    created_at: datetime
