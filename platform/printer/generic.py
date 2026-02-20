"""
通用打印机适配器 — 仅导出 G-code 文件到指定目录
适用于无网络接口的打印机（SD卡/U盘传输）
"""

import logging
import shutil
from pathlib import Path
from typing import Optional

from .base import PrinterAdapter, PrinterState, PrinterStatus

logger = logging.getLogger(__name__)


class GenericAdapter(PrinterAdapter):
    """
    通用适配器：将 G-code 文件复制到指定输出目录。
    无实际打印机连接，用于手动传输场景。

    用法：
        adapter = GenericAdapter(output_dir="/mnt/sdcard")
        await adapter.connect()
        await adapter.upload(Path("model.gcode"))
    """

    def __init__(self, output_dir: str = "./gcode_output", name: str = "generic"):
        super().__init__(host="local", port=0, name=name)
        self.output_dir = Path(output_dir)

    async def connect(self) -> bool:
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._connected = True
        logger.info(f"通用适配器就绪，输出目录: {self.output_dir}")
        return True

    async def disconnect(self) -> None:
        self._connected = False

    async def upload(self, file_path: Path, remote_name: Optional[str] = None) -> str:
        fname = remote_name or file_path.name
        dest = self.output_dir / fname
        shutil.copy2(file_path, dest)
        logger.info(f"文件已导出: {dest}")
        return str(dest)

    async def start(self, filename: str) -> bool:
        logger.info(f"[通用] 请手动在打印机上启动文件: {filename}")
        return True

    async def pause(self) -> bool:
        logger.info("[通用] 请手动暂停打印机")
        return True

    async def resume(self) -> bool:
        logger.info("[通用] 请手动继续打印")
        return True

    async def cancel(self) -> bool:
        logger.info("[通用] 请手动取消打印")
        return True

    async def monitor(self) -> PrinterStatus:
        return PrinterStatus(
            state=PrinterState.IDLE,
            extra={"note": "通用适配器无法监控，请手动检查打印机状态"},
        )
