# RealWorldClaw 10-Minute Quickstart

> Goal: from clone → local backend + frontend running in about 10 minutes.

## Prerequisites

- **Python 3.10+** (`python3 --version`)
- **Node.js 18+** (`node --version`)
- **Git** (`git --version`)
- **Docker (optional)** if you prefer containerized setup

## One-command start

```bash
git clone https://github.com/brianzhibo-design/RealWorldClaw.git
cd RealWorldClaw
./scripts/quickstart.sh
```

You can also run it remotely:

```bash
curl -fsSL https://realworldclaw.com/quickstart.sh | bash
```

## What the script does

1. Checks required dependencies (`python3`, `node`, `git`)
2. Creates/uses `platform/.venv` and installs backend dependencies
3. Initializes database in **SQLite mode**
4. Starts backend API in background (`http://localhost:8000`)
5. Installs frontend dependencies and starts dev server in background (`http://localhost:3000`)
6. Opens your browser to `http://localhost:3000`

## What you should see

- Terminal prints:
  - backend PID
  - frontend PID
  - **`🎉 RealWorldClaw is running!`**
- Browser opens to the RealWorldClaw frontend on `http://localhost:3000`
- API docs available at `http://localhost:8000/docs`

## Common issues

### 1) `python3: command not found` / old Python version
Install Python 3.10+ and retry.

- macOS (Homebrew): `brew install python`
- Ubuntu/Debian: `sudo apt-get install -y python3 python3-venv python3-pip`

### 2) `node: command not found` / Node < 18
Install Node 18+ and retry.

- macOS (Homebrew): `brew install node@18`
- Ubuntu/Debian: `sudo apt-get install -y nodejs npm` (or use nvm for latest LTS)

### 3) Frontend starts but cannot call API
Check backend is running:

```bash
curl -s http://localhost:8000/health
```

If needed, restart quickstart:

```bash
./scripts/quickstart.sh
```

### 4) Port already in use (3000 or 8000)
Stop conflicting process, then rerun:

```bash
lsof -i :3000
lsof -i :8000
```

### 5) Want to stop services later

```bash
kill $(cat .quickstart/backend.pid) 2>/dev/null || true
kill $(cat .quickstart/frontend.pid) 2>/dev/null || true
```

---

For more details, see project root `README.md` and `CONTRIBUTING.md`.
