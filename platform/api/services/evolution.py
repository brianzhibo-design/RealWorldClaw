"""Agent evolution XP/level helpers."""

from __future__ import annotations

from datetime import date

# Daily XP cap per agent (from automatic hooks like posting/commenting).
# Admin grant-xp bypasses this limit.
DAILY_XP_CAP = 200

# In-memory daily tracker: {agent_id: {date_str: accumulated_xp}}
_daily_xp: dict[str, dict[str, int]] = {}


def _reset_daily_xp() -> None:
    """Reset daily tracker. For testing only."""
    _daily_xp.clear()


def _check_daily_cap(agent_id: str, xp_delta: int) -> int:
    """Return the actual XP to grant after applying the daily cap.

    Returns 0 if the agent already hit the cap today.
    """
    today = date.today().isoformat()
    agent_tracker = _daily_xp.setdefault(agent_id, {})
    used = agent_tracker.get(today, 0)
    remaining = max(0, DAILY_XP_CAP - used)
    granted = min(xp_delta, remaining)
    if granted > 0:
        agent_tracker[today] = used + granted
    return granted


LEVEL_THRESHOLDS: list[tuple[int, str]] = [
    (0, "Newborn"),
    (100, "Curious"),
    (500, "Builder"),
    (2000, "Creator"),
    (10000, "Pioneer"),
]


def level_for_xp(xp: int) -> tuple[int, str]:
    safe_xp = max(0, int(xp))
    level = 0
    title = "Newborn"
    for idx, (threshold, name) in enumerate(LEVEL_THRESHOLDS):
        if safe_xp >= threshold:
            level = idx
            title = name
        else:
            break
    return level, title


def grant_agent_xp(db, agent_id: str, xp_delta: int, *, bypass_cap: bool = False) -> dict | None:
    """Add XP to an agent and recalculate level/title.

    When bypass_cap=False (default, used by automatic hooks), the daily cap
    is enforced.  Admin grant-xp should pass bypass_cap=True.

    Returns updated evolution snapshot, or None if agent does not exist.
    """
    if bypass_cap:
        delta = int(xp_delta)
    else:
        delta = _check_daily_cap(agent_id, int(xp_delta))
        if delta <= 0:
            # Cap reached — still return current state without modifying.
            row = db.execute(
                "SELECT id, COALESCE(evolution_xp,0) AS evolution_xp, "
                "COALESCE(evolution_level,0) AS evolution_level, "
                "COALESCE(evolution_title,'Newborn') AS evolution_title "
                "FROM agents WHERE id = ?",
                (agent_id,),
            ).fetchone()
            if not row:
                return None
            return {
                "agent_id": agent_id,
                "evolution_xp": int(row["evolution_xp"]),
                "evolution_level": int(row["evolution_level"]),
                "evolution_title": row["evolution_title"],
            }
    row = db.execute(
        """
        SELECT id,
               COALESCE(evolution_xp, 0) AS evolution_xp,
               COALESCE(evolution_level, 0) AS evolution_level,
               COALESCE(evolution_title, 'Newborn') AS evolution_title
        FROM agents
        WHERE id = ?
        """,
        (agent_id,),
    ).fetchone()
    if not row:
        return None

    new_xp = max(0, int(row["evolution_xp"]) + delta)
    new_level, new_title = level_for_xp(new_xp)

    db.execute(
        """
        UPDATE agents
        SET evolution_xp = ?,
            evolution_level = ?,
            evolution_title = ?
        WHERE id = ?
        """,
        (new_xp, new_level, new_title, agent_id),
    )

    return {
        "agent_id": agent_id,
        "evolution_xp": new_xp,
        "evolution_level": new_level,
        "evolution_title": new_title,
    }
