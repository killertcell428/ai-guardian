# AI Guardian アーキテクチャ（v1.1.0）

> Last updated: 2026-04-07
> Version: v1.1.0 — 137 patterns, 5-layer detection, MCP server scanner

## 概要

AI Guardian は **AIエージェント向け汎用セキュリティレイヤー** である。LLMアプリケーションの入力・出力・MCP ツール定義を監視し、プロンプトインジェクションからデータ漏洩まで19カテゴリの脅威を検出・ブロック・修復ガイダンス付きで報告する。外部依存ゼロ（Python 標準ライブラリのみ）。

```
┌──────────────────────────────────────────────────────────────────────┐
│                          AI Agents                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Claude   │  │ OpenAI / │  │ LangChain│  │ Custom   │            │
│  │ Code     │  │ Anthropic│  │ LangGraph│  │ Agent    │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │              │              │              │                  │
│       ▼              ▼              ▼              ▼                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │              AI Guardian Security Layer                      │     │
│  │                                                              │     │
│  │  ┌────────────────────────────────────────────────────────┐ │     │
│  │  │  Adapter Layer                                          │ │     │
│  │  │  Claude Code hooks │ FastAPI middleware │ LangChain CB  │ │     │
│  │  │  Anthropic Proxy   │ OpenAI Proxy      │ LangGraph Node│ │     │
│  │  └─────────┬──────────────────────────────────────────────┘ │     │
│  │            │                                                 │     │
│  │  ┌─────────▼──────────────────────────────────────────────┐ │     │
│  │  │  Detection Pipeline（5層）                              │ │     │
│  │  │                                                         │ │     │
│  │  │  L1. Text Normalization                                 │ │     │
│  │  │      NFKC正規化 → ゼロ幅文字除去 → スペース圧縮        │ │     │
│  │  │      → Confusable正規化 → Emoji除去                    │ │     │
│  │  │                                                         │ │     │
│  │  │  L2. Pattern Matching（137パターン）                    │ │     │
│  │  │      19カテゴリ × 4言語（EN/JA/KO/ZH）                 │ │     │
│  │  │                                                         │ │     │
│  │  │  L3. Active Decoding ★v1.1新機能                       │ │     │
│  │  │      Base64/Hex/URL/ROT13 → デコード → 再スキャン      │ │     │
│  │  │                                                         │ │     │
│  │  │  L4. Semantic Similarity（56フレーズ）                  │ │     │
│  │  │      difflib + n-gram ファジーマッチング                │ │     │
│  │  │                                                         │ │     │
│  │  │  L5. Policy Evaluation                                  │ │     │
│  │  │      YAML宣言ルール → allow / deny / review             │ │     │
│  │  └─────────┬──────────────────────────────────────────────┘ │     │
│  │            │                                                 │     │
│  │  ┌─────────▼──────────────────────────────────────────────┐ │     │
│  │  │  Output Layer                                           │ │     │
│  │  │                                                         │ │     │
│  │  │  Activity Stream ─► Local + Global + Alert（3階層ログ）│ │     │
│  │  │  Remediation Hints（OWASP/CWE/MITRE 参照付き）         │ │     │
│  │  │  Compliance Report（OWASP/NIST/MITRE/CSA/AI事業者GL）  │ │     │
│  │  │  Benchmark Report / Badge（shields.io）                 │ │     │
│  │  └────────────────────────────────────────────────────────┘ │     │
│  └─────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

## モジュール構成

```
ai_guardian/
│
├── scanner.py              # コア検出エンジン
│   ├── scan()              #   ユーザー入力スキャン
│   ├── scan_output()       #   LLM応答スキャン
│   ├── scan_messages()     #   マルチターン会話スキャン（エスカレーション検知）
│   ├── scan_rag_context()  #   RAGドキュメントスキャン
│   ├── scan_mcp_tool()     #   MCPツール定義スキャン
│   ├── scan_mcp_tools()    #   複数MCPツール一括スキャン
│   ├── sanitize()          #   PII自動マスキング
│   ├── _normalize_text()   #   L1: 正規化（NFKC + ゼロ幅 + スペース + Confusable + Emoji）
│   └── _run_patterns()     #   L2-L4: パターン→デコード→類似度の順次実行
│
├── decoders.py             # ★v1.1 L3: アクティブデコーディング
│   ├── decode_base64_payloads()    #   Base64検出・デコード
│   ├── decode_hex_payloads()       #   \xNN / 0xNNNN デコード
│   ├── decode_url_encoding()       #   %XX パーセントエンコーディング
│   ├── decode_rot13()              #   ROT13（指標付きテキスト検出）
│   ├── normalize_confusables()     #   Cyrillic/Greek → Latin ホモグリフ変換
│   ├── strip_emojis()              #   Emoji除去
│   └── decode_all()                #   全デコーダ適用 → 変種リスト返却
│
├── mcp_scanner.py          # ★v1.1 MCPサーバーレベルスキャナー
│   ├── scan_mcp_server()           #   サーバー全体の包括分析
│   ├── detect_rug_pull()           #   スナップショット比較によるラグプル検知
│   ├── analyze_permissions()       #   権限スコープ分析（4軸）
│   ├── score_server_trust()        #   信頼スコア算出（0-100）
│   ├── snapshot_tool()             #   ツール定義のスナップショット作成
│   ├── save_snapshots() / load_snapshots()  # スナップショット永続化
│   ├── MCPToolSnapshot             #   スナップショットデータクラス
│   ├── MCPServerReport             #   サーバーレポートデータクラス
│   └── MCPDiffResult               #   差分結果データクラス
│
├── filters/
│   └── patterns.py         # 全137検出パターン定義（19カテゴリ）
│       ├── PROMPT_INJECTION_PATTERNS        # EN 7 + JA 6 + KO 4 + ZH 4 = 21
│       ├── JAILBREAK_ROLEPLAY_PATTERNS      # 6
│       ├── MCP_SECURITY_PATTERNS            # 14（★v1.1 +3: 権限昇格/ラグプル/隠しツール）
│       ├── INDIRECT_INJECTION_PATTERNS      # 5
│       ├── ENCODING_BYPASS_PATTERNS         # 8（★v1.1 +3: nested/confusable/URL-encoded）
│       ├── MEMORY_POISONING_PATTERNS        # 9（★v1.1 +5: cross-session/drift/KO/ZH）
│       ├── SECOND_ORDER_INJECTION_PATTERNS  # 9（★v1.1 +5: tool-chain/craft/KO/ZH）
│       ├── SQL_INJECTION_PATTERNS           # 8
│       ├── COMMAND_INJECTION_PATTERNS       # 2
│       ├── DATA_EXFIL_PATTERNS              # 4
│       ├── PII_INPUT_PATTERNS               # JP 5 + Intl 4 + KO 3 + ZH 3 = 15
│       ├── CONFIDENTIAL_DATA_PATTERNS       # 3
│       ├── LEGAL_RISK_PATTERNS              # 2
│       ├── PROMPT_LEAK_PATTERNS             # EN 6 + JA 2 = 8
│       ├── TOKEN_EXHAUSTION_PATTERNS        # 5
│       ├── HALLUCINATION_ACTION_PATTERNS    # 3
│       ├── SYNTHETIC_CONTENT_PATTERNS       # 4
│       ├── EMOTIONAL_MANIPULATION_PATTERNS  # 3
│       ├── OVER_RELIANCE_PATTERNS           # 3
│       └── OUTPUT_PATTERNS                  # 9（SSN/CC/Email/Secret/Harmful/MyNumber/Phone等）
│
├── similarity.py           # L4: 意味的類似度検出
│   ├── ATTACK_CORPUS       #   56件の攻撃フレーズ（EN + JA + KO + ZH）
│   └── check_similarity()  #   difflib + n-gram ファジーマッチング
│
├── guard.py                # OOP API（Guardクラス）
│   ├── Guard               #   check_input() / check_output() / check_messages()
│   └── CheckResult         #   blocked / risk_level / reasons / remediation
│
├── benchmark.py            # ベンチマークスイート
│   ├── BenchmarkSuite      #   精度ベンチマーク（112攻撃 + 26安全入力）
│   │   ├── run()           #     カテゴリ別検出率
│   │   ├── run_latency()   #     レイテンシ計測（Avg/P95/P99/throughput）
│   │   └── run_json()      #     JSON出力
│   ├── LatencyResult       #   ★v1.1: to_markdown_report() / to_badge_json()
│   └── ATTACK_CORPUS       #   16カテゴリの攻撃コーパス
│
├── redteam.py              # レッドチームスイート
│   ├── RedTeamSuite        #   テンプレートベース攻撃生成
│   │   ├── run()           #     標準モード（9カテゴリ）
│   │   └── run_adaptive()  #     ★v1.1: 適応型変異（最大N回変異→再試行）
│   ├── MultiStepAttack     #   ★v1.1: マルチステップ攻撃チェーン
│   ├── RedTeamReportGenerator  # ★v1.1: Markdown/HTMLレポート生成
│   ├── make_http_check()   #   ★v1.1: HTTPエンドポイントテスト
│   └── _adaptive_mutate()  #   ★v1.1: 5変異戦略（spacing/emoji/case/prefix/synonym）
│
├── activity.py             # Activity Stream（3階層ログ）
│   ├── ActivityStream      #   record() / query() / export_csv() / export_excel_summary()
│   └── rotate_logs()       #   7日後圧縮、60日後削除
│
├── policy.py               # ポリシーエンジン（宣言的YAML）
│   ├── load_policy()       #   YAML/JSONローダー
│   └── evaluate()          #   先頭一致ルール評価 → allow/deny/review
│
├── compliance.py           # コンプライアンスマッピング（AI事業者GL v1.2: 37/37）
│
├── cli.py                  # CLI（aigコマンド）
│   ├── aig scan            #   テキストスキャン
│   ├── aig mcp             #   MCPツールスキャン
│   │   ├── --trust         #     ★v1.1: サーバー信頼スコア表示
│   │   ├── --diff          #     ★v1.1: ラグプル検知（スナップショット比較）
│   │   └── --server        #     ★v1.1: サーバーURL指定
│   ├── aig redteam         #   レッドチーム
│   │   ├── --adaptive      #     ★v1.1: 適応型変異モード
│   │   ├── --report        #     ★v1.1: 脆弱性レポート生成
│   │   └── --target-url    #     ★v1.1: HTTPエンドポイントテスト
│   ├── aig benchmark       #   ベンチマーク
│   │   ├── --latency       #     レイテンシ計測
│   │   ├── --report        #     ★v1.1: Markdownレポート生成
│   │   └── --badge         #     ★v1.1: shields.ioバッジJSON
│   ├── aig init            #   プロジェクト初期化
│   ├── aig logs            #   Activity Stream閲覧
│   ├── aig policy          #   ポリシー管理
│   ├── aig status          #   ガバナンス概要
│   ├── aig report          #   コンプライアンスレポート
│   ├── aig maintenance     #   ログローテーション
│   └── aig doctor          #   セットアップ診断
│
├── middleware/              # フレームワーク統合
│   ├── fastapi.py          #   FastAPI/Starlette ミドルウェア
│   ├── langchain.py        #   LangChain コールバック
│   ├── langgraph.py        #   LangGraph GuardNode
│   ├── anthropic_proxy.py  #   SecureAnthropic ドロップインプロキシ
│   └── openai_proxy.py     #   SecureOpenAI ドロップインプロキシ
│
├── adapters/
│   └── claude_code.py      #   Claude Code hooks連携（PreToolUse）
│
└── badge.py                #   「Secured by AI Guardian」バッジ（SVG）
```

## 検出パイプライン詳細

入力テキストがどのように処理されるかの全フロー：

```
入力テキスト
    │
    ▼
