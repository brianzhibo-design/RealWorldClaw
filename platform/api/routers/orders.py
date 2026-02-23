"""订单系统路由 — Maker Network

核心隐私规则：
- 买家永远看不到Maker真实身份/地址
- Maker永远看不到买家真实身份/详细地址
- Messages display "Customer"/"Maker"

订单类型：
- print_only: 只打印零件，maker和builder都能接
- full_build: 成品组装，只有builder能接
"""

from __future__ import annotations
import logging
logger = logging.getLogger(__name__)



import random
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import get_db
from ..models.schemas import (
    OrderAcceptRequest,
    OrderCreateRequest,
    OrderEstimateRequest,
    OrderMessageCreate,
    OrderReviewRequest,
    OrderShippingUpdate,
    OrderStatusUpdate,
)
from ..services.matching import match_maker_for_order
from ..deps import get_authenticated_identity
from ..pricing import estimate_price

router = APIRouter(prefix="/orders", tags=["orders"])

# ─── Constants ───────────────────────────────────────────

PLATFORM_FEE_NORMAL = 0.0  # Free platform — makers keep 100%
PLATFORM_FEE_EXPRESS = 0.0  # Free platform — makers keep 100%
_ROLE_DISPLAY = {"customer": "Customer", "maker": "Maker", "platform": "Platform"}


# ─── Helpers ─────────────────────────────────────────────

def _generate_order_number() -> str:
    now = datetime.now(timezone.utc)
    seq = random.randint(1000, 9999)
    return f"RWC-{now.strftime('%Y%m%d')}-{seq}"


