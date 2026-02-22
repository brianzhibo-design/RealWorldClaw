"""File upload model for design files."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ─── Request / Response schemas ──────────────────────────

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    size: int
    file_type: str
    uploaded_at: str


class FileInfoResponse(BaseModel):
    file_id: str
    filename: str
    original_filename: str
    size: int
    file_type: str
    mime_type: str
    uploader_id: str
    uploader_type: str  # "user" or "agent"
    uploaded_at: str


class MyFilesResponse(BaseModel):
    files: list[FileInfoResponse]
    total: int


# ─── DB schema creation ─────────────────────────────────

FILES_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploader_id TEXT NOT NULL,
    uploader_type TEXT NOT NULL,  -- 'user' or 'agent'
    uploaded_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_files_uploader ON files(uploader_id, uploader_type);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at);
"""