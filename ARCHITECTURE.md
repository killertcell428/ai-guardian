# AI Guardian アーキテクチャ（v1.3.1）

> Last updated: 2026-04-10
> Version: v1.3.1 — 165+ patterns, 25+ threat categories, 6-layer detection, CaMeL capabilities, AEP, Safety Specs

## 概要

AI Guardian は **AIエージェント向け汎用セキュリティレイヤー** である。LLMアプリケーションの入力・出力・MCP ツール定義を監視し、プロンプトインジェクションからデータ漏洩まで25+カテゴリの脅威を検出・ブロック・修復ガイダンス付きで報告する。v1.3.1 では従来の3層検出（パターン・類似度・デコード）に加え、CaMeL ベースのケーパビリティ制御（L4）、Atomic Execution Pipeline（L5）、Safety Specification & Verifier（L6）を追加し、6層防御を実現。外部依存ゼロ（Python 標準ライブラリのみ）。

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
│  │  │  Detection & Enforcement Pipeline（6層）                │ │     │
│  │  │                                                         │ │     │
│  │  │  L1. Regex Pattern Matching（165+パターン）             │ │     │
│  │  │      25+カテゴリ × 4言語（EN/JA/KO/ZH）                │ │     │
│  │  │      + NFKC正規化 + ゼロ幅文字除去 + スペース圧縮      │ │     │
│  │  │      + Confusable正規化 + Emoji除去                    │ │     │
│  │  │                                                         │ │     │
│  │  │  L2. Semantic Similarity Detection（56フレーズ）        │ │     │
│  │  │      difflib + n-gram ファジーマッチング                │ │     │
│  │  │                                                         │ │     │
│  │  │  L3. Active Decoding                                    │ │     │
│  │  │      Base64/Hex/ROT13/URL/Unicode → デコード → 再スキャン│ │    │
│  │  │                                                         │ │     │
│  │  │  L4. Capability-Based Access Control ★v1.2              │ │     │
│  │  │      CaMeL: 制御フロー/データフロー分離                 │ │     │
│  │  │      テイント追跡 + 権限トークン + ポリシー強制          │ │     │
│  │  │                                                         │ │     │
│  │  │  L5. Atomic Execution Pipeline (AEP) ★v1.3              │ │     │
│  │  │      Scan → Execute → Vaporize（原子的実行）            │ │     │
│  │  │      サンドボックス隔離 + 痕跡消去                      │ │     │
│  │  │                                                         │ │     │
│  │  │  L6. Safety Specification & Verifier ★v1.3.1            │ │     │
│  │  │      宣言的安全仕様 + 証明書検証                        │ │     │
│  │  │      ビルトイン仕様（no_exfil, no_exec, pii_guard等）   │ │     │
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
│   ├── _normalize_text()   #   正規化（NFKC + ゼロ幅 + スペース + Confusable + Emoji）
│   └── _run_patterns()     #   L1-L3: パターン→類似度→デコードの順次実行
│
├── decoders.py             # L3: アクティブデコーディング
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
│   └── patterns.py         # 全165+検出パターン定義（25+カテゴリ）
│       ├── PROMPT_INJECTION_PATTERNS        # EN 6 + JA 4 + KO 4 + ZH 4 = 18
│       ├── JAILBREAK_ROLEPLAY_PATTERNS      # 6
│       ├── MCP_SECURITY_PATTERNS            # 13
│       ├── INDIRECT_INJECTION_PATTERNS      # 5
│       ├── ENCODING_BYPASS_PATTERNS         # 8
│       ├── MEMORY_POISONING_PATTERNS        # 9
│       ├── SECOND_ORDER_INJECTION_PATTERNS  # 9
│       ├── SQL_INJECTION_PATTERNS           # 8
│       ├── COMMAND_INJECTION_PATTERNS       # 2
│       ├── DATA_EXFIL_PATTERNS              # 4
│       ├── PII_INPUT_PATTERNS               # JP + Intl + KO + ZH = 11+
│       ├── CONFIDENTIAL_DATA_PATTERNS       # 3
│       ├── PROMPT_LEAK_PATTERNS             # EN 6 + JA 2 = 8
│       ├── TOKEN_EXHAUSTION_PATTERNS        # 5
│       ├── HALLUCINATION_ACTION_PATTERNS    # 3
│       ├── SYNTHETIC_CONTENT_PATTERNS       # 4
│       ├── EMOTIONAL_MANIPULATION_PATTERNS  # 3
│       ├── OVER_RELIANCE_PATTERNS           # 3
│       ├── SANDBOX_ESCAPE_PATTERNS          # ★v1.2: 4
│       ├── SELF_PRIVILEGE_ESCALATION_PATTERNS # ★v1.2: 4
│       ├── COT_DECEPTION_PATTERNS           # ★v1.2: 3
│       ├── EVALUATION_GAMING_PATTERNS       # ★v1.2: 3
│       ├── AUDIT_TAMPERING_PATTERNS         # ★v1.2: 4
│       ├── AUTONOMOUS_EXPLOIT_PATTERNS      # ★v1.2: 5
│       └── OUTPUT_PATTERNS                  # 9（SSN/CC/Email/Secret/Harmful/MyNumber/Phone等）
│
├── similarity.py           # L2: 意味的類似度検出
│   ├── ATTACK_CORPUS       #   56件の攻撃フレーズ（EN + JA + KO + ZH）
│   └── check_similarity()  #   difflib + n-gram ファジーマッチング
│
├── capabilities/           # ★v1.2 L4: CaMeL ケーパビリティベースアクセス制御
│   ├── __init__.py
│   ├── enforcer.py         #   ケーパビリティ強制（権限チェック + ポリシー適用）
│   ├── policy_bridge.py    #   既存ポリシーエンジンとの橋渡し
│   ├── store.py            #   ケーパビリティストア（権限永続化）
│   ├── taint.py            #   テイント追跡（データフロー汚染伝搬）
│   └── tokens.py           #   権限トークン（制御フロー/データフロー分離）
│
├── aep/                    # ★v1.3 L5: Atomic Execution Pipeline
│   ├── __init__.py
│   ├── pipeline.py         #   Scan → Execute → Vaporize パイプライン
│   ├── sandbox.py          #   サンドボックス隔離実行
│   └── vaporizer.py        #   実行痕跡の安全消去
│
├── safety/                 # ★v1.3.1 L6: Safety Specification & Verifier
│   ├── __init__.py
│   ├── spec.py             #   安全仕様の宣言的定義（SafetySpec）
│   ├── builtin_specs.py    #   ビルトイン仕様（no_exfil, no_exec, pii_guard 等）
│   ├── loader.py           #   YAML/JSON から仕様をロード
│   └── verifier.py         #   証明書検証（Guaranteed Safe AI 準拠）
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

