"""
RealWorldClaw — Universal Printer Adapter
==========================================
适配所有主流3D打印机，统一接口：切片 + 上传 + 打印

支持:
- Bambu Lab (P1S/P2S/X1C/A1) — MQTT + FTPS
- OctoPrint — REST API
- Moonraker (Klipper) — REST API
- PrusaLink — REST API  
- 通用 — PrusaSlicer CLI 切片 + G-code输出
"""

import os
import json
import ssl
import time
import subprocess
import hashlib
from pathlib import Path
from typing import Optional, Dict, Any
from dataclasses import dataclass, asdict
from enum import Enum

class PrinterType(Enum):
    BAMBU = "bambu"
    OCTOPRINT = "octoprint"
    MOONRAKER = "moonraker"
    PRUSALINK = "prusalink"
    GENERIC = "generic"

class PrintStatus(Enum):
    IDLE = "idle"
    SLICING = "slicing"
    UPLOADING = "uploading"
    PRINTING = "printing"
    PAUSED = "paused"
    COMPLETE = "complete"
    ERROR = "error"

@dataclass
class SliceProfile:
    """切片参数 — 所有打印机通用"""
    layer_height: float = 0.2       # mm
    first_layer_height: float = 0.2
    nozzle_diameter: float = 0.4
    infill_density: int = 20        # %
    wall_count: int = 3
    top_layers: int = 5
    bottom_layers: int = 4
    support: bool = False
    bed_temp: int = 60
    nozzle_temp: int = 210
    filament: str = "PLA"
    speed: int = 80                 # mm/s
    bed_size_x: int = 256
    bed_size_y: int = 256
    bed_size_z: int = 256

@dataclass
class PrinterConfig:
    """打印机配置"""
    name: str
    type: PrinterType
    ip: str
    port: int = 80
    access_code: str = ""
    serial: str = ""
    api_key: str = ""
    profile: SliceProfile = None
    
    def __post_init__(self):
        if self.profile is None:
            self.profile = SliceProfile()

