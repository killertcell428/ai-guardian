# ミドルウェア & 連携ガイド

## FastAPI / Starlette ミドルウェア

**インストール:** `pip install 'ai-guardian[fastapi]'`

### 基本セットアップ

```python
from fastapi import FastAPI
from ai_guardian import Guard
from ai_guardian.middleware.fastapi import AIGuardianMiddleware

app = FastAPI()
guard = Guard(policy="strict")
app.add_middleware(AIGuardianMiddleware, guard=guard)
```

このミドルウェアは、JSON ボディに `"messages"` キー（OpenAI チャット形式）を含むすべての **POST / PUT / PATCH** リクエストをインターセプトし、各 user/assistant メッセージをスキャンします。

ブロックされたリクエストには **HTTP 400** レスポンスが返されます。

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

### ミドルウェアのコンストラクタオプション

```python
app.add_middleware(
    AIGuardianMiddleware,
    guard=guard,
    scan_output=True,      # レスポンスボディもスキャンする（デフォルト: False）
    exclude_paths=["/health", "/metrics"],  # これらのエンドポイントをスキップ
)
```

### ルートハンドラでスキャン結果にアクセス

```python
from fastapi import Request

@app.post("/chat")
async def chat(request: Request):
    # ミドルウェア実行後に利用可能
    result = request.state.guardian_result
    if result:
        print(result.risk_score)
```

---

## LangChain コールバック

**インストール:** `pip install 'ai-guardian[langchain]'`

### 基本セットアップ

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

### コールバックのオプション

```python
AIGuardianCallback(
    guard=guard,
    block_on_input=True,    # LLM 入力をスキャン（デフォルト: True）
    block_on_output=True,   # LLM 出力をスキャン（デフォルト: False）
    on_blocked=None,        # ブロック時に例外を投げる前に呼ばれるコールバック（任意）
)
```

### LCEL チェーンとの連携

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

## OpenAI プロキシラッパー

**インストール:** `pip install 'ai-guardian[openai]'`

### 基本セットアップ

```python
from ai_guardian import Guard
from ai_guardian.middleware.openai_proxy import SecureOpenAI

guard = Guard()
client = SecureOpenAI(api_key="sk-...", guard=guard)

# openai.OpenAI と同一の API
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
```

ブロックされたリクエストは、ネットワーク通信が発生する前に `GuardianBlockedError` を送出します。

### レスポンスのスキャン

```python
client = SecureOpenAI(
    api_key="sk-...",
    guard=guard,
    scan_response=True,   # LLM の出力もスキャン（デフォルト: False）
)
```

### 非同期クライアント

```python
from ai_guardian.middleware.openai_proxy import AsyncSecureOpenAI

client = AsyncSecureOpenAI(api_key="sk-...", guard=guard)

response = await client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

---

## `GuardianBlockedError` の処理

すべての連携機能は、リクエストがブロックされた場合に `ai_guardian.middleware.GuardianBlockedError` を送出します。この例外には完全な `CheckResult` が含まれています。

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

## 連携の組み合わせ

多層防御のために複数の連携ポイントを重ねて使用できます。

```python
# 1. FastAPI ミドルウェア — HTTP レイヤーでブロック
app.add_middleware(AIGuardianMiddleware, guard=guard)

# 2. LangChain コールバック — LLM 呼び出し前にブロック
callback = AIGuardianCallback(guard=guard, block_on_output=True)

# 3. ルートロジック内での手動チェック — 独自のエラーハンドリング用
@app.post("/chat")
async def chat(body: ChatBody):
    result = guard.check_messages(body.messages)
    if result.blocked:
        raise HTTPException(status_code=400, detail=result.reasons)
    ...
```
