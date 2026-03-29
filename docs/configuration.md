# Configuration

## Guard constructor

```python
Guard(
    policy: str = "default",
    policy_file: str | None = None,
    auto_block_threshold: int | None = None,
    auto_allow_threshold: int | None = None,
)
```

| Parameter              | Type           | Default     | Description                                              |
|------------------------|----------------|-------------|----------------------------------------------------------|
| `policy`               | `str`          | `"default"` | Built-in policy name: `"default"`, `"strict"`, `"permissive"` |
| `policy_file`          | `str \| None`  | `None`      | Path to a YAML policy file (overrides `policy`)          |
| `auto_block_threshold` | `int \| None`  | `None`      | Override block threshold (0–100)                         |
| `auto_allow_threshold` | `int \| None`  | `None`      | Override allow threshold (0–100)                         |

## Built-in policies

### `"default"` (recommended)

```
block  when score >= 81   (CRITICAL)
allow  when score <= 30   (LOW)
log    otherwise
```

### `"strict"`

```
block  when score >= 61   (HIGH or above)
allow  when score <= 20
log    otherwise
```

### `"permissive"`

```
block  when score >= 91
allow  when score <= 40
log    otherwise
```

## Inline threshold override

```python
# Block anything above 70, allow anything below 25
guard = Guard(auto_block_threshold=70, auto_allow_threshold=25)
```

## YAML policy file

Requires `pip install 'ai-guardian[yaml]'`.

```yaml
# policy.yaml
name: my-company-policy
description: Custom policy for ACME Corp

# Score at which requests are automatically blocked (0-100)
auto_block_threshold: 75

# Score at which requests are automatically allowed without further checks (0-100)
auto_allow_threshold: 20

custom_rules:
  # Block any mention of a competitor by name
  - id: block_competitor
    name: Competitor Mention
    description: Flag any message mentioning CompetitorX
    pattern: "(?i)\\bCompetitorX\\b"
    score_delta: 60
    enabled: true

  # Warn when users ask for financial data in bulk
  - id: bulk_financial_export
    name: Bulk Financial Data Request
    description: Detect attempts to export large amounts of financial records
    pattern: "(?i)(export|download|dump)\\s+(all|every|bulk)\\s+(transaction|payment|invoice)"
    score_delta: 45
    enabled: true
```

```python
guard = Guard(policy_file="policy.yaml")
```

### YAML schema reference

| Field                  | Type     | Required | Description                                       |
|------------------------|----------|----------|---------------------------------------------------|
| `name`                 | string   | no       | Human-readable name                               |
| `description`          | string   | no       | Free-form description                             |
| `auto_block_threshold` | integer  | no       | Override block threshold (0–100)                  |
| `auto_allow_threshold` | integer  | no       | Override allow threshold (0–100)                  |
| `custom_rules`         | list     | no       | List of `CustomRule` objects (see below)          |

#### CustomRule fields

| Field         | Type    | Required | Description                                                       |
|---------------|---------|----------|-------------------------------------------------------------------|
| `id`          | string  | yes      | Unique identifier (snake_case)                                    |
| `name`        | string  | yes      | Human-readable label shown in `reasons`                           |
| `description` | string  | no       | Longer explanation                                                |
| `pattern`     | string  | yes      | Python regex (compiled with `re.IGNORECASE` by default)           |
| `score_delta` | integer | yes      | Points added to risk score when pattern matches (1–100)           |
| `enabled`     | boolean | yes      | Set to `false` to disable without removing the rule               |

## Risk scoring model

Scores are calculated as follows:

1. Each matched pattern contributes its `score_delta`.
2. Within the same category, scores are **capped at 2× the highest base score** to prevent runaway accumulation from noisy input.
3. Final score is clamped to `[0, 100]`.

| Score range | Risk level | Symbol         |
|-------------|------------|----------------|
| 0 – 30      | LOW        | safe           |
| 31 – 60     | MEDIUM     | log & allow    |
| 61 – 80     | HIGH       | log & allow    |
| 81 – 100    | CRITICAL   | block          |

## Environment variable configuration

For the self-hosted backend only (see `backend/.env.example`):

```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/ai_guardian
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=change-me-in-production
OPENAI_API_KEY=sk-...
DEBUG=false
DEMO_MODE=false
```
