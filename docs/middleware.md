# Middleware & Integration Guide

## FastAPI / Starlette middleware

**Install:** `pip install 'ai-guardian[fastapi]'`

### Basic setup

```python
from fastapi import FastAPI
from ai_guardian import Guard
from ai_guardian.middleware.fastapi import AIGuardianMiddleware

app = FastAPI()
guard = Guard(policy="strict")
app.add_middleware(AIGuardianMiddleware, guard=guard)
```

The middleware intercepts every **POST / PUT / PATCH** request that contains a JSON body
with a `"messages"` key (OpenAI chat format) and scans each user/assistant message.

Blocked requests receive an **HTTP 400** response:

```json
{
  "error": {
    "type": "guardian_policy_violation",
    "code": "request_blocked",
    "message": "Request blocked by AI Guardian security policy.",
    "risk_score": 85,
    "risk_level": "CRITICAL",
    "reasons": ["DAN / Jailbreak Persona"],
    "remediation": {
      "primary_threat": "DAN / Jailbreak Persona",
      "owasp_refs": ["OWASP LLM01: Prompt Injection"],
      "hints": ["Jailbreak attempts try to bypass AI safety guardrails..."]
    }
  }
}
```

### Middleware constructor options

```python
app.add_middleware(
    AIGuardianMiddleware,
    guard=guard,
    scan_output=True,      # also scan response bodies (default: False)
    exclude_paths=["/health", "/metrics"],  # skip these endpoints
)
```

### Accessing the scan result in route handlers

```python
from fastapi import Request

@app.post("/chat")
async def chat(request: Request):
    # Available after middleware runs
    result = request.state.guardian_result
    if result:
        print(result.risk_score)
```

---

## LangChain callback

**Install:** `pip install 'ai-guardian[langchain]'`

### Basic setup

```python
from langchain_openai import ChatOpenAI
from ai_guardian import Guard
from ai_guardian.middleware.langchain import AIGuardianCallback, GuardianBlockedError

guard = Guard(policy="strict")
callback = AIGuardianCallback(guard=guard, block_on_output=True)

llm = ChatOpenAI(model="gpt-4o", callbacks=[callback])

try:
    response = llm.invoke("What is 2 + 2?")
    print(response.content)
except GuardianBlockedError as e:
    print(f"Blocked: {e.result.reasons}")
```

### Callback options

```python
AIGuardianCallback(
    guard=guard,
    block_on_input=True,    # scan LLM input (default: True)
    block_on_output=True,   # scan LLM output (default: False)
    on_blocked=None,        # optional callable(result) called before raising
)
```

### With LCEL chains

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([("user", "{input}")])
chain = prompt | llm | StrOutputParser()

try:
    result = chain.invoke(
        {"input": "Explain quantum computing"},
        config={"callbacks": [callback]},
    )
except GuardianBlockedError as e:
    result = "Response blocked by security policy."
```

---

## OpenAI proxy wrapper

**Install:** `pip install 'ai-guardian[openai]'`

### Basic setup

```python
from ai_guardian import Guard
from ai_guardian.middleware.openai_proxy import SecureOpenAI

guard = Guard()
client = SecureOpenAI(api_key="sk-...", guard=guard)

# Identical API to openai.OpenAI
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
```

Blocked requests raise `GuardianBlockedError` before any network call is made.

### Scanning the response

```python
client = SecureOpenAI(
    api_key="sk-...",
    guard=guard,
    scan_response=True,   # scan LLM output as well (default: False)
)
```

### Async client

```python
from ai_guardian.middleware.openai_proxy import AsyncSecureOpenAI

client = AsyncSecureOpenAI(api_key="sk-...", guard=guard)

response = await client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

---

## Handling `GuardianBlockedError`

All integrations raise `ai_guardian.middleware.GuardianBlockedError` when a request is
blocked. The exception carries the full `CheckResult`:

```python
from ai_guardian.middleware import GuardianBlockedError

try:
    ...
except GuardianBlockedError as e:
    result = e.result
    print(result.risk_score)    # int 0-100
    print(result.risk_level)    # RiskLevel.CRITICAL
    print(result.reasons)       # list[str]
    print(result.remediation)   # dict with hints and owasp_refs
```

---

## Combining integrations

You can layer multiple integration points for defence in depth:

```python
# 1. FastAPI middleware — blocks at the HTTP layer
app.add_middleware(AIGuardianMiddleware, guard=guard)

# 2. LangChain callback — blocks before the LLM call
callback = AIGuardianCallback(guard=guard, block_on_output=True)

# 3. Manual check in route logic — for custom error handling
@app.post("/chat")
async def chat(body: ChatBody):
    result = guard.check_messages(body.messages)
    if result.blocked:
        raise HTTPException(status_code=400, detail=result.reasons)
    ...
```