┌─── L1: Text Normalization ────────────────────────────────────┐
│  ① NFKC正規化（全角→半角、合字→分解）                        │
│  ② ゼロ幅文字除去（U+200B, U+FEFF 等 12種）                  │
│  ③ スペース挿入圧縮（"D R O P" → "DROP"）                    │
│  ④ Confusable正規化（Cyrillic а→a, Greek ο→o 等 40+文字）   │
│  ⑤ Emoji除去（絵文字挿入攻撃の無効化）                        │
└───────┬───────────────────────────────────────────────────────┘
        │ 正規化テキスト（元テキスト + 変換版を連結）
        ▼
┌─── L2: Pattern Matching ──────────────────────────────────────┐
│  137パターン（19カテゴリ × 4言語）を順次照合                   │
│  マッチ → MatchedRule 生成（rule_id, score_delta, owasp_ref） │
│  カテゴリ別スコア集計（上限: base_score × 2 / カテゴリ）      │
└───────┬───────────────────────────────────────────────────────┘
        │
        ▼
┌─── L3: Active Decoding ★v1.1 ─────────────────────────────────┐
│  エンコード指標を検出した場合のみ実行（性能への影響最小化）     │
│                                                                 │
│  ① Base64文字列 → base64.b64decode → テキスト化               │
│  ② Hex(\xNN) → bytes.fromhex → テキスト化                     │
│  ③ URL(%XX) → urllib.parse.unquote                             │
│  ④ ROT13指標付きテキスト → codecs.decode(rot_13)              │
│                                                                 │
│  デコード結果を L1→L2 で再スキャン                              │
│  新規マッチのみ追加（重複排除: rule_id ベース）                 │
│  ルール名に "(decoded)" を付与して追跡可能に                    │
└───────┬────────────────────────────────────────────────────────┘
        │
        ▼
