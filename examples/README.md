# Examples

Runnable code samples for ai-guardian.

## Setup

```bash
pip install aig-guardian
# or for all examples:
pip install 'aig-guardian[all]'
```

## Files

| File | Description | Extra deps |
|------|-------------|------------|
| [`basic_usage.py`](basic_usage.py) | Core `Guard` class — input/output scanning, policies, risk scoring | none |
| [`fastapi_integration.py`](fastapi_integration.py) | FastAPI middleware + manual check | `ai-guardian[fastapi]`, `uvicorn` |
| [`langchain_integration.py`](langchain_integration.py) | LangChain callback for input + output scanning | `ai-guardian[langchain]`, `langchain-openai` |
| [`openai_proxy.py`](openai_proxy.py) | Drop-in `SecureOpenAI` wrapper (sync + async) | `ai-guardian[openai]` |
| [`custom_policy.py`](custom_policy.py) | YAML policy files, inline overrides, custom rules | `ai-guardian[yaml]` |

## Running the examples

```bash
# Basic — no dependencies, no API key needed
python examples/basic_usage.py

# FastAPI server
pip install 'aig-guardian[fastapi]' uvicorn
uvicorn examples.fastapi_integration:app --reload
# then: curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" \
#         -d '{"messages": [{"role": "user", "content": "Hello!"}]}'

# LangChain (live LLM calls optional)
pip install 'aig-guardian[langchain]' langchain-openai
OPENAI_API_KEY=sk-... python examples/langchain_integration.py

# OpenAI proxy (live API calls optional — guard fires offline)
pip install 'aig-guardian[openai]'
OPENAI_API_KEY=sk-... python examples/openai_proxy.py

# Custom policy
pip install 'aig-guardian[yaml]'
python examples/custom_policy.py
```

## What each example demonstrates

### `basic_usage.py`

- Prompt injection detection
- PII detection (credit card, SSN, API keys)
- SQL injection detection
- Policy comparison (`permissive` vs `default` vs `strict`)
- Output scanning
- Accessing the full `CheckResult` (score, reasons, remediation)

### `fastapi_integration.py`

- `AIGuardianMiddleware` setup
- Automatic scan of all POST request bodies
- Accessing `request.state.guardian_result` inside route handlers
- Manual `guard.check_messages()` as an alternative to middleware
- Custom error handler for blocked requests

### `langchain_integration.py`

- `AIGuardianCallback` with `block_on_input=True` / `block_on_output=True`
- Handling `GuardianBlockedError`
- LCEL chain integration
- Custom `on_blocked` handler (silent logging instead of raising)

### `openai_proxy.py`

- `SecureOpenAI` as a drop-in for `openai.OpenAI`
- `scan_response=True` for output scanning
- `AsyncSecureOpenAI` for async code
- One-line migration from `openai.OpenAI`

### `custom_policy.py`

- Built-in policy comparison
- Inline `auto_block_threshold` / `auto_allow_threshold` override
- YAML policy file with custom rules
- Combining built-in patterns with custom regex rules
