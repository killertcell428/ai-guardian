---
title: "【実務者向け】AI事業者ガイドライン v1.2 全37要件チェックリスト — OSSツール1つで対応する方法"
emoji: "✅"
type: "tech"
topics: ["AI", "セキュリティ", "コンプライアンス", "AIエージェント", "LLM"]
published: false
---

## この記事を読んでほしい人

- AIエージェント（Claude Code / Cursor / ChatGPT等）を社内で使い始めた・使いたい方
- 「AI事業者ガイドラインに対応しろ」と言われたが、何をすればいいかわからない情シス担当者
- AI推進PJで技術的なセキュリティ対策を任されたエンジニア

## 結論を先に

2026年3月31日公開の **AI事業者ガイドライン v1.2** には **37の技術要件** があります。

OSSツール [AI Guardian](https://github.com/killertcell428/ai-guardian) を使えば、**37要件すべてに技術的に対応** できます。この記事では全37要件をチェックリスト形式で解説し、具体的な対応方法を示します。

```bash
# インストール（依存ゼロ・Python標準ライブラリのみ）
pip install aig-guardian

# コンプライアンスレポートを自動生成
aig report
```

## v1.2 で何が変わったか

v1.1（25要件）→ v1.2（37要件）で **12要件が追加** されました。追加された要件は全て **AIエージェント時代** を前提としたものです：

| 新規カテゴリ | 要件数 | 背景 |
|-------------|:------:|------|
| AIエージェント管理 | 2 | Claude Code/Cursor等のエージェントが企業で普及 |
| Human-in-the-Loop強化 | 3 | 緊急停止・最小権限・継続モニタリング |
| 新リスクカテゴリ | 4 | ハルシネーション誤動作・合成コンテンツ・感情操作・AI過度依存 |
| 開発者責任拡大 | 2 | RAG構築者・ファインチューニング実施者の責任 |
| 攻めのガバナンス | 2 | プロアクティブなガバナンス・段階的導入支援 |
| データ汚染対策 | 1 | プロンプトインジェクション・データポイズニング |

## 全37要件チェックリスト

### セキュリティ（3要件）

#### GL-SEC-01: 設計段階からのセキュリティ組み込み

- [ ] LLMへの入出力にセキュリティスキャン層を設置しているか
- [ ] プロンプトインジェクション対策を実装しているか

```python
from ai_guardian import Guard

guard = Guard()
result = guard.check_input(user_message)
if result.blocked:
    return "リクエストがブロックされました"
```

**AI Guardian対応:** Guard クラスをミドルウェアとして追加するだけ。121検出パターンが自動適用。

#### GL-SEC-02: 脆弱性情報収集と迅速なパッチ配布

- [ ] OWASP LLM Top 10 の脅威を把握しているか
- [ ] 検出パターンを定期的に更新する仕組みがあるか

**AI Guardian対応:** 全パターンにOWASP参照を付与。`pip install --upgrade aig-guardian` で最新パターンに更新。

#### GL-SEC-03: 攻撃対象面（Attack Surface）の管理 [v1.2 新規]

- [ ] AIエージェントが利用するMCPツール・API・ファイルアクセスの権限を管理しているか
- [ ] 不要な権限を削除しているか

```bash
# MCPツール定義のセキュリティスキャン
aig mcp --file mcp_tools.json
```

**AI Guardian対応:** MCPセキュリティスキャナー（唯一のOSS）で6つの攻撃面をカバー。Policy Engineで操作ごとの権限制御。

### リスク管理（6要件）

#### GL-RISK-01: リスクベースアプローチ

- [ ] AIリクエストの危険度を定量的に評価しているか
- [ ] リスクレベルに応じた対応（ブロック/レビュー/許可）を定義しているか

**AI Guardian対応:** 0-100のリスクスコアリング。Low/Medium/High/Criticalの4段階。YAMLポリシーでカスタマイズ可能。

#### GL-RISK-02: インシデントDB

- [ ] 全リクエスト・判定結果を記録しているか
- [ ] 重大イベントを永続保存しているか

**AI Guardian対応:** Activity Streamで全操作を自動記録（JSONL）。alertsログで重大イベントを永続保存。

#### GL-RISK-03: ハルシネーション起因の誤動作対策 [v1.2 新規]

- [ ] AIが確認なく自律的に破壊的操作を実行するリスクを管理しているか

**AI Guardian対応:** `hallucination_action` 検知パターン（3パターン）。Human-in-the-Loopで重要操作に人間の承認を要求。

#### GL-RISK-04: 合成コンテンツ・フェイク情報 [v1.2 新規]

- [ ] ディープフェイク・偽情報の生成要求を検知しているか

**AI Guardian対応:** `synthetic_content` 検知パターン（4パターン、EN/JA対応）。

#### GL-RISK-05: AI過度依存の防止 [v1.2 新規]

- [ ] AIの判断を盲信せず、人間が最終判断する仕組みがあるか

**AI Guardian対応:** `over_reliance` 検知パターン（3パターン）。「AIに全て任せろ」「人間の判断は不要」等の指示を検出。

#### GL-RISK-06: 感情操作の防止 [v1.2 新規]

- [ ] ダークパターン・心理操作指示を検知しているか

**AI Guardian対応:** `emotional_manipulation` 検知パターン（3パターン）+ 出力側の感情操作検知。

### 透明性（2要件）

#### GL-TRANS-01: 更新履歴と評価結果のドキュメント化

- [ ] AIシステムの変更履歴を記録しているか

**AI Guardian対応:** Activity Streamで全操作を自動記録。`aig logs` で照会。CSV/Excelエクスポート対応。

#### GL-TRANS-02: 能力と限界の開示

- [ ] AIシステムのカバー範囲と限界を文書化しているか

**AI Guardian対応:** `aig report` でカバー範囲を自動レポート。各検知ルールにOWASP参照と修復ヒントを付与。

### Human-in-the-Loop（4要件）

#### GL-HUMAN-01: 外部アクション実行時のHITL

- [ ] Medium/Highリスクのリクエストを人間がレビューする仕組みがあるか

**AI Guardian対応:** レビューキュー。Medium/Highリスクは自動でキューへ。SLAタイムアウト対応。

#### GL-HUMAN-02: 緊急停止メカニズム [v1.2 新規]

- [ ] CRITICALリスクを即時ブロックする仕組みがあるか

**AI Guardian対応:** `auto_block_threshold` でCRITICALリスクを即時ブロック。Slack通知でリアルタイムアラート。

#### GL-HUMAN-03: 最小権限の原則 [v1.2 新規]

- [ ] AIエージェントに必要最小限の権限のみ付与しているか

**AI Guardian対応:** Policy Engineで操作ごとの権限を制御（allow/deny/review）。デフォルトで破壊的操作をブロック。

#### GL-HUMAN-04: 継続的モニタリング [v1.2 新規]

- [ ] AIシステムの動作を継続的に監視する仕組みがあるか

**AI Guardian対応:** Activity Streamの3層アーキテクチャ（ローカル/グローバル/アラート）。Cloud Dashboardでリアルタイム可視化。

### データ保護（2要件）

#### GL-DATA-01: 個人情報保護

- [ ] PII（個人情報）がLLMに送信されるのを防止しているか

**AI Guardian対応:** 17パターンのPII検知（マイナンバー・電話番号・住所・クレカ・SSN等、5カ国対応）。`sanitize()` で自動墨消し。

#### GL-DATA-02: トレーサビリティ

- [ ] データの流れを追跡できるか

**AI Guardian対応:** `delegation_chain` フィールドでエージェント間の委任関係を追跡。全ファイルアクセスを記録。

### 監査（1要件）

#### GL-AUDIT-01: 追跡可能性

- [ ] 全リクエスト・判定・レビュー結果を不変ログとして保存しているか

**AI Guardian対応:** 監査ログ100%記録。JSONL形式で改ざん検知可能。`aig report` でコンプライアンスレポート出力。

### AIエージェント管理（2要件）[v1.2 新規]

#### GL-AGENT-01: AIエージェントの定義と管理

- [ ] 利用しているAIエージェントを一覧化し、各エージェントのリスクを把握しているか

**AI Guardian対応:** Claude Code / LangGraph / OpenAI / Anthropic / FastAPI 5種のアダプター。`aig status` でガバナンスダッシュボード。

#### GL-AGENT-02: マルチエージェント連携の安全設計

- [ ] 複数エージェントが連携する場合、権限昇格や情報漏洩のリスクを管理しているか

**AI Guardian対応:** `delegation_chain` で委任追跡。LangGraph GuardNodeでワークフロー全体を保護。Second-Orderインジェクション検知（4パターン）。

### 開発者責任（2要件）[v1.2 新規]

#### GL-RESP-01: RAG構築時の開発者責任

- [ ] RAG検索結果に攻撃コードや機密情報が含まれていないかスキャンしているか

```python
from ai_guardian import scan_rag_context

chunks = retriever.search("user query")
result = scan_rag_context([c.text for c in chunks])
if not result.is_safe:
    # 汚染されたチャンクを除外
    safe_chunks = [c for c in chunks if ...]
```

**AI Guardian対応:** `scan_rag_context()` で112パターンをRAGコンテキストに適用。間接インジェクション5パターン。

#### GL-RESP-02: システムプロンプトの安全設計

- [ ] システムプロンプトの漏洩対策を実装しているか

**AI Guardian対応:** 8パターンのシステムプロンプト漏洩検知（4言語対応）。

### ガバナンス（2要件）[v1.2 新規]

#### GL-GOV-01: 攻めのガバナンスの実践

- [ ] AIガバナンスを「コスト」ではなく「競争力」として捉えているか
- [ ] 段階的にガバナンスを強化する計画があるか

**AI Guardian対応:** 3段階ポリシー（permissive → default → strict）で段階的な導入を支援。`aig benchmark` で検出精度を可視化。

#### GL-GOV-02: 段階的導入支援

- [ ] 小規模チームでも導入できるか

**AI Guardian対応:** ゼロ依存・3行導入。`aig init` で初期化、`aig doctor` で診断。

### データ汚染対策（1要件）[v1.2 新規]

#### GL-POISON-01: データ汚染・プロンプトインジェクション対策

- [ ] プロンプトインジェクション対策を多層で実装しているか
- [ ] RAGコンテキストの汚染を検知しているか
- [ ] MCPツール経由の攻撃を検知しているか

**AI Guardian対応:** 3層防御（正規表現 → 類似度検知 → Human-in-the-Loop）。MCPセキュリティスキャナー10パターン。間接インジェクション5パターン。

## コンプライアンスレポートの自動生成

```bash
# 全37要件の対応状況を確認
aig report

# JSON形式で出力（社内システム連携用）
aig report --json

# 30日間のアクティビティサマリー
aig report --days 30
```

## まとめ

| 項目 | 内容 |
|------|------|
| 対応要件数 | **37/37（100%）** |
| 導入工数 | **3行（pip install → import → Guard()）** |
| 依存ライブラリ | **ゼロ（Python標準ライブラリのみ）** |
| 対応言語 | 日本語・英語・韓国語・中国語 |
| ライセンス | Apache 2.0（商用利用可） |
| コスト | **無料（OSS）** |

AI事業者ガイドライン v1.2への対応は、もはや「やるかやらないか」ではなく「いつやるか」の問題です。AI Guardian を使えば、**今日から** 技術的な対応を始められます。

## リンク

- [AI Guardian GitHub](https://github.com/killertcell428/ai-guardian)
- [PyPI](https://pypi.org/project/aig-guardian/)
- [AI事業者ガイドライン v1.2 を読んだ記事](https://zenn.dev/sharu389no/articles/guideline-v12-what-companies-must-do)
- [AI事業者ガイドライン原文（総務省）](https://www.soumu.go.jp/main_sosiki/kenkyu/ai_network/02ryutsu20_04000019.html)
