<p align="center">
  <img src="https://raw.githubusercontent.com/killertcell428/ai-guardian/main/.github/shield.svg" alt="AI Guardian" width="120" />
</p>

<h1 align="center">AI Guardian</h1>

<p align="center">
  <strong>The governance layer for AI agents.</strong><br>
  Monitor, control, and audit every AI agent operation. From LLM security to AGI-era governance.
</p>

<p align="center">
  <a href="https://github.com/killertcell428/ai-guardian/actions/workflows/ci.yml"><img src="https://github.com/killertcell428/ai-guardian/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://pypi.org/project/aig-guardian/"><img src="https://img.shields.io/pypi/v/aig-guardian" alt="PyPI" /></a>
  <a href="https://pypi.org/project/aig-guardian/"><img src="https://img.shields.io/pypi/dm/aig-guardian" alt="Downloads" /></a>
  <a href="https://www.python.org/downloads/"><img src="https://img.shields.io/badge/python-3.10%2B-blue" alt="Python" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-green" alt="License" /></a>
</p>

<p align="center">
  <a href="https://ai-guardian-mauve.vercel.app/docs">Docs</a> &middot;
  <a href="https://ai-guardian-mauve.vercel.app/challenge">Gandalf Challenge</a> &middot;
  <a href="https://ai-guardian-mauve.vercel.app/docs/compliance/japan">Japan Compliance</a> &middot;
  <a href="https://pypi.org/project/aig-guardian/">PyPI</a>
</p>

---

## The Problem

AI agents (Claude Code, Cursor, custom agents) are transforming how teams work. But enterprises can't adopt them safely:

- **78% of agent incidents** caused by over-permissioned agents
- **57% of companies** have no centralized AI agent management
- **94% of companies** lack an advanced AI security strategy

## The Solution

AI Guardian is the **common security layer** that ships alongside any AI agent. Install it once, and every agent operation is automatically monitored, policy-controlled, and audit-logged.

```bash
pip install aig-guardian
aig init --agent claude-code
```

That's it. Every Claude Code operation is now governed.

## How It Works

```
AI Agent (Claude Code, Cursor, etc.)
    |
    v
[AI Guardian]
    |--- Activity Stream: Log every operation (who/what/when/where)
    |--- Policy Engine: Allow / Deny / Review per YAML rules
    |--- Threat Scanner: 48 patterns + semantic similarity
    |--- Auto-Sanitizer: Redact PII before it reaches LLMs
    |
    v
Allow (exit 0) or Block (exit 2) with remediation guidance
```

## Quick Start

### 1. Install & Initialize

```bash
pip install aig-guardian
aig init --agent claude-code
```

This creates:
- `ai-guardian-policy.yaml` with 14 default security rules
- `.claude/hooks/aig-guard.py` that intercepts every tool call
- `.ai-guardian/logs/` for the activity stream

### 2. Policy Rules (YAML)

```yaml
# ai-guardian-policy.yaml
rules:
  - id: block_rm_rf
    action: "shell:exec"
    target: "rm -rf *"
    decision: deny
    reason: "Recursive deletion is blocked"

  - id: protect_env
    action: "file:write"
    target: ".env*"
    decision: deny
    reason: "Environment files are protected"

  - id: review_git_push
    action: "shell:exec"
    target: "git push*"
    decision: review
    reason: "Push requires review"
```

### 3. Monitor Activity

```bash
aig logs                     # View recent activity
aig logs --action shell:exec # Filter by action
aig logs --risk-above 50     # High-risk events only
aig status                   # Governance overview
aig report --days 30         # Compliance report
```

### 4. Scan & Sanitize (Python API)

```python
from ai_guardian import scan, sanitize

# Scan for threats (48 patterns + similarity detection)
result = scan("Ignore previous instructions")
print(result.is_safe)       # False
print(result.risk_score)    # 70

# Auto-redact PII
cleaned, _ = sanitize("Phone: 090-1234-5678")
print(cleaned)  # "Phone: [PHONE_REDACTED]"
```

## Features

### Agent Governance (v0.3.0)

| Feature | Description |
|---------|-------------|
| **Activity Stream** | JSONL log of every agent operation (file, shell, network, LLM, MCP) |
| **Policy Engine** | YAML-based allow/deny/review rules with glob patterns |
| **Claude Code Adapter** | Auto-configure hooks with `aig init --agent claude-code` |
| **CLI** | `aig init`, `aig logs`, `aig policy`, `aig status`, `aig report`, `aig scan` |
| **14 Default Rules** | Block rm -rf, protect .env/.ssh, review git push, review agent spawning |

