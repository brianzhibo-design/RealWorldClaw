"""Search API models."""

from __future__ import annotations

from pydantic import BaseModel
from typing import Any, Dict, Optional


class SearchResult(BaseModel):
    type: str  # "post", "node", or "user"
    id: str
    title: str
    name: str
    snippet: str
    author_id: str
    tags: str
    created_at: str
    metadata: Dict[str, Any]


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
    query: str
    page: int
    limit: int
    posts: Optional[list[SearchResult]] = None
    spaces: Optional[list[SearchResult]] = None
    users: Optional[list[SearchResult]] = None
