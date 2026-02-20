"""
BambuLabAdapter — 拓竹 Bambu Lab 打印机局域网适配器 (P2S / P1S / X1C 等)

沸羊羊💪 基建出品 | 2026-02-20

══════════════════════════════════════════════════════════════
Bambu Lab 局域网协议说明 (基于 OpenBambuAPI 社区逆向文档)
══════════════════════════════════════════════════════════════

【连接方式】
  MQTT: mqtts://{PRINTER_IP}:8883  (TLS, 自签名证书)
    用户名: bblp
    密码: LAN Access Code (在 Bambu Studio → 设备 → 局域网模式 获取)
  FTPS: ftps://{PRINTER_IP}:990  (隐式TLS)
    用户名: bblp  密码: 同上

【MQTT Topic 结构】
  订阅(接收状态):  device/{SERIAL}/report
  发布(发送命令):  device/{SERIAL}/request
  局域网模式下 SERIAL 可以用任意非空字符串，一般直接用序列号

【消息格式】 — 全部 JSON
  请求:  { "{TYPE}": { "sequence_id": "N", "command": "{CMD}", ... } }
  响应:  { "{TYPE}": { "sequence_id": "N", "command": "{CMD}", "result": "success", ... } }

【核心命令】
  pushing.pushall        — 请求完整状态推送 (P系列只推增量，需主动请求全量)
  info.get_version       — 获取固件版本
  print.project_file     — 打印3MF项目文件 (上传到FTPS后通过此命令启动)
  print.gcode_file       — 打印gcode文件
  print.pause            — 暂停打印 (QoS=1)
  print.resume           — 继续打印 (QoS=1)
  print.stop             — 停止/取消打印 (QoS=1)
  print.print_speed      — 设置速度 (1=静音 2=标准 3=运动 4=狂暴)
  print.gcode_line       — 发送原始G-code
  print.ams_change_filament — AMS换料
  print.ams_control      — AMS控制 (resume/reset/pause)
  system.ledctrl         — LED灯控制
  camera.ipcam_record_set — 录像开关
  camera.ipcam_timelapse  — 延时摄影开关

【状态字段 (push_status)】
  gcode_state: IDLE / RUNNING / PAUSE / FAILED / FINISH
  mc_percent: 打印进度 0-100
  mc_remaining_time: 剩余时间(分钟)
  layer_num / total_layer_num: 当前层/总层数
  nozzle_temper / nozzle_target_temper: 喷嘴温度
  bed_temper / bed_target_temper: 热床温度
  chamber_temper: 仓温
  gcode_file: 当前文件名
  subtask_name: 任务名
  ams: AMS耗材信息(tray_type, tray_color, remain...)
  wifi_signal: WiFi信号强度
  spd_lvl: 速度档位

【FTP上传流程】
  1. FTPS连接到 990 端口 (隐式TLS, 不验证证书)
  2. 上传3MF到根目录或 /cache/ 目录
  3. MQTT发送 print.project_file 命令启动打印
     url: "ftp:///filename.3mf"  或  "file:///mnt/sdcard/filename.3mf"
     param: "Metadata/plate_1.gcode" (3MF内的gcode路径)
══════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import asyncio
import json
import logging
import ssl
import time
import ftplib
from io import BytesIO
from pathlib import Path
from typing import Any, Callable, Optional

try:
    import paho.mqtt.client as mqtt
except ImportError:
    mqtt = None  # type: ignore

from .base import PrinterAdapter, PrinterState, PrinterStatus

logger = logging.getLogger(__name__)

# gcode_state → PrinterState 映射
_STATE_MAP: dict[str, PrinterState] = {
    "IDLE": PrinterState.IDLE,
    "RUNNING": PrinterState.PRINTING,
    "PAUSE": PrinterState.PAUSED,
    "FAILED": PrinterState.ERROR,
    "FINISH": PrinterState.COMPLETE,
    "PREPARE": PrinterState.PRINTING,
    "SLICING": PrinterState.PRINTING,
}


def _make_tls_context() -> ssl.SSLContext:
    """创建不验证证书的TLS上下文 (拓竹使用自签名证书)"""
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


class BambuLabAdapter(PrinterAdapter):
    """
    Bambu Lab 局域网 MQTT + FTPS 适配器

    支持型号: P1P / P1S / P2S / X1C / X1 / A1 mini 等 (需开启局域网模式)

    使用:
        adapter = BambuLabAdapter(
            host="192.168.1.100",
            access_code="12345678",
            serial="01P00A000000000",  # 可选, 不填则用通配符发现
        )
        await adapter.connect()
        status = await adapter.monitor()
    """

    MQTT_PORT = 8883
    FTPS_PORT = 990
    MQTT_USERNAME = "bblp"

    def __init__(
        self,
        host: str,
        access_code: str,
        serial: str = "",
        port: int = MQTT_PORT,
        name: str = "",
    ):
        super().__init__(host=host, port=port, api_key=access_code, name=name or f"BambuLab@{host}")
        self.access_code = access_code
        self.serial = serial or "0"  # 局域网模式可用任意值,但最好用真实序列号
        self._seq_id = 0
        self._mqtt_client: Optional[Any] = None
        self._latest_status: dict[str, Any] = {}
        self._status_event = asyncio.Event()
        self._on_status_callbacks: list[Callable[[dict], None]] = []
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    # ─── 内部工具 ───────────────────────────────────────────

    def _next_seq(self) -> str:
        self._seq_id += 1
        return str(self._seq_id)

    @property
    def _topic_report(self) -> str:
        return f"device/{self.serial}/report"

    @property
    def _topic_request(self) -> str:
        return f"device/{self.serial}/request"

    def _publish(self, payload: dict, qos: int = 0) -> None:
        """发送MQTT消息"""
        if not self._mqtt_client:
            raise ConnectionError("MQTT未连接")
        data = json.dumps(payload)
        logger.debug("MQTT TX → %s", data[:200])
        self._mqtt_client.publish(self._topic_request, data, qos=qos)

    def _send_command(self, msg_type: str, command: str, qos: int = 0, **kwargs) -> str:
        """构建并发送标准命令, 返回 sequence_id"""
        seq = self._next_seq()
        payload = {msg_type: {"sequence_id": seq, "command": command, **kwargs}}
        self._publish(payload, qos=qos)
        return seq

    # ─── MQTT 回调 (在paho线程中运行) ──────────────────────

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            logger.info("✅ MQTT 已连接到 %s", self.host)
            # 订阅报告topic (通配符，兼容未知serial)
            client.subscribe(f"device/+/report", qos=0)
            self._connected = True
            # 请求全量状态
            self._send_command("pushing", "pushall", version=1, push_target=1)
        else:
            logger.error("❌ MQTT 连接失败, rc=%d", rc)

    def _on_message(self, client, userdata, msg):
        try:
            data = json.loads(msg.payload)
        except json.JSONDecodeError:
            return

        # 自动发现serial
        if self.serial == "0" and msg.topic.startswith("device/") and msg.topic.endswith("/report"):
            discovered = msg.topic.split("/")[1]
            if discovered != "0":
                self.serial = discovered
                logger.info("🔍 发现打印机序列号: %s", self.serial)

        # 合并状态
        if "print" in data:
            self._latest_status.update(data["print"])
            for cb in self._on_status_callbacks:
                try:
                    cb(self._latest_status)
                except Exception:
                    pass
            # 通知等待者
            if self._loop:
                self._loop.call_soon_threadsafe(self._status_event.set)

        # 其他类型也存储
        for key in ("info", "system", "camera", "xcam", "upgrade"):
            if key in data:
                self._latest_status[f"__{key}__"] = data[key]
                if self._loop:
                    self._loop.call_soon_threadsafe(self._status_event.set)

    def _on_disconnect(self, client, userdata, rc, properties=None):
        self._connected = False
        logger.warning("⚠️ MQTT 断开, rc=%d", rc)

    # ─── PrinterAdapter 接口实现 ────────────────────────────

    async def connect(self) -> bool:
        """连接打印机 MQTT"""
        if mqtt is None:
            raise ImportError("需要安装 paho-mqtt: pip install paho-mqtt")

        self._loop = asyncio.get_running_loop()

        client = mqtt.Client(
            client_id=f"openclaw_{int(time.time())}",
            protocol=mqtt.MQTTv311,
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2
            if hasattr(mqtt, "CallbackAPIVersion")
            else None,
        )
        client.username_pw_set(self.MQTT_USERNAME, self.access_code)
        client.tls_set_context(_make_tls_context())
        client.tls_insecure_set(True)

        client.on_connect = self._on_connect
        client.on_message = self._on_message
        client.on_disconnect = self._on_disconnect

        self._mqtt_client = client

        # 异步连接
        try:
            client.connect_async(self.host, self.MQTT_PORT, keepalive=60)
            client.loop_start()
        except Exception as e:
            logger.error("MQTT连接失败: %s", e)
            return False

        # 等待连接完成
        for _ in range(50):  # 最多等5秒
            if self._connected:
                return True
            await asyncio.sleep(0.1)

        logger.error("MQTT连接超时")
        return False

    async def disconnect(self) -> None:
        """断开MQTT连接"""
        if self._mqtt_client:
            self._mqtt_client.loop_stop()
            self._mqtt_client.disconnect()
            self._mqtt_client = None
        self._connected = False

    async def upload(self, file_path: Path, remote_name: Optional[str] = None) -> str:
        """
        通过FTPS上传3MF/gcode文件到打印机

        Args:
            file_path: 本地文件路径
            remote_name: 远端文件名 (默认同本地文件名)

        Returns:
            远端文件路径
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")

        remote = remote_name or file_path.name
        loop = asyncio.get_running_loop()

        def _ftp_upload():
            ftp = ftplib.FTP_TLS()
            ftp.connect(self.host, self.FTPS_PORT, timeout=30)
            # 隐式TLS: 连接后立即加密
            ctx = _make_tls_context()
            ftp.context = ctx
            ftp.auth()
            ftp.login(self.MQTT_USERNAME, self.access_code)
            ftp.prot_p()  # 数据连接也加密

            with open(file_path, "rb") as f:
                ftp.storbinary(f"STOR {remote}", f)

            ftp.quit()
            return remote

        result = await loop.run_in_executor(None, _ftp_upload)
        logger.info("📤 文件已上传: %s → %s", file_path.name, result)
        return result

    async def start(self, filename: str) -> bool:
        """
        开始打印

        Args:
            filename: 文件名 (已上传到打印机的3MF或gcode)
                      3MF文件会使用 project_file 命令
                      gcode文件会使用 gcode_file 命令
        """
        if filename.lower().endswith(".3mf"):
            # 3MF项目文件打印
            self._send_command(
                "print", "project_file",
                param="Metadata/plate_1.gcode",
                project_id="0",
                profile_id="0",
                task_id="0",
                subtask_id="0",
                subtask_name=filename,
                file="",
                url=f"ftp:///{filename}",
                md5="",
                timelapse=False,
                bed_type="auto",
                bed_levelling=True,
                flow_cali=True,
                vibration_cali=True,
                layer_inspect=True,
                ams_mapping="",
                use_ams=False,
            )
        else:
            # 直接gcode打印
            self._send_command("print", "gcode_file", param=filename)

        logger.info("▶️ 开始打印: %s", filename)
        return True

    async def start_3mf(
        self,
        filename: str,
        plate: int = 1,
        use_ams: bool = False,
        ams_mapping: Optional[list[int]] = None,
        timelapse: bool = False,
        bed_levelling: bool = True,
        flow_cali: bool = True,
        vibration_cali: bool = True,
    ) -> bool:
        """
        启动3MF打印 (高级版, 支持AMS映射和更多选项)

        Args:
            filename: 3MF文件名
            plate: 板号 (从1开始)
            use_ams: 是否使用AMS
            ams_mapping: AMS映射数组, 如 [-1, -1, -1, 1, 0]
            timelapse: 延时摄影
            bed_levelling: 自动调平
            flow_cali: 流量校准
            vibration_cali: 振动补偿
        """
        self._send_command(
            "print", "project_file",
            param=f"Metadata/plate_{plate}.gcode",
            project_id="0",
            profile_id="0",
            task_id="0",
            subtask_id="0",
            subtask_name=filename,
            file="",
            url=f"ftp:///{filename}",
            md5="",
            timelapse=timelapse,
            bed_type="auto",
            bed_levelling=bed_levelling,
            flow_cali=flow_cali,
            vibration_cali=vibration_cali,
            layer_inspect=True,
            ams_mapping=ams_mapping or "",
            use_ams=use_ams,
        )
        logger.info("▶️ 开始打印3MF: %s (plate=%d, ams=%s)", filename, plate, use_ams)
        return True

    async def pause(self) -> bool:
        """暂停打印"""
        self._send_command("print", "pause", qos=1, param="")
        logger.info("⏸️ 暂停打印")
        return True

    async def resume(self) -> bool:
        """继续打印"""
        self._send_command("print", "resume", qos=1, param="")
        logger.info("▶️ 继续打印")
        return True

    async def cancel(self) -> bool:
        """取消/停止打印"""
        self._send_command("print", "stop", qos=1, param="")
        logger.info("⏹️ 停止打印")
        return True

    async def monitor(self) -> PrinterStatus:
        """获取打印机当前状态"""
        if not self._connected:
            return PrinterStatus(state=PrinterState.DISCONNECTED)

        s = self._latest_status

        # 如果还没有数据，请求一次全量推送并等待
        if not s:
            self._status_event.clear()
            self._send_command("pushing", "pushall", version=1, push_target=1)
            try:
                await asyncio.wait_for(self._status_event.wait(), timeout=10)
            except asyncio.TimeoutError:
                logger.warning("等待状态超时")
            s = self._latest_status

        gcode_state = s.get("gcode_state", "IDLE").upper()
        state = _STATE_MAP.get(gcode_state, PrinterState.IDLE)

        return PrinterStatus(
            state=state,
            nozzle_temp=float(s.get("nozzle_temper", 0)),
            nozzle_target=float(s.get("nozzle_target_temper", 0)),
            bed_temp=float(s.get("bed_temper", 0)),
            bed_target=float(s.get("bed_target_temper", 0)),
            progress=float(s.get("mc_percent", 0)) / 100.0,
            filename=s.get("subtask_name") or s.get("gcode_file"),
            elapsed_seconds=0,  # Bambu不直接给elapsed, 可从gcode_start_time算
            remaining_seconds=float(s.get("mc_remaining_time", 0)) * 60,  # 分钟→秒
            extra={
                "layer_num": s.get("layer_num", 0),
                "total_layer_num": s.get("total_layer_num", 0),
                "chamber_temp": s.get("chamber_temper", 0),
                "wifi_signal": s.get("wifi_signal", ""),
                "speed_level": s.get("spd_lvl", 0),
                "speed_magnitude": s.get("spd_mag", 100),
                "gcode_state": gcode_state,
                "ams": s.get("ams", {}),
                "ipcam": s.get("ipcam", {}),
                "print_error": s.get("print_error", 0),
                "hms": s.get("hms", []),
            },
        )

    # ─── 扩展方法 (非基类接口) ─────────────────────────────

    async def get_version(self) -> dict:
        """获取固件版本信息"""
        self._status_event.clear()
        self._send_command("info", "get_version")
        try:
            await asyncio.wait_for(self._status_event.wait(), timeout=10)
        except asyncio.TimeoutError:
            pass
        return self._latest_status.get("__info__", {})

    async def set_speed(self, level: int = 2) -> bool:
        """设置打印速度: 1=静音 2=标准 3=运动 4=狂暴"""
        assert 1 <= level <= 4, "速度等级 1-4"
        self._send_command("print", "print_speed", param=str(level))
        return True

    async def send_gcode(self, gcode: str) -> bool:
        """发送原始G-code"""
        self._send_command("print", "gcode_line", param=gcode)
        return True

    async def set_light(self, node: str = "chamber_light", on: bool = True) -> bool:
        """控制LED灯"""
        self._send_command(
            "system", "ledctrl",
            led_node=node,
            led_mode="on" if on else "off",
            led_on_time=500, led_off_time=500,
            loop_times=1, interval_time=1000,
        )
        return True

    async def set_camera_recording(self, enable: bool = True) -> bool:
        """开关录像"""
        self._send_command("camera", "ipcam_record_set", control="enable" if enable else "disable")
        return True

    async def set_timelapse(self, enable: bool = True) -> bool:
        """开关延时摄影"""
        self._send_command("camera", "ipcam_timelapse", control="enable" if enable else "disable")
        return True

    async def ams_change_filament(self, target_tray: int, curr_temp: int = 0, tar_temp: int = 0) -> bool:
        """AMS换料"""
        self._send_command(
            "print", "ams_change_filament",
            target=target_tray, curr_temp=curr_temp, tar_temp=tar_temp,
        )
        return True

    async def request_full_status(self) -> dict:
        """请求并等待完整状态推送"""
        self._status_event.clear()
        self._send_command("pushing", "pushall", version=1, push_target=1)
        try:
            await asyncio.wait_for(self._status_event.wait(), timeout=10)
        except asyncio.TimeoutError:
            logger.warning("全量状态请求超时")
        return dict(self._latest_status)

    def on_status(self, callback: Callable[[dict], None]) -> None:
        """注册状态更新回调"""
        self._on_status_callbacks.append(callback)

    @staticmethod
    async def discover(timeout: float = 5.0) -> list[dict[str, str]]:
        """
        通过SSDP/mDNS发现局域网内的拓竹打印机

        Returns:
            [{"ip": "...", "name": "...", "serial": "..."}, ...]
        """
        # Bambu打印机通过SSDP广播 (UDP 2021端口)
        found: list[dict[str, str]] = []
        loop = asyncio.get_running_loop()

        class SSDPProtocol(asyncio.DatagramProtocol):
            def datagram_received(self, data: bytes, addr: tuple):
                try:
                    msg = data.decode("utf-8", errors="ignore")
                    info = {"ip": addr[0]}
                    for line in msg.split("\r\n"):
                        if line.startswith("USN:"):
                            info["serial"] = line.split(":")[-1].strip()
                        if line.startswith("DevName.bambu.com:"):
                            info["name"] = line.split(":", 1)[-1].strip()
                        if line.startswith("DevModel.bambu.com:"):
                            info["model"] = line.split(":", 1)[-1].strip()
                    if "serial" in info or "name" in info:
                        found.append(info)
                except Exception:
                    pass

        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind(("", 0))

            transport, _ = await loop.create_datagram_endpoint(
                SSDPProtocol, sock=sock
            )

            # 发送SSDP M-SEARCH
            search_msg = (
                "M-SEARCH * HTTP/1.1\r\n"
                "HOST: 239.255.255.250:1900\r\n"
                'MAN: "ssdp:discover"\r\n'
                "MX: 3\r\n"
                "ST: urn:bambulab-com:device:3dprinter:1\r\n"
                "\r\n"
            )
            transport.sendto(search_msg.encode(), ("239.255.255.250", 2021))

            await asyncio.sleep(timeout)
            transport.close()
        except Exception as e:
            logger.warning("SSDP发现失败: %s", e)

        return found
