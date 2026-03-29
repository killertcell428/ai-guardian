# AI Guardian Architecture

## Overview

AI Guardian is a **universal governance layer for AI agents**. It monitors, controls, and audits every operation that AI agents (Claude Code, Cursor, custom agents) perform in enterprise environments.

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Agents                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Claude   │  │ Cursor   │  │ Custom   │  │ Future   │       │
│  │ Code     │  │          │  │ Agent    │  │ Agents   │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │             │
│       ▼              ▼              ▼              ▼             │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              AI Guardian Governance Layer             │       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────────┐ │       │
│  │  │            Adapter Layer                         │ │       │
│  │  │  Claude Code hooks │ MCP Gateway │ SDK          │ │       │
│  │  └─────────┬───────────────────────────────────────┘ │       │
│  │            │                                          │       │
│  │  ┌─────────▼───────────────────────────────────────┐ │       │
│  │  │          Core Processing Pipeline                │ │       │
│  │  │                                                   │ │       │
│  │  │  1. Text Normalization (NFKC, zero-width, etc.)  │ │       │
│  │  │  2. Threat Scan (48 regex + 40 similarity)       │ │       │
│  │  │  3. Policy Evaluation (YAML rules)               │ │       │
│  │  │  4. Decision: Allow / Deny / Review              │ │       │
│  │  └─────────┬───────────────────────────────────────┘ │       │
│  │            │                                          │       │
│  │  ┌─────────▼───────────────────────────────────────┐ │       │
│  │  │          Output Layer                            │ │       │
│  │  │                                                   │ │       │
│  │  │  Activity Stream (JSONL) ─► Local + Global + Alert│ │       │
│  │  │  Remediation Hints (OWASP/CWE refs)              │ │       │
│  │  │  Compliance Report (24 JP requirements)          │ │       │
│  │  │  Excel/CSV Export                                │ │       │
│  │  └─────────────────────────────────────────────────┘ │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Module Architecture

```
ai_guardian/
│
├── scanner.py              # Layer 0: Core threat detection
│   ├── scan()              #   Scan user input (48 patterns + similarity)
│   ├── scan_output()       #   Scan LLM responses
│   ├── scan_messages()     #   Multi-turn conversation scanning
│   ├── scan_rag_context()  #   RAG document scanning
│   ├── sanitize()          #   Auto-redact PII
│   └── _normalize_text()   #   Evasion defeat (NFKC, zero-width, spacing)
│
├── patterns.py             # Detection pattern definitions
│   ├── PROMPT_INJECTION    #   12 EN + 6 JA patterns
│   ├── SQL_INJECTION       #   6 patterns
│   ├── PII_INPUT           #   8 patterns (JP: My Number, phone, etc.)
│   ├── COMMAND_INJECTION   #   2 patterns
│   ├── CONFIDENTIAL        #   3 patterns
│   ├── LEGAL_RISK          #   2 patterns (trade secret, copyright)
│   └── OUTPUT_PATTERNS     #   7 patterns (PII leak, secret leak)
│
├── similarity.py           # Layer 2: Semantic similarity detection
│   ├── ATTACK_CORPUS       #   40 canonical attack phrases (EN + JA)
│   ├── _ATTACK_SIGNAL_WORDS #  Signal word filter (reduces false positives)
│   └── check_similarity()  #   Fuzzy matching via difflib + n-grams
│
├── activity.py             # Activity Stream (multi-tier logging)
│   ├── ActivityEvent       #   Universal event schema (AGI-ready fields)
│   ├── ActivityStream      #   3-tier: Local + Global + Alert archive
│   │   ├── record()        #     Append to all applicable tiers
│   │   ├── query()         #     Filter by action/agent/risk/user
│   │   ├── summary()       #     Aggregate stats (by_user, by_project, etc.)
│   │   ├── export_csv()    #     Excel-compatible CSV export
│   │   ├── export_excel_summary()  #  Summary + events bundle
│   │   ├── rotate_logs()   #     Compress after 7d, delete after 60d
│   │   └── get_alert_knowledge()   #  Alert history for auto-fix AI
│   └── _dict_to_event()    #   Tolerant deserialization
│
├── policy.py               # Policy Engine (declarative YAML rules)
│   ├── PolicyRule          #   allow/deny/review + conditions (AGI stubs)
│   ├── Policy              #   Rule collection + default decision
│   ├── load_policy()       #   YAML/JSON loader (stdlib-only parser)
│   ├── evaluate()          #   First-match rule evaluation
│   ├── save_policy()       #   YAML-like output
│   └── _default_policy()   #   14 built-in security rules
│
├── compliance.py           # Japan regulatory mapping
│   ├── ComplianceItem      #   Regulation → Feature → Status
│   ├── get_compliance_report()   #  24 items, all covered
│   └── get_compliance_summary()  #  Coverage rate: 100%
│
├── cli.py                  # CLI entry point (aig command)
│   ├── aig init            #   Project setup + Claude Code hooks
│   ├── aig logs            #   Activity Stream viewer
│   ├── aig policy          #   Policy management
│   ├── aig status          #   Governance overview
│   ├── aig report          #   Compliance report
│   ├── aig maintenance     #   Log rotation
│   └── aig scan            #   Quick threat scan
│
├── adapters/
│   └── claude_code.py      # Claude Code hooks integration
│       ├── install_hooks()       #  Auto-configure .claude/settings.json
│       ├── generate_hooks_config()  # PreToolUse hook config
│       └── HOOK_SCRIPT           #  Interceptor (scan + policy + log)
│
└── badge.py                # UI badge component (SVG)
```

