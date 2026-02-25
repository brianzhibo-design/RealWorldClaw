from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, Query

from ..database import get_db

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("")
async def list_tags(category: str | None = Query(None, description="craft/material/equipment/scene")):
    with get_db() as db:
        if category:
            rows = db.execute(
                "SELECT id, name, category, created_at FROM tags WHERE category = ? ORDER BY name ASC",
                (category,),
            ).fetchall()
            return {
                "category": category,
                "tags": [dict(r) for r in rows],
            }

        rows = db.execute("SELECT id, name, category, created_at FROM tags ORDER BY category, name ASC").fetchall()

    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        grouped[row["category"]].append(dict(row))

    return {"categories": grouped}
