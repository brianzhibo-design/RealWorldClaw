"""打印农场匹配引擎 — 为订单找到最优农场

权重：地理距离40% + 材料匹配20% + 评分20% + 价格20%
"""

from __future__ import annotations

import json
import sqlite3


def _geo_score(farm_province: str, farm_city: str, farm_district: str,
               order_province: str, order_city: str, order_district: str) -> float:
    """地理距离得分：同区1.0，同城0.8，同省0.5，跨省0.2"""
    if farm_province == order_province:
        if farm_city == order_city:
            if farm_district == order_district:
                return 1.0
            return 0.8
        return 0.5
    return 0.2


def _material_score(farm_materials: list[str], preferred: str | None) -> float:
    """材料匹配得分"""
    if not preferred:
        return 1.0  # 无偏好，全部匹配
    for m in farm_materials:
        if preferred.lower() in m.lower() or m.lower() in preferred.lower():
            return 1.0
    return 0.0


def _rating_score(rating: float) -> float:
    """评分得分：0-5映射到0-1"""
    return min(rating / 5.0, 1.0)


def _price_score(price: float, all_prices: list[float]) -> float:
    """价格得分：越便宜越高分"""
    if not all_prices or max(all_prices) == min(all_prices):
        return 1.0
    mn, mx = min(all_prices), max(all_prices)
    return 1.0 - (price - mn) / (mx - mn)


def match_farm_for_order(
    db: sqlite3.Connection,
    order_province: str,
    order_city: str,
    order_district: str,
    material_preference: str | None = None,
    limit: int = 5,
) -> list[dict]:
    """返回按综合得分排序的最优农场列表。

    Each result: {farm_id, score, geo_score, material_score, rating_score, price_score, ...farm fields}
    """
    rows = db.execute(
        "SELECT * FROM farms WHERE availability = 'open'",
    ).fetchall()

    if not rows:
        return []

    farms = [dict(r) for r in rows]
    all_prices = [f["pricing_per_hour_cny"] for f in farms]

    scored: list[dict] = []
    for f in farms:
        materials = json.loads(f["materials"]) if isinstance(f["materials"], str) else f["materials"]
        geo = _geo_score(
            f["location_province"], f["location_city"], f["location_district"],
            order_province, order_city, order_district,
        )
        mat = _material_score(materials, material_preference)
        rat = _rating_score(f["rating"])
        pri = _price_score(f["pricing_per_hour_cny"], all_prices)

        total = geo * 0.4 + mat * 0.2 + rat * 0.2 + pri * 0.2

        scored.append({
            **f,
            "materials_list": materials,
            "score": round(total, 4),
            "geo_score": round(geo, 2),
            "material_score": round(mat, 2),
            "rating_score": round(rat, 2),
            "price_score": round(pri, 2),
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]
