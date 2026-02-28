# Contributing to RealWorldClaw

Thank you for your interest in contributing! Whether you're fixing a typo, adding a sensor module, or translating docs — every contribution matters. This guide will help you get started.

## Table of Contents

- [Quick Start: Fork → PR](#quick-start-fork--pr)
- [Development Environment Setup](#development-environment-setup)
- [Code Standards](#code-standards)
- [Good First Issues](#good-first-issues)
- [Ways to Contribute](#ways-to-contribute)
- [Pull Request Process](#pull-request-process)
- [PR Template](#pr-template)
- [Commit Convention](#commit-convention)
- [Code of Conduct](#code-of-conduct)

## Quick Start: Fork → PR

```bash
# 1. Fork the repo on GitHub (click "Fork" button)

# 2. Clone your fork
git clone https://github.com/<your-username>/RealWorldClaw.git
cd RealWorldClaw

# 3. Add upstream remote
git remote add upstream https://github.com/brianzhibo-design/RealWorldClaw.git

# 4. Create a feature branch
git checkout -b feat/my-feature

# 5. Make changes, then lint & test
make lint
make test

# 6. Commit using conventional commits
git commit -m "feat(components): add temperature sensor module"

# 7. Push to your fork
git push origin feat/my-feature

# 8. Open a Pull Request against main on GitHub
```

## Development Environment Setup

### Prerequisites

- Python 3.11+
- Node.js 18+ (for frontend/CLI tooling)
- Git

### Backend (Platform)

```bash
cd platform
pip install -r requirements.txt
pip install -r requirements-dev.txt
python -m api.main
```

### CLI

```bash
cd cli
npm install
npm link  # makes `rwc` available globally
```

### Using the Makefile

```bash
make dev        # Start development server
make test       # Run tests
make lint       # Run linter
make validate   # Validate component manifests
```

## Code Standards

### Python (ruff)

We use [ruff](https://github.com/astral-sh/ruff) for Python linting and formatting.

```bash
ruff check .     # Lint
ruff format .    # Format
```

Key rules:
- Line length: 100 characters
- Target: Python 3.11+
- Style: PEP 8 with ruff defaults

### JavaScript/TypeScript

For frontend and CLI code:

```bash
npx eslint .
npx tsc --noEmit   # Type checking
```

### Tests

- **Python tests**: `pytest` in the `tests/` directory
- **E2E tests**: `tests/e2e/`
- All PRs that change behavior should include or update tests
- Run `make test` before submitting

## Good First Issues

**New to the project?** Look for issues labeled [`good first issue`](https://github.com/brianzhibo-design/RealWorldClaw/labels/good%20first%20issue).

These issues are:
- 🟢 **Scoped** — clear boundaries, won't require understanding the entire codebase
- 📝 **Documented** — include context, acceptance criteria, and estimated effort
- 🤝 **Supported** — maintainers will help if you get stuck

Also check [`help wanted`](https://github.com/brianzhibo-design/RealWorldClaw/labels/help%20wanted) for slightly larger tasks that still welcome community contributions.

**How to claim an issue:**
1. Comment on the issue saying you'd like to work on it
2. A maintainer will assign it to you
3. If you can't finish within 2 weeks, let us know so others can pick it up

## Ways to Contribute

### 🌍 Translation & i18n
Help translate docs and UI to your language. See `docs-site/zh/` for the Chinese example.

### 🔧 Components
Create hardware components under `seed-components/` with proper manifests and STL files.

### 📦 Firmware Modules
Add sensor/actuator modules under `firmware/modules/` — see existing files for the pattern.

### 📖 Documentation
Improve guides, fix typos, add examples. Docs live in `docs/` and `docs-site/`.

### 🧪 Tests
Increase test coverage for `platform/`, `cli/`, or add new e2e scenarios.

### 🐛 Bug Fixes
Check open issues for bugs and submit fixes with regression tests.

## Pull Request Process

1. **Fork** the repository and create a feature branch from `main`
2. **Make your changes** following the code standards above
3. **Test** your changes: `make lint && make test`
4. **Push** your branch and open a Pull Request against `main`
5. **Fill out the PR template** completely (see below)
6. **Wait for review** — maintainers will review within a few business days
7. **Address feedback** by pushing additional commits to your branch
8. Once approved, a maintainer will **merge** your PR

## PR Template

When you open a PR, you'll see our template automatically. Please fill out:

- **What**: Brief description of changes
- **Why**: Business context or issue link (e.g., `Fixes #42`)
- **Type**: Feature / Bug fix / Refactor / Docs / CI
- **Checklist**: Tests pass, no mock data, no console.log, build passes, self-reviewed

> 💡 **Tip**: Link your PR to an issue by writing `Closes #<issue-number>` in the description. GitHub will auto-close the issue when the PR merges.

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

```
<type>(<scope>): <description>
```

| Type       | Description                          |
|------------|--------------------------------------|
| `feat`     | A new feature                        |
| `fix`      | A bug fix                            |
| `docs`     | Documentation only changes           |
| `style`    | Formatting, no code change           |
| `refactor` | Code change that neither fixes nor adds |
| `test`     | Adding or correcting tests           |
| `chore`    | Maintenance tasks                    |
| `ci`       | CI/CD changes                        |

Examples:
```
feat(components): add clawbie-v5 gripper component
fix(platform): correct manifest validation for nested params
docs: update CONTRIBUTING with adapter guidelines
```

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold a welcoming, inclusive, and respectful community.

**TL;DR**: Be kind. Be constructive. Assume good intent.

---

Questions? Open a [Discussion](https://github.com/brianzhibo-design/RealWorldClaw/discussions) or reach out to the maintainers. We're happy to help! 🐾
