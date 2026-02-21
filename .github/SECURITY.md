# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| latest  | ✅ Yes             |
| < latest | ❌ No (upgrade)   |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report vulnerabilities via one of the following:

1. **GitHub Security Advisories:** Use the "Report a vulnerability" button on the [Security tab](https://github.com/brianzhibo-design/RealWorldClaw/security/advisories/new)
2. **Email:** Send details to **security@realworldclaw.com**

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected versions / components
- Potential impact assessment
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix / disclosure:** Coordinated with reporter, typically within 30 days

### Scope

The following are in scope:

- Platform API (authentication, authorization, injection)
- WebSocket event leakage
- CLI command injection
- Printer adapter security (unauthorized print jobs)
- Dependency vulnerabilities (critical/high severity)

### Out of Scope

- Hardware physical-access attacks
- Social engineering
- Denial of service on development/staging environments

## Security Best Practices for Contributors

- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Validate and sanitize all user inputs
- Keep dependencies up to date
- Follow the principle of least privilege in API design

Thank you for helping keep RealWorldClaw and its users safe.
