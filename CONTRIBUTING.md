# Contributing to RealWorldClaw

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Code Standards](#code-standards)
- [Ways to Contribute](#ways-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Commit Convention](#commit-convention)

## Development Environment Setup

### Prerequisites

- Python 3.11+
- Node.js 18+ (for frontend tooling)
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/brianzhibo-design/RealWorldClaw.git
cd realworldclaw

# Install Python dependencies
cd platform
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Run the dev server
python -m api.main
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
# Lint
ruff check .

# Format
ruff format .
```

Key rules:
- Line length: 100 characters
- Target: Python 3.11+
- Style: PEP 8 with ruff defaults

### JavaScript/TypeScript (ESLint)

For any frontend or tooling JS/TS code, we use [ESLint](https://eslint.org/).

```bash
npx eslint .
```

## Ways to Contribute

### 1. Components

Create new hardware components with proper manifests.

- Add your component under `components/<component-name>/`
- Include a valid `manifest.yaml` with metadata, parameters, and print settings
- Provide STL/3MF files and a README
- Validate with `make validate`

### 2. Adapters

Build adapters that connect components or interface with external systems.

- Place adapters under `adapters/<adapter-name>/`
- Document compatibility and interface specifications
- Include integration tests

### 3. Standards

Propose or improve standards for the ecosystem.

- Standards live under `standards/`
- Follow the RFC-style process: draft → review → accepted
- Include rationale, specification, and examples

### 4. Print Reports

Share real-world printing results and feedback.

- Submit print reports under `reports/`
- Include printer model, filament, settings, and photos
- Use the provided report template

## Pull Request Process

1. **Fork** the repository and create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes** following the code standards above.

3. **Test** your changes:
   ```bash
   make lint
   make test
   ```

4. **Push** your branch and open a Pull Request against `main`.

5. **Fill out** the PR template completely.

6. **Wait for review** — maintainers will review within a few business days.

7. **Address feedback** by pushing additional commits to your branch.

8. Once approved, a maintainer will **merge** your PR.

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

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

### Examples

```
feat(components): add clawbie-v5 gripper component
fix(platform): correct manifest validation for nested params
docs: update CONTRIBUTING with adapter guidelines
chore(ci): upgrade ruff to 0.5.0
```

### Breaking Changes

Append `!` after the type/scope, or add `BREAKING CHANGE:` in the footer:

```
feat(standards)!: redesign manifest schema v2

BREAKING CHANGE: manifest.yaml now requires `version: 2` field.
```

---

Questions? Open a [Discussion](https://github.com/anthropics/realworldclaw/discussions) or reach out to the maintainers. We're happy to help! 🐾
