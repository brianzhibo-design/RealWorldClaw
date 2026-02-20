"""
Moonraker/Klipper 适配器 — HTTP API 实现
支持 Creality K1 / Elegoo Neptune 4 / Voron / 所有 Klipper 机型
文档：https://moonraker.readthedocs.io/en/latest/web_api/
"""

import logging
from pathlib import Path
from typing import Optional

import aiohttp

from .base import PrinterAdapter, PrinterState, PrinterStatus

logger = logging.getLogger(__name__)

_STATE_MAP = {
    "standby": PrinterState.IDLE,
    "printing": PrinterState.PRINTING,
    "paused": PrinterState.PAUSED,
    "complete": PrinterState.COMPLETE,
    "cancelled": PrinterState.IDLE,
    "error": PrinterState.ERROR,
}


class MoonrakerAdapter(PrinterAdapter):
    """
    Moonraker HTTP API 适配器（默认端口 7125）。

    用法：
        adapter = MoonrakerAdapter("192.168.1.100", port=7125)
        await adapter.connect()
        status = await adapter.monitor()
    """

    def __init__(self, host: str, port: int = 7125, api_key: str = "", name: str = ""):
        super().__init__(host, port, api_key, name)
        self._session: Optional[aiohttp.ClientSession] = None

    async def _ensure_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            self._session = aiohttp.ClientSession(
                base_url=self.base_url,
                headers=headers,
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

    async def connect(self) -> bool:
        try:
            data = await self._get("/printer/info")
            state = data.get("result", {}).get("state", "unknown")
            logger.info(f"Moonraker 连接成功 @ {self.host} (state={state})")
            self._connected = True
            return True
        except Exception as e:
            logger.error(f"Moonraker 连接失败 @ {self.host}: {e}")
            self._connected = False
            return False

    async def disconnect(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()
        self._connected = False

    async def upload(self, file_path: Path, remote_name: Optional[str] = None) -> str:
        fname = remote_name or file_path.name
        session = await self._ensure_session()
        data = aiohttp.FormData()
        fh = open(file_path, "rb")
        try:
            data.add_field("file", fh, filename=fname)
            async with session.post("/server/files/upload", data=data) as resp:
                resp.raise_for_status()
                result = await resp.json()
                logger.info(f"文件上传成功: {fname}")
                return result.get("result", {}).get("item", {}).get("path", fname)
        finally:
            fh.close()

    async def start(self, filename: str) -> bool:
        try:
            await self._post(f"/printer/print/start?filename={filename}")
            logger.info(f"开始打印: {filename}")
            return True
        except Exception as e:
            logger.error(f"启动打印失败: {e}")
            return False

    async def pause(self) -> bool:
        try:
            await self._post("/printer/print/pause")
            return True
        except Exception as e:
            logger.error(f"暂停失败: {e}")
            return False

    async def resume(self) -> bool:
        try:
            await self._post("/printer/print/resume")
            return True
        except Exception as e:
            logger.error(f"继续失败: {e}")
            return False

    async def cancel(self) -> bool:
        try:
            await self._post("/printer/print/cancel")
            return True
        except Exception as e:
            logger.error(f"取消失败: {e}")
            return False

    async def monitor(self) -> PrinterStatus:
        status = PrinterStatus()
        try:
            data = await self._get(
                "/printer/objects/query?print_stats&virtual_sdcard&extruder&heater_bed"
            )
            result = data.get("result", {}).get("status", {})

            # 状态
            ps = result.get("print_stats", {})
            status.state = _STATE_MAP.get(ps.get("state", "standby"), PrinterState.IDLE)
            status.filename = ps.get("filename") or None
            status.elapsed_seconds = ps.get("total_duration", 0.0)
            status.filament_used_mm = ps.get("filament_used", 0.0)

            # 进度
            vsd = result.get("virtual_sdcard", {})
            status.progress = vsd.get("progress", 0.0)

            # 温度
            ext = result.get("extruder", {})
            status.nozzle_temp = ext.get("temperature", 0.0)
            status.nozzle_target = ext.get("target", 0.0)
            bed = result.get("heater_bed", {})
            status.bed_temp = bed.get("temperature", 0.0)
            status.bed_target = bed.get("target", 0.0)

        except Exception as e:
            logger.error(f"Moonraker 状态获取失败: {e}")
            status.state = PrinterState.DISCONNECTED

        return status

    async def send_gcode(self, script: str) -> dict:
        """发送任意 G-code 命令"""
        return await self._post(f"/printer/gcode/script?script={script}")

    async def list_files(self) -> list[dict]:
        data = await self._get("/server/files/list?root=gcodes")
        return data.get("result", [])
