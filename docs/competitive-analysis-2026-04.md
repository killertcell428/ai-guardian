# AI セキュリティ/ガードレール競合分析レポート

> 調査期間: 2025年10月 - 2026年4月
> 作成日: 2026-04-06

---

## 1. 業界全体の動向サマリ

### M&A の嵐 -- AI セキュリティスタートアップの統合が加速

2025年後半から2026年にかけて、AI セキュリティ領域で **大型買収が3件** 発生した。独立系スタートアップが大手サイバーセキュリティ企業に吸収される流れが顕著。

| 買収元 | 被買収 | 金額 | 時期 |
|--------|--------|------|------|
| **Check Point** | Lakera | $300M | 2025年9月 |
| **SentinelOne** | Prompt Security | ~$250M | 2025年8月 |
| **CrowdStrike** | Pangea | $260M | 2025年9月（2026年完了） |
| **OpenAI** | Promptfoo | 非公開 | 2026年3月 |

### 資金調達 -- AI セキュリティへの投資は過去最高

| 企業 | 調達額 | 評価額 | 用途 |
|------|--------|--------|------|
| Tenex.ai | $250M | $1B+ | AIサイバーセキュリティツール |
| Xbow | $120M | $1B+ | AI脆弱性スキャン |
| Vega Security | $120M Series B | $700M | サイバー脅威検出 |

Q1 2026 のVC投資は $300B を突破し過去最高。AI セキュリティは高速成長カテゴリとして確立。

### 技術トレンド

1. **エージェンティックAIセキュリティ** -- 自律AIエージェントの監視・制御が最重要テーマに
2. **MCP（Model Context Protocol）ゲートウェイ** -- MCP サーバーのセキュリティスキャンが新標準
3. **チェーン・オブ・ソート監査** -- LLMの推論過程を監査するガードレール
4. **Shadow AI 検出** -- 企業内で無許可利用されるAIツールの可視化
5. **コード生成セキュリティ** -- LLM生成コードの静的解析がガードレールに統合

---

## 2. 競合各社の最新動向（2025年10月 - 2026年4月）

### 2.1 Lakera（Check Point に買収）

- **2025年9月**: Check Point が $300M で買収。Check Point Infinity アーキテクチャに統合
- **統合先**: CloudGuard WAF（AI アプリ保護）、GenAI Protect（GenAI トラフィック保護）
- **Check Point Global Center of Excellence for AI Security** の基盤に
- 100+ 言語対応、98%+ 検出率、50ms 以下のレイテンシ
- **新機能**: Advanced PII Detection & DLP、カスタムディテクター、暴力的コンテンツ検出
- **2026年3月**: Canica（インタラクティブテキストデータセットビューア、t-SNE/UMAP対応）をOSS公開

### 2.2 HiddenLayer

- **2025年7月**: AWS Intelligence Community Marketplace に掲載
- **2025年12月**: 米国 Missile Defense Agency の SHIELD IDIQ 契約を獲得（上限 $151B）
- **2025年12月**: AWS GenAI（Bedrock, AgentCore, SageMaker）との統合拡張
- **2026年3月**: **Agentic Runtime Security** -- 自律AIエージェントの意思決定・行動をリアルタイム保護する次世代モジュール
- **2026 AI Threat Landscape Report** 公開: AIエージェント関連のインシデントが全AI侵害の1/8に到達

### 2.3 Protect AI

- **ModelScan v0.8.7**: Keras CVE-2025-1550 対応
- **Guardian（エンタープライズ版）**: 自動モデルフォーマット検出、より広いモデルサポート
- **LLM Guard（OSS）**: 入力スキャナー（PII匿名化、トピック禁止、毒性検出）＋出力スキャナー（バイアス検出、悪意あるURL検出）

### 2.4 Arthur AI

- **毒性分類器**: トークン上限を 1,200 → 8,000 に拡大
- **PII検出精度向上**: "me", "you", "doctor" 等の誤検知フィルタリング
- **プロンプトインジェクション分類器**: 精度向上、Precision 優先（偽陽性削減）
- **2026年1月**: エージェンティック機能（テスト、トレーシング、デプロイ）追加

### 2.5 Guardrails AI

- **2025年2月**: Guardrails Index ローンチ（24ガードレールの性能/レイテンシベンチマーク）
- **NeMo Guardrails 統合**: 入力/出力バリデーターをNeMoに追加可能
- **計画中**: マルチモーダルサポート（テキスト以外のメディア検証）、高度なエージェンティックワークフロー

