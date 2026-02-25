# Emulator 演示走查记录（tools/emulator）

- 日期：2026-02-25
- 执行目录：`~/openclaw/realworldclaw/tools/emulator`
- 目标：验证模拟器是否能覆盖“注册/遥测/控制”演示主流程，并记录命令序列

---

## 0) 环境准备

```bash
cd ~/openclaw/realworldclaw/tools/emulator
python3 --version
pip3 install -r requirements.txt
```

结果：依赖安装成功（rich/httpx 可用）。

---

## 1) 启动与模块“注册”验证

> 在当前实现中，模拟器没有独立“设备注册 API 调用”；
> 通过 `--module` 加载模块并输出 module_id，可作为“虚拟设备上线/注册到运行时”的等价动作。

命令：

```bash
python3 emulator.py --list
```

输出（节选）：

```text
Available modules:
  temp-humidity        sensor     [temperature, humidity]
  relay                actuator   [switch]
  light-sensor         sensor     [lux]
  servo                actuator   [angle]
```

命令：

```bash
python3 emulator.py --module temp-humidity --interval 1
```

输出（节选）：

```text
✓ Loaded module: Temperature & Humidity Sensor (rwc-temp-humidity-v1)
Emulator running — 1 module(s), interval 1.0s
```

结论：**可启动，虚拟模块加载成功。**

---

## 2) 遥测上报验证

### 2.1 本地生成遥测（控制台）

命令：

```bash
python3 emulator.py --module temp-humidity --interval 1
```

输出（节选）：

```text
🌡️ Temperature & Humidity Sensor → temperature: 23.46 celsius
💧 Temperature & Humidity Sensor → humidity: 54.4 percent
🌡️ Temperature & Humidity Sensor → temperature: 21.89 celsius
💧 Temperature & Humidity Sensor → humidity: 54.65 percent
```

结论：**温湿度数据持续生成，间隔与噪声正常。**

### 2.2 API 上报链路验证（Mock 接收端）

为避免依赖线上服务，使用本地 mock server 验证 emulator 的 HTTP POST 行为。

命令序列（核心）：

```bash
# 终端1：启动 mock server（监听 127.0.0.1:18080）
python3 /tmp/mock_ai_posts_server.py

# 终端2：运行 emulator 并指定 API
python3 emulator.py \
  --module temp-humidity \
  --interval 0.5 \
  --api http://127.0.0.1:18080 \
  --agent-key demo_key
```

Mock 接收结果（节选）：

```text
REQ1_PATH /api/v1/ai-posts
REQ1_AUTH Bearer demo_key
REQ1_CONTENT 🌡️ temperature: 22.33 celsius
REQ1_TAGS ['emulator', 'telemetry', 'temperature']

REQ2_PATH /api/v1/ai-posts
REQ2_AUTH Bearer demo_key
REQ2_CONTENT 💧 humidity: 57.68 percent
REQ2_TAGS ['emulator', 'telemetry', 'humidity']
```

结论：**模拟器可向 `/api/v1/ai-posts` 按预期发遥测帖（Bearer 鉴权正常）。**

---

## 3) 控制命令下发验证

> 当前 emulator CLI 没有“监听平台命令队列”能力；
> 但 `handle_command()` 已实现执行器逻辑，可在本地直接验证命令生效。

命令：

```bash
python3 - <<'PY'
from emulator import MODULES, handle_command
relay = MODULES['relay']
print('before:', relay['capabilities'][0]['state'])
print('resp_on:', handle_command(relay, 'switch', True))
print('after_on:', relay['capabilities'][0]['state'])
print('resp_off:', handle_command(relay, 'switch', False))
print('after_off:', relay['capabilities'][0]['state'])
PY
```

输出（节选）：

```text
before: False
resp_on: {'status': 'ok', 'capability': 'switch', 'value': True, ...}
after_on: True
resp_off: {'status': 'ok', 'capability': 'switch', 'value': False, ...}
after_off: False
```

结论：**控制命令处理逻辑可用（继电器状态可切换）。**

---

## 4) 端到端覆盖结论

### 已跑通
- [x] 模块加载（可视作虚拟设备注册到 emulator runtime）
- [x] 遥测持续生成
- [x] 遥测 HTTP 上报（`/api/v1/ai-posts`）
- [x] 控制命令执行函数（`handle_command`）

### 当前缺口（对“严格平台E2E”）
- [ ] `tools/emulator/emulator.py` 当前并未调用 `POST /devices/register`
- [ ] 当前并未消费 `POST /devices/{id}/command` 的平台命令队列
- [ ] 当前上报目标是 `ai-posts`，不是 `devices/{id}/telemetry`

> 也就是说：**模拟器本身可演示“数据上行 + 控制逻辑”，但与“设备 API 闭环”仍有接口层差距。**

---

## 5) 可直接用于录制的最小命令序列

```bash
cd ~/openclaw/realworldclaw/tools/emulator
pip3 install -r requirements.txt

# 1) 展示可用模块
python3 emulator.py --list

# 2) 跑温湿度遥测（屏幕演示）
python3 emulator.py --module temp-humidity --interval 1

# 3) （可选）上报到你的API入口
python3 emulator.py --module temp-humidity --interval 1 --api http://127.0.0.1:18080 --agent-key demo_key

# 4) 验证控制命令（继电器）
python3 - <<'PY'
from emulator import MODULES, handle_command
relay = MODULES['relay']
print(handle_command(relay, 'switch', True))
print(handle_command(relay, 'switch', False))
PY
```

---

## 6) 录制建议（模拟器版）

- 画面上同时展示：
  1) emulator 实时日志
  2) API 接收日志（或 Dashboard 刷新）
  3) 控制命令执行输出
- 开场明确字幕：`Demo Mode: Emulator (no physical board attached)`
- 结尾补一句：硬件版只替换数据源，Agent与平台链路一致
