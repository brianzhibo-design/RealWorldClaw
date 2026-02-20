"""订单系统路由 — Print Farm Network

核心隐私规则：
- 买家永远看不到农场主真实身份/地址
- 农场主永远看不到买家真实身份/详细地址
- 消息中转显示"客户"/"制造商"
"""

from __future__ import annotations

import json
import random
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import get_db
from ..models.schemas import (
    OrderAcceptRequest,
    OrderCreateRequest,
    OrderCreateResponse,
    OrderMessageCreate,
    OrderMessageResponse,
    OrderReviewRequest,
    OrderReviewResponse,
    OrderShippingUpdate,
    OrderStatusUpdate,
)
from ..services.matching import match_farm_for_order
from .agents import get_current_agent

router = APIRouter(prefix="/orders", tags=["orders"])

# ─── Constants ───────────────────────────────────────────

PLATFORM_FEE_NORMAL = 0.15
PLATFORM_FEE_EXPRESS = 0.20
_ROLE_DISPLAY = {"customer": "客户", "farmer": "制造商", "platform": "平台"}


# ─── Helpers ─────────────────────────────────────────────

def _generate_order_number() -> str:
    now = datetime.now(timezone.utc)
    seq = random.randint(1000, 9999)
    return f"RWC-{now.strftime('%Y%m%d')}-{seq}"


