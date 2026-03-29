# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

We release security patches for the latest minor version only.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

### Option 1 — GitHub Private Security Advisory (preferred)

1. Go to the repository → **Security** tab → **Advisories** → **New draft security advisory**.
2. Fill in the details (description, affected version, reproduction steps, suggested fix).
3. Submit. The maintainers will respond within **72 hours**.

### Option 2 — Email

Send a report to **security@killertcell428.dev** with:

- A description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Any known mitigations
- Your contact information (optional, for acknowledgement)

PGP key: available on request.

## Response Process

1. **Acknowledgement** — we confirm receipt within 72 hours.
2. **Assessment** — we evaluate impact and severity within 7 days.
3. **Fix** — we develop and test a patch.
4. **Disclosure** — we coordinate a release date with you and publish a GitHub Security Advisory.
5. **Credit** — with your permission, we list you in the advisory and CHANGELOG.

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure): please give us a reasonable window (typically 90 days) before public disclosure.

## Scope

The following are **in scope**:

- Bypasses of the `Guard` class detection logic (false-negative exploits)
- Information leakage from the library itself
- Remote code execution via crafted input
- Dependency vulnerabilities in the published packages
- Security issues in the self-hosted backend (`backend/`)

The following are **out of scope**:

- Attacks that require physical access to the host machine
- Social engineering of maintainers
- Issues in third-party dependencies that have no direct impact on ai-guardian

## Security Design Notes

ai-guardian is a **defence-in-depth layer**, not a complete security solution. It works by
pattern-matching known attack signatures and should be combined with:

- Input validation at the API boundary
- Output sanitisation before rendering to users
- Principle of least privilege for LLM system prompts
- Rate limiting and audit logging

A sophisticated attacker may craft inputs that evade the current pattern set. We actively
maintain and expand detection patterns — contributions are welcome via the standard PR process.
