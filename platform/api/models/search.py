"""Search API models."""

from __future__ import annotations

from pydantic import BaseModel
from typing import Any, Dict


class SearchResult(BaseModel):
    type: str  # "post" or "node"
    id: str
    title: str  # For posts: title, for nodes: name
    name: str   # Same as title, for consistency
    snippet: str  # Truncated content/description
    author_id: str  # For posts: author_id, for nodes: owner_id
    tags: str  # JSON string of tags/capabilities
    created_at: str
    metadata: Dict[str, Any]  # Additional type-specific fields


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
    query: str
    page: int
    limit: int