"""Maker Network 路由 — Maker / Builder 两种角色

隐私规则：公开接口不暴露owner信息、详细地址。

Maker: 有打印机，接单打印零件
Builder: 打印+组装+测试，交付成品机器人
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import get_db
from ..models.schemas import (
    MakerAvailability,
    MakerOwnerResponse,
    MakerPublicResponse,
    MakerRegisterRequest,
    MakerStatusUpdate,
    MakerUpdateRequest,
)
from .agents import get_current_agent

router = APIRouter(prefix="/makers", tags=["makers"])


def _row_to_public(row: dict) -> dict:
    materials = json.loads(row["materials"]) if isinstance(row["materials"], str) else row["materials"]
    capabilities = json.loads(row["capabilities"]) if row.get("capabilities") else []
    return {
        "id": row["id"],
        "maker_type": row["maker_type"],
        "printer_brand": row["printer_brand"],
        "printer_model": row["printer_model"],
        "build_volume_x": row["build_volume_x"],
        "build_volume_y": row["build_volume_y"],
        "build_volume_z": row["build_volume_z"],
        "materials": materials,
        "capabilities": capabilities,
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
def register_maker(body: MakerRegisterRequest, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()
    maker_id = str(uuid.uuid4())

    # 根据maker_type自动设置默认capabilities
    if body.capabilities:
        capabilities = body.capabilities
    elif body.maker_type == "builder":
        capabilities = ["printing", "assembly", "testing"]
    else:
        capabilities = ["printing"]

    with get_db() as db:
        db.execute(
            """INSERT INTO makers
               (id, owner_id, maker_type, printer_model, printer_brand,
                build_volume_x, build_volume_y, build_volume_z,
                materials, capabilities,
                location_province, location_city, location_district,
                availability, pricing_per_hour_cny, description, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                maker_id, agent["id"], body.maker_type,
                body.printer_model, body.printer_brand,
                body.build_volume_x, body.build_volume_y, body.build_volume_z,
                json.dumps(body.materials, ensure_ascii=False),
                json.dumps(capabilities, ensure_ascii=False),
                body.location_province, body.location_city, body.location_district,
                body.availability.value, body.pricing_per_hour_cny,
                body.description, now, now,
            ),
        )
        row = db.execute("SELECT * FROM makers WHERE id = ?", (maker_id,)).fetchone()

    return _row_to_owner(dict(row))


@router.get("")
def list_makers(
    province: str | None = Query(None),
    city: str | None = Query(None),
    material: str | None = Query(None),
    maker_type: str | None = Query(None),
    availability: MakerAvailability | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """浏览可用Maker/Builder — 公开接口，隐私保护"""
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
    if maker_type:
        conditions.append("maker_type = ?")
        params.append(maker_type)
    if availability:
        conditions.append("availability = ?")
        params.append(availability.value)

    where = " AND ".join(conditions) if conditions else "1=1"
    offset = (page - 1) * per_page

    with get_db() as db:
        rows = db.execute(
            f"SELECT * FROM makers WHERE {where} ORDER BY rating DESC, total_orders DESC LIMIT ? OFFSET ?",
            params + [per_page, offset],
        ).fetchall()

    return [_row_to_public(dict(r)) for r in rows]


@router.get("/{maker_id}")
def get_maker(maker_id: str):
    """Maker详情 — 公开，隐私保护"""
    with get_db() as db:
        row = db.execute("SELECT * FROM makers WHERE id = ?", (maker_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Maker not found")
    return _row_to_public(dict(row))


@router.put("/{maker_id}")
def update_maker(maker_id: str, body: MakerUpdateRequest, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM makers WHERE id = ?", (maker_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Maker not found")
        if row["owner_id"] != agent["id"]:
            raise HTTPException(status_code=403, detail="Not your maker profile")

        updates: dict = {}
        for field in ["printer_model", "printer_brand", "build_volume_x", "build_volume_y",
                       "build_volume_z", "location_province", "location_city",
                       "location_district", "pricing_per_hour_cny", "description"]:
            val = getattr(body, field, None)
            if val is not None:
                updates[field] = val
        if body.materials is not None:
            updates["materials"] = json.dumps(body.materials, ensure_ascii=False)
        if body.capabilities is not None:
            updates["capabilities"] = json.dumps(body.capabilities, ensure_ascii=False)
        if body.maker_type is not None:
            updates["maker_type"] = body.maker_type
        updates["updated_at"] = now

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        db.execute(
            f"UPDATE makers SET {set_clause} WHERE id = ?",
            list(updates.values()) + [maker_id],
        )
        row = db.execute("SELECT * FROM makers WHERE id = ?", (maker_id,)).fetchone()

    return _row_to_owner(dict(row))


@router.put("/{maker_id}/status")
def update_maker_status(maker_id: str, body: MakerStatusUpdate, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT owner_id FROM makers WHERE id = ?", (maker_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Maker not found")
        if row["owner_id"] != agent["id"]:
            raise HTTPException(status_code=403, detail="Not your maker profile")

        db.execute(
            "UPDATE makers SET availability = ?, updated_at = ? WHERE id = ?",
            (body.availability.value, now, maker_id),
        )

    return {"maker_id": maker_id, "availability": body.availability.value}