### Threat Detection (v0.2.0)

| Category | Patterns |
|----------|----------|
| Prompt Injection (EN + JA) | 12 patterns + 40 similarity phrases |
| SQL Injection | 6 patterns |
| PII Detection | 8 input + 7 output patterns |
| Command Injection | 2 patterns |
| Data Exfiltration | 2 patterns |
| Confidential / Legal | 5 patterns (trade secrets, copyright, NDA) |

### Beyond Detection

| Feature | Description |
|---------|-------------|
| **Remediation Hints** | OWASP/CWE ref + actionable fix for every detection |
| **Auto-Sanitization** | `sanitize()` redacts PII before LLM transmission |
| **RAG Protection** | `scan_rag_context()` detects indirect injection in documents |
| **Multi-turn Detection** | `scan_messages()` catches escalation across conversation turns |
| **Japan Compliance** | 24 regulatory requirements mapped (89.6% coverage) |
| **Text Normalization** | Defeats fullwidth, zero-width, spaced-char evasion |

## Default Policy Rules

| Rule | Action | Decision | Reason |
|------|--------|----------|--------|
| `dangerous_commands` | `shell:exec` rm -rf | **Deny** | Recursive deletion blocked |
| `env_file_protection` | `file:write` .env* | **Deny** | Environment files protected |
| `ssh_key_protection` | `file:*` .ssh/* | **Deny** | SSH keys protected |
| `credentials_protection` | `file:write` *credentials* | **Deny** | Credential files protected |
| `pipe_to_shell` | `shell:exec` *\| bash* | **Deny** | Remote code execution blocked |
| `git_force_push` | `shell:exec` *--force* | **Deny** | Force push blocked |
| `git_push_review` | `shell:exec` git push* | **Review** | Push requires human review |
| `sudo_commands` | `shell:exec` sudo * | **Review** | Privilege escalation reviewed |
| `agent_spawn_review` | `agent:spawn` * | **Review** | Sub-agent creation reviewed |

## AGI-Ready Architecture

AI Guardian's data model is designed for the governance challenges coming in 2-3 years:

```python
from ai_guardian import ActivityEvent

event = ActivityEvent(
    action="agent:spawn",
    target="finance_agent",
    autonomy_level=3,                        # 1-5 autonomy scale
    delegation_chain=["user", "main_agent"], # Who delegated to whom
    estimated_cost=0.50,                     # Cost governance
    memory_scope="department:sales",          # Knowledge boundaries
)
```

| Future Capability | Status | Field |
|-------------------|--------|-------|
| Autonomy level control | Schema ready | `autonomy_level` |
| Agent delegation governance | Schema ready | `delegation_chain` |
| Cost governance | Schema ready | `estimated_cost` |
| Memory/knowledge boundaries | Schema ready | `memory_scope` |
| Policy conditions | Schema ready | `conditions` dict |

## Japanese Language & Compliance

Native detection for Japanese threats and full regulatory mapping:

- **AI Promotion Act** (AI推進法): Human-in-the-Loop, audit trails
- **AI Operator Guidelines** (AI事業者GL v1.1): Multi-layer defense, risk assessment
- **APPI / My Number Act**: PII detection + auto-sanitization
- **Unfair Competition Prevention Act**: Trade secret markers
- **Copyright Act**: Copyright infringement detection

```python
from ai_guardian.compliance import get_compliance_summary
summary = get_compliance_summary()
print(f"Coverage: {summary['coverage_rate']}%")  # 89.6%
```

## Try the Gandalf Challenge

Can you trick an AI into revealing a secret password? 7 levels using AI Guardian's real detection engine.

> **[Play Gandalf Challenge](https://ai-guardian-mauve.vercel.app/challenge)**

## Architecture

```
ai_guardian/
├── scanner.py          # Core threat detection (48 patterns)
├── patterns.py         # Detection pattern definitions
├── similarity.py       # Layer 2 semantic matching
├── activity.py         # Activity Stream (JSONL logging)
├── policy.py           # Policy Engine (YAML rules)
├── cli.py              # CLI entry point (aig command)
├── compliance.py       # Japan regulatory mapping
├── adapters/
│   └── claude_code.py  # Claude Code hooks integration
└── badge.py            # UI badge component
```

**Zero dependencies.** Pure Python stdlib. 152 tests. 100% detection rate, 0% false positives.

## Contributing

We welcome contributions! If you find a bypass technique, please [open an issue](https://github.com/killertcell428/ai-guardian/issues/new).

## License

Apache 2.0
