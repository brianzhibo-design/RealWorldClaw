"""File upload API for design files and images."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from ..database import get_db
from ..deps import get_authenticated_identity
from ..models.files import FileInfoResponse, FileUploadResponse, MyFilesResponse

router = APIRouter(prefix="/files", tags=["files"])

# Constants
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {".stl", ".obj", ".step", ".stp", ".3mf", ".png", ".jpg", ".jpeg"}
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"

# Ensure upload directory exists
UPLOAD_DIR.mkdir(exist_ok=True)


def _get_file_extension(filename: str) -> str:
    """Get file extension in lowercase."""
    return Path(filename).suffix.lower()


def _is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return _get_file_extension(filename) in ALLOWED_EXTENSIONS


def _get_mime_type(filename: str) -> str:
    """Get MIME type based on file extension."""
    ext = _get_file_extension(filename)
    mime_types = {
        ".stl": "model/stl",
        ".obj": "model/obj",
        ".step": "model/step",
        ".stp": "model/step",
        ".3mf": "model/3mf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }
    return mime_types.get(ext, "application/octet-stream")


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    identity: dict = Depends(get_authenticated_identity)
):
    """Upload a design file (STL/OBJ/STEP/3MF) or image (PNG/JPG)."""
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not _is_allowed_file(file.filename):
        allowed = ", ".join(ALLOWED_EXTENSIONS)
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {allowed}"
        )
    
    # Read file content and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Generate file ID and create unique filename
    file_id = str(uuid.uuid4())
    file_extension = _get_file_extension(file.filename)
    stored_filename = f"{file_id}{file_extension}"
    file_path = UPLOAD_DIR / stored_filename
    
    # Save file to disk
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Save metadata to database
    now = datetime.now(timezone.utc).isoformat()
    
    with get_db() as db:
        db.execute("""
            INSERT INTO files (
                id, filename, original_filename, size, file_type, mime_type, 
                file_path, uploader_id, uploader_type, uploaded_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            file_id,
            stored_filename,
            file.filename,
            len(content),
            file_extension,
            _get_mime_type(file.filename),
            str(file_path),
            identity["identity_id"],
            identity["identity_type"],
            now,
            now
        ))
    
    return FileUploadResponse(
        file_id=file_id,
        filename=file.filename,
        size=len(content),
        file_type=file_extension,
        uploaded_at=now
    )


@router.get("/my", response_model=MyFilesResponse)
async def get_my_files(identity: dict = Depends(get_authenticated_identity)):
    """Get all files uploaded by the authenticated user/agent."""
    
    with get_db() as db:
        rows = db.execute("""
            SELECT * FROM files 
            WHERE uploader_id = ? AND uploader_type = ?
            ORDER BY uploaded_at DESC
        """, (identity["identity_id"], identity["identity_type"])).fetchall()
    
    files = [
        FileInfoResponse(
            file_id=row["id"],
            filename=row["original_filename"],
            original_filename=row["original_filename"],
            size=row["size"],
            file_type=row["file_type"],
            mime_type=row["mime_type"],
            uploader_id=row["uploader_id"],
            uploader_type=row["uploader_type"],
            uploaded_at=row["uploaded_at"]
        )
        for row in rows
    ]
    
    return MyFilesResponse(
        files=files,
        total=len(files)
    )


@router.get("/{file_id}", response_model=FileInfoResponse)
async def get_file_info(file_id: str):
    """Get file metadata."""
    
    with get_db() as db:
        row = db.execute("""
            SELECT * FROM files WHERE id = ?
        """, (file_id,)).fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileInfoResponse(
        file_id=row["id"],
        filename=row["original_filename"],
        original_filename=row["original_filename"],
        size=row["size"],
        file_type=row["file_type"],
        mime_type=row["mime_type"],
        uploader_id=row["uploader_id"],
        uploader_type=row["uploader_type"],
        uploaded_at=row["uploaded_at"]
    )


@router.get("/{file_id}/download")
async def download_file(file_id: str, identity: dict = Depends(get_authenticated_identity)):
    """Download a file."""
    
    with get_db() as db:
        row = db.execute("""
            SELECT * FROM files WHERE id = ?
        """, (file_id,)).fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = Path(row["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=str(file_path),
        filename=row["original_filename"],
        media_type=row["mime_type"]
    )