def _customer_view(row: dict) -> dict:
    """买家视角：隐藏农场主信息"""
    farm_display = "待匹配"
    if row.get("farm_id"):
        with get_db() as db:
            farm = db.execute("SELECT location_city FROM farms WHERE id = ?", (row["farm_id"],)).fetchone()
            if farm:
                farm_display = f"{farm['location_city']} 认证农场"
    return {
        "id": row["id"],
        "order_number": row["order_number"],
        "component_id": row["component_id"],
        "quantity": row["quantity"],
        "material": row["material"],
        "urgency": row["urgency"],
        "status": row["status"],
        "notes": row["notes"],
        "price_total_cny": row["price_total_cny"] or 0,
        "platform_fee_cny": row["platform_fee_cny"] or 0,
        "farm_display": farm_display,
        "shipping_tracking": row["shipping_tracking"],
        "shipping_carrier": row["shipping_carrier"],
        "estimated_completion": row["estimated_completion"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _farmer_view(row: dict) -> dict:
    """农场主视角：只看到省+市，隐藏区和详细地址"""
    return {
        "id": row["id"],
        "order_number": row["order_number"],
        "component_id": row["component_id"],
        "quantity": row["quantity"],
        "material": row["material"],
        "urgency": row["urgency"],
        "status": row["status"],
        "notes": row["notes"],
        "farm_income_cny": row["farm_income_cny"] or 0,
        "delivery_province": row["delivery_province"],
        "delivery_city": row["delivery_city"],
        # NO district, NO address — 隐私保护
        "estimated_completion": row["estimated_completion"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _get_user_role_for_order(db, order: dict, agent_id: str) -> str | None:
    if order["customer_id"] == agent_id:
        return "customer"
    if order["farm_id"]:
        farm = db.execute("SELECT owner_id FROM farms WHERE id = ?", (order["farm_id"],)).fetchone()
        if farm and farm["owner_id"] == agent_id:
            return "farmer"
    return None


# ─── Routes ──────────────────────────────────────────────

@router.post("", status_code=201)
def create_order(body: OrderCreateRequest, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()
    order_id = str(uuid.uuid4())
    order_number = _generate_order_number()

    with get_db() as db:
        matches = match_farm_for_order(
            db,
            body.delivery_province, body.delivery_city, body.delivery_district,
            body.material_preference,
        )

        farm_id = None
        farm_region = "待匹配"
        estimated_price = 0.0

        if matches:
            best = matches[0]
            farm_id = best["id"]
            farm_region = f"{best['location_province']} {best['location_city']}"
            estimated_price = round(best["pricing_per_hour_cny"] * body.quantity * 2, 2)

        fee_rate = PLATFORM_FEE_EXPRESS if body.urgency == "express" else PLATFORM_FEE_NORMAL
        platform_fee = round(estimated_price * fee_rate, 2)
        farm_income = round(estimated_price - platform_fee, 2)

        db.execute(
            """INSERT INTO orders
               (id, order_number, customer_id, farm_id, component_id, quantity, material,
                delivery_province, delivery_city, delivery_district, delivery_address,
                urgency, status, notes,
                price_total_cny, platform_fee_cny, farm_income_cny,
                created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                order_id, order_number, agent["id"], farm_id,
                body.component_id, body.quantity, body.material_preference,
                body.delivery_province, body.delivery_city, body.delivery_district,
                body.delivery_address,  # 仅存数据库，不给农场主看
                body.urgency.value, "pending", body.notes,
                estimated_price, platform_fee, farm_income,
                now, now,
            ),
        )

    return {
        "order_id": order_id,
        "order_number": order_number,
        "estimated_price_cny": estimated_price,
        "platform_fee_cny": platform_fee,
        "estimated_time": "48小时" if body.urgency == "normal" else "24小时",
        "matched_farm_region": farm_region,
        "status": "pending",
    }


@router.get("")
def list_orders(agent: dict = Depends(get_current_agent), page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100)):
    offset = (page - 1) * per_page
    agent_id = agent["id"]

    with get_db() as db:
        customer_orders = db.execute(
            "SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (agent_id, per_page, offset),
        ).fetchall()

        farm_ids = [r["id"] for r in db.execute("SELECT id FROM farms WHERE owner_id = ?", (agent_id,)).fetchall()]

    results: dict = {"as_customer": [], "as_farmer": []}
    for r in customer_orders:
        results["as_customer"].append(_customer_view(dict(r)))

    if farm_ids:
        placeholders = ",".join("?" * len(farm_ids))
        with get_db() as db:
            farmer_orders = db.execute(
                f"SELECT * FROM orders WHERE farm_id IN ({placeholders}) ORDER BY created_at DESC LIMIT ? OFFSET ?",
                farm_ids + [per_page, offset],
            ).fetchall()
        for r in farmer_orders:
            results["as_farmer"].append(_farmer_view(dict(r)))

    return results


@router.get("/{order_id}")
def get_order(order_id: str, agent: dict = Depends(get_current_agent)):
    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)
        role = _get_user_role_for_order(db, order, agent["id"])

    if role == "customer":
        return {"role": "customer", "order": _customer_view(order)}
    elif role == "farmer":
        return {"role": "farmer", "order": _farmer_view(order)}
    raise HTTPException(status_code=403, detail="Not your order")


@router.put("/{order_id}/accept")
def accept_order(order_id: str, body: OrderAcceptRequest, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        if order["status"] != "pending":
            raise HTTPException(status_code=400, detail="Order is not pending")
        if not order["farm_id"]:
            raise HTTPException(status_code=400, detail="No farm assigned")

        farm = db.execute("SELECT owner_id FROM farms WHERE id = ?", (order["farm_id"],)).fetchone()
        if not farm or farm["owner_id"] != agent["id"]:
            raise HTTPException(status_code=403, detail="Not assigned to your farm")

        est = (datetime.now(timezone.utc) + timedelta(hours=body.estimated_hours)).isoformat()
        db.execute(
            "UPDATE orders SET status = 'accepted', estimated_completion = ?, updated_at = ? WHERE id = ?",
            (est, now, order_id),
        )

    return {"order_id": order_id, "status": "accepted", "estimated_completion": est}


@router.put("/{order_id}/status")
def update_order_status(order_id: str, body: OrderStatusUpdate, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()

    valid_transitions = {
        "accepted": ["printing"],
        "printing": ["quality_check"],
        "quality_check": ["shipping"],
        "shipping": ["delivered"],
    }

    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        role = _get_user_role_for_order(db, order, agent["id"])
        if role != "farmer":
            raise HTTPException(status_code=403, detail="Only farm owner can update status")

        allowed = valid_transitions.get(order["status"], [])
        if body.status.value not in allowed:
            raise HTTPException(status_code=400, detail=f"Cannot transition from {order['status']} to {body.status.value}")

        db.execute("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", (body.status.value, now, order_id))

    return {"order_id": order_id, "status": body.status.value}


@router.put("/{order_id}/shipping")
def update_shipping(order_id: str, body: OrderShippingUpdate, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        role = _get_user_role_for_order(db, order, agent["id"])
        if role != "farmer":
            raise HTTPException(status_code=403, detail="Only farm owner can add shipping info")

        db.execute(
            "UPDATE orders SET shipping_carrier = ?, shipping_tracking = ?, updated_at = ? WHERE id = ?",
            (body.shipping_carrier, body.shipping_tracking, now, order_id),
        )

    return {"order_id": order_id, "shipping_carrier": body.shipping_carrier, "shipping_tracking": body.shipping_tracking}


@router.post("/{order_id}/confirm")
def confirm_delivery(order_id: str, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        if order["customer_id"] != agent["id"]:
            raise HTTPException(status_code=403, detail="Only customer can confirm delivery")
        if order["status"] not in ("delivered", "shipping"):
            raise HTTPException(status_code=400, detail="Order not in deliverable state")

        db.execute(
            "UPDATE orders SET status = 'completed', actual_completion = ?, updated_at = ? WHERE id = ?",
            (now, now, order_id),
        )
        if order["farm_id"]:
            db.execute("UPDATE farms SET total_orders = total_orders + 1 WHERE id = ?", (order["farm_id"],))

    return {"order_id": order_id, "status": "completed"}


@router.post("/{order_id}/review", status_code=201)
def review_order(order_id: str, body: OrderReviewRequest, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        if order["customer_id"] != agent["id"]:
            raise HTTPException(status_code=403, detail="Only customer can review")
        if order["status"] != "completed":
            raise HTTPException(status_code=400, detail="Order not completed yet")

        existing = db.execute(
            "SELECT id FROM order_reviews WHERE order_id = ? AND reviewer_id = ?",
            (order_id, agent["id"]),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Already reviewed")

        review_id = str(uuid.uuid4())
        db.execute(
            "INSERT INTO order_reviews (id, order_id, reviewer_id, rating, comment, created_at) VALUES (?,?,?,?,?,?)",
            (review_id, order_id, agent["id"], body.rating, body.comment, now),
        )

        # 更新农场平均评分
        if order["farm_id"]:
            avg = db.execute(
                "SELECT AVG(r.rating) as avg_r FROM order_reviews r JOIN orders o ON r.order_id = o.id WHERE o.farm_id = ?",
                (order["farm_id"],),
            ).fetchone()
            if avg and avg["avg_r"]:
                db.execute("UPDATE farms SET rating = ? WHERE id = ?", (round(avg["avg_r"], 2), order["farm_id"]))

    return {"id": review_id, "order_id": order_id, "rating": body.rating, "comment": body.comment, "created_at": now}


@router.post("/{order_id}/messages", status_code=201)
def send_message(order_id: str, body: OrderMessageCreate, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        role = _get_user_role_for_order(db, order, agent["id"])
        if not role:
            raise HTTPException(status_code=403, detail="Not your order")

        msg_id = str(uuid.uuid4())
        db.execute(
            "INSERT INTO order_messages (id, order_id, sender_id, sender_role, message, created_at) VALUES (?,?,?,?,?,?)",
            (msg_id, order_id, agent["id"], role, body.message, now),
        )

    return {
        "id": msg_id, "order_id": order_id,
        "sender_role": role, "sender_display": _ROLE_DISPLAY[role],
        "message": body.message, "created_at": now,
    }


@router.get("/{order_id}/messages")
def get_messages(order_id: str, agent: dict = Depends(get_current_agent)):
    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        role = _get_user_role_for_order(db, order, agent["id"])
        if not role:
            raise HTTPException(status_code=403, detail="Not your order")

        msgs = db.execute(
            "SELECT * FROM order_messages WHERE order_id = ? ORDER BY created_at ASC",
            (order_id,),
        ).fetchall()

    return [
        {
            "id": m["id"], "order_id": m["order_id"],
            "sender_role": m["sender_role"],
            "sender_display": _ROLE_DISPLAY.get(m["sender_role"], "未知"),
            "message": m["message"], "created_at": m["created_at"],
        }
        for m in msgs
    ]
