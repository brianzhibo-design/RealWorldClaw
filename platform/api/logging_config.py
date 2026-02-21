"""RealWorldClaw — Structured logging with structlog."""

from __future__ import annotations

import logging
from typing import Optional
import sys
from pathlib import Path

import structlog

LOG_DIR = Path(__file__).parent.parent / "logs"


def setup_logging(log_level: str = "INFO") -> None:
    """Configure structured logging with file and console output."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    # Shared structlog processors
    shared_processors: list = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    # Configure structlog
    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    json_formatter = structlog.stdlib.ProcessorFormatter(
        processor=structlog.processors.JSONRenderer(),
    )

    console_formatter = structlog.stdlib.ProcessorFormatter(
        processor=structlog.dev.ConsoleRenderer(),
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(log_level)

    # Info file handler
    info_handler = logging.FileHandler(str(LOG_DIR / "info.log"), encoding="utf-8")
    info_handler.setFormatter(json_formatter)
    info_handler.setLevel(logging.INFO)

    # Error file handler
    error_handler = logging.FileHandler(str(LOG_DIR / "error.log"), encoding="utf-8")
    error_handler.setFormatter(json_formatter)
    error_handler.setLevel(logging.ERROR)

    # Root logger
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(console_handler)
    root.addHandler(info_handler)
    root.addHandler(error_handler)
    root.setLevel(log_level)

    # Quiet noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(name: Optional[str] = None) -> structlog.stdlib.BoundLogger:
    """Get a structlog logger."""
    return structlog.get_logger(name)
