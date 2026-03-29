# AI Guardian アーキテクチャ

## 概要

AI Guardian は **AIエージェント向け汎用ガバナンスレイヤー** である。エンタープライズ環境でAIエージェント（Claude Code、Cursor、独自エージェント）が実行するすべての操作を監視・制御・監査する。

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

## モジュール構成

```
ai_guardian/
│
├── scanner.py              # Layer 0: 脅威検出コア
│   ├── scan()              #   ユーザー入力スキャン（48パターン + 類似度）
│   ├── scan_output()       #   LLM応答スキャン
│   ├── scan_messages()     #   マルチターン会話スキャン
│   ├── scan_rag_context()  #   RAGドキュメントスキャン
│   ├── sanitize()          #   PII自動マスキング
│   └── _normalize_text()   #   回避手法の無効化（NFKC、ゼロ幅文字、スペース挿入）
│
├── patterns.py             # 検出パターン定義
│   ├── PROMPT_INJECTION    #   英語12 + 日本語6パターン
│   ├── SQL_INJECTION       #   6パターン
│   ├── PII_INPUT           #   8パターン（マイナンバー、電話番号等）
│   ├── COMMAND_INJECTION   #   2パターン
│   ├── CONFIDENTIAL        #   3パターン
│   ├── LEGAL_RISK          #   2パターン（営業秘密、著作権）
│   └── OUTPUT_PATTERNS     #   7パターン（PII漏洩、秘密情報漏洩）
│
├── similarity.py           # Layer 2: 意味的類似度検出
│   ├── ATTACK_CORPUS       #   40件の標準的な攻撃フレーズ（英語 + 日本語）
│   ├── _ATTACK_SIGNAL_WORDS #  シグナルワードフィルタ（誤検知削減用）
│   └── check_similarity()  #   difflib + n-gramによるファジーマッチング
│
├── activity.py             # Activity Stream（多階層ログ）
│   ├── ActivityEvent       #   汎用イベントスキーマ（AGI対応フィールド含む）
│   ├── ActivityStream      #   3階層: Local + Global + Alert アーカイブ
│   │   ├── record()        #     該当する全階層に追記
│   │   ├── query()         #     action/agent/risk/user でフィルタ
│   │   ├── summary()       #     集計統計（by_user, by_project 等）
│   │   ├── export_csv()    #     Excel互換CSVエクスポート
│   │   ├── export_excel_summary()  #  サマリ + イベント一括出力
│   │   ├── rotate_logs()   #     7日後に圧縮、60日後に削除
│   │   └── get_alert_knowledge()   #  自動修正AI向けアラート履歴
│   └── _dict_to_event()    #   寛容なデシリアライゼーション
│
├── policy.py               # ポリシーエンジン（宣言的YAMLルール）
│   ├── PolicyRule          #   allow/deny/review + conditions（AGIスタブ）
│   ├── Policy              #   ルールコレクション + デフォルト判定
│   ├── load_policy()       #   YAML/JSONローダー（標準ライブラリのみ）
│   ├── evaluate()          #   先頭一致ルール評価
│   ├── save_policy()       #   YAML形式出力
│   └── _default_policy()   #   14個の組み込みセキュリティルール
│
├── compliance.py           # 日本の法規制マッピング
│   ├── ComplianceItem      #   法規制 → 機能 → 対応状況
│   ├── get_compliance_report()   #  24項目、全項目対応済み
│   └── get_compliance_summary()  #  カバー率: 100%
│
├── cli.py                  # CLIエントリポイント（aig コマンド）
│   ├── aig init            #   プロジェクト初期化 + Claude Code hooks設定
│   ├── aig logs            #   Activity Stream 閲覧
│   ├── aig policy          #   ポリシー管理
│   ├── aig status          #   ガバナンス概要
│   ├── aig report          #   コンプライアンスレポート
│   ├── aig maintenance     #   ログローテーション
│   └── aig scan            #   脅威クイックスキャン
│
├── adapters/
│   └── claude_code.py      # Claude Code hooks連携
│       ├── install_hooks()       #  .claude/settings.json の自動設定
│       ├── generate_hooks_config()  # PreToolUse hook設定生成
│       └── HOOK_SCRIPT           #  インターセプタ（スキャン + ポリシー + ログ）
│
└── badge.py                # UIバッジコンポーネント（SVG）
```

