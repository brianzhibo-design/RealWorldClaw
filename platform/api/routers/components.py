"""组件搜索 / 详情 / 上传"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import get_db
from ..models.schemas import ComponentCreate, ComponentResponse
from .agents import get_current_agent

router = APIRouter(prefix="/components", tags=["components"])


def _row_to_component(row) -> ComponentResponse:
    return ComponentResponse(
        id=row["id"],
        display_name=row["display_name"],
        description=row["description"],
        version=row["version"],
        author_id=row["author_id"],
        tags=json.loads(row["tags"] or "[]"),
        capabilities=json.loads(row["capabilities"] or "[]"),
        status=row["status"],
        downloads=row["downloads"],
        rating=row["rating"],
        review_count=row["review_count"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


# ─── GET /components ─────────────────────────────────────

@router.get("", response_model=dict)
def search_components(
    q: str | None = None,
    tags: str | None = None,
    status: str | None = None,
    sort: str = "created_at",
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    conditions = []
    params: list = []

    if q:
        conditions.append("(display_name LIKE ? OR description LIKE ? OR tags LIKE ?)")
        params.extend([f"%{q}%"] * 3)
    if tags:
        for tag in tags.split(","):
            conditions.append("tags LIKE ?")
            params.append(f'%"{tag.strip()}"%')
    if status:
        conditions.append("status = ?")
        params.append(status)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    order = "created_at DESC" if sort == "created_at" else "downloads DESC"
    offset = (page - 1) * per_page

    with get_db() as db:
        total = db.execute(f"SELECT COUNT(*) as c FROM components {where}", params).fetchone()["c"]
        rows = db.execute(
            f"SELECT * FROM components {where} ORDER BY {order} LIMIT ? OFFSET ?",
            params + [per_page, offset],
        ).fetchall()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "components": [_row_to_component(r) for r in rows],
    }


# ─── GET /components/{id} ────────────────────────────────

@router.get("/{component_id}", response_model=ComponentResponse)
def get_component(component_id: str):
    with get_db() as db:
        row = db.execute("SELECT * FROM components WHERE id = ?", (component_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Component not found")
    return _row_to_component(row)


# ─── POST /components ────────────────────────────────────

@router.post("", response_model=ComponentResponse, status_code=201)
def create_component(req: ComponentCreate, agent: dict = Depends(get_current_agent)):
    if agent["status"] != "active":
        raise HTTPException(403, "Agent must be active to upload components")

    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        existing = db.execute("SELECT id FROM components WHERE id = ?", (req.id,)).fetchone()
        if existing:
            raise HTTPException(409, {"code": "ID_TAKEN", "message": f"Component '{req.id}' already exists"})

        db.execute(
            """INSERT INTO components (id, display_name, description, version, author_id,
               tags, capabilities, compute, material, estimated_cost_cny,
               estimated_print_time, estimated_filament_g, status,
               downloads, rating, review_count, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unverified', 0, 0.0, 0, ?, ?)""",
            (req.id, req.display_name, req.description, req.version, agent["id"],
             json.dumps(req.tags), json.dumps(req.capabilities),
             req.compute, req.material, req.estimated_cost_cny,
             req.estimated_print_time, req.estimated_filament_g, now, now),
        )
        row = db.execute("SELECT * FROM components WHERE id = ?", (req.id,)).fetchone()

    return _row_to_component(row)


# ─── POST /components/{id}/download ──────────────────────

@router.post("/{component_id}/download")
def download_component(component_id: str):
    """MVP: 记录下载计数，返回占位响应"""
    with get_db() as db:
        row = db.execute("SELECT * FROM components WHERE id = ?", (component_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Component not found")
        db.execute("UPDATE components SET downloads = downloads + 1 WHERE id = ?", (component_id,))
    return {"message": "Download recorded", "component_id": component_id, "downloads": row["downloads"] + 1}