┌─── L4: Semantic Similarity ───────────────────────────────────┐
│  56件の攻撃フレーズ辞書と類似度比較                            │
│  L2で未検出のカテゴリのみ対象（二重検出防止）                  │
│  difflib.SequenceMatcher + n-gram で閾値判定                  │
└───────┬───────────────────────────────────────────────────────┘
        │
        ▼
┌─── スコア算出 ────────────────────────────────────────────────┐
│  total = min(Σカテゴリスコア, 100)                             │
│  risk_level:                                                   │
│    0-30  → low（安全）                                         │
│    31-60 → medium（要確認）                                    │
│    61-80 → high（危険）                                        │
│    81+   → critical（自動ブロック）                             │
└───────┬───────────────────────────────────────────────────────┘
        │
        ▼
  ScanResult {
    risk_score, risk_level, matched_rules[],
    reason, is_safe, needs_review, is_blocked,
    remediation { primary_threat, owasp_refs, hints, action }
  }
```

## MCP セキュリティアーキテクチャ

### 6つの攻撃面

```
MCPサーバー                                    AI Guardian 防御
┌──────────────────────┐
│ tools/list レスポンス │
│                      │
│ ① Tool Description   │──▶ 14 MCPパターン + 全入力パターン
│    <IMPORTANT>タグ    │    （description フィールドをスキャン）
│                      │
│ ② Parameter Schema   │──▶ inputSchema.properties の
│    隠し説明文         │    name + description を再帰スキャン
│                      │
│ ③ Tool Output        │──▶ scan_output() で応答をスキャン
│    再注入指示         │    （出力ポイズニング検知）
│                      │
│ ④ Cross-Tool Shadow  │──▶ mcp_cross_tool_shadow パターン
│    他ツールの操作     │    （ツール間の干渉検知）
│                      │
│ ⑤ Rug Pull           │──▶ ★v1.1: スナップショット比較
│    定義の悪意ある変更 │    detect_rug_pull() + 差分スキャン
│                      │
│ ⑥ Sampling Hijack    │──▶ プロンプト注入パターンで検知
│    コンテキスト汚染   │
└──────────────────────┘
```

### v1.1 MCPサーバーレベル分析

```
aig mcp --file tools.json --trust --diff
         │
         ▼
