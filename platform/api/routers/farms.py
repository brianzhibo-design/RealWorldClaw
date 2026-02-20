"""打印农场路由 — Print Farm Network

隐私规则：公开接口不暴露owner信息、详细地址。
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import get_db
from ..models.schemas import (
    FarmAvailability,
    FarmOwnerResponse,
    FarmPublicResponse,
    FarmRegisterRequest,
    FarmStatusUpdate,
    FarmUpdateRequest,
)
from .agents import get_current_agent

router = APIRouter(prefix="/farms", tags=["farms"])


def _row_to_public(row: dict) -> dict:
    materials = json.loads(row["materials"]) if isinstance(row["materials"], str) else row["materials"]
    return {
        "id": row["id"],
        "printer_brand": row["printer_brand"],
        "printer_model": row["printer_model"],
        "build_volume_x": row["build_volume_x"],
        "build_volume_y": row["build_volume_y"],
        "build_volume_z": row["build_volume_z"],
        "materials": materials,
        "location_province": row["location_province"],
        "location_city": row["location_city"],
        # NOT exposing location_district
        "availability": row["availability"],
        "pricing_per_hour_cny": row["pricing_per_hour_cny"],
        "description": row["description"],
        "rating": row["rating"],
        "total_orders": row["total_orders"],
        "success_rate": row["success_rate"],
        "verified": bool(row["verified"]),
        "created_at": row["created_at"],
    }


def _row_to_owner(row: dict) -> dict:
    d = _row_to_public(row)
    d["location_district"] = row["location_district"]
    d["updated_at"] = row["updated_at"]
    return d


# ─── Routes ──────────────────────────────────────────────

@router.post("/register", status_code=201)
def register_farm(body: FarmRegisterRequest, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()
    farm_id = str(uuid.uuid4())

    with get_db() as db:
        db.execute(
            """INSERT INTO farms
               (id, owner_id, printer_model, printer_brand,
                build_volume_x, build_volume_y, build_volume_z,
                materials, location_province, location_city, location_district,
                availability, pricing_per_hour_cny, description, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                farm_id, agent["id"],
                body.printer_model, body.printer_brand,
                body.build_volume_x, body.build_volume_y, body.build_volume_z,
                json.dumps(body.materials, ensure_ascii=False),
                body.location_province, body.location_city, body.location_district,
                body.availability.value, body.pricing_per_hour_cny,
                body.description, now, now,
            ),
        )
        row = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()

    return _row_to_owner(dict(row))


@router.get("")
def list_farms(
    province: str | None = Query(None),
    city: str | None = Query(None),
    material: str | None = Query(None),
    availability: FarmAvailability | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """浏览可用农场 — 公开接口，隐私保护"""
    conditions: list[str] = []
    params: list = []
    if province:
        conditions.append("location_province = ?")
        params.append(province)
    if city:
        conditions.append("location_city = ?")
        params.append(city)
    if material:
        conditions.append("materials LIKE ?")
        params.append(f"%{material}%")
    if availability:
        conditions.append("availability = ?")
        params.append(availability.value)

    where = " AND ".join(conditions) if conditions else "1=1"
    offset = (page - 1) * per_page

    with get_db() as db:
        rows = db.execute(
            f"SELECT * FROM farms WHERE {where} ORDER BY rating DESC, total_orders DESC LIMIT ? OFFSET ?",
            params + [per_page, offset],
        ).fetchall()

    return [_row_to_public(dict(r)) for r in rows]


@router.get("/{farm_id}")
def get_farm(farm_id: str):
    """农场详情 — 公开，隐私保护"""
    with get_db() as db:
        row = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Farm not found")
    return _row_to_public(dict(row))


@router.put("/{farm_id}")
def update_farm(farm_id: str, body: FarmUpdateRequest, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Farm not found")
        if row["owner_id"] != agent["id"]:
            raise HTTPException(status_code=403, detail="Not your farm")

        updates: dict = {}
        for field in ["printer_model", "printer_brand", "build_volume_x", "build_volume_y",
                       "build_volume_z", "location_province", "location_city",
                       "location_district", "pricing_per_hour_cny", "description"]:
            val = getattr(body, field, None)
            if val is not None:
                updates[field] = val
        if body.materials is not None:
            updates["materials"] = json.dumps(body.materials, ensure_ascii=False)
        updates["updated_at"] = now

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        db.execute(
            f"UPDATE farms SET {set_clause} WHERE id = ?",
            list(updates.values()) + [farm_id],
        )
        row = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()

    return _row_to_owner(dict(row))


@router.put("/{farm_id}/status")
def update_farm_status(farm_id: str, body: FarmStatusUpdate, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT owner_id FROM farms WHERE id = ?", (farm_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Farm not found")
        if row["owner_id"] != agent["id"]:
            raise HTTPException(status_code=403, detail="Not your farm")

        db.execute(
            "UPDATE farms SET availability = ?, updated_at = ? WHERE id = ?",
            (body.availability.value, now, farm_id),
        )

    return {"farm_id": farm_id, "availability": body.availability.value}