### 2.6 Prompt Security（SentinelOne に買収）

- **2025年8月**: SentinelOne が ~$250M で買収
- **MCP Gateway**: 13,000+ MCP サーバーを監視、動的リスクスコア付与
- **Prompt Fuzzer**: GenAI 脆弱性評価の OSS ツール
- **Embedding-level プロンプトインジェクション研究**: RAG パイプラインの汚染検出
- **認可機能**: AI データアクセス制御を強化

### 2.7 Pangea（CrowdStrike に買収）

- **2025年2月**: AI Guard + Prompt Guard リリース（50+ PII タイプ、99%+ インジェクション検出）
- **2025年7月**: **AI Detection and Response (AIDR)** プラットフォーム
  - Chrome ブラウザ監視で Shadow AI 検出
  - MCP プロキシ（エージェントセキュリティ）
  - AWS ログ分析でAI利用可視化
- **2025年9月**: CrowdStrike が $260M で買収 → Falcon プラットフォームに統合
- 業界初の完全な AI Detection and Response (AIDR) を実現

### 2.8 Lasso Security

- **Agentic Purple Teaming**: AIエージェントが自律的に脆弱性スキャン → ガバナンス・セキュリティポリシー適用
- **MCP Gateway**: セキュリティプラグインでコンテキストガードレール、プロンプト監視、リアルタイムログ
- **メモリポイズニング対策**: セッションメモリ隔離、データソース検証、ロールバック用フォレンジックスナップショット
- **CBAC（Context-Based Access Control）**: コンテキストベースのアクセス制御
- **Intent-Aware Controls**: エージェントの意図を理解し、許容範囲外の動作を検出

### 2.9 NVIDIA NeMo Guardrails

- **IORails**: 並列実行対応の最適化 Input/Output レールエンジン（content-safety, topic-safety, jailbreak検出）
- **BotThinking**: LLMの推論トレースにガードレールを適用
- **OpenAI互換サーバー**: v1/models エンドポイント + GuardrailsMiddleware for LangChain
- **LangChain 1.x 互換**: Content blocks API 対応（推論トレース + ツールコール）
- **Azure OpenAI / Cohere / Google embedding** プロバイダー追加
- **LFU キャッシュ**: content-safety, topic-control, jailbreak 検出モデル用

### 2.10 新興 OSS ツール

#### Meta LlamaFirewall（2025年4月〜）
- **PromptGuard 2**: BERT ベースのジェイルブレイク/インジェクション検出（86M / 22M パラメータ）
- **Agent Alignment Checks**: チェーン・オブ・ソートをリアルタイム監査（OSS初）
- **CodeShield**: LLM生成コードのオンライン静的解析（8言語対応、Semgrep + regex）
- 攻撃成功率を 90% 削減（1.75%まで低下）

#### Cisco DefenseClaw（2026年3月）
- AIエージェントのセキュリティ自動化フレームワーク（OSS）
- NVIDIA NeMo Guardrails との統合
- MCP サーバースキャン、メモリポイズニング検出、ツール悪用検出
- Zero Trust を AIエージェントに拡張

#### OpenAI Promptfoo（2026年3月 OpenAI が買収）
- 自動レッドチーミング、プロンプトインジェクション検出、データリーク防止
- Fortune 500 の 25% 以上が利用
- OpenAI Frontier に統合予定、OSS 継続

#### Trylon Gateway
- OSS の AI ゲートウェイ（セルフホスト型プロキシ）
- OpenAI / Gemini / Claude のガードレール

#### OpenGuardrails
- コンテキスト認識型の安全性 & 操作検出モデル（OSS初の大規模安全性LLM + 本番対応プラットフォーム）

---

## 3. ai-guardian に不足している機能の比較表