## データフロー

### エージェント操作 → ガバナンス判定

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

### フローの説明

1. エージェントがツールを呼び出す（例: Bash で `rm -rf /`）
2. アダプタが呼び出しをインターセプト（Claude Code hook: PreToolUse）
3. ActivityEvent を構築（action、target、user_id、agent_type を記録）
4. 脅威スキャンを実行（該当する場合）
   - `_normalize_text()` で回避手法を無効化
   - 48個の正規表現でパターンマッチング
   - 40フレーズで類似度チェック
   - リスクスコアとリスクレベルを算出
5. ポリシー評価
   - `ai-guardian-policy.yaml` を読み込み
   - ルールを上から順に照合（最初に一致したルールが適用）
   - 判定結果を返す
6. Activity Stream に全階層で記録
   - Local: プロジェクトローカルログ
   - Global: 全プロジェクト横断ログ
   - Alert: ブロック/レビュー対象のみ
7. エージェントに判定結果を返却
   - `exit 0` → 許可（ツール実行）
   - `exit 2` → 拒否（ツールブロック、理由を stderr に出力）

## ログアーキテクチャ

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

### ログ階層の説明

- **プロジェクト単位**（ユーザーから参照可能）
  - `.ai-guardian/logs/` 配下に日次JSONLファイルを保存
  - 7日経過後に自動圧縮、60日経過後に自動削除

- **グローバル**（CISO・監査用、プロジェクト横断）
  - `~/.ai-guardian/global/` に全プロジェクトのログを集約
  - `~/.ai-guardian/alerts/` にブロック・レビュー対象イベントのみ保存
  - アラートログは削除されない（ナレッジベースとして永続保持）

## AGI対応スキーマ

ActivityEvent には将来のガバナンス拡張に備えたフィールドが含まれている。

| フィールド | 型 | 用途 | 状態 |
|-------|------|---------|--------|
| `autonomy_level` | int (1-5) | エージェント自律度スケール | スキーマ定義済み |
| `delegation_chain` | list[str] | エージェント間の委任追跡 | スキーマ定義済み |
| `estimated_cost` | float | API/計算コストのガバナンス | スキーマ定義済み |
| `memory_scope` | str | 知識境界の強制 | スキーマ定義済み |
| `suggested_fix` | str | AIが提案する安全な代替操作 | スキーマ定義済み |
| `fix_applied` | bool | 自動修正が適用されたか | スキーマ定義済み |

PolicyRule の `conditions` は将来の条件チェックに対応している。

```yaml
conditions:
  autonomy_level: 3        # レベル3以上でないと実行不可
  cost_limit: 1.0          # 推定コストが$1超で拒否
  department: "engineering" # engineering部門のみ許可
  memory_retention: "90d"  # 90日後に自動削除
```

## セキュリティ設計原則

1. **外部依存ゼロ** --- Python標準ライブラリのみ使用（サプライチェーンリスクの排除）
2. **デフォルトで許可** --- hookのエラー時はエージェントをブロックしない（グレースフルデグラデーション）
3. **追記専用ログ** --- JSONLファイルへの追記のみ、更新・削除操作なし
4. **ポリシー as コード** --- YAMLをgitで管理し、バージョン管理と監査を実現
5. **エージェント非依存** --- アダプタパターンにより任意のエージェントに対応
6. **検出 + 修復** --- すべてのブロックにOWASPリファレンスと修正ガイダンスを付与
