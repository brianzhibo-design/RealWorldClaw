# Try it in 2 minutes (no hardware needed)

Terminal 1:

```bash
python3 simulator/virtual_device.py
```

Terminal 2:

```bash
python3 simulator/agent_demo.py
```

Watch the AI agent read sensor data and control the relay automatically.

## Switch to real hardware

`agent_demo.py` supports environment variables, so user code can stay unchanged:

```bash
RWC_DEVICE_URL=http://<your-device-host>:<port> \
RWC_DEVICE_ID=<your-device-id> \
python3 simulator/agent_demo.py
```

Expected device API contract:

- `GET /api/v1/devices/{device_id}/status`
- `POST /api/v1/devices/{device_id}/command` with `{ "command": "relay_on" | "relay_off" }`
