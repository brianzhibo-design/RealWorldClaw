#!/bin/bash
set -e

echo "🚀 Starting RealWorldClaw Hardware Demo..."
echo "📡 Starting virtual device..."
python3 platform/simulator/virtual_device.py &
SIM_PID=$!

cleanup() {
  echo ""
  echo "🧹 Stopping virtual device (PID: $SIM_PID)..."
  kill "$SIM_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

sleep 2
echo "🤖 Starting AI agent..."
python3 platform/simulator/agent_demo.py
