# API Reference

## `ai_guardian` — top-level exports

```python
from ai_guardian import Guard, CheckResult, MatchedRule, RiskLevel
```

---

## `RiskLevel`

```python
class RiskLevel(str, Enum):
    LOW      = "LOW"       # score 0–30
    MEDIUM   = "MEDIUM"    # score 31–60
    HIGH     = "HIGH"      # score 61–80
    CRITICAL = "CRITICAL"  # score 81–100
```

---

## `MatchedRule`

Represents a single pattern that fired during a scan.

```python
@dataclass
class MatchedRule:
    id:          str    # e.g. "pi_ignore_previous"
    name:        str    # e.g. "Ignore Previous Instructions"
    score_delta: int    # points contributed to the total risk score
    owasp_ref:   str    # e.g. "OWASP LLM01: Prompt Injection"
    cwe_ref:     str    # e.g. "CWE-20"
```

---

## `CheckResult`

Returned by every `Guard` scan method.

```python
@dataclass
class CheckResult:
    blocked:     bool             # True if risk_score >= auto_block_threshold
    risk_score:  int              # 0–100
    risk_level:  RiskLevel        # LOW / MEDIUM / HIGH / CRITICAL
    reasons:     list[str]        # human-readable names of matched rules
    matched_rules: list[MatchedRule]
    remediation: dict             # structured remediation hints (see below)
    input_text:  str              # scanned text (first 500 chars)
```

### `remediation` structure

```python
{
    "primary_threat": "Ignore Previous Instructions",
    "owasp_refs": ["OWASP LLM01: Prompt Injection"],
    "cwe_refs":   ["CWE-20"],
    "hints": [
        "Prompt injection attempts override the LLM's system instructions...",
        "Validate and sanitise all user-supplied input before passing to the LLM.",
    ],
}
```

---

## `Guard`

### Constructor

```python
Guard(
    policy: str = "default",
    policy_file: str | None = None,
    auto_block_threshold: int | None = None,
    auto_allow_threshold: int | None = None,
)
```

### Methods

#### `check_input(text: str) -> CheckResult`

Scan a plain-text user prompt.

```python
result = guard.check_input("Ignore previous instructions")
```

#### `check_messages(messages: list[dict]) -> CheckResult`

Scan an OpenAI-style messages array. Only `user` and `assistant` roles are scanned
by default; `system` prompts are skipped.

```python
result = guard.check_messages([
    {"role": "system",    "content": "You are a helpful assistant."},
    {"role": "user",      "content": "DROP TABLE users"},
    {"role": "assistant", "content": "Sure, here you go..."},
])
```

#### `check_output(text: str) -> CheckResult`

Scan an LLM response for leaked credentials or PII.

```python
result = guard.check_output(llm_response_text)
```

#### `check_response(response: dict) -> CheckResult`

Scan an OpenAI-style response object (extracts `choices[*].message.content`).

```python
response = openai_client.chat.completions.create(...)
result = guard.check_response(response.model_dump())
```

---

## `ai_guardian.middleware.fastapi`

### `AIGuardianMiddleware`

Starlette middleware class. See [middleware.md](middleware.md).

```python
from ai_guardian.middleware.fastapi import AIGuardianMiddleware

app.add_middleware(
    AIGuardianMiddleware,
    guard=guard,
    scan_output=False,
    exclude_paths=["/health"],
)
```

---

## `ai_guardian.middleware.langchain`

### `AIGuardianCallback`

LangChain `BaseCallbackHandler` subclass.

```python
from ai_guardian.middleware.langchain import AIGuardianCallback, GuardianBlockedError

callback = AIGuardianCallback(
    guard=guard,
    block_on_input=True,
    block_on_output=False,
    on_blocked=None,   # optional callable(result: CheckResult) -> None
)
```

### `GuardianBlockedError`

Raised by all integrations when a request is blocked.

```python
class GuardianBlockedError(Exception):
    result: CheckResult
```

---

## `ai_guardian.middleware.openai_proxy`

### `SecureOpenAI`

Drop-in replacement for `openai.OpenAI`.

```python
from ai_guardian.middleware.openai_proxy import SecureOpenAI

client = SecureOpenAI(
    api_key="sk-...",
    guard=guard,
    scan_response=False,
)
```

### `AsyncSecureOpenAI`

Async variant:

```python
from ai_guardian.middleware.openai_proxy import AsyncSecureOpenAI

client = AsyncSecureOpenAI(api_key="sk-...", guard=guard)
response = await client.chat.completions.create(...)
```

---

## `ai_guardian.policies.manager`

### `PolicyManager`

Loads and manages policies. Usually not used directly.

```python
from ai_guardian.policies.manager import PolicyManager

pm = PolicyManager()
policy = pm.load("strict")            # built-in
policy = pm.load_from_file("p.yaml") # custom YAML
```

---

## Exceptions

| Exception              | Module                          | When raised                                     |
|------------------------|---------------------------------|-------------------------------------------------|
| `GuardianBlockedError` | `ai_guardian.middleware`        | Request exceeds block threshold in integrations |
| `PolicyLoadError`      | `ai_guardian.policies.manager`  | Invalid or missing YAML policy file             |