| 機能カテゴリ | 機能 | ai-guardian | 競合の実装例 | 優先度 |
|---|---|---|---|---|
| **ML ベース検出** | LLM/BERT ベースのインジェクション分類器 | なし（regex + 類似度のみ） | LlamaFirewall PromptGuard 2, Lakera Guard, Arthur Shield | **最高** |
| **エージェント監視** | チェーン・オブ・ソート監査 | なし | LlamaFirewall Agent Alignment Checks, HiddenLayer Agentic Runtime | **最高** |
| **エージェント監視** | MCP ゲートウェイ / MCP サーバースキャン | なし | Lasso MCP Gateway, Prompt Security MCP Gateway, Cisco AI Defense | **高** |
| **コード安全性** | LLM 生成コードの静的解析 | なし | LlamaFirewall CodeShield（8言語） | **高** |
| **Shadow AI** | 企業内 AI ツール利用の可視化・制御 | なし | Pangea AIDR（Chrome監視）, Prompt Security | 中 |
| **メモリ安全性** | メモリポイズニング検出・セッション隔離 | なし | Lasso Security, Cisco DefenseClaw | **高** |
| **マルチモーダル** | 画像・音声のガードレール | なし | Guardrails AI（計画中）, LlamaFirewall（計画中） | 中 |
| **自動レッドチーミング** | 自律的な脆弱性スキャン | なし | Lasso Purple Teaming, Promptfoo, Cisco AI Defense Explorer | **高** |
| **Embedding 攻撃** | Embedding レベルのインジェクション検出 | なし | Prompt Security 研究 | 中 |
| **コンテキスト認識** | コンテキストベースアクセス制御 (CBAC) | なし | Lasso Security | 中 |
| **Intent 検出** | エージェントの意図理解・逸脱検出 | なし | Lasso Intent-Aware Controls | 中 |
| **推論トレース** | LLM の推論過程へのガードレール適用 | なし | NeMo BotThinking | 中 |
| **ベンチマーク** | ガードレール性能比較ベンチマーク | `aig benchmark` あり | Guardrails Index（24ガードレール横断） | 低 |
| **PII 高度化** | 50+ タイプの PII 検出 | 8 タイプ | Pangea AI Guard（50+ タイプ） | **高** |
| **DLP** | Data Loss Prevention 統合 | なし | Lakera Advanced DLP, Prompt Security | 中 |
| **ダッシュボード** | リアルタイム監視 Web UI | Cloud Dashboard あり（v0.7.0） | 各社エンタープライズ版 | 対応済 |
| **Slack 通知** | 高リスク検知時の通知 | あり（v0.7.0） | HiddenLayer, 各社 | 対応済 |
| **LangGraph 統合** | GuardNode | あり（v0.6.2） | NeMo GuardrailsMiddleware | 対応済 |
| **コンプライアンス** | 日本法規制マッピング | 37要件100%（v0.8.0） | 各社は日本未対応 | **強み** |
| **ゼロ依存** | stdlib のみで動作 | あり | 各社は依存多数 | **強み** |
| **日本語ネイティブ** | 日本語攻撃パターン + PII | あり | Lakera（100+言語）以外は未対応 | **強み** |

---

## 4. 推奨アクション（優先順位付き）

### Tier 1: 最優先（差別化に直結、Phase 2 で実装推奨）

1. **ML ベースのインジェクション分類器追加**
   - 現状の regex + 類似度に加え、軽量 BERT/DistilBERT ベースの分類器をオプション依存で提供
   - LlamaFirewall PromptGuard 2（22M パラメータ軽量版）を参考
   - `pip install aig-guardian[ml]` でオプションインストール（ゼロ依存の原則を維持）

2. **MCP ゲートウェイ / MCP セキュリティスキャン**
   - MCP サーバーのリクエスト/レスポンスを検査するプロキシ機能
   - Lasso / Prompt Security の MCP Gateway がデファクトになりつつある
   - Claude Code hooks との親和性が高い（ai-guardian の強み）

3. **自動レッドチーミング機能**
   - `aig redteam` コマンドで自動的に攻撃パターンを生成・テスト
   - Promptfoo のOSS部分、Lasso Purple Teaming を参考

### Tier 2: 高優先（Phase 2-3 で実装）

4. **LLM 生成コードの安全性チェック**
   - CodeShield 類似の静的解析（Semgrep ルール活用）
   - `aig scan --code` or `guard.check_code()` で実行

5. **メモリポイズニング対策**
   - マルチターン会話のメモリ汚染検出
   - セッション間のコンテキスト隔離検証

6. **PII 検出の大幅拡充**
   - 現状 8 タイプ → 30+ タイプへ（パスポート、銀行口座、健康保険証、住所等）
   - 特に日本固有 PII の網羅（法人番号、健康保険証番号等）

### Tier 3: 中優先（Phase 3 以降）

7. **チェーン・オブ・ソート監査**
   - AIエージェントの推論過程を監視し、逸脱を検出

8. **Shadow AI 検出**
   - 企業内で未承認のAIツール利用を可視化

9. **マルチモーダルガードレール**
   - 画像内のプロンプトインジェクション検出等

---

## 5. 戦略的考察

### ai-guardian のポジショニング