def _customer_view(row: dict) -> dict:
    """买家视角：隐藏Maker信息"""
    maker_display = "Pending match"
    if row.get("maker_id"):
        with get_db() as db:
            maker = db.execute("SELECT location_city, maker_type FROM makers WHERE id = ?", (row["maker_id"],)).fetchone()
            if maker:
                type_label = "Builder" if maker["maker_type"] == "builder" else "Maker"
                maker_display = f"{maker['location_city']} 认证{type_label}"
    return {
        "id": row["id"],
        "order_number": row["order_number"],
        "order_type": row.get("order_type", "print_only"),
        "component_id": row["component_id"],
        "quantity": row["quantity"],
        "material": row["material"],
        "urgency": row["urgency"],
        "status": row["status"],
        "notes": row["notes"],
        "price_total_cny": row["price_total_cny"] or 0,
        "platform_fee_cny": row["platform_fee_cny"] or 0,
        "maker_display": maker_display,
        "shipping_tracking": row["shipping_tracking"],
        "shipping_carrier": row["shipping_carrier"],
        "estimated_completion": row["estimated_completion"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _maker_view(row: dict) -> dict:
    """Maker视角：只看到省+市，隐藏区和详细地址"""
    return {
        "id": row["id"],
        "order_number": row["order_number"],
        "order_type": row.get("order_type", "print_only"),
        "component_id": row["component_id"],
        "quantity": row["quantity"],
        "material": row["material"],
        "urgency": row["urgency"],
        "status": row["status"],
        "notes": row["notes"],
        "maker_income_cny": row["maker_income_cny"] or 0,
        "delivery_province": row["delivery_province"],
        "delivery_city": row["delivery_city"],
        # NO district, NO address — 隐私保护
        "estimated_completion": row["estimated_completion"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _get_user_roles_for_order(db, order: dict, agent_id: str) -> list[str]:
    """Return all roles a user has for an order (can be both customer and maker)."""
    roles = []
    if order["customer_id"] == agent_id:
        roles.append("customer")
    if order["maker_id"]:
        maker = db.execute("SELECT owner_id FROM makers WHERE id = ?", (order["maker_id"],)).fetchone()
        if maker and maker["owner_id"] == agent_id:
            roles.append("maker")
    return roles


def _get_user_role_for_order(db, order: dict, agent_id: str) -> str | None:
    """Return user's primary role (customer first for viewing, use _get_user_roles_for_order for action checks)."""
    roles = _get_user_roles_for_order(db, order, agent_id)
    return roles[0] if roles else None


# ─── Routes ──────────────────────────────────────────────

@router.post("", status_code=201)
def create_order(body: OrderCreateRequest, identity: dict = Depends(get_authenticated_identity)):
    logger.info("Creating order: identity=%s type=%s qty=%d", identity["identity_id"], body.order_type, body.quantity)
    now = datetime.now(timezone.utc).isoformat()
    order_id = str(uuid.uuid4())
    order_number = _generate_order_number()

    with get_db() as db:
        # Validate file_id if provided
        if body.file_id:
            file_row = db.execute("SELECT id FROM files WHERE id = ?", (body.file_id,)).fetchone()
            if not file_row:
                raise HTTPException(status_code=400, detail="File not found")

        # Use auto_match or traditional matching
        maker_id = None
        maker_region = "Pending match"
        maker_hourly_rate = 30.0  # 默认费率
        
        if body.auto_match:
            # Auto-matching logic: find nearby online nodes
            matches = match_maker_for_order(
                db,
                body.delivery_province, body.delivery_city, body.delivery_district,
                body.material or body.material_preference,
                order_type=body.order_type.value if body.order_type else "print_only",
            )
            
            if matches:
                best = matches[0]
                maker_id = best["id"]
                maker_region = f"{best['location_province']} {best['location_city']}"
                maker_hourly_rate = best.get("pricing_per_hour_cny", 30.0)
        else:
            # No auto-match: leave order unassigned for makers to claim
            pass

        # 使用定价引擎计算价格
        pricing_result = estimate_price(
            material=body.material or body.material_preference or "PLA",
            quantity=body.quantity,
            maker_hourly_rate=maker_hourly_rate,
            urgency=body.urgency.value
        )
        
        estimated_price = pricing_result["estimated_price_cny"]
        platform_fee = pricing_result["platform_fee_cny"]
        maker_income = pricing_result["maker_income_cny"]

        db.execute(
            """INSERT INTO orders
               (id, order_number, order_type, customer_id, maker_id, component_id, quantity, material,
                delivery_province, delivery_city, delivery_district, delivery_address,
                urgency, status, notes,
                price_total_cny, platform_fee_cny, maker_income_cny,
                file_id, color, auto_match,
                created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                order_id, order_number, body.order_type.value if body.order_type else "print_only",
                identity["identity_id"], maker_id,
                body.component_id or "", body.quantity, body.material or body.material_preference,
                body.delivery_province, body.delivery_city, body.delivery_district,
                body.delivery_address,  # 仅存数据库，不给Maker看
                body.urgency.value, "pending", body.notes,
                estimated_price, platform_fee, maker_income,
                body.file_id, body.color, 1 if body.auto_match else 0,
                now, now,
            ),
        )

    return {
        "order_id": order_id,
        "order_number": order_number,
        "order_type": body.order_type.value if body.order_type else "print_only",
        "estimated_price_cny": estimated_price,
        "platform_fee_cny": platform_fee,
        "estimated_time": "48小时" if body.urgency == "normal" else "24小时",
        "matched_maker_region": maker_region,
        "status": "pending",
    }


@router.get("")
def list_orders(identity: dict = Depends(get_authenticated_identity), page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100)):
    offset = (page - 1) * per_page
    agent_id = identity["identity_id"]

    with get_db() as db:
        customer_orders = db.execute(
            "SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (agent_id, per_page, offset),
        ).fetchall()

        maker_ids = [r["id"] for r in db.execute("SELECT id FROM makers WHERE owner_id = ?", (agent_id,)).fetchall()]

    results: dict = {"as_customer": [], "as_maker": []}
    for r in customer_orders:
        results["as_customer"].append(_customer_view(dict(r)))

    if maker_ids:
        placeholders = ",".join("?" * len(maker_ids))
        with get_db() as db:
            maker_orders = db.execute(
                f"SELECT * FROM orders WHERE maker_id IN ({placeholders}) ORDER BY created_at DESC LIMIT ? OFFSET ?",
                maker_ids + [per_page, offset],
            ).fetchall()
        for r in maker_orders:
            results["as_maker"].append(_maker_view(dict(r)))

    return results


@router.get("/available")
def get_available_orders(identity: dict = Depends(get_authenticated_identity)):
    """Get orders available for makers to accept, filtered by maker capabilities."""
    agent_id = identity["identity_id"]
    
    with get_db() as db:
        # Get maker information to filter by capabilities
        maker_info = db.execute(
            "SELECT * FROM makers WHERE owner_id = ?", 
            (agent_id,)
        ).fetchone()
        
        if not maker_info:
            raise HTTPException(status_code=403, detail="Not registered as a maker")
        
        # Get available orders (pending status, no maker assigned)
        available_orders = db.execute("""
            SELECT * FROM orders 
            WHERE status = 'pending' AND maker_id IS NULL
            ORDER BY created_at DESC
        """).fetchall()
        
        # Convert to maker view format
        result = []
        for order in available_orders:
            result.append(_maker_view(dict(order)))
    
    return {"orders": result, "available_orders": result, "total": len(result)}


@router.get("/{order_id}")
def get_order(order_id: str, identity: dict = Depends(get_authenticated_identity)):
    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)
        role = _get_user_role_for_order(db, order, identity["identity_id"])

    if role == "customer":
        return {"role": "customer", "order": _customer_view(order)}
    elif role == "maker":
        return {"role": "maker", "order": _maker_view(order)}
    raise HTTPException(status_code=403, detail="Not your order")


@router.put("/{order_id}/accept")
def accept_order(order_id: str, body: OrderAcceptRequest, identity: dict = Depends(get_authenticated_identity)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        # Use IMMEDIATE transaction to prevent race condition
        # (two makers accepting the same order simultaneously)
        db.execute("BEGIN IMMEDIATE")
        try:
            row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
            if not row:
                db.execute("ROLLBACK")
                raise HTTPException(status_code=404, detail="Order not found")
            order = dict(row)

            if order["status"] != "pending":
                db.execute("ROLLBACK")
                raise HTTPException(status_code=400, detail="Order is not pending")
            if not order["maker_id"]:
                db.execute("ROLLBACK")
                raise HTTPException(status_code=400, detail="No maker assigned")

            maker = db.execute("SELECT owner_id FROM makers WHERE id = ?", (order["maker_id"],)).fetchone()
            if not maker or maker["owner_id"] != identity["identity_id"]:
                db.execute("ROLLBACK")
                raise HTTPException(status_code=403, detail="Not assigned to your maker profile")

            est = (datetime.now(timezone.utc) + timedelta(hours=body.estimated_hours)).isoformat()
            db.execute(
                "UPDATE orders SET status = 'accepted', estimated_completion = ?, updated_at = ? WHERE id = ?",
                (est, now, order_id),
            )
            db.execute("COMMIT")
        except HTTPException:
            raise
        except Exception:
            db.execute("ROLLBACK")
            raise

    logger.info("Order accepted: order=%s by=%s est=%s", order_id, identity["identity_id"], est)
    return {"order_id": order_id, "status": "accepted", "estimated_completion": est}


@router.put("/{order_id}/status")
def update_order_status(order_id: str, body: OrderStatusUpdate, identity: dict = Depends(get_authenticated_identity)):
    now = datetime.now(timezone.utc).isoformat()

    valid_transitions = {
        "accepted": ["printing"],
        "printing": ["assembling", "quality_check", "completed", "shipping"],
        "assembling": ["quality_check", "completed"],
        "quality_check": ["shipping", "completed"],
        "shipping": ["delivered", "completed"],
        "delivered": ["completed"],
    }

    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        roles = _get_user_roles_for_order(db, order, identity["identity_id"])
        if "maker" not in roles:
            raise HTTPException(status_code=403, detail="Only maker can update status")

        allowed = valid_transitions.get(order["status"], [])
        if body.status.value not in allowed:
            raise HTTPException(status_code=400, detail=f"Cannot transition from {order['status']} to {body.status.value}")

        db.execute("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", (body.status.value, now, order_id))

    return {"order_id": order_id, "status": body.status.value}


@router.put("/{order_id}/shipping")
def update_shipping(order_id: str, body: OrderShippingUpdate, identity: dict = Depends(get_authenticated_identity)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        roles = _get_user_roles_for_order(db, order, identity["identity_id"])
        if "maker" not in roles:
            raise HTTPException(status_code=403, detail="Only maker can add shipping info")

        db.execute(
            "UPDATE orders SET shipping_carrier = ?, shipping_tracking = ?, updated_at = ? WHERE id = ?",
            (body.shipping_carrier, body.shipping_tracking, now, order_id),
        )

    return {"order_id": order_id, "shipping_carrier": body.shipping_carrier, "shipping_tracking": body.shipping_tracking}


@router.post("/{order_id}/confirm")
def confirm_delivery(order_id: str, identity: dict = Depends(get_authenticated_identity)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        if order["customer_id"] != identity["identity_id"]:
            raise HTTPException(status_code=403, detail="Only customer can confirm delivery")
        if order["status"] not in ("delivered", "shipping"):
            raise HTTPException(status_code=400, detail="Order not in deliverable state")

        db.execute(
            "UPDATE orders SET status = 'completed', actual_completion = ?, updated_at = ? WHERE id = ?",
            (now, now, order_id),
        )
        if order["maker_id"]:
            db.execute("UPDATE makers SET total_orders = total_orders + 1 WHERE id = ?", (order["maker_id"],))

    return {"order_id": order_id, "status": "completed"}


@router.post("/{order_id}/review", status_code=201)
def review_order(order_id: str, body: OrderReviewRequest, identity: dict = Depends(get_authenticated_identity)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        if order["customer_id"] != identity["identity_id"]:
            raise HTTPException(status_code=403, detail="Only customer can review")
        if order["status"] != "completed":
            raise HTTPException(status_code=400, detail="Order not completed yet")

        existing = db.execute(
            "SELECT id FROM order_reviews WHERE order_id = ? AND reviewer_id = ?",
            (order_id, identity["identity_id"]),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Already reviewed")

        review_id = str(uuid.uuid4())
        db.execute(
            "INSERT INTO order_reviews (id, order_id, reviewer_id, rating, comment, created_at) VALUES (?,?,?,?,?,?)",
            (review_id, order_id, identity["identity_id"], body.rating, body.comment, now),
        )

        # 更新Maker平均评分
        if order["maker_id"]:
            avg = db.execute(
                "SELECT AVG(r.rating) as avg_r FROM order_reviews r JOIN orders o ON r.order_id = o.id WHERE o.maker_id = ?",
                (order["maker_id"],),
            ).fetchone()
            if avg and avg["avg_r"]:
                db.execute("UPDATE makers SET rating = ? WHERE id = ?", (round(avg["avg_r"], 2), order["maker_id"]))

    return {"id": review_id, "order_id": order_id, "rating": body.rating, "comment": body.comment, "created_at": now}


@router.post("/{order_id}/messages", status_code=201)
def send_message(order_id: str, body: OrderMessageCreate, identity: dict = Depends(get_authenticated_identity)):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        role = _get_user_role_for_order(db, order, identity["identity_id"])
        if not role:
            raise HTTPException(status_code=403, detail="Not your order")

        msg_id = str(uuid.uuid4())
        db.execute(
            "INSERT INTO order_messages (id, order_id, sender_id, sender_role, message, created_at) VALUES (?,?,?,?,?,?)",
            (msg_id, order_id, identity["identity_id"], role, body.message, now),
        )

    return {
        "id": msg_id, "order_id": order_id,
        "sender_role": role, "sender_display": _ROLE_DISPLAY[role],
        "message": body.message, "created_at": now,
    }


@router.get("/{order_id}/messages")
def get_messages(order_id: str, identity: dict = Depends(get_authenticated_identity)):
    with get_db() as db:
        row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        order = dict(row)

        role = _get_user_role_for_order(db, order, identity["identity_id"])
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


# ─── Enhanced Order Matching Endpoints ──────────────────
# These endpoints are for the enhanced order matching system

@router.post("/{order_id}/claim")  
def claim_order(order_id: str, identity: dict = Depends(get_authenticated_identity)):
    """Maker claims an unassigned order (enhanced matching)."""
    agent_id = identity["identity_id"]
    now = datetime.now(timezone.utc).isoformat()
    
    with get_db() as db:
        # Verify maker exists
        maker_info = db.execute(
            "SELECT * FROM makers WHERE owner_id = ?", 
            (agent_id,)
        ).fetchone()
        
        if not maker_info:
            raise HTTPException(status_code=403, detail="Not registered as a maker")
        
        # Get order
        order = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order["status"] != "pending":
            raise HTTPException(status_code=400, detail="Order is not available")
        
        if order["maker_id"] is not None:
            raise HTTPException(status_code=400, detail="Order already assigned")
        
        # Accept the order
        db.execute("""
            UPDATE orders 
            SET maker_id = ?, status = 'accepted', updated_at = ?
            WHERE id = ?
        """, (maker_info["id"], now, order_id))
    
    return {"message": "Order claimed successfully", "order_id": order_id, "status": "accepted"}


@router.post("/{order_id}/complete")
def complete_order(order_id: str, identity: dict = Depends(get_authenticated_identity)):
    """Maker marks order as completed."""
    agent_id = identity["identity_id"]
    now = datetime.now(timezone.utc).isoformat()
    
    with get_db() as db:
        # Get order and verify ownership
        order = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Check if the authenticated user is the maker for this order
        if order["maker_id"]:
            maker = db.execute("SELECT owner_id FROM makers WHERE id = ?", (order["maker_id"],)).fetchone()
            if not maker or maker["owner_id"] != agent_id:
                raise HTTPException(status_code=403, detail="Not your order")
        else:
            raise HTTPException(status_code=403, detail="Order not assigned")
        
        if order["status"] not in ["accepted", "printing", "assembling", "quality_check"]:
            raise HTTPException(status_code=400, detail="Order cannot be completed from current status")
        
        # Mark as completed
        db.execute("""
            UPDATE orders 
            SET status = 'completed', updated_at = ?
            WHERE id = ?
        """, (now, order_id))
    
    return {"message": "Order completed successfully", "order_id": order_id, "status": "completed"}


@router.post("/{order_id}/cancel")
def cancel_order(order_id: str, identity: dict = Depends(get_authenticated_identity)):
    """Cancel an order (customer or maker can cancel)."""
    agent_id = identity["identity_id"]
    now = datetime.now(timezone.utc).isoformat()
    
    with get_db() as db:
        # Get order
        order = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order_dict = dict(order)
        role = _get_user_role_for_order(db, order_dict, agent_id)
        
        if not role:
            raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
        
        if order["status"] in ["completed", "delivered", "cancelled"]:
            raise HTTPException(status_code=400, detail="Order cannot be cancelled")
        
        # Cancel the order
        db.execute("""
            UPDATE orders 
            SET status = 'cancelled', updated_at = ?
            WHERE id = ?
        """, (now, order_id))
    
    return {"message": "Order cancelled successfully", "order_id": order_id, "status": "cancelled"}


@router.post("/estimate")
def estimate_order_price(body: OrderEstimateRequest, identity: dict = Depends(get_authenticated_identity)):
    """Get a price estimate before creating an order."""
    # 如果指定了maker_id，用maker的hourly_rate
    # 否则用默认值
    maker_hourly_rate = 30.0  # 默认值
    
    if body.maker_id:
        with get_db() as db:
            maker = db.execute("SELECT pricing_per_hour_cny FROM makers WHERE id = ?", (body.maker_id,)).fetchone()
            if maker and maker["pricing_per_hour_cny"]:
                maker_hourly_rate = maker["pricing_per_hour_cny"]
    
    result = estimate_price(
        material=body.material or "PLA",
        quantity=body.quantity or 1,
        maker_hourly_rate=maker_hourly_rate,
        urgency=body.urgency or "normal"
    )
    return result
