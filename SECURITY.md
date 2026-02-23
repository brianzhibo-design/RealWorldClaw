# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | ✅ (current)       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Email **security@realworldclaw.com** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Security Measures

- JWT authentication with bcrypt password hashing
- Rate limiting on registration (5/hour) and login (20/5min)
- Input sanitization (XSS protection on all user content)
- Username pattern validation (`^[a-zA-Z0-9_-]+$`)
- SQLite WAL mode with IMMEDIATE transactions for critical operations
- CORS restricted to production domains
- File upload size limit (50MB) with extension validation

## Scope

The following are in scope for security reports:

- Authentication/authorization bypass
- SQL injection
- XSS (stored or reflected)
- IDOR (accessing other users' data)
- File upload vulnerabilities
- Rate limiting bypass

## Known Limitations

- SQLite (single-node, no row-level locking beyond IMMEDIATE)
- No email verification on registration (planned)
- No CAPTCHA (planned)
- File content-type not validated (only extension checked)
