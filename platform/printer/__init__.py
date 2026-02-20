"""
RealWorldClaw 打印机适配层 💪
沸羊羊出品 — 基建就是力量

支持：OctoPrint / Moonraker(Klipper) / 通用G-code导出 / 局域网自动发现
"""

from .base import PrinterAdapter, PrinterState, PrinterStatus
from .octoprint import OctoPrintAdapter
from .moonraker import MoonrakerAdapter
from .generic import GenericAdapter
from .bambu import BambuLabAdapter
from .discovery import discover_printers

__all__ = [
    "PrinterAdapter",
    "PrinterState",
    "PrinterStatus",
    "OctoPrintAdapter",
    "MoonrakerAdapter",
    "GenericAdapter",
    "BambuLabAdapter",
    "discover_printers",
]
