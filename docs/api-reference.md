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

## `ai_guardian.capabilities`

v1.3.0 で追加されたケーパビリティベースのアクセス制御レイヤーです。ツール呼び出しに対して最小権限の原則を適用します。

### `CapabilityStore`

ケーパビリティの定義と管理を行います。

```python
from ai_guardian.capabilities import CapabilityStore, Capability

store = CapabilityStore()
store.grant("file_reader", Capability(
    resource="filesystem",
    actions=["read"],
    constraints={"paths": ["/data/**"]},
))
store.revoke("file_reader", resource="filesystem")
```

### `CapabilityEnforcer`

実行時にケーパビリティを検証し、許可されていない操作をブロックします。

```python
from ai_guardian.capabilities import CapabilityEnforcer

enforcer = CapabilityEnforcer(store)
enforcer.check("file_reader", resource="filesystem", action="write")
# -> CapabilityDeniedError (write not granted)
```

### `TaintLabel` / `TaintedValue`

汚染追跡（Taint Tracking）により、外部入力が信頼された操作に流入するのを防ぎます。

```python
from ai_guardian.capabilities import TaintLabel, TaintedValue

user_input = TaintedValue("rm -rf /", label=TaintLabel.USER_INPUT)
print(user_input.is_tainted)  # True

# 汚染された値をシェルコマンドに渡そうとするとエラー
enforcer.check_taint(user_input, sink="shell_exec")
# -> TaintViolationError
```

### `Capability`

個々のケーパビリティを表すデータクラスです。

```python
@dataclass
class Capability:
    resource: str                    # e.g. "filesystem", "network", "database"
    actions: list[str]               # e.g. ["read", "write", "execute"]
    constraints: dict[str, Any]      # e.g. {"paths": ["/data/**"], "max_size": 1048576}
    expires_at: datetime | None      # 有効期限（None = 無期限）
```

---

## `ai_guardian.aep`

v1.3.0 で追加された Atomic Execution Pipeline（AEP）です。ツール実行をサンドボックス内で原子的に実行し、副作用を制御します。

### `AtomicPipeline`

ツール実行を原子的なトランザクションとしてラップします。

```python
from ai_guardian.aep import AtomicPipeline, Vaporizer

pipeline = AtomicPipeline(
    vaporize=True,      # 失敗時に副作用を消去
    sandbox=True,       # サンドボックス内で実行
    timeout=30.0,       # タイムアウト（秒）
)

result = await pipeline.execute(tool_fn, args={"path": "/data/report.csv"})
print(result.success)       # True
print(result.return_value)  # tool_fn の戻り値
print(result.side_effects)  # 検出された副作用のリスト
```

### `ProcessSandbox`

ツール実行を隔離されたプロセスで行います。

```python
from ai_guardian.aep import ProcessSandbox

sandbox = ProcessSandbox(
    allowed_paths=["/data/**"],
    network=False,        # ネットワークアクセス禁止
    max_memory_mb=256,
)
result = await sandbox.run(tool_fn, args)
```

### `Vaporizer`

実行失敗時に副作用（ファイル作成、ネットワーク送信等）をロールバックします。

```python
from ai_guardian.aep import Vaporizer

vaporizer = Vaporizer()
async with vaporizer.track():
    # この中で発生した副作用は失敗時に自動消去
    write_file("/tmp/output.txt", data)
    # 例外発生 → /tmp/output.txt は自動削除
```

### `AEPResult`

パイプライン実行の結果を表します。

```python
@dataclass
class AEPResult:
    success: bool                    # 実行成功か
    return_value: Any                # ツールの戻り値
    side_effects: list[str]          # 検出された副作用
    duration_ms: float               # 実行時間（ミリ秒）
    sandbox_violations: list[str]    # サンドボックス違反（あれば）
```

---

## `ai_guardian.safety`

v1.3.0 で追加された形式的安全性検証レイヤーです。ツールの副作用が安全仕様に準拠していることを検証します。

### `SafetyVerifier`

安全仕様に基づいてツール実行の安全性を検証します。

```python
from ai_guardian.safety import SafetyVerifier, DEFAULT_SAFETY_SPEC

verifier = SafetyVerifier(spec=DEFAULT_SAFETY_SPEC)
cert = verifier.verify(tool_name="file_writer", effects=[
    EffectSpec(type="file_write", target="/data/output.csv"),
])
print(cert.verified)     # True
print(cert.proof_hash)   # 検証証明のハッシュ
```

### `SafetySpec`

安全仕様を定義します。

```python
from ai_guardian.safety import SafetySpec, Invariant

spec = SafetySpec(
    name="production-safety",
    invariants=[
        Invariant(
            name="no_system_write",
            description="システムディレクトリへの書き込み禁止",
            condition="effect.target not matches '/etc/**'",
        ),
        Invariant(
            name="no_network_exfil",
            description="外部ネットワークへのデータ送信禁止",
            condition="effect.type != 'network_send' or effect.target in allowed_hosts",
        ),
    ],
)
```

### `EffectSpec` / `Invariant` / `ProofCertificate`

```python
@dataclass
class EffectSpec:
    type: str          # "file_write", "network_send", "db_query", etc.
    target: str        # 対象リソース
    metadata: dict     # 追加メタデータ

@dataclass
class Invariant:
    name: str          # 不変条件名
    description: str   # 人間が読める説明
    condition: str     # 検証条件式

@dataclass
class ProofCertificate:
    verified: bool             # 全不変条件を満たしたか
    proof_hash: str            # 検証証明の SHA-256 ハッシュ
    checked_invariants: int    # 検証した不変条件の数
    violations: list[str]      # 違反した不変条件（あれば）
    timestamp: datetime        # 検証日時
```

### 定義済み安全仕様

```python
from ai_guardian.safety import DEFAULT_SAFETY_SPEC, STRICT_SAFETY_SPEC

# DEFAULT_SAFETY_SPEC — 一般的なアプリケーション向け
# STRICT_SAFETY_SPEC — 金融・医療向け（より厳格な制約）
verifier = SafetyVerifier(spec=STRICT_SAFETY_SPEC)
```

---

## `Guard.authorize_tool()`

v1.3.0 で追加。ケーパビリティ検証 + 安全性検証 + AEP を統合した単一エントリポイントです。

```python
from ai_guardian import Guard
from ai_guardian.capabilities import CapabilityStore, Capability

store = CapabilityStore()
store.grant("data_tool", Capability(
    resource="filesystem",
    actions=["read"],
    constraints={"paths": ["/data/**"]},
))

guard = Guard(policy="strict", capabilities=store)

# ツール呼び出しの認可（ケーパビリティ + 安全仕様を一括検証）
auth = guard.authorize_tool(
    tool_name="data_tool",
    action="read",
    resource="filesystem",
    target="/data/report.csv",
)
print(auth.authorized)    # True
print(auth.certificate)   # ProofCertificate
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