┌─── 各ツールスキャン ──────────────┐
│  scan_mcp_tool(tool) × N           │
│  → ScanResult per tool             │
└─────────┬──────────────────────────┘
          │
          ▼
┌─── 権限分析 ─────────────────────┐
│  analyze_permissions(tool):        │
│    file_system  (read/write/del)   │
│    network      (http/fetch/send)  │
│    code_execution (exec/shell)     │
│    sensitive_data (creds/keys)     │
└─────────┬──────────────────────────┘
          │
          ▼
┌─── ラグプル検知 ─────────────────┐
│  load_snapshots(前回)              │
│  detect_rug_pull(前回, 今回)       │
│  → 説明文の変更 + 新パターン検知  │
│  save_snapshots(今回)              │
└─────────┬──────────────────────────┘
          │
          ▼
┌─── 信頼スコア算出 ───────────────┐
│  score_server_trust():             │
│  100 - avg_risk - permission_pen   │
│    70-100: trusted                 │
│    40-69:  suspicious              │
│    0-39:   dangerous               │
└─────────┬──────────────────────────┘
          │
          ▼
  MCPServerReport {
    trust_score, trust_level,
    tool_results, permission_summaries,
    rug_pull_alerts
  }
```

## エージェント操作 → ガバナンス判定フロー

```
1. Agent がツールを呼び出す（例: Bash "rm -rf /"）
       │
       ▼
