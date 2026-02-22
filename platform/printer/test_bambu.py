#!/usr/bin/env python3
"""
拓竹 Bambu Lab 打印机连接测试脚本

沸羊羊💪 基建出品

使用方法:
    python test_bambu.py --ip 192.168.1.100 --code 12345678
    python test_bambu.py --ip 192.168.1.100 --code 12345678 --serial 01P00A000000000
    python test_bambu.py --discover  # 局域网发现

需要安装:
    pip install paho-mqtt
"""

import argparse
import asyncio
import json
import logging
import sys
import os

# 让 import 能找到上级模块
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from yangcun.realworldclaw.platform.printer.bambu import BambuLabAdapter


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def pretty(obj) -> str:
    if hasattr(obj, "__dict__"):
        return json.dumps(obj.__dict__, indent=2, default=str, ensure_ascii=False)
    return json.dumps(obj, indent=2, default=str, ensure_ascii=False)


async def test_discover():
    """测试局域网发现"""
    print("\n🔍 正在搜索局域网内的拓竹打印机...")
    devices = await BambuLabAdapter.discover(timeout=5)
    if devices:
        print(f"\n✅ 发现 {len(devices)} 台打印机:")
        for d in devices:
            print(f"  📦 {d}")
    else:
        print("\n⚠️ 未发现打印机 (确保打印机已开机且在同一局域网, 并开启了局域网模式)")


async def test_connection(ip: str, code: str, serial: str = ""):
    """测试连接和状态获取"""
    adapter = BambuLabAdapter(host=ip, access_code=code, serial=serial)

    # 1. 连接测试
    print(f"\n{'='*60}")
    print(f"🔌 连接测试: {ip}")
    print(f"{'='*60}")

    ok = await adapter.connect()
    if not ok:
        print("❌ 连接失败! 请检查:")
        print("   - 打印机IP是否正确")
        print("   - Access Code是否正确 (Bambu Studio → 设备 → 局域网模式)")
        print("   - 打印机是否在同一局域网")
        print("   - 打印机是否开启了局域网模式")
        return

    print("✅ MQTT 连接成功!")
    if adapter.serial and adapter.serial != "0":
        print(f"   序列号: {adapter.serial}")

    # 2. 获取版本
    print(f"\n{'='*60}")
    print("📋 固件版本")
    print(f"{'='*60}")
    version = await adapter.get_version()
    if version:
        print(pretty(version))
    else:
        print("⚠️ 未获取到版本信息 (可能需要稍等)")

    # 3. 获取状态
    print(f"\n{'='*60}")
    print("📊 打印机状态")
    print(f"{'='*60}")
    status = await adapter.monitor()
    print(f"  状态:       {status.state.value}")
    print(f"  喷嘴温度:   {status.nozzle_temp}°C → {status.nozzle_target}°C")
    print(f"  热床温度:   {status.bed_temp}°C → {status.bed_target}°C")
    print(f"  打印进度:   {status.progress_pct}%")
    if status.filename:
        print(f"  当前文件:   {status.filename}")
    if status.remaining_seconds > 0:
        mins = int(status.remaining_seconds / 60)
        print(f"  剩余时间:   {mins} 分钟")

    extra = status.extra
    if extra.get("layer_num") or extra.get("total_layer_num"):
        print(f"  当前层:     {extra['layer_num']} / {extra['total_layer_num']}")
    if extra.get("chamber_temp"):
        print(f"  仓温:       {extra['chamber_temp']}°C")
    if extra.get("wifi_signal"):
        print(f"  WiFi信号:   {extra['wifi_signal']}")
    speed_names = {1: "静音", 2: "标准", 3: "运动", 4: "狂暴"}
    if extra.get("speed_level"):
        print(f"  速度模式:   {speed_names.get(extra['speed_level'], extra['speed_level'])}")

    # AMS信息
    ams_data = extra.get("ams", {})
    if isinstance(ams_data, dict) and ams_data.get("ams"):
        print(f"\n{'='*60}")
        print("🎨 AMS 耗材信息")
        print(f"{'='*60}")
        for unit in ams_data["ams"]:
            print(f"  AMS #{unit.get('id', '?')} (温度: {unit.get('temp', '?')}°C, 湿度: {unit.get('humidity', '?')})")
            for tray in unit.get("tray", []):
                ttype = tray.get("tray_type")
                if ttype:
                    color = tray.get("tray_color", "?")
                    print(f"    槽{tray['id']}: {ttype} (颜色: #{color[:6]})")
                else:
                    print(f"    槽{tray.get('id', '?')}: 空")

    # 4. 实时监控 (5秒)
    print(f"\n{'='*60}")
    print("📡 实时监控 (5秒)...")
    print(f"{'='*60}")

    update_count = 0
    def on_update(data):
        nonlocal update_count
        update_count += 1

    adapter.on_status(on_update)
    await asyncio.sleep(5)
    print(f"  收到 {update_count} 条状态更新")

    # 断开
    await adapter.disconnect()
    print("\n✅ 测试完成! 打印机连接正常 🎉")
    print(f"\n💡 提示: 明天打印测试时, 可以用以下代码:")
    print(f"   adapter = BambuLabAdapter(host='{ip}', access_code='****')")
    print(f"   await adapter.connect()")
    print(f"   await adapter.upload(Path('model.3mf'))")
    print(f"   await adapter.start('model.3mf')")


async def main():
    parser = argparse.ArgumentParser(description="拓竹打印机连接测试 🔧")
    parser.add_argument("--ip", help="打印机IP地址")
    parser.add_argument("--code", help="LAN Access Code")
    parser.add_argument("--serial", default="", help="打印机序列号 (可选)")
    parser.add_argument("--discover", action="store_true", help="搜索局域网打印机")
    args = parser.parse_args()

    if args.discover:
        await test_discover()
    elif args.ip and args.code:
        await test_connection(args.ip, args.code, args.serial)
    else:
        # 交互模式
        print("🔧 拓竹 Bambu Lab 打印机连接测试")
        print("="*40)
        print("\n1. 搜索局域网打印机")
        print("2. 输入IP和Access Code测试连接")
        choice = input("\n请选择 (1/2): ").strip()

        if choice == "1":
            await test_discover()
        else:
            ip = input("打印机IP: ").strip()
            code = input("Access Code: ").strip()
            serial = input("序列号 (回车跳过): ").strip()
            if ip and code:
                await test_connection(ip, code, serial)
            else:
                print("❌ 请输入IP和Access Code")


if __name__ == "__main__":
    asyncio.run(main())
