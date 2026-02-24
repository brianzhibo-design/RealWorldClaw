"""RealWorldClaw — Health check endpoints."""

from __future__ import annotations

import logging
logger = logging.getLogger(__name__)

import os
import platform
import shutil
import time

import psutil  # optional — graceful fallback
from fastapi import APIRouter

from ..database import DB_PATH, get_db

router = APIRouter(tags=["health"])

_START_TIME = time.time()


@router.get("/health")
def health_basic():
    """Basic liveness check."""
    return {"status": "ok"}


@router.get("/health/detailed")
def health_detailed():
    """Detailed health: DB, disk, memory, uptime."""
    # Database
    db_ok = True
    try:
        with get_db() as db:
            db.execute("SELECT 1")
    except Exception as e:
        logger.exception("Database health check failed: %s", e)
        db_ok = False

    # Disk
    disk = shutil.disk_usage(DB_PATH.parent if DB_PATH.parent.exists() else "/")
    disk_info = {
        "total_gb": round(disk.total / (1 << 30), 2),
        "free_gb": round(disk.free / (1 << 30), 2),
        "used_percent": round((disk.used / disk.total) * 100, 1),
    }

    # Memory
    try:
        mem = psutil.virtual_memory()
        memory_info = {
            "total_gb": round(mem.total / (1 << 30), 2),
            "available_gb": round(mem.available / (1 << 30), 2),
            "used_percent": mem.percent,
        }
    except Exception as e:
        logger.exception("Memory info retrieval failed: %s", e)
        memory_info = {"note": "psutil not available"}

    uptime_s = round(time.time() - _START_TIME, 1)

    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "disk": disk_info,
        "memory": memory_info,
        "uptime_seconds": uptime_s,
        "platform": platform.platform(),
        "python": platform.python_version(),
        "pid": os.getpid(),
    }