入力テキストがどのように6層で処理されるかの全フロー：

```
入力テキスト
    │
    ▼
┌─── L1: Regex Pattern Matching ────────────────────────────────┐
│  ① Text Normalization（前処理）                                │
│     NFKC正規化 → ゼロ幅文字除去 → スペース圧縮               │
│     → Confusable正規化 → Emoji除去                            │
│  ② 165+パターン（25+カテゴリ × 4言語）を順次照合              │
│     マッチ → MatchedRule 生成（rule_id, score_delta, owasp_ref）│
│     カテゴリ別スコア集計（上限: base_score × 2 / カテゴリ）    │
└───────┬───────────────────────────────────────────────────────┘
        │ 正規化テキスト + マッチ結果
        ▼
┌─── L2: Semantic Similarity ───────────────────────────────────┐
│  56件の攻撃フレーズ辞書と類似度比較                            │
│  L1で未検出のカテゴリのみ対象（二重検出防止）                  │
│  difflib.SequenceMatcher + n-gram で閾値判定                  │
└───────┬───────────────────────────────────────────────────────┘
        │
        ▼
┌─── L3: Active Decoding ───────────────────────────────────────┐
│  エンコード指標を検出した場合のみ実行（性能への影響最小化）     │
│                                                                 │
│  ① Base64文字列 → base64.b64decode → テキスト化               │
│  ② Hex(\xNN) → bytes.fromhex → テキスト化                     │
│  ③ ROT13指標付きテキスト → codecs.decode(rot_13)              │
│  ④ URL(%XX) → urllib.parse.unquote                             │
│  ⑤ Unicode エスケープ → デコード                               │
│                                                                 │
│  デコード結果を L1→L2 で再スキャン                              │
│  新規マッチのみ追加（重複排除: rule_id ベース）                 │
│  ルール名に "(decoded)" を付与して追跡可能に                    │
└───────┬────────────────────────────────────────────────────────┘
        │
        ▼
┌─── L4: Capability-Based Access Control ★v1.2 ─────────────────┐
│  CaMeL アーキテクチャ: 制御フローとデータフローの分離           │
│                                                                 │
│  ① テイント追跡（taint.py）                                    │
│     外部入力（ユーザー/RAG/MCP）にテイントラベルを付与          │
│     データフロー全体で汚染伝搬を追跡                            │
│  ② 権限トークン（tokens.py）                                   │
│     操作に必要なケーパビリティをトークンとして発行              │
│     file:read, net:connect, exec:shell 等の粒度で制御          │
│  ③ 強制適用（enforcer.py）                                     │
│     テイントレベル × 要求権限 → allow/deny 判定                │
│     汚染データによる特権操作を自動ブロック                      │
│                                                                 │
│  参照: CaMeL (Debenedetti et al., 2025)                        │
└───────┬────────────────────────────────────────────────────────┘
        │
        ▼
┌─── L5: Atomic Execution Pipeline (AEP) ★v1.3 ─────────────────┐
│  ツール実行を原子的3フェーズで隔離                              │
│                                                                 │
│  ① Scan — 実行前に L1-L4 でコマンド/引数を検査                 │
│  ② Execute — サンドボックス内で隔離実行（sandbox.py）          │
│     ファイルシステム/ネットワークを制限した環境で実行            │
│  ③ Vaporize — 実行痕跡の安全消去（vaporizer.py）              │
│     一時ファイル・メモリ上の機密データを確実に除去              │
│                                                                 │
│  参照: AEP / CIV (Scan-Execute-Vaporize pattern)               │
└───────┬────────────────────────────────────────────────────────┘
        │
        ▼
┌─── L6: Safety Specification & Verifier ★v1.3.1 ───────────────┐
│  宣言的安全仕様による形式的保証                                 │
│                                                                 │
│  ① Safety Spec 定義（spec.py / builtin_specs.py）              │
│     no_exfil: データ外部送信禁止                                │
│     no_exec: 任意コード実行禁止                                 │
│     pii_guard: PII漏洩防止                                      │
│     カスタム仕様もYAML/JSONで定義可能（loader.py）              │
│  ② Verifier（verifier.py）                                     │
│     実行結果が安全仕様を満たすか検証                            │
│     証明書（proof certificate）を発行                           │
│     違反時は理由付きでブロック + 修復ガイダンス                 │
│                                                                 │
│  参照: Guaranteed Safe AI (Dalrymple et al., 2024)              │
└───────┬────────────────────────────────────────────────────────┘
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
4. 検出パイプライン実行（L1→L2→L3→L4→L5→L6）
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
   Local:  .ai-guardian/logs/2026-04-10.jsonl
   Global: ~/.ai-guardian/global/2026-04-10.jsonl
   Alert:  ~/.ai-guardian/alerts/2026-04-10.jsonl
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

### 25+カテゴリ × パターン数

| # | カテゴリ | パターン数 | 言語 | OWASP LLM |
|---|---------|:----------:|:----:|-----------|
| 1 | Prompt Injection | 18 | EN/JA/KO/ZH | LLM01 |
| 2 | Jailbreak / Roleplay | 6 | EN | LLM01 |
| 3 | MCP Tool Poisoning | 13 | EN | LLM01 |
| 4 | Indirect Injection (RAG) | 5 | EN | LLM01 |
| 5 | Encoding Bypass | 8 | EN | LLM01 |
| 6 | Memory Poisoning | 9 | EN/JA/KO/ZH | LLM01 |
| 7 | Second-Order Injection | 9 | EN/JA/KO/ZH | LLM01 |
| 8 | System Prompt Leak | 8 | EN/JA | LLM07 |
| 9 | SQL Injection | 8 | EN | — |
| 10 | Command Injection | 2 | EN | — |
| 11 | Data Exfiltration | 4 | EN | LLM06 |
| 12 | PII Detection (Input) | 11+ | JP/Intl/KO/ZH | LLM02 |
| 13 | Confidential Data | 3 | EN/JA | LLM02 |
| 14 | Token Exhaustion | 5 | EN | LLM10 |
| 15 | Hallucination Action | 3 | EN/JA | — |
| 16 | Synthetic Content | 4 | EN/JA | — |
| 17 | Emotional Manipulation | 3 | EN/JA | — |
| 18 | Over-Reliance | 3 | EN/JA | — |
| 19 | Sandbox Escape ★v1.2 | 4 | EN | LLM01 |
| 20 | Self-Privilege Escalation ★v1.2 | 4 | EN | LLM01 |
| 21 | CoT Deception ★v1.2 | 3 | EN | — |
| 22 | Evaluation Gaming ★v1.2 | 3 | EN | — |
| 23 | Audit Tampering ★v1.2 | 4 | EN | LLM09 |
| 24 | Autonomous Exploit ★v1.2 | 5 | EN | LLM01 |
| — | **Output Safety** | **9** | EN/JA | LLM02/LLM05 |
| | **合計** | **165+** | | |

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
  │   ├── 2026-04-10.jsonl        ← 本日のイベント
  │   ├── 2026-03-31.jsonl.gz     ← 圧縮済み（7日経過後）
  │   └── ...                      ← 60日後に自動削除
  └── mcp_snapshots/               ← ★v1.1: MCPスナップショット保存
      └── mcp_<server_hash>.json

グローバル（CISO/監査、プロジェクト横断）:
  ~/.ai-guardian/
  ├── global/
  │   └── 2026-04-10.jsonl        ← 全プロジェクト集約
  └── alerts/
      └── 2026-04-10.jsonl        ← ブロック/レビューのみ（永久保持）
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
7. **多層防御** — パターン→類似度→デコード→ケーパビリティ→AEP→安全仕様の6層で回避困難な検出・防御を実現
8. **形式的安全保証** — Safety Specification による宣言的仕様と証明書検証で、検出だけでなく安全性の形式的保証を提供

## 学術論文リファレンス

v1.2 以降で導入したアーキテクチャ層は、以下の学術研究に基づいている。

| 層 | 論文 | 著者 | 概要 |
|----|------|------|------|
| L4 | **CaMeL: Design and Evaluation of a Capability-Based Agent Security Framework** | Debenedetti et al., 2025 | LLMエージェントの制御フロー（信頼済み）とデータフロー（未信頼）を分離し、テイント追跡とケーパビリティトークンでプロンプトインジェクションを防御するフレームワーク |
| L5 | **Atomic Execution Pipeline (AEP)** | — | ツール実行をScan→Execute→Vaporizeの原子的3フェーズで隔離し、実行痕跡を安全に消去するパターン |
| L5 | **CIV: Confidentiality, Integrity, and Vaporization** | — | 機密データの安全な処理と消去を保証する実行モデル |
| L6 | **Guaranteed Safe AI** | Dalrymple et al., 2024 | AIシステムの安全性を宣言的仕様（Safety Specification）と形式的検証（Proof Certificate）で保証するフレームワーク。World Model + Safety Spec + Verifier の三位一体構成 |