## Data Flow

### Agent Operation → Governance Decision

```
1. Agent calls a tool (e.g., Bash "rm -rf /")
       │
       ▼
2. Adapter intercepts (Claude Code hook: PreToolUse)
       │
       ▼
3. Build ActivityEvent
   - action: "shell:exec"
   - target: "rm -rf /"
   - user_id: "tanaka" (from OS)
   - agent_type: "claude_code"
       │
       ▼
4. Threat Scan (if applicable)
   - _normalize_text() → defeat evasion
   - Pattern matching (48 regex)
   - Similarity check (40 phrases)
   - → risk_score: 90, risk_level: "critical"
       │
       ▼
5. Policy Evaluation
   - Load ai-guardian-policy.yaml
   - Match rules in order (first match wins)
   - Rule "dangerous_commands" matches
   - → decision: "deny"
       │
       ▼
6. Activity Stream (record to all tiers)
   - Local:  .ai-guardian/logs/2026-03-28.jsonl
   - Global: ~/.ai-guardian/global/2026-03-28.jsonl
   - Alert:  ~/.ai-guardian/alerts/2026-03-28.jsonl (blocked = alert)
       │
       ▼
7. Return decision to agent
   - exit 0 → allow (tool executes)
   - exit 2 → deny (tool blocked, reason in stderr)
```

## Log Architecture

```
Per-project (user-visible):
  .ai-guardian/
  └── logs/
      ├── 2026-03-28.jsonl     ← Today's events
      ├── 2026-03-21.jsonl.gz  ← Compressed (>7 days old)
      └── ...                   ← Auto-deleted after 60 days

Global (CISO/audit, cross-project):
  ~/.ai-guardian/
  ├── global/
  │   ├── 2026-03-28.jsonl     ← All projects aggregated
  │   └── ...
  └── alerts/
      ├── 2026-03-28.jsonl     ← Blocked/reviewed events ONLY
      └── ...                   ← NEVER deleted (knowledge base)
```

## AGI-Ready Schema

ActivityEvent includes fields for future governance dimensions:

| Field | Type | Purpose | Status |
|-------|------|---------|--------|
| `autonomy_level` | int (1-5) | Agent autonomy scale | Schema ready |
| `delegation_chain` | list[str] | Agent-to-agent delegation tracking | Schema ready |
| `estimated_cost` | float | API/compute cost governance | Schema ready |
| `memory_scope` | str | Knowledge boundary enforcement | Schema ready |
| `suggested_fix` | str | AI-suggested safe alternative | Schema ready |
| `fix_applied` | bool | Was auto-fix applied? | Schema ready |

PolicyRule `conditions` dict supports future checks:

```yaml
conditions:
  autonomy_level: 3        # Require level 3+ to execute
  cost_limit: 1.0          # Block if estimated cost > $1
  department: "engineering" # Only engineering department
  memory_retention: "90d"  # Auto-forget after 90 days
```

## Security Design Principles

1. **Zero dependencies** — Pure Python stdlib (no supply chain risk)
2. **Fail-open by default** — Hook errors don't block agent (graceful degradation)
3. **Append-only logs** — JSONL files, no update/delete operations
4. **Policy-as-code** — YAML in git, version controlled, auditable
5. **Agent-agnostic** — Adapter pattern for any agent type
6. **Detection + remediation** — Every block includes OWASP ref + fix guidance
