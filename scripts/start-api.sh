#!/bin/bash
cd "/Volumes/T7 Shield/realworldclaw/platform"
source venv/bin/activate 2>/dev/null || true
exec python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000