業界の M&A ラッシュにより、独立系AIセキュリティスタートアップは急速に大手に吸収されている。これは ai-guardian にとって **チャンス** でもある。

**有利な点:**
- Lakera、Prompt Security、Pangea が大企業に買収され、**独立系OSSの選択肢が減少**
- 大企業統合後は価格上昇 & ベンダーロックインが予想され、**OSSへの需要が増加**
- Meta LlamaFirewall は強力だが Meta エコシステム寄り。**プロバイダー中立の軽量OSSはニッチが空いている**
- **日本語ネイティブ対応 + 日本法規制マッピング** は唯一無二の差別化

**課題:**
- ML ベース検出がないと「regex だけ」と見られ、技術的信頼性で劣る
- MCP ゲートウェイ未対応は 2026 年のエージェント時代に遅れを取るリスク
- 大手の資金力・営業力に対抗するには、コミュニティとOSSの優位性を最大化する必要がある

---

## Sources

- [Lakera Product Updates](https://www.lakera.ai/product-updates)
- [Lakera Q4 2025 Blog](https://www.lakera.ai/blog/the-year-of-the-agent-what-recent-attacks-revealed-in-q4-2025-and-what-it-means-for-2026)
- [HiddenLayer 2026 AI Threat Report](https://www.hiddenlayer.com/news/hiddenlayer-releases-the-2026-ai-threat-landscape-report-spotlighting-the-rise-of-agentic-ai-and-the-expanding-attack-surface-of-autonomous-systems)
- [HiddenLayer Agentic Runtime Security](https://www.morningstar.com/news/pr-newswire/20260323da16125/hiddenlayer-unveils-new-agentic-runtime-security-capabilities-for-securing-autonomous-ai-execution)
- [Arthur AI December 2025 Release](https://docs.arthur.ai/changelog/december-2025-release-notes)
- [Arthur Shield Changelog](https://shield.docs.arthur.ai/changelog)
- [Guardrails AI Docs](https://guardrailsai.com/docs)
- [Guardrails AI + NeMo Integration](https://guardrailsai.com/blog/nemoguardrails-integration)
- [NeMo Guardrails GitHub](https://github.com/NVIDIA-NeMo/Guardrails)
- [NeMo Guardrails Release Notes](https://docs.nvidia.com/nemo/guardrails/latest/release-notes.html)
- [Check Point acquires Lakera ($300M)](https://www.checkpoint.com/press-releases/check-point-acquires-lakera-to-deliver-end-to-end-ai-security-for-enterprises/)
- [SentinelOne acquires Prompt Security (~$250M)](https://investors.sentinelone.com/press-releases/news-details/2025/SentinelOne-to-Acquire-Prompt-Security-to-Advance-GenAI-Security-and-Agent-Security-Strategy/default.aspx)
- [CrowdStrike acquires Pangea ($260M)](https://www.crowdstrike.com/en-us/press-releases/crowdstrike-to-acquire-pangea-to-secure-every-layer-of-enterprise-ai/)
- [OpenAI acquires Promptfoo](https://openai.com/index/openai-to-acquire-promptfoo/)
- [Meta LlamaFirewall](https://ai.meta.com/research/publications/llamafirewall-an-open-source-guardrail-system-for-building-secure-ai-agents/)
- [Cisco DefenseClaw](https://siliconangle.com/2026/03/23/cisco-debuts-new-ai-agent-security-features-open-source-defenseclaw-tool/)
- [Cisco AI Defense RSA 2026](https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m03/cisco-reimagines-security-for-the-agentic-workforce.html)
- [Lasso Agentic AI Security](https://www.lasso.security/resources/agentic-ai-security-platform)
- [Pangea AI Detection & Response](https://siliconangle.com/2025/07/29/pangea-launches-ai-detection-response-close-gaps-generative-ai-security/)
- [Protect AI ModelScan](https://github.com/protectai/modelscan)
- [Tenex.ai raises $250M](https://www.bloomberg.com/news/articles/2026-03-31/google-partner-tenex-raises-250-million-for-ai-security-tools)
- [Xbow valued at $1B+](https://www.bloomberg.com/news/articles/2026-03-18/ai-security-startup-xbow-now-valued-at-more-than-1-billion)
- [Q1 2026 VC funding $300B](https://news.crunchbase.com/venture/record-breaking-funding-ai-global-q1-2026/)
- [OpenGuardrails](https://openguardrails.com/)
- [Trylon Gateway](https://github.com/trylonai/gateway)
