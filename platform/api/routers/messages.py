"""Direct messages API."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..database import get_db
from ..deps import get_authenticated_identity
from ..notifications import send_notification

router = APIRouter(prefix="/messages", tags=["messages"])


class MessageSendRequest(BaseModel):
    recipient_id: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1, max_length=5000)


@router.post("")
async def send_message(
    request: MessageSendRequest,
    identity: dict = Depends(get_authenticated_identity),
):
    sender_id = identity["identity_id"]
    if sender_id == request.recipient_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    content = request.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    now = datetime.now(timezone.utc).isoformat()
    message_id = str(uuid.uuid4())

    with get_db() as db:
        recipient = db.execute(
            "SELECT id, email, username FROM users WHERE id = ?",
            (request.recipient_id,),
        ).fetchone()
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")

        db.execute(
            """
            INSERT INTO direct_messages (
                id, sender_id, recipient_id, content, read, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (message_id, sender_id, request.recipient_id, content, 0, now),
        )

        # Mark previous received messages from recipient as read when sender replies
        db.execute(
            """
            UPDATE direct_messages
            SET read = 1
            WHERE sender_id = ? AND recipient_id = ?
            """,
            (request.recipient_id, sender_id),
        )

    # DM notification trigger
    await send_notification(
        recipient["email"],
        "You have a new direct message",
        f"You received a new message from {identity.get('username') or sender_id}:\n\n{content[:200]}",
        notification_type="direct_message",
    )

    return {
        "id": message_id,
        "sender_id": sender_id,
        "recipient_id": request.recipient_id,
        "content": content,
        "read": False,
        "created_at": now,
    }


@router.get("")
def list_conversations(identity: dict = Depends(get_authenticated_identity)):
    current_user_id = identity["identity_id"]

    with get_db() as db:
        rows = db.execute(
            """
            SELECT dm.*
            FROM direct_messages dm
            JOIN (
                SELECT
                    CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS other_user_id,
                    MAX(created_at) AS last_created_at
                FROM direct_messages
                WHERE sender_id = ? OR recipient_id = ?
                GROUP BY other_user_id
            ) latest
              ON (
                (CASE WHEN dm.sender_id = ? THEN dm.recipient_id ELSE dm.sender_id END) = latest.other_user_id
                AND dm.created_at = latest.last_created_at
              )
            WHERE dm.sender_id = ? OR dm.recipient_id = ?
            ORDER BY dm.created_at DESC
            """,
            (
                current_user_id,
                current_user_id,
                current_user_id,
                current_user_id,
                current_user_id,
                current_user_id,
            ),
        ).fetchall()

        conversations = []
        for row in rows:
            row = dict(row)
            other_user_id = (
                row["recipient_id"]
                if row["sender_id"] == current_user_id
                else row["sender_id"]
            )
            user_row = db.execute(
                "SELECT id, username FROM users WHERE id = ?",
                (other_user_id,),
            ).fetchone()

            unread_count = db.execute(
                """
                SELECT COUNT(*) AS cnt FROM direct_messages
                WHERE sender_id = ? AND recipient_id = ? AND read = 0
                """,
                (other_user_id, current_user_id),
            ).fetchone()["cnt"]

            conversations.append(
                {
                    "user_id": other_user_id,
                    "username": user_row["username"] if user_row else None,
                    "last_message": {
                        "id": row["id"],
                        "sender_id": row["sender_id"],
                        "recipient_id": row["recipient_id"],
                        "content": row["content"],
                        "read": bool(row["read"]),
                        "created_at": row["created_at"],
                    },
                    "unread_count": unread_count,
                }
            )

    return {"conversations": conversations}


@router.get("/{user_id}")
def get_conversation_history(
    user_id: str,
    identity: dict = Depends(get_authenticated_identity),
):
    current_user_id = identity["identity_id"]

    with get_db() as db:
        other_user = db.execute(
            "SELECT id, username FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        if not other_user:
            raise HTTPException(status_code=404, detail="User not found")

        rows = db.execute(
            """
            SELECT id, sender_id, recipient_id, content, read, created_at
            FROM direct_messages
            WHERE (sender_id = ? AND recipient_id = ?)
               OR (sender_id = ? AND recipient_id = ?)
            ORDER BY created_at ASC
            """,
            (current_user_id, user_id, user_id, current_user_id),
        ).fetchall()

        db.execute(
            """
            UPDATE direct_messages
            SET read = 1
            WHERE sender_id = ? AND recipient_id = ? AND read = 0
            """,
            (user_id, current_user_id),
        )

    return {
        "user": {"id": other_user["id"], "username": other_user["username"]},
        "messages": [
            {
                "id": row["id"],
                "sender_id": row["sender_id"],
                "recipient_id": row["recipient_id"],
                "content": row["content"],
                "read": bool(row["read"]),
                "created_at": row["created_at"],
            }
            for row in rows
        ],
    }
