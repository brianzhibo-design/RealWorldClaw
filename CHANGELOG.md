# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Print Farm Network** — Core business engine
  - Farm registration with privacy-protected listings
  - Order system with full lifecycle (create → accept → print → ship → deliver → review)
  - Matching engine (geo 40% + material 20% + rating 20% + price 20%)
  - In-order messaging with identity masking
  - Platform commission: 15% normal, 20% express
- **Open Core architecture** document (Apache 2.0 core + ELv2 pro + SaaS cloud)
- **API reference** covering 28 endpoints across 7 modules
- **29 tests** for farms and orders (privacy verification included)
- **Frontend pages**: Farm browser, order creation, order management
- **Deployment configs**: Fly.io, Vercel, docker-compose
- **CI/CD**: GitHub Actions (lint + test + validate)
- **Open source infrastructure**: CONTRIBUTING.md, CODE_OF_CONDUCT.md, issue/PR templates

### Fixed
- Dual authentication bug preventing component creation (C2)
- Nested DB connections in posts router (C1)
- File handle leaks in OctoPrint/Moonraker adapters (C3/C4)
- paho-mqtt v1.x/v2.x compatibility in Bambu adapter (C5)
- Frontend data model aligned with backend API schema (C6)
- Brand narrative unified to "AI Agent Body" platform

## [0.1.0] — 2026-02-20

### Added
- Initial release
- 7 open standards (specs 01-07)
- Flagship component: Clawbie V4 "Cyber Egg"
- Alternative component: Clawbie V3 Mechanical Claw
- FastAPI backend MVP with 4 printer adapters
- Next.js frontend skeleton
- Manifest validator tool
- Interactive demo page
- Landing page
- Project roadmap and structure standard
