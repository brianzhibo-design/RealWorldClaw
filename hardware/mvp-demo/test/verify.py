#!/usr/bin/env python3
"""
RealWorldClaw P0.2 MVP — Hardware Verification Script
Tests MQTT communication with ESP32 device.

Usage:
    pip install paho-mqtt
    python verify.py [--broker realworldclaw-api.fly.dev] [--device esp32-mvp-001]
"""

import argparse
import json
import sys
import time
import paho.mqtt.client as mqtt

TIMEOUT = 10  # seconds


def test_device(broker: str, port: int, device_id: str):
    results = {"telemetry": False, "relay_on": False, "relay_off": False, "ping": False}
    received = []

    def on_message(client, userdata, msg):
        try:
            data = json.loads(msg.payload)
        except json.JSONDecodeError:
            return
        topic = msg.topic
        if topic.endswith("/telemetry"):
            if "temperature" in data and "humidity" in data:
                results["telemetry"] = True
                print(f"  ✅ Telemetry: T={data['temperature']}°C H={data['humidity']}% relay={data.get('relay')}")
                received.append("telemetry")
        elif topic.endswith("/status"):
            if data.get("status") == "pong":
                results["ping"] = True
                print("  ✅ Ping/Pong OK")
                received.append("ping")

    client = mqtt.Client(client_id=f"rwc-test-{int(time.time())}")
    client.on_message = on_message
    
    print(f"🔌 Connecting to {broker}:{port}...")
    try:
        client.connect(broker, port, 60)
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

    prefix = f"rwc/{device_id}"
    client.subscribe(f"{prefix}/telemetry")
    client.subscribe(f"{prefix}/status")
    client.loop_start()

    # Test 1: Wait for telemetry
    print("\n📊 Test 1: Waiting for telemetry data...")
    t0 = time.time()
    while not results["telemetry"] and time.time() - t0 < TIMEOUT:
        time.sleep(0.1)
    if not results["telemetry"]:
        print("  ❌ No telemetry received (is device powered on?)")

    # Test 2: Ping
    print("\n🏓 Test 2: Ping...")
    client.publish(f"{prefix}/command", json.dumps({"action": "ping"}))
    t0 = time.time()
    while not results["ping"] and time.time() - t0 < 5:
        time.sleep(0.1)
    if not results["ping"]:
        print("  ❌ No pong response")

    # Test 3: Relay ON
    print("\n💡 Test 3: Relay ON...")
    client.publish(f"{prefix}/command", json.dumps({"action": "relay_on"}))
    time.sleep(2)
    # Check next telemetry for relay=true
    print("  ℹ️  Listen for click sound from relay module")

    # Test 4: Relay OFF
    print("\n🔌 Test 4: Relay OFF...")
    client.publish(f"{prefix}/command", json.dumps({"action": "relay_off"}))
    time.sleep(2)

    client.loop_stop()
    client.disconnect()

    # Summary
    print("\n" + "=" * 40)
    print("📋 Results:")
    passed = sum(1 for v in results.values() if v)
    for test, ok in results.items():
        print(f"  {'✅' if ok else '❌'} {test}")
    print(f"\n  {passed}/{len(results)} passed")
    return passed == len(results)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RWC MVP Hardware Verification")
    parser.add_argument("--broker", default="realworldclaw-api.fly.dev")
    parser.add_argument("--port", type=int, default=1883)
    parser.add_argument("--device", default="esp32-mvp-001")
    args = parser.parse_args()

    ok = test_device(args.broker, args.port, args.device)
    sys.exit(0 if ok else 1)