2. Adapter がインターセプト
   ├── Claude Code hook: PreToolUse
   ├── FastAPI middleware: POST/PUT/PATCH
   ├── LangChain callback: on_llm_start
   ├── Anthropic/OpenAI Proxy: messages.create
   └── LangGraph GuardNode: ノード実行前
       │
       ▼
3. ActivityEvent を構築
   action: "shell:exec", target: "rm -rf /",
   user_id: "tanaka", agent_type: "claude_code"
       │
       ▼
4. 検出パイプライン実行（L1→L2→L3→L4）
   → risk_score: 90, risk_level: "critical"
   → matched_rules: [cmdi_shell, ...]
       │
       ▼
5. ポリシー評価
   ai-guardian-policy.yaml を読み込み
   先頭一致ルール評価 → decision: "deny"
       │
       ▼
6. Activity Stream に記録（全3階層）
   Local:  .ai-guardian/logs/2026-04-07.jsonl
   Global: ~/.ai-guardian/global/2026-04-07.jsonl
   Alert:  ~/.ai-guardian/alerts/2026-04-07.jsonl
       │
       ▼
7. エージェントに判定返却
   exit 0 → allow（ツール実行）
   exit 2 → deny（ツールブロック + 理由 + 修復ガイダンス）
```

## レッドチームアーキテクチャ

### 標準モード vs 適応型モード

```
標準モード (aig redteam)               適応型モード (aig redteam --adaptive)
┌──────────────────┐                   ┌──────────────────┐
│ テンプレート生成  │                   │ テンプレート生成  │
│ 9カテゴリ × N本  │                   │ 9カテゴリ × N本  │
└────────┬─────────┘                   └────────┬─────────┘
         │                                      │
         ▼                                      ▼
┌──────────────────┐                   ┌──────────────────┐
│ スキャン実行      │                   │ スキャン実行      │
│ blocked/bypassed │                   │ blocked/bypassed │
└────────┬─────────┘                   └────────┬─────────┘
         │                                      │ blocked?
         ▼                                      ▼
      結果集計                          ┌──────────────────┐
                                       │ 変異適用（5戦略） │
                                       │ ① char spacing   │
                                       │ ② emoji挿入      │
                                       │ ③ case mix       │
                                       │ ④ prefix/suffix  │
                                       │ ⑤ synonym置換    │
                                       └────────┬─────────┘
                                                │
                                                ▼
                                       再スキャン（最大N回）
                                                │
                                                ▼
                                       最終結果集計
                                       + Markdown/HTMLレポート
