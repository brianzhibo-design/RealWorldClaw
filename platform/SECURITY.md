# Security Policy

## Supported Versions

RealWorldClaw currently provides security support for the latest `main` branch and the latest tagged release.

## Reporting a Vulnerability

Please report vulnerabilities privately and **do not** open public issues for undisclosed security findings.

- Preferred channel: email security contact / private maintainer channel
- Include:
  - Affected component and version/commit
  - Reproduction steps / PoC
  - Impact assessment (confidentiality, integrity, availability)
  - Suggested remediation (if known)

## Response Time Commitment

- Initial acknowledgement: **within 24 hours**
- Triage and severity classification: **within 3 business days**
- Mitigation plan for confirmed High/Critical issues: **within 5 business days**
- Target patch release for High/Critical issues: **within 14 days** (or earlier if exploitable in production)

## Security Practices Baseline

- Automated dependency and static security scans are run in CI (`.github/workflows/security.yml`)
- Weekly scheduled scans run every Monday
- Pull requests run security scans in reporting mode (non-blocking)
- Security tooling baseline:
  - `bandit` for Python SAST
  - `safety` for requirements vulnerability checks
  - `pip-audit` for installed dependency CVE audit
- Scan report artifacts are generated via `scripts/security-scan.sh` and written to `reports/`
- Secrets must not be committed; use environment variables and deployment secret managers
- Input validation and parameterized SQL are required for new DB-facing code

## Disclosure Policy

We follow coordinated disclosure. Reporters are asked to allow reasonable remediation time before public disclosure.
