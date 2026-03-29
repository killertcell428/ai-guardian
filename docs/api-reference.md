# API リファレンス

## `ai_guardian` — トップレベルエクスポート

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

スキャン中にマッチした個々のパターンを表します。

```python
@dataclass
class MatchedRule:
    id:          str    # e.g. "pi_ignore_previous"
    name:        str    # e.g. "Ignore Previous Instructions"
    score_delta: int    # 合計リスクスコアへの加算ポイント
    owasp_ref:   str    # e.g. "OWASP LLM01: Prompt Injection"
    cwe_ref:     str    # e.g. "CWE-20"
```

---

## `CheckResult`

`Guard` のすべてのスキャンメソッドが返すオブジェクトです。

```python
@dataclass
class CheckResult:
    blocked:     bool             # risk_score >= auto_block_threshold の場合 True
    risk_score:  int              # 0–100
    risk_level:  RiskLevel        # LOW / MEDIUM / HIGH / CRITICAL
    reasons:     list[str]        # マッチしたルールの人間が読める名前
    matched_rules: list[MatchedRule]
    remediation: dict             # 構造化された修復ヒント（後述）
    input_text:  str              # スキャン対象テキスト（先頭 500 文字）
```

### `remediation` の構造

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

### コンストラクタ

```python
Guard(
    policy: str = "default",
    policy_file: str | None = None,
    auto_block_threshold: int | None = None,
    auto_allow_threshold: int | None = None,
)
```

### メソッド

#### `check_input(text: str) -> CheckResult`

プレーンテキストのユーザープロンプトをスキャンします。

```python
result = guard.check_input("Ignore previous instructions")
```

#### `check_messages(messages: list[dict]) -> CheckResult`

OpenAI 形式のメッセージ配列をスキャンします。デフォルトでは `user` と `assistant` ロールのみがスキャン対象で、`system` プロンプトはスキップされます。

```python
result = guard.check_messages([
    {"role": "system",    "content": "You are a helpful assistant."},
    {"role": "user",      "content": "DROP TABLE users"},
    {"role": "assistant", "content": "Sure, here you go..."},
])
```

#### `check_output(text: str) -> CheckResult`

LLM レスポンスをスキャンし、認証情報や個人情報の漏洩を検出します。

```python
result = guard.check_output(llm_response_text)
```

#### `check_response(response: dict) -> CheckResult`

OpenAI 形式のレスポンスオブジェクトをスキャンします（`choices[*].message.content` を抽出）。

```python
response = openai_client.chat.completions.create(...)
result = guard.check_response(response.model_dump())
```

---

## `ai_guardian.middleware.fastapi`

### `AIGuardianMiddleware`

Starlette ミドルウェアクラスです。詳細は [middleware.md](middleware.md) を参照してください。

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

LangChain の `BaseCallbackHandler` サブクラスです。

```python
from ai_guardian.middleware.langchain import AIGuardianCallback, GuardianBlockedError

callback = AIGuardianCallback(
    guard=guard,
    block_on_input=True,
    block_on_output=False,
    on_blocked=None,   # 任意のコールバック callable(result: CheckResult) -> None
)
```

### `GuardianBlockedError`

リクエストがブロックされた際にすべての連携機能から送出される例外です。

```python
class GuardianBlockedError(Exception):
    result: CheckResult
```

---

## `ai_guardian.middleware.openai_proxy`

### `SecureOpenAI`

`openai.OpenAI` のドロップイン置き換えです。

```python
from ai_guardian.middleware.openai_proxy import SecureOpenAI

client = SecureOpenAI(
    api_key="sk-...",
    guard=guard,
    scan_response=False,
)
```

### `AsyncSecureOpenAI`

非同期版:

```python
from ai_guardian.middleware.openai_proxy import AsyncSecureOpenAI

client = AsyncSecureOpenAI(api_key="sk-...", guard=guard)
response = await client.chat.completions.create(...)
```

---

## `ai_guardian.policies.manager`

### `PolicyManager`

ポリシーの読み込みと管理を行います。通常は直接使用しません。

```python
from ai_guardian.policies.manager import PolicyManager

pm = PolicyManager()
policy = pm.load("strict")            # 組み込みポリシー
policy = pm.load_from_file("p.yaml") # カスタム YAML
```

---

## 例外

| 例外                   | モジュール                      | 送出タイミング                                  |
|------------------------|---------------------------------|-------------------------------------------------|
| `GuardianBlockedError` | `ai_guardian.middleware`        | 連携機能でブロック閾値を超えた場合              |
| `PolicyLoadError`      | `ai_guardian.policies.manager`  | YAML ポリシーファイルが無効または見つからない場合|
