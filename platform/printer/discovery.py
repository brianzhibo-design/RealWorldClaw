"""
局域网打印机自动发现 — mDNS 扫描
支持 OctoPrint / Moonraker / PrusaLink / Bambu Lab
"""

import asyncio
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# mDNS 服务名 → 适配器类型映射
MDNS_SERVICE_MAP = {
    "_octoprint._tcp.local.": "octoprint",
    "_moonraker._tcp.local.": "moonraker",
    "_http._tcp.local.": "http",  # PrusaLink 等通用 HTTP
    "_bambu-mqtt._tcp.local.": "bambu",
}


@dataclass
class DiscoveredPrinter:
    """发现的打印机信息"""
    name: str
    host: str
    port: int
    adapter_type: str  # octoprint / moonraker / bambu / unknown
    properties: dict[str, str]

    @property
    def address(self) -> str:
        return f"{self.host}:{self.port}"


class PrinterScanner:
    """基于 zeroconf 的 mDNS 打印机扫描器"""

    def __init__(self):
        self._discovered: list[DiscoveredPrinter] = []

    async def scan(self, timeout: float = 5.0) -> list[DiscoveredPrinter]:
        """
        扫描局域网中的 3D 打印机。

        需要安装 zeroconf: pip install zeroconf
        """
        try:
            from zeroconf import ServiceBrowser, Zeroconf
        except ImportError:
            logger.warning("zeroconf 未安装，跳过 mDNS 扫描。pip install zeroconf")
            return []

        self._discovered = []
        zc = Zeroconf()

        class Listener:
            def __init__(self, scanner: "PrinterScanner"):
                self.scanner = scanner

            def add_service(self, zc: Zeroconf, stype: str, name: str) -> None:
                info = zc.get_service_info(stype, name)
                if info is None:
                    return
                addresses = info.parsed_addresses()
                if not addresses:
                    return
                host = addresses[0]
                port = info.port or 80
                props = {
                    k.decode() if isinstance(k, bytes) else k:
                    v.decode() if isinstance(v, bytes) else str(v)
                    for k, v in info.properties.items()
                }
                adapter_type = MDNS_SERVICE_MAP.get(stype, "unknown")
                printer = DiscoveredPrinter(
                    name=name.replace(f".{stype}", ""),
                    host=host,
                    port=port,
                    adapter_type=adapter_type,
                    properties=props,
                )
                self.scanner._discovered.append(printer)
                logger.info(f"发现打印机: {printer.name} ({adapter_type}) @ {host}:{port}")

            def remove_service(self, zc: Zeroconf, stype: str, name: str) -> None:
                pass

            def update_service(self, zc: Zeroconf, stype: str, name: str) -> None:
                pass

        listener = Listener(self)
        [
            ServiceBrowser(zc, stype, listener)
            for stype in MDNS_SERVICE_MAP.keys()
        ]

        await asyncio.sleep(timeout)
        zc.close()

        return self._discovered


async def discover_printers(timeout: float = 5.0) -> list[DiscoveredPrinter]:
    """便捷函数：扫描局域网打印机"""
    scanner = PrinterScanner()
    return await scanner.scan(timeout=timeout)
