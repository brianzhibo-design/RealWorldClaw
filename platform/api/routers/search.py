"""Search API for posts, spaces (nodes), and users."""

from __future__ import annotations

from fastapi import APIRouter, Query
from typing import Literal, Optional

from ..database import get_db
from ..models.search import SearchResponse, SearchResult

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(..., description="Search query"),
    type: Optional[Literal["post", "node", "user", "all"]] = Query("all", description="Search type"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(20, ge=1, le=100, description="Results per page")
):
    """Search posts, spaces (nodes), and users."""
    
    offset = (page - 1) * limit
    search_term = f"%{q}%"
    
    posts = []
    spaces = []
    users = []
    
    with get_db() as db:
        # Search posts
        if type in ["post", "all"]:
            post_rows = db.execute("""
                SELECT id, title, content, author_id, created_at, upvotes, downvotes, comment_count
                FROM community_posts 
                WHERE title LIKE ? OR content LIKE ?
                ORDER BY upvotes DESC, created_at DESC
                LIMIT ? OFFSET ?
            """, (search_term, search_term, limit, offset)).fetchall()
            
            for row in post_rows:
                content = row["content"] or ""
                snippet = content[:200] + "..." if len(content) > 200 else content
                posts.append(SearchResult(
                    type="post",
                    id=row["id"],
                    title=row["title"],
                    name=row["title"],
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
        
        # Search spaces (nodes)
        if type in ["node", "all"]:
            node_rows = db.execute("""
                SELECT id, name, description, owner_id, node_type, capabilities, materials, status, created_at
                FROM nodes 
                WHERE name LIKE ? OR description LIKE ?
                ORDER BY status DESC, created_at DESC
                LIMIT ? OFFSET ?
            """, (search_term, search_term, limit, offset)).fetchall()
            
            for row in node_rows:
                description = row["description"] or ""
                snippet = description[:200] + "..." if len(description) > 200 else description
                spaces.append(SearchResult(
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
                        "status": row["status"]
                    }
                ))
        
        # Search users
        if type in ["user", "all"]:
            user_rows = db.execute("""
                SELECT id, username, email, created_at
                FROM users
                WHERE username LIKE ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """, (search_term, limit, offset)).fetchall()
            
            for row in user_rows:
                users.append(SearchResult(
                    type="user",
                    id=row["id"],
                    title=row["username"],
                    name=row["username"],
                    snippet="",
                    author_id=row["id"],
                    tags="[]",
                    created_at=row["created_at"],
                    metadata={}
                ))
        
        # Totals
        post_count = 0
        node_count = 0
        user_count = 0
        if type in ["post", "all"]:
            post_count = db.execute(
                "SELECT COUNT(*) as c FROM community_posts WHERE title LIKE ? OR content LIKE ?",
                (search_term, search_term)
            ).fetchone()["c"]
        if type in ["node", "all"]:
            node_count = db.execute(
                "SELECT COUNT(*) as c FROM nodes WHERE name LIKE ? OR description LIKE ?",
                (search_term, search_term)
            ).fetchone()["c"]
        if type in ["user", "all"]:
            user_count = db.execute(
                "SELECT COUNT(*) as c FROM users WHERE username LIKE ?",
                (search_term,)
            ).fetchone()["c"]
        
        total = post_count + node_count + user_count
    
    # Combined results for backward compat
    results = posts + spaces + users
    
    return SearchResponse(
        results=results,
        total=total,
        query=q,
        page=page,
        limit=limit,
        posts=posts,
        spaces=spaces,
        users=users,
    )
