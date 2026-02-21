# Project Structure

```
RealWorldClaw/
├── .github/                    # GitHub configuration
│   ├── ISSUE_TEMPLATE/         # Issue templates (YAML)
│   │   ├── bug_report.yml
│   │   ├── feature_request.yml
│   │   ├── module_request.yml
│   │   └── config.yml
│   ├── workflows/              # CI/CD pipelines
│   │   ├── ci.yml              # Matrix tests (Python + Node)
│   │   ├── release.yml         # Auto-release on tag
│   │   ├── docs.yml            # Docs site deployment
│   │   └── codeql.yml          # Security scanning
│   ├── CODEOWNERS
│   ├── FUNDING.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── SECURITY.md
│
├── platform/                   # Backend (Python/FastAPI)
│   ├── api/                    # REST API & WebSocket server
│   │   ├── routers/            # Route handlers
│   │   │   ├── agents.py       # Agent protocol endpoints
│   │   │   ├── auth.py         # Authentication
│   │   │   ├── components.py   # Component registry CRUD
│   │   │   ├── health.py       # Health check
│   │   │   ├── makers.py       # Maker network
│   │   │   ├── match.py        # Order-maker matching
│   │   │   ├── orders.py       # Print order management
│   │   │   ├── posts.py        # Community posts
│   │   │   ├── ws.py           # WebSocket events
│   │   │   └── admin.py        # Admin endpoints
│   │   ├── models/             # SQLAlchemy / Pydantic models
│   │   ├── services/           # Business logic
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── database.py         # DB connection
│   │   ├── security.py         # Auth & permissions
│   │   ├── ws_manager.py       # WebSocket connection manager
│   │   ├── events.py           # Event system
│   │   ├── middleware.py        # CORS, logging, rate limit
│   │   └── audit.py            # Audit logging
│   ├── cli/                    # Python CLI (rwc command)
│   │   └── rwc.py
│   ├── printer/                # 3D printer adapters
│   │   ├── base.py             # Abstract printer interface
│   │   ├── bambu.py            # Bambu Lab adapter
│   │   ├── octoprint.py        # OctoPrint adapter
│   │   ├── moonraker.py        # Moonraker/Klipper adapter
│   │   ├── generic.py          # Generic G-code adapter
│   │   └── discovery.py        # Network printer discovery
│   ├── tests/                  # Test suite
│   ├── skills/                 # Automation skills
│   ├── pyproject.toml          # Python package config
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── frontend/                   # Web dashboard (Next.js)
│   ├── app/                    # App router pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities & API client
│   └── package.json
│
├── cli/                        # Node.js CLI (rwc)
│   ├── src/
│   │   ├── commands/           # CLI commands
│   │   ├── lib/                # Shared utilities
│   │   └── index.js            # Entry point
│   ├── bin/rwc.js              # CLI binary
│   └── package.json
│
├── firmware/                   # ESP32 firmware (PlatformIO)
│
├── hardware/                   # Hardware design files
│
├── components/                 # Component package registry
│
├── designs/                    # Reference device designs
│   ├── desktop-assistant/      # AI desktop companion
│   ├── environment-sentinel/   # Environment monitor
│   └── hexapod-walker/         # Walking robot
│
├── docs/                       # Documentation source
│   ├── specs/                  # RWC Module Standard & specs
│   ├── architecture/           # System architecture docs
│   ├── design/                 # Design research & proposals
│   ├── marketing/              # Marketing materials
│   └── learning/               # Learning resources
│
├── docs-site/                  # Documentation website (VitePress)
│   ├── .vitepress/config.mts
│   └── api/                    # API reference pages
│
├── landing/                    # Landing page / marketing site
├── website/                    # Main website
├── brand/                      # Brand assets (logos, colors)
├── tools/                      # Developer tools
│   └── manifest-validator/     # Component manifest validator
├── specs/                      # JSON schemas
├── demo/                       # Demo files
├── archive/                    # Archived iterations
│
├── .editorconfig               # Editor configuration
├── .gitattributes              # Git file handling
├── .gitignore                  # Git ignore rules
├── CHANGELOG.md                # Version changelog
├── CODE_OF_CONDUCT.md          # Community code of conduct
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # MIT License
├── Makefile                    # Build shortcuts
├── README.md                   # Project README (English)
├── README_CN.md                # Project README (中文)
├── ROADMAP.md                  # Project roadmap
├── STRUCTURE.md                # This file
└── docker-compose.yml          # Root Docker Compose
```
