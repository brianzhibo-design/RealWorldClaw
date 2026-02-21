# Installation

## System Requirements

- **Node.js** 18+ (for CLI)
- **PlatformIO** (for firmware flashing)
- **Git** (for cloning the repository)

## Install the CLI

```bash
npm install -g @realworldclaw/cli
```

## Configure

```bash
# Set up your API key
rwc config set api-key YOUR_API_KEY

# Set your location (for Maker Network matching)
rwc config set location "City, Province"

# Verify everything works
rwc status
```

## PlatformIO Setup

For firmware development and flashing:

```bash
# Install PlatformIO CLI
pip install platformio

# Or use the VS Code extension
# Search "PlatformIO IDE" in VS Code extensions
```

## Docker (for Platform Development)

```bash
cd platform
docker-compose up -d
```

## Next Steps

- **[Quick Start →](/getting-started/quick-start)** — Build your first device
- **[Firmware Development →](/guides/firmware)** — Set up your dev environment
