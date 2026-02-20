"""
OctoPrint 适配器 — REST API 实现
支持 Creality Ender 系列 / Anycubic / 所有 OctoPrint 管理的打印机
"""

import logging
from pathlib import Path
from typing import Optional

import aiohttp

from .base import PrinterAdapter, PrinterState, PrinterStatus

logger = logging.getLogger(__name__)

# OctoPrint 状态 → 内部状态映射
_STATE_MAP = {
    "Operational": PrinterState.IDLE,
    "Printing": PrinterState.PRINTING,
    "Pausing": PrinterState.PAUSED,
    "Paused": PrinterState.PAUSED,
    "Cancelling": PrinterState.PRINTING,
    "Error": PrinterState.ERROR,
    "Offline": PrinterState.DISCONNECTED,
    "Closed": PrinterState.DISCONNECTED,
    "Connecting": PrinterState.CONNECTING,
}


class OctoPrintAdapter(PrinterAdapter):
    """
    OctoPrint REST API 适配器。
    文档：https://docs.octoprint.org/en/master/api/

    用法：
        adapter = OctoPrintAdapter("192.168.1.50", api_key="ABCDEF...")
        await adapter.connect()
        status = await adapter.monitor()
    """

    def __init__(self, host: str, port: int = 80, api_key: str = "", name: str = ""):
        super().__init__(host, port, api_key, name)
        self._session: Optional[aiohttp.ClientSession] = None

    @property
    def _headers(self) -> dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self.api_key:
            h["X-Api-Key"] = self.api_key
        return h

    async def _ensure_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                base_url=self.base_url,
                headers=self._headers,
                timeout=aiohttp.ClientTimeout(total=30),
            )
        return self._session

    async def _get(self, path: str) -> dict:
        session = await self._ensure_session()
        async with session.get(path) as resp:
            resp.raise_for_status()
            return await resp.json()

    async def _post(self, path: str, json: Optional[dict] = None) -> dict:
        session = await self._ensure_session()
        async with session.post(path, json=json) as resp:
            resp.raise_for_status()
            if resp.content_type == "application/json":
                return await resp.json()
            return {}

    # ── 核心接口实现 ──

    async def connect(self) -> bool:
        """验证连接（GET /api/version）"""
        try:
            data = await self._get("/api/version")
            logger.info(f"OctoPrint {data.get('server', '?')} 连接成功 @ {self.host}")
            self._connected = True
            return True
        except Exception as e:
            logger.error(f"OctoPrint 连接失败 @ {self.host}: {e}")
            self._connected = False
            return False

    async def disconnect(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()
        self._connected = False

    async def upload(self, file_path: Path, remote_name: Optional[str] = None) -> str:
        """上传 G-code 到 OctoPrint (POST /api/files/local)"""
        fname = remote_name or file_path.name
        session = await self._ensure_session()
        data = aiohttp.FormData()
        data.add_field("file", open(file_path, "rb"), filename=fname)
        async with session.post("/api/files/local", data=data, headers={"X-Api-Key": self.api_key}) as resp:
            resp.raise_for_status()
            result = await resp.json()
            logger.info(f"文件上传成功: {fname}")
            return result.get("files", {}).get("local", {}).get("name", fname)

    async def start(self, filename: str) -> bool:
        """选择文件并开始打印"""
        try:
            # 先选中文件
            await self._post(f"/api/files/local/{filename}", json={"command": "select", "print": True})
            logger.info(f"开始打印: {filename}")
            return True
        except Exception as e:
            logger.error(f"启动打印失败: {e}")
            return False

    async def pause(self) -> bool:
        try:
            await self._post("/api/job", json={"command": "pause", "action": "pause"})
            return True
        except Exception as e:
            logger.error(f"暂停失败: {e}")
            return False

    async def resume(self) -> bool:
        try:
            await self._post("/api/job", json={"command": "pause", "action": "resume"})
            return True
        except Exception as e:
            logger.error(f"继续失败: {e}")
            return False

    async def cancel(self) -> bool:
        try:
            await self._post("/api/job", json={"command": "cancel"})
            return True
        except Exception as e:
            logger.error(f"取消失败: {e}")
            return False

    async def monitor(self) -> PrinterStatus:
        """获取打印机状态（GET /api/printer + GET /api/job）"""
        status = PrinterStatus()

        try:
            # 打印机状态
            printer_data = await self._get("/api/printer")
            state_text = printer_data.get("state", {}).get("text", "Offline")
            status.state = _STATE_MAP.get(state_text, PrinterState.DISCONNECTED)

            # 温度
            temps = printer_data.get("temperature", {})
            tool0 = temps.get("tool0", {})
            bed = temps.get("bed", {})
            status.nozzle_temp = tool0.get("actual", 0.0)
            status.nozzle_target = tool0.get("target", 0.0)
            status.bed_temp = bed.get("actual", 0.0)
            status.bed_target = bed.get("target", 0.0)

            # 打印任务
            job_data = await self._get("/api/job")
            job = job_data.get("job", {})
            progress_data = job_data.get("progress", {})
            status.filename = job.get("file", {}).get("name")
            status.progress = (progress_data.get("completion") or 0.0) / 100.0
            status.elapsed_seconds = progress_data.get("printTime") or 0.0
            status.remaining_seconds = progress_data.get("printTimeLeft") or 0.0
            status.filament_used_mm = (
                job.get("filament", {}).get("tool0", {}).get("length", 0.0)
            )

            # 完成检测
            if status.progress >= 1.0 and status.state == PrinterState.IDLE:
                status.state = PrinterState.COMPLETE

        except Exception as e:
            logger.error(f"状态获取失败: {e}")
            status.state = PrinterState.DISCONNECTED

        return status

    # ── 扩展方法 ──

    async def get_version(self) -> dict:
        """获取 OctoPrint 版本信息"""
        return await self._get("/api/version")

    async def get_connection(self) -> dict:
        """获取串口连接信息"""
        return await self._get("/api/connection")

    async def list_files(self) -> list[dict]:
        """列出已上传的文件"""
        data = await self._get("/api/files/local")
        return data.get("files", [])
