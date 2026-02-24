"""Search API for posts and nodes."""

from __future__ import annotations

from fastapi import APIRouter, Query
from typing import Literal, Optional

from ..database import get_db
from ..models.search import SearchResponse, SearchResult

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(..., description="Search query"),
    type: Optional[Literal["post", "node", "all"]] = Query("all", description="Search type"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(20, ge=1, le=100, description="Results per page")
):
    """Search posts and/or nodes by title, content, name, description, and capabilities."""
    
    offset = (page - 1) * limit
    results = []
    total = 0
    
    # Prepare search term for LIKE query
    search_term = f"%{q}%"
    
    with get_db() as db:
        # Search posts
        if type in ["post", "all"]:
            post_rows = db.execute("""
                SELECT 
                    'post' as type,
                    id,
                    title as name,
                    content,
                    author_id,
                    created_at,
                    upvotes,
                    downvotes,
                    comment_count
                FROM community_posts 
                WHERE title LIKE ? OR content LIKE ?
                ORDER BY upvotes DESC, created_at DESC
                LIMIT ? OFFSET ?
            """, (search_term, search_term, limit if type == "post" else limit//2, offset)).fetchall()
            
            for row in post_rows:
                # Create snippet from content
                content = row["content"] or ""
                snippet = content[:200] + "..." if len(content) > 200 else content
                
                results.append(SearchResult(
                    type="post",
                    id=row["id"],
                    title=row["name"],
                    name=row["name"],
                    snippet=snippet,
                    author_id=row["author_id"],
                    tags="[]",
                    created_at=row["created_at"],
                    metadata={
                        "upvotes": row["upvotes"],
                        "downvotes": row["downvotes"],
                        "reply_count": row["comment_count"]
                    }
                ))
        
        # Search nodes
        if type in ["node", "all"]:
            node_rows = db.execute("""
                SELECT 
                    'node' as type,
                    id,
                    name,
                    description,
                    owner_id,
                    node_type,
                    capabilities,
                    materials,
                    status,
                    created_at
                FROM nodes 
                WHERE name LIKE ? OR description LIKE ? OR capabilities LIKE ?
                ORDER BY status DESC, created_at DESC
                LIMIT ? OFFSET ?
            """, (search_term, search_term, search_term, limit if type == "node" else limit//2, 0 if type == "post" else offset)).fetchall()
            
            for row in node_rows:
                # Create snippet from description
                description = row["description"] or ""
                snippet = description[:200] + "..." if len(description) > 200 else description
                
                results.append(SearchResult(
                    type="node",
                    id=row["id"],
                    title=row["name"],
                    name=row["name"],
                    snippet=snippet,
                    author_id=row["owner_id"],
                    tags=row["capabilities"] or "[]",
                    created_at=row["created_at"],
                    metadata={
                        "node_type": row["node_type"],
                        "capabilities": row["capabilities"] or "[]",
                        "materials": row["materials"] or "[]",
                        "status": row["status"]
                    }
                ))
        
        # Get total counts
        if type in ["post", "all"]:
            post_count = db.execute("""
                SELECT COUNT(*) as count FROM community_posts 
                WHERE title LIKE ? OR content LIKE ?
            """, (search_term, search_term)).fetchone()["count"]
        else:
            post_count = 0
            
        if type in ["node", "all"]:
            node_count = db.execute("""
                SELECT COUNT(*) as count FROM nodes 
                WHERE name LIKE ? OR description LIKE ? OR capabilities LIKE ?
            """, (search_term, search_term, search_term)).fetchone()["count"]
        else:
            node_count = 0
            
        total = post_count + node_count
    
    return SearchResponse(
        results=results,
        total=total,
        query=q,
        page=page,
        limit=limit
    )