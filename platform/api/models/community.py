"""Community models for posts and comments."""

from __future__ import annotations

import enum
from typing import Optional

from pydantic import BaseModel, Field


class PostType(str, enum.Enum):
    design_share = "design_share"
    showcase = "showcase"
    discussion = "discussion"


class PostTemplateType(str, enum.Enum):
    request = "request"
    engineering_log = "engineering_log"
    showcase = "showcase"
    free = "free"


class TagCategory(str, enum.Enum):
    craft = "craft"
    material = "material"
    equipment = "equipment"
    scene = "scene"


class PostSortType(str, enum.Enum):
    newest = "newest"
    popular = "popular"
    hot = "hot"
    best = "best"
    following = "following"


# ─── Request / Response schemas ──────────────────────────

class PostCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    post_type: PostType
    file_id: Optional[str] = None
    images: Optional[list[str]] = None  # JSON array of image URLs/paths
    tags: list[str] = Field(default_factory=list)
    template_type: Optional[PostTemplateType] = None


class PostListQuery(BaseModel):
    type: Optional[PostType] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    sort: PostSortType = PostSortType.newest


class CommentCreateRequest(BaseModel):
    content: str = Field(..., min_length=1)
    parent_id: Optional[str] = None


class CommentResponse(BaseModel):
    id: str
    post_id: str
    content: str
    author_id: str
    author_type: str  # "user" or "agent"
    parent_id: Optional[str] = None
    author_name: Optional[str] = None
    replies: Optional[list['CommentResponse']] = None
    is_best_answer: bool = False
    created_at: str
    updated_at: str

# Forward reference fix for self-referencing model
CommentResponse.model_rebuild()


class VoteRequest(BaseModel):
    vote_type: str = Field(..., pattern="^(up|down)$")


class VoteResponse(BaseModel):
    upvotes: int
    downvotes: int
    user_vote: Optional[str] = None  # "up", "down", or null


class ReportPostRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=500)


class BestAnswerRequest(BaseModel):
    comment_id: str = Field(..., min_length=1)


class TagResponse(BaseModel):
    id: str
    name: str
    category: TagCategory
    created_at: str


class PostResponse(BaseModel):
    id: str
    title: str
    content: str
    post_type: PostType
    author_id: str
    author_type: str  # "user" or "agent"
    author_name: Optional[str] = None
    file_id: Optional[str] = None
    images: Optional[list[str]] = None
    tags: list[str] = Field(default_factory=list)
    template_type: Optional[PostTemplateType] = None
    is_resolved: bool = False
    is_pinned: bool = False
    is_locked: bool = False
    best_answer_comment_id: Optional[str] = None
    best_comment_id: Optional[str] = None
    resolved_at: Optional[str] = None
    comment_count: int
    likes_count: int
    upvotes: int = 0
    downvotes: int = 0
    created_at: str
    updated_at: str


class PostListResponse(BaseModel):
    posts: list[PostResponse]
    total: int
    page: int
    limit: int
    has_next: bool


class PostDetailResponse(PostResponse):
    pass


# ─── DB schema creation ─────────────────────────────────

COMMUNITY_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_type TEXT NOT NULL,  -- 'user' or 'agent'
    file_id TEXT,
    images TEXT,  -- JSON array
    template_type TEXT,
    is_resolved INTEGER NOT NULL DEFAULT 0,
    best_answer_comment_id TEXT,
    best_comment_id TEXT,
    resolved_at TEXT,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_locked INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS community_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_type TEXT NOT NULL,  -- 'user' or 'agent'
    is_best_answer INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES community_posts (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS post_tags (
    post_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES community_posts (id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_reports (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    reporter_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES community_posts (id) ON DELETE CASCADE,
    UNIQUE(post_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id, author_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON community_comments(author_id, author_type);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_post_id ON community_reports(post_id);

CREATE TABLE IF NOT EXISTS community_votes (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    direction TEXT NOT NULL,  -- 'up' or 'down'
    created_at TEXT NOT NULL,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES community_posts (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_community_votes_post ON community_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_user ON community_votes(user_id);
"""