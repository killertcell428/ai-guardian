# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Nothing yet

---

## [0.1.0] - 2026-03-29

### Added
- **Core `Guard` class** with `check_input()`, `check_messages()`, and `check_output()` methods
- **50+ detection patterns** covering OWASP LLM Top 10:
  - Prompt injection (ignore-previous-instructions, DAN personas, role switching)
  - System prompt extraction
  - PII detection (credit card, SSN, API keys, Japanese My Number, phone, bank accounts)
  - SQL injection (UNION SELECT, DROP TABLE, stacked queries)
  - Command injection and path traversal
  - Data exfiltration requests
  - Output scanning for leaked credentials and PII
  - Japanese language attack patterns
- **`RiskLevel` enum** — `LOW` / `MEDIUM` / `HIGH` / `CRITICAL`
- **`CheckResult` dataclass** — risk score, level, reasons, remediation hints, OWASP references
- **Diminishing-returns scorer** — per-category caps prevent runaway scores from noisy input
- **Policy system** — built-in `default`, `strict`, `permissive` policies; custom YAML support
- **FastAPI / Starlette middleware** (`AIGuardianMiddleware`) — automatic scan of POST request bodies
- **LangChain callback** (`AIGuardianCallback`) — input and output scanning with `GuardianBlockedError`
- **OpenAI proxy wrapper** (`SecureOpenAI`) — transparent drop-in replacement for `openai.OpenAI`
- **Zero required dependencies** for the core library; optional extras: `[fastapi]`, `[langchain]`, `[openai]`, `[yaml]`, `[all]`
- Self-hosted SaaS backend (`backend/`) with:
  - Multi-tenant architecture
  - Human-in-the-Loop review queue
  - Immutable audit log
  - OpenAI-compatible proxy endpoint
  - JWT + API key authentication
  - PostgreSQL + Redis + Alembic migrations
  - Next.js dashboard frontend

### Changed
- N/A (initial release)

### Fixed
- N/A (initial release)

---

[Unreleased]: https://github.com/your-org/ai-guardian/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/ai-guardian/releases/tag/v0.1.0