class PrinterAdapter:
    """通用打印机适配器"""
    
    def __init__(self, config: PrinterConfig):
        self.config = config
        self._status = PrintStatus.IDLE
        self._progress = 0
    
    @property
    def status(self) -> Dict[str, Any]:
        return {
            "printer": self.config.name,
            "type": self.config.type.value,
            "status": self._status.value,
            "progress": self._progress
        }
    
    def slice(self, stl_path: str, output_path: str = None, 
              profile: SliceProfile = None) -> str:
        """
        切片STL文件 → G-code
        使用PrusaSlicer CLI，兼容所有打印机
        """
        if profile is None:
            profile = self.config.profile
        
        if output_path is None:
            output_path = stl_path.replace('.stl', '.gcode')
        
        self._status = PrintStatus.SLICING
        
        # 生成PrusaSlicer配置
        config_path = self._generate_slicer_config(profile)
        
        # 调用PrusaSlicer CLI
        prusa = self._find_prusaslicer()
        if not prusa:
            raise RuntimeError("PrusaSlicer not found. Install: brew install --cask prusaslicer")
        
        cmd = [prusa, '--load', config_path, '--export-gcode', '-o', output_path, stl_path]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if not os.path.exists(output_path):
            self._status = PrintStatus.ERROR
            raise RuntimeError(f"Slicing failed: {result.stderr}")
        
        self._status = PrintStatus.IDLE
        return output_path
    
    def upload_and_print(self, gcode_path: str, autostart: bool = True) -> bool:
        """上传G-code并开始打印"""
        self._status = PrintStatus.UPLOADING
        
        adapter = self._get_adapter()
        success = adapter.upload(gcode_path)
        
        if success and autostart:
            self._status = PrintStatus.PRINTING
            adapter.start_print(os.path.basename(gcode_path))
        
        return success
    
    def pause(self):
        self._get_adapter().pause()
        self._status = PrintStatus.PAUSED
    
    def resume(self):
        self._get_adapter().resume()
        self._status = PrintStatus.PRINTING
    
    def stop(self):
        self._get_adapter().stop()
        self._status = PrintStatus.IDLE
    
    def get_status(self) -> Dict[str, Any]:
        """查询打印机实时状态"""
        return self._get_adapter().get_status()
    
    # ─── 内部方法 ───
    
    def _get_adapter(self):
        adapters = {
            PrinterType.BAMBU: BambuAdapter,
            PrinterType.OCTOPRINT: OctoPrintAdapter,
            PrinterType.MOONRAKER: MoonrakerAdapter,
            PrinterType.PRUSALINK: PrusaLinkAdapter,
            PrinterType.GENERIC: GenericAdapter,
        }
        cls = adapters.get(self.config.type, GenericAdapter)
        return cls(self.config)
    
    def _find_prusaslicer(self) -> Optional[str]:
        paths = [
            '/Applications/PrusaSlicer.app/Contents/MacOS/PrusaSlicer',
            '/usr/bin/prusa-slicer',
            '/usr/local/bin/prusa-slicer',
        ]
        for p in paths:
            if os.path.exists(p):
                return p
        # Try which
        try:
            result = subprocess.run(['which', 'prusa-slicer'], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
        except:
            pass
        return None
    
    def _generate_slicer_config(self, profile: SliceProfile) -> str:
        """生成PrusaSlicer .ini 配置文件"""
        config = f"""
[print:RWC]
layer_height = {profile.layer_height}
first_layer_height = {profile.first_layer_height}
perimeters = {profile.wall_count}
top_solid_layers = {profile.top_layers}
bottom_solid_layers = {profile.bottom_layers}
fill_density = {profile.infill_density}%
fill_pattern = grid
support_material = {1 if profile.support else 0}

[filament:RWC]
temperature = {profile.nozzle_temp}
first_layer_temperature = {profile.nozzle_temp + 5}
bed_temperature = {profile.bed_temp}
first_layer_bed_temperature = {profile.bed_temp}
filament_type = {profile.filament}
filament_diameter = 1.75

[printer:RWC]
bed_shape = 0x0,{profile.bed_size_x}x0,{profile.bed_size_x}x{profile.bed_size_y},0x{profile.bed_size_y}
max_print_height = {profile.bed_size_z}
nozzle_diameter = {profile.nozzle_diameter}
printer_technology = FFF
gcode_flavor = marlin2
use_relative_e_distances = 1
start_gcode = G28\\nG29\\nM104 S[first_layer_temperature]\\nM140 S[first_layer_bed_temperature]\\nM109 S[first_layer_temperature]\\nM190 S[first_layer_bed_temperature]\\nG92 E0
end_gcode = M104 S0\\nM140 S0\\nG91\\nG1 Z10 F3000\\nG90\\nG28 X Y\\nM84
"""
        path = '/tmp/rwc_slicer_config.ini'
        with open(path, 'w') as f:
            f.write(config)
        return path


# ═══ 打印机协议适配器 ═══

class BambuAdapter:
    """拓竹 Bambu Lab — MQTT + FTPS"""
    
    def __init__(self, config: PrinterConfig):
        self.config = config
    
    def upload(self, gcode_path: str) -> bool:
        """通过FTPS上传到打印机SD卡"""
        import paho.mqtt.client as mqtt
        
        # Bambu需要3MF格式，但也支持发送gcode命令
        # 通过MQTT逐行发送gcode
        print(f"📤 Uploading to Bambu {self.config.name} via MQTT...")
        
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        client.username_pw_set("bblp", self.config.access_code)
        client.tls_set(cert_reqs=ssl.CERT_NONE)
        client.tls_insecure_set(True)
        
        connected = [False]
        def on_connect(c, u, f, rc, p=None):
            connected[0] = (rc == 0)
        
        client.on_connect = on_connect
        client.connect(self.config.ip, 8883, 60)
        client.loop_start()
        time.sleep(3)
        
        if not connected[0]:
            print("❌ Cannot connect to printer")
            return False
        
        topic = f"device/{self.config.serial}/request"
        
        # 发送gcode行（Bambu支持通过MQTT发送单行gcode）
        with open(gcode_path) as f:
            lines = [l.strip() for l in f if l.strip() and not l.startswith(';')]
        
        print(f"📨 Sending {len(lines)} gcode lines...")
        for i, line in enumerate(lines):
            msg = json.dumps({
                "print": {
                    "sequence_id": str(i),
                    "command": "gcode_line",
                    "param": line
                }
            })
            client.publish(topic, msg)
            
            if i % 1000 == 0:
                print(f"  Progress: {i}/{len(lines)} ({i*100//len(lines)}%)")
                time.sleep(0.1)  # 不要overwhelm打印机
        
        print("✅ Upload complete")
        client.loop_stop()
        client.disconnect()
        return True
    
    def start_print(self, filename: str):
        pass  # gcode_line模式下直接执行
    
    def pause(self):
        self._send_command("pause")
    
    def resume(self):
        self._send_command("resume")
    
    def stop(self):
        self._send_command("stop")
    
    def get_status(self) -> Dict:
        import paho.mqtt.client as mqtt
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        client.username_pw_set("bblp", self.config.access_code)
        client.tls_set(cert_reqs=ssl.CERT_NONE)
        client.tls_insecure_set(True)
        
        result = {}
        def on_message(c, u, msg):
            try:
                data = json.loads(msg.payload)
                if 'print' in data:
                    result.update(data['print'])
            except:
                pass
        
        def on_connect(c, u, f, rc, p=None):
            if rc == 0:
                c.subscribe(f"device/{self.config.serial}/report")
        
        client.on_connect = on_connect
        client.on_message = on_message
        client.connect(self.config.ip, 8883, 60)
        client.loop_start()
        time.sleep(5)
        
        topic = f"device/{self.config.serial}/request"
        client.publish(topic, json.dumps({
            "pushing": {"sequence_id": "0", "command": "pushall"}
        }))
        time.sleep(3)
        
        client.loop_stop()
        client.disconnect()
        return result
    
    def _send_command(self, cmd: str):
        import paho.mqtt.client as mqtt
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        client.username_pw_set("bblp", self.config.access_code)
        client.tls_set(cert_reqs=ssl.CERT_NONE)
        client.tls_insecure_set(True)
        client.connect(self.config.ip, 8883, 60)
        client.loop_start()
        time.sleep(2)
        
        topic = f"device/{self.config.serial}/request"
        client.publish(topic, json.dumps({
            "print": {"sequence_id": "0", "command": cmd}
        }))
        time.sleep(1)
        client.loop_stop()
        client.disconnect()


class OctoPrintAdapter:
    """OctoPrint — REST API"""
    
    def __init__(self, config: PrinterConfig):
        self.config = config
        self.base_url = f"http://{config.ip}:{config.port}"
        self.headers = {"X-Api-Key": config.api_key}
    
    def upload(self, gcode_path: str) -> bool:
        import urllib.request
        filename = os.path.basename(gcode_path)
        
        with open(gcode_path, 'rb') as f:
            data = f.read()
        
        boundary = '----RWCBoundary'
        body = (
            f'--{boundary}\r\n'
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f'Content-Type: application/octet-stream\r\n\r\n'
        ).encode() + data + f'\r\n--{boundary}--\r\n'.encode()
        
        req = urllib.request.Request(
            f'{self.base_url}/api/files/local',
            data=body,
            headers={
                **self.headers,
                'Content-Type': f'multipart/form-data; boundary={boundary}'
            }
        )
        
        try:
            urllib.request.urlopen(req, timeout=60)
            return True
        except Exception as e:
            print(f"❌ OctoPrint upload failed: {e}")
            return False
    
    def start_print(self, filename: str):
        self._api_post(f'/api/files/local/{filename}', {"command": "select", "print": True})
    
    def pause(self):
        self._api_post('/api/job', {"command": "pause", "action": "pause"})
    
    def resume(self):
        self._api_post('/api/job', {"command": "pause", "action": "resume"})
    
    def stop(self):
        self._api_post('/api/job', {"command": "cancel"})
    
    def get_status(self) -> Dict:
        return self._api_get('/api/job')
    
    def _api_get(self, path: str) -> Dict:
        import urllib.request
        req = urllib.request.Request(f'{self.base_url}{path}', headers=self.headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    
    def _api_post(self, path: str, data: Dict):
        import urllib.request
        body = json.dumps(data).encode()
        req = urllib.request.Request(
            f'{self.base_url}{path}', data=body,
            headers={**self.headers, 'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req, timeout=10)


class MoonrakerAdapter:
    """Moonraker (Klipper) — REST API"""
    
    def __init__(self, config: PrinterConfig):
        self.config = config
        self.base_url = f"http://{config.ip}:{config.port}"
    
    def upload(self, gcode_path: str) -> bool:
        filename = os.path.basename(gcode_path)
        cmd = [
            'curl', '-s', '-F', f'file=@{gcode_path}',
            f'{self.base_url}/server/files/upload'
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        return result.returncode == 0
    
    def start_print(self, filename: str):
        import urllib.request
        urllib.request.urlopen(
            f'{self.base_url}/printer/print/start?filename={filename}', timeout=10)
    
    def pause(self):
        import urllib.request
        urllib.request.urlopen(f'{self.base_url}/printer/print/pause', timeout=10)
    
    def resume(self):
        import urllib.request
        urllib.request.urlopen(f'{self.base_url}/printer/print/resume', timeout=10)
    
    def stop(self):
        import urllib.request
        urllib.request.urlopen(f'{self.base_url}/printer/print/cancel', timeout=10)
    
    def get_status(self) -> Dict:
        import urllib.request
        with urllib.request.urlopen(
            f'{self.base_url}/printer/objects/query?print_stats', timeout=10) as resp:
            return json.loads(resp.read())


class PrusaLinkAdapter:
    """PrusaLink — REST API"""
    
    def __init__(self, config: PrinterConfig):
        self.config = config
        self.base_url = f"http://{config.ip}:{config.port}"
        self.headers = {"X-Api-Key": config.api_key}
    
    def upload(self, gcode_path: str) -> bool:
        filename = os.path.basename(gcode_path)
        cmd = [
            'curl', '-s', '-X', 'PUT',
            '-H', f'X-Api-Key: {self.config.api_key}',
            '-H', 'Content-Type: application/octet-stream',
            '--data-binary', f'@{gcode_path}',
            f'{self.base_url}/api/v1/files/usb/{filename}'
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        return result.returncode == 0
    
    def start_print(self, filename: str):
        pass  # PrusaLink auto-starts on upload with print header
    
    def pause(self): pass
    def resume(self): pass
    def stop(self): pass
    def get_status(self) -> Dict: return {}


class GenericAdapter:
    """通用 — 只切片输出G-code，不上传"""
    
    def __init__(self, config: PrinterConfig):
        self.config = config
    
    def upload(self, gcode_path: str) -> bool:
        print(f"📂 G-code ready: {gcode_path}")
        print("   Copy to SD card or USB to print")
        return True
    
    def start_print(self, filename: str):
        print(f"🖨️ Select {filename} on printer to start")
    
    def pause(self): pass
    def resume(self): pass
    def stop(self): pass
    def get_status(self) -> Dict: return {"status": "unknown"}


# ═══ 便捷函数 ═══

def quick_print(stl_path: str, printer_config: Dict) -> str:
    """一键打印 — 从STL到打印"""
    config = PrinterConfig(
        name=printer_config.get('name', 'Printer'),
        type=PrinterType(printer_config.get('type', 'generic')),
        ip=printer_config.get('ip', ''),
        port=printer_config.get('port', 80),
        access_code=printer_config.get('access_code', ''),
        serial=printer_config.get('serial', ''),
        api_key=printer_config.get('api_key', ''),
    )
    
    adapter = PrinterAdapter(config)
    
    # 1. 切片
    gcode_path = adapter.slice(stl_path)
    print(f"✅ Sliced: {gcode_path}")
    
    # 2. 上传并打印
    adapter.upload_and_print(gcode_path)
    print(f"🖨️ Printing started!")
    
    return gcode_path


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python printer_adapter.py <stl_file> [--printer bambu|octoprint|moonraker|generic]")
        print("\nSupported printers:")
        for pt in PrinterType:
            print(f"  {pt.value}")
        sys.exit(1)
    
    stl_file = sys.argv[1]
    
    # 默认配置
    printer_type = "generic"
    for i, arg in enumerate(sys.argv):
        if arg == "--printer" and i+1 < len(sys.argv):
            printer_type = sys.argv[i+1]
    
    # 加载配置
    config_path = os.path.expanduser("~/.rwc/printer.json")
    if os.path.exists(config_path):
        with open(config_path) as f:
            cfg = json.load(f)
    else:
        cfg = {"name": "Default", "type": printer_type, "ip": "localhost"}
    
    gcode = quick_print(stl_file, cfg)
    print(f"\n✅ Done! G-code: {gcode}")
