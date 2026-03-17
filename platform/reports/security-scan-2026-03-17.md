# Security Scan Report (2026-03-17)

## Run Summary

- Bandit exit code: `1`
- Safety exit code: `0`
- pip-audit exit code: `1`

## Bandit (Static Analysis)

- Total findings: **94**
- HIGH: **0**
- MEDIUM: **39**
- LOW: **55**

- ✅ No HIGH severity findings.

### MEDIUM/LOW Findings

- Count: **94** (see `bandit-2026-03-17.json` for details)

## Safety (Dependency DB Check)

- Reported vulnerabilities: **0**

## pip-audit (Installed Dependency Audit)

- Vulnerable dependencies found: **1**

### Vulnerability Details

- `ecdsa==0.19.1` — `CVE-2024-23342` (GHSA-wj6h-64fc-37mp)
  - Fix versions: N/A
  - python-ecdsa has been found to be subject to a Minerva timing attack on the P-256 curve. Using the `ecdsa.SigningKey.sign_digest()` API function and timing signatures an attacker can leak the internal nonce which may allow for private key discovery. Both ECDSA signatures, key generation, and ECDH operations are affected. ECDSA signature verification is unaffected. The python-ecdsa project considers side channel attacks out of scope for the project and there is no planned fix.

## Artifacts

- `bandit-2026-03-17.json`
- `safety-2026-03-17.json`
- `pip-audit-2026-03-17.json`
