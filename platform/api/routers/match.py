"""智能匹配引擎（MVP版：关键词+标签匹配）"""

from __future__ import annotations

import json
from datetime import datetime

from fastapi import APIRouter

from ..database import get_db
from ..models.schemas import ComponentResponse, MatchRequest, MatchResponse, MatchResult

router = APIRouter(prefix="/match", tags=["match"])


def _compute_score(component: dict, req: MatchRequest) -> tuple[float, str]:
    """简单匹配评分：关键词 + 标签 + 硬件 + 预算"""
    score = 0.0
    reasons = []
    tags = json.loads(component["tags"] or "[]")
    caps = json.loads(component["capabilities"] or "[]")
    need_lower = req.need.lower()

    # 1. 关键词匹配 (0-0.3)
    text = f"{component['display_name']} {component['description']} {' '.join(tags)}".lower()
    keywords = need_lower.split()
    matched_kw = sum(1 for kw in keywords if kw in text)
    kw_score = min(matched_kw / max(len(keywords), 1) * 0.3, 0.3)
    score += kw_score
    if kw_score > 0.1:
        reasons.append(f"关键词匹配 {matched_kw}/{len(keywords)}")

    # 2. 标签匹配 (0-0.25)
    hw_set = set(h.lower() for h in req.hardware_available)
    tag_overlap = len(hw_set & set(t.lower() for t in tags))
    tag_score = min(tag_overlap * 0.08, 0.25)
    score += tag_score
    if tag_overlap:
        reasons.append(f"标签重叠 {tag_overlap} 个")

    # 3. 硬件匹配 (0-0.25)
    compute = (component["compute"] or "").lower()
    if compute and compute in hw_set:
        score += 0.25
        reasons.append("计算平台匹配")
    elif compute:
        score += 0.05

    # 4. 预算匹配 (0-0.1)
    cost = component["estimated_cost_cny"]
    if req.budget_cny and cost:
        if cost <= req.budget_cny:
            score += 0.1
            reasons.append("预算内")
        elif cost <= req.budget_cny * 1.3:
            score += 0.05

    # 5. 社区评价加分 (0-0.1)
    if component["review_count"] > 0:
        score += min(component["rating"] / 5.0 * 0.1, 0.1)

    reason = "；".join(reasons) if reasons else "基础匹配"
    return round(min(score, 1.0), 3), reason


def _row_to_component_resp(row) -> ComponentResponse:
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


@router.post("", response_model=MatchResponse)
def match_components(req: MatchRequest):
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM components WHERE status != 'flagged'"
        ).fetchall()

    scored = []
    for row in rows:
        s, reason = _compute_score(dict(row), req)
        if s > 0.05:
            scored.append((s, reason, row))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[: req.limit]

    matches = [
        MatchResult(
            component=_row_to_component_resp(row),
            score=s,
            reason=reason,
        )
        for s, reason, row in top
    ]

    suggestions = []
    if not matches:
        suggestions.append("没找到匹配的组件，建议在 #requests 频道发帖寻求社区帮助")
        suggestions.append("也可以尝试用更宽泛的关键词重新搜索")

    return MatchResponse(matches=matches, no_match_suggestions=suggestions)
