"""Minimal notification system for RealWorldClaw.

Currently logs notifications. Add email/push providers by implementing send().
Set RESEND_API_KEY env var to enable email delivery via Resend (free 100/day).
"""

from __future__ import annotations

import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("NOTIFICATION_FROM", "noreply@realworldclaw.com")


async def send_notification(
    to_email: Optional[str],
    subject: str,
    body: str,
    notification_type: str = "info",
) -> bool:
    """Send a notification. Returns True on success.
    
    If RESEND_API_KEY is set, sends via Resend API.
    Otherwise, logs the notification (useful for development).
    """
    logger.info("Notification [%s] to=%s subject=%s", notification_type, to_email, subject)
    
    if not RESEND_API_KEY or not to_email:
        logger.info("Notification not sent (no API key or no recipient): %s", subject)
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={
                    "from": FROM_EMAIL,
                    "to": [to_email],
                    "subject": subject,
                    "text": body,
                },
                timeout=10,
            )
            if resp.status_code == 200:
                logger.info("Email sent to %s: %s", to_email, subject)
                return True
            else:
                logger.error("Email send failed (%d): %s", resp.status_code, resp.text)
                return False
    except Exception as e:
        logger.error("Email send error: %s", e)
        return False


# Pre-built notification templates

def order_created_maker(order_number: str, material: str, quantity: int) -> tuple[str, str]:
    """Notification for maker when a new order is assigned."""
    subject = f"New Order Assigned: {order_number}"
    body = f"""You have a new manufacturing order!

Order: {order_number}
Material: {material}
Quantity: {quantity}

Log in to RealWorldClaw to accept or review: https://realworldclaw.com/maker-orders
"""
    return subject, body


def order_accepted_customer(order_number: str, maker_name: str) -> tuple[str, str]:
    subject = f"Order {order_number} Accepted"
    body = f"""Your order has been accepted by a maker!

Order: {order_number}
Maker: {maker_name}

Track progress: https://realworldclaw.com/orders
"""
    return subject, body


def order_status_changed(order_number: str, old_status: str, new_status: str) -> tuple[str, str]:
    subject = f"Order {order_number}: {new_status.replace('_', ' ').title()}"
    body = f"""Your order status has been updated.

Order: {order_number}
Status: {old_status} → {new_status}

View details: https://realworldclaw.com/orders
"""
    return subject, body


def order_completed(order_number: str) -> tuple[str, str]:
    subject = f"Order {order_number} Completed!"
    body = f"""Your order has been completed! 🎉

Order: {order_number}

Please leave a review: https://realworldclaw.com/orders
"""
    return subject, body
