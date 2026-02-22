"""Community API for posts and comments."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import get_db
from ..deps import get_authenticated_identity
from ..models.community import (
    CommentCreateRequest,
    CommentResponse,
    PostCreateRequest,
    PostDetailResponse,
    PostListResponse,
    PostResponse,
    PostSortType,
    PostType,
)

router = APIRouter(prefix="/community", tags=["community"])


def _row_to_post_response(row: dict) -> PostResponse:
    """Convert database row to PostResponse."""
    images = None
    if row["images"]:
        try:
            images = json.loads(row["images"])
        except json.JSONDecodeError:
            images = None
    
    return PostResponse(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        post_type=PostType(row["post_type"]),
        author_id=row["author_id"],
        author_type=row["author_type"],
        file_id=row["file_id"],
        images=images,
        comment_count=row["comment_count"],
        likes_count=row["likes_count"],
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )


@router.post("/posts", response_model=PostResponse)
async def create_post(
    post: PostCreateRequest,
    identity: dict = Depends(get_authenticated_identity)
):
    """Create a new community post."""
    
    # Validate file_id if provided
    if post.file_id:
        with get_db() as db:
            file_row = db.execute(
                "SELECT id FROM files WHERE id = ?", 
                (post.file_id,)
            ).fetchone()
            if not file_row:
                raise HTTPException(status_code=400, detail="File not found")
    
    post_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    images_json = json.dumps(post.images) if post.images else None
    
    with get_db() as db:
        db.execute("""
            INSERT INTO community_posts (
                id, title, content, post_type, author_id, author_type,
                file_id, images, comment_count, likes_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        """, (
            post_id,
            post.title,
            post.content,
            post.post_type.value,
            identity["identity_id"],
            identity["identity_type"],
            post.file_id,
            images_json,
            now,
            now
        ))
        
        # Fetch the created post
        row = db.execute("""
            SELECT * FROM community_posts WHERE id = ?
        """, (post_id,)).fetchone()
    
    return _row_to_post_response(dict(row))


@router.get("/posts", response_model=PostListResponse)
async def get_posts(
    type: PostType = Query(None, description="Filter by post type"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Posts per page"),
    sort: PostSortType = Query(PostSortType.newest, description="Sort order")
):
    """Get list of community posts with pagination and filtering."""
    
    # Build query conditions
    conditions = []
    params = []
    
    if type:
        conditions.append("post_type = ?")
        params.append(type.value)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    # Build sort clause
    if sort == PostSortType.newest:
        order_clause = "ORDER BY created_at DESC"
    elif sort == PostSortType.popular:
        order_clause = "ORDER BY likes_count DESC, comment_count DESC, created_at DESC"
    else:
        order_clause = "ORDER BY created_at DESC"
    
    offset = (page - 1) * limit
    
    with get_db() as db:
        # Get total count
        count_query = f"SELECT COUNT(*) FROM community_posts {where_clause}"
        total = db.execute(count_query, params).fetchone()[0]
        
        # Get posts
        posts_query = f"""
            SELECT * FROM community_posts 
            {where_clause} 
            {order_clause}
            LIMIT ? OFFSET ?
        """
        rows = db.execute(posts_query, params + [limit, offset]).fetchall()
    
    posts = [_row_to_post_response(dict(row)) for row in rows]
    
    has_next = offset + len(posts) < total
    
    return PostListResponse(
        posts=posts,
        total=total,
        page=page,
        limit=limit,
        has_next=has_next
    )


@router.get("/posts/{post_id}", response_model=PostDetailResponse)
async def get_post_detail(post_id: str):
    """Get detailed information about a specific post."""
    
    with get_db() as db:
        row = db.execute("""
            SELECT * FROM community_posts WHERE id = ?
        """, (post_id,)).fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return _row_to_post_response(dict(row))


@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(
    post_id: str,
    comment: CommentCreateRequest,
    identity: dict = Depends(get_authenticated_identity)
):
    """Add a comment to a post."""
    
    # Verify post exists
    with get_db() as db:
        post_row = db.execute("""
            SELECT id FROM community_posts WHERE id = ?
        """, (post_id,)).fetchone()
        
        if not post_row:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Create comment
        comment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        db.execute("""
            INSERT INTO community_comments (
                id, post_id, content, author_id, author_type, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            comment_id,
            post_id,
            comment.content,
            identity["identity_id"],
            identity["identity_type"],
            now,
            now
        ))
        
        # Update comment count on post
        db.execute("""
            UPDATE community_posts 
            SET comment_count = comment_count + 1, updated_at = ?
            WHERE id = ?
        """, (now, post_id))
        
        # Get the created comment
        comment_row = db.execute("""
            SELECT * FROM community_comments WHERE id = ?
        """, (comment_id,)).fetchone()
    
    return CommentResponse(
        id=comment_row["id"],
        post_id=comment_row["post_id"],
        content=comment_row["content"],
        author_id=comment_row["author_id"],
        author_type=comment_row["author_type"],
        created_at=comment_row["created_at"],
        updated_at=comment_row["updated_at"]
    )


@router.get("/posts/{post_id}/comments", response_model=list[CommentResponse])
async def get_post_comments(
    post_id: str,
    limit: int = Query(50, ge=1, le=100, description="Comments per request"),
    offset: int = Query(0, ge=0, description="Comments offset")
):
    """Get comments for a specific post."""
    
    # Verify post exists
    with get_db() as db:
        post_row = db.execute("""
            SELECT id FROM community_posts WHERE id = ?
        """, (post_id,)).fetchone()
        
        if not post_row:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Get comments
        rows = db.execute("""
            SELECT * FROM community_comments 
            WHERE post_id = ?
            ORDER BY created_at ASC
            LIMIT ? OFFSET ?
        """, (post_id, limit, offset)).fetchall()
    
    return [
        CommentResponse(
            id=row["id"],
            post_id=row["post_id"],
            content=row["content"],
            author_id=row["author_id"],
            author_type=row["author_type"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
        for row in rows
    ]