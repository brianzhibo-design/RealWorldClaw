"""
PrinterAdapter 基类 — 所有打印机适配器的抽象接口
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional


class PrinterState(str, Enum):
    """打印机状态枚举"""
    IDLE = "idle"
    PRINTING = "printing"
    PAUSED = "paused"
    ERROR = "error"
    COMPLETE = "complete"
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"


@dataclass
class PrinterStatus:
    """打印机状态快照"""
    state: PrinterState = PrinterState.DISCONNECTED
    # 温度
    nozzle_temp: float = 0.0
    nozzle_target: float = 0.0
    bed_temp: float = 0.0
    bed_target: float = 0.0
    # 打印进度
    progress: float = 0.0  # 0.0 ~ 1.0
    filename: Optional[str] = None
    elapsed_seconds: float = 0.0
    remaining_seconds: float = 0.0
    # 耗材
    filament_used_mm: float = 0.0
    # 扩展信息
    extra: dict[str, Any] = field(default_factory=dict)

    @property
    def progress_pct(self) -> float:
        return round(self.progress * 100, 1)


class PrinterAdapter(ABC):
    """
    打印机适配器抽象基类。

    所有适配器必须实现以下方法：
    - connect()     连接打印机
    - disconnect()  断开连接
    - upload()      上传文件到打印机
    - start()       开始打印
    - pause()       暂停
    - resume()      继续
    - cancel()      取消打印
    - monitor()     获取当前状态
    """

    def __init__(self, host: str, port: int = 80, api_key: str = "", name: str = ""):
        self.host = host
        self.port = port
        self.api_key = api_key
        self.name = name or f"{self.__class__.__name__}@{host}"
        self._connected = False

    @property
    def base_url(self) -> str:
        return f"http://{self.host}:{self.port}"

    @property
    def connected(self) -> bool:
        return self._connected

    @abstractmethod
    async def connect(self) -> bool:
        """连接打印机，返回是否成功"""
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        """断开连接"""
        ...

    @abstractmethod
    async def upload(self, file_path: Path, remote_name: Optional[str] = None) -> str:
        """
        上传 G-code / 3MF 文件到打印机。
        返回远端文件名/标识。
        """
        ...

    @abstractmethod
    async def start(self, filename: str) -> bool:
        """开始打印指定文件，返回是否成功"""
        ...

    @abstractmethod
    async def pause(self) -> bool:
        """暂停当前打印"""
        ...

    @abstractmethod
    async def resume(self) -> bool:
        """继续打印"""
        ...

    @abstractmethod
    async def cancel(self) -> bool:
        """取消当前打印"""
        ...

    @abstractmethod
    async def monitor(self) -> PrinterStatus:
        """获取打印机当前状态"""
        ...

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} {self.name} connected={self._connected}>"
