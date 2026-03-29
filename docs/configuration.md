# 設定

## Guard コンストラクタ

```python
Guard(
    policy: str = "default",
    policy_file: str | None = None,
    auto_block_threshold: int | None = None,
    auto_allow_threshold: int | None = None,
)
```

| パラメータ             | 型             | デフォルト  | 説明                                                     |
|------------------------|----------------|-------------|----------------------------------------------------------|
| `policy`               | `str`          | `"default"` | 組み込みポリシー名: `"default"`, `"strict"`, `"permissive"` |
| `policy_file`          | `str \| None`  | `None`      | YAML ポリシーファイルのパス（`policy` より優先）         |
| `auto_block_threshold` | `int \| None`  | `None`      | ブロック閾値の上書き（0〜100）                           |
| `auto_allow_threshold` | `int \| None`  | `None`      | 許可閾値の上書き（0〜100）                               |

## 組み込みポリシー

### `"default"`（推奨）

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

## インライン閾値の上書き

```python
# スコア 70 以上をブロック、25 以下を許可
guard = Guard(auto_block_threshold=70, auto_allow_threshold=25)
```

## YAML ポリシーファイル

`pip install 'ai-guardian[yaml]'` が必要です。

```yaml
# policy.yaml
name: my-company-policy
description: Custom policy for ACME Corp

# リクエストを自動ブロックするスコア（0-100）
auto_block_threshold: 75

# リクエストを追加チェックなしで自動許可するスコア（0-100）
auto_allow_threshold: 20

custom_rules:
  # 競合他社名の言及をブロック
  - id: block_competitor
    name: Competitor Mention
    description: Flag any message mentioning CompetitorX
    pattern: "(?i)\\bCompetitorX\\b"
    score_delta: 60
    enabled: true

  # 財務データの一括取得を警告
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

### YAML スキーマリファレンス

| フィールド             | 型       | 必須 | 説明                                              |
|------------------------|----------|------|---------------------------------------------------|
| `name`                 | string   | いいえ | 人間が読める名前                                  |
| `description`          | string   | いいえ | 自由記述の説明文                                  |
| `auto_block_threshold` | integer  | いいえ | ブロック閾値の上書き（0〜100）                    |
| `auto_allow_threshold` | integer  | いいえ | 許可閾値の上書き（0〜100）                        |
| `custom_rules`         | list     | いいえ | `CustomRule` オブジェクトのリスト（後述）         |

#### CustomRule のフィールド

| フィールド    | 型      | 必須 | 説明                                                              |
|---------------|---------|------|-------------------------------------------------------------------|
| `id`          | string  | はい | 一意の識別子（snake_case）                                        |
| `name`        | string  | はい | `reasons` に表示される人間が読めるラベル                          |
| `description` | string  | いいえ | 詳細な説明                                                        |
| `pattern`     | string  | はい | Python 正規表現（デフォルトで `re.IGNORECASE` 付きでコンパイル）  |
| `score_delta` | integer | はい | パターンがマッチした際にリスクスコアに加算されるポイント（1〜100）|
| `enabled`     | boolean | はい | `false` にするとルールを削除せず無効化できる                      |

## リスクスコアリングモデル

スコアは以下のように算出されます。

1. マッチしたパターンごとに `score_delta` が加算される。
2. 同一カテゴリ内では、ノイズの多い入力によるスコアの暴走を防ぐため、**最大ベーススコアの 2 倍**が上限となる。
3. 最終スコアは `[0, 100]` にクランプされる。

| スコア範囲  | リスクレベル | アクション     |
|-------------|------------|----------------|
| 0 〜 30     | LOW        | 安全           |
| 31 〜 60    | MEDIUM     | ログ記録＆許可 |
| 61 〜 80    | HIGH       | ログ記録＆許可 |
| 81 〜 100   | CRITICAL   | ブロック       |

## 環境変数による設定

セルフホスト型バックエンド専用です（`backend/.env.example` を参照）。

```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/ai_guardian
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=change-me-in-production
OPENAI_API_KEY=sk-...
DEBUG=false
DEMO_MODE=false
```