```

## セキュリティカバー範囲

### 19カテゴリ × パターン数

| # | カテゴリ | パターン数 | 言語 | OWASP LLM |
|---|---------|:----------:|:----:|-----------|
| 1 | Prompt Injection | 21 | EN/JA/KO/ZH | LLM01 |
| 2 | Jailbreak / Roleplay | 6 | EN | LLM01 |
| 3 | MCP Tool Poisoning | 14 | EN | LLM01 |
| 4 | Indirect Injection (RAG) | 5 | EN | LLM01 |
| 5 | Encoding Bypass | 8 | EN | LLM01 |
| 6 | Memory Poisoning | 9 | EN/JA/KO/ZH | LLM01 |
| 7 | Second-Order Injection | 9 | EN/JA/KO/ZH | LLM01 |
| 8 | System Prompt Leak | 8 | EN/JA | LLM07 |
| 9 | SQL Injection | 8 | EN | — |
| 10 | Command Injection | 2 | EN | — |
| 11 | Data Exfiltration | 4 | EN | LLM06 |
| 12 | PII Detection (Input) | 15 | JP/Intl/KO/ZH | LLM02 |
| 13 | Confidential Data | 3 | EN/JA | LLM02 |
| 14 | Legal Risk | 2 | JA | — |
| 15 | Token Exhaustion | 5 | EN | LLM10 |
| 16 | Hallucination Action | 3 | EN/JA | — |
| 17 | Synthetic Content | 4 | EN/JA | — |
| 18 | Emotional Manipulation | 3 | EN/JA | — |
| 19 | Over-Reliance | 3 | EN/JA | — |
| — | **Output Safety** | **9** | EN/JA | LLM02/LLM05 |
| | **合計** | **137 + 9** | | |

### フレームワークカバレッジ

| フレームワーク | カバー範囲 |
|-------------|-----------|
| OWASP LLM Top 10 (2025) | 8/10 リスク（LLM03 Supply Chain, LLM09 Misinformation は対象外） |
| NIST AI RMF 1.0 | 4/4 機能（Govern, Map, Measure, Manage） |
| MITRE ATLAS | 40/67 テクニック（残27はインフラ/事前段階） |
| CSA STAR for AI | 8/10 ドメイン（AI Model Dev, Fairness は N/A） |
| AI事業者ガイドライン v1.2 | 37/37 要件（100%） |

## ログアーキテクチャ（3階層）

```
プロジェクト単位（ユーザーから参照可能）:
  .ai-guardian/
  ├── logs/
  │   ├── 2026-04-07.jsonl        ← 本日のイベント
  │   ├── 2026-03-31.jsonl.gz     ← 圧縮済み（7日経過後）
  │   └── ...                      ← 60日後に自動削除
  └── mcp_snapshots/               ← ★v1.1: MCPスナップショット保存
      └── mcp_<server_hash>.json

グローバル（CISO/監査、プロジェクト横断）:
  ~/.ai-guardian/
  ├── global/
  │   └── 2026-04-07.jsonl        ← 全プロジェクト集約
  └── alerts/
      └── 2026-04-07.jsonl        ← ブロック/レビューのみ（永久保持）
```

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

## セキュリティ設計原則

1. **外部依存ゼロ** — Python標準ライブラリのみ使用（サプライチェーンリスクの排除）
2. **デフォルトで許可** — hookのエラー時はエージェントをブロックしない（グレースフルデグラデーション）
3. **追記専用ログ** — JSONLファイルへの追記のみ、更新・削除操作なし
4. **ポリシー as コード** — YAMLをgitで管理し、バージョン管理と監査を実現
5. **エージェント非依存** — アダプタパターンにより任意のエージェントに対応
6. **検出 + 修復** — すべてのブロックにOWASPリファレンスと修正ガイダンスを付与
7. **多層防御** — 正規化→パターン→デコード→類似度→ポリシーの5層で回避困難な検出を実現
