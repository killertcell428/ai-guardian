# AI Guardian — OSS から収益化へのロードマップ

> 最終更新: 2026-03-31
> 戦略: OSS で信頼を獲得 → SaaS で収益化 → エンタープライズで拡大

---

## ビジョン

**「すべての AI エージェントに、当たり前のようにセキュリティ層が存在する世界」**

Gartner が 2030 年までに「Guardian Agent」技術が Agentic AI 市場の 10-15% を占めると予測。
AI Guardian はその OSS 版として、開発者・企業が自社でコントロールできるガバナンス基盤を提供する。

---

## 収益モデル（想定）

```
OSS Core（無料・永久）
  └→ コミュニティ信頼・スター・ダウンロード・認知
      └→ Cloud Pro（$49/月〜）
          └→ Enterprise（要見積もり・$500/月〜）
```

| ティア | 対象 | 価格 | 主な機能 |
|--------|------|------|---------|
| **OSS Free** | 個人・スタートアップ | 無料 | Guard クラス・57ルール・CLI |
| **Cloud Pro** | 小規模チーム (2-20名) | $49/月 | Webダッシュボード・Slack通知・月次レポート |
| **Business** | 中規模企業 (20-200名) | $299/月 | 複数テナント・SSO・SLA・カスタムポリシー |
| **Enterprise** | 大企業・金融・医療 | 要見積 | オンプレ・LDAP・監査対応・専任サポート |

---

## Phase 0: 種まき（〜2026-04-12）✅ Phase 1 先行完了

**ゴール**: 最初の 50 スター・100 PyPI DL/日・コミュニティの芽

### マーケティング
- [x] HN で既存スレッドに返信（新規アカウント投稿制限のため Show HN → 返信に変更）
- [x] Zenn 記事投稿（MCP信頼モデルは内容が浅く取り消し → 別記事を投稿済）
- [x] Reddit r/Python, r/netsec, r/MachineLearning 投稿
- [x] DEV.to 英語記事投稿
- [ ] Awesome list への PR 送信（3リスト）

### プロダクト
- [x] PyPI v0.7.0 リリース（v0.4.0 → v0.5.0 → v0.6.0 → v0.6.1 → v0.7.0）
- [x] GitHub Discussions 有効化
- [x] good-first-issue 3件作成
- [x] Gandalf Challenge の動作確認・デバッグ（levels.py構文修正、全7レベル正常動作）

### KPI 目標
| 指標 | 現在 | 2週間後目標 |
|------|------|------------|
| GitHub Stars | 4 | 50 |
| PyPI DL/月 | 不明 | 500 |
| Zenn/Qiita いいね合計 | 計測中 | 100 |

---

## Phase 1: 点火（2026-04-12 〜 2026-05-31）

**ゴール**: 300 スター・1,000 PyPI DL/月・初の外部コントリビューター

### マーケティング
- [ ] Qiita/Zenn で週 1 記事ペース継続
- [ ] Twitter/X で週 3〜5 投稿ペース継続
- [ ] **Product Hunt ローンチ（5/13 水曜 予定）** ← 詳細は `content/product_hunt_strategy.md`
  - ⚠️ Coming Soon ページは廃止済み（2025-08）。Maker 信頼構築 + 外部チャネルで代替
  - [ ] Phase A: PH アカウント & Draft 作成、毎日コメント活動（〜4/20）
  - [ ] Phase B: 外部チャネル種まき & 支援者 50-100名 獲得（4/14〜4/28）
  - [ ] ギャラリー画像 5枚 + OG image PNG + デモ動画（〜4/21）
  - [ ] ローンチコピー最終レビュー & 支援者事前連絡（〜4/28）
  - [ ] LP 改善 & 全アセット PH アップロード（〜5/5）
  - [ ] Go/NoGo 判断（5/5）→ 基準未達なら 5/20 or 5/27 に延期
  - [ ] ローンチ実行 12:01 AM PT & 全 SNS 段階的展開（5/13）
- [ ] AI系 Meetup での 5分 LT 登壇
- [ ] LangChain/LlamaIndex Discord でシェア
- [x] ~~全日本AIハッカソン 2026（4/25）~~ → 不参加（取消）

### プロダクト
- [x] Anthropic SDK 統合（Issue #3） ← v0.5.0 完了
- [x] Policy Template Hub 公開（業種別ポリシー YAML） ← v0.5.0 完了
- [x] バッジ「Secured by AI Guardian」作成（採用企業が README に貼れる） ← 完了
- [x] VS Code 拡張のプロトタイプ（aig scan をエディタから実行） ← v0.6.0 完了
- [x] **LangGraph GuardNode** 統合 ← v0.6.2 追加（Phase 1 先行実装）
- [x] **ベンチマーク 100% 精度達成**（53/53 attacks, 0% false positive） ← v0.6.1
- [x] **韓国語・中国語パターン追加**（Issue #7）← v0.8.1
- [x] **間接インジェクション検知**（Issue #6: RAG/Webスクレイピング）← v0.8.1
- [x] **コンプライアンス文書作成**（OWASP/NIST/MITRE/CSA）← v0.8.1
- [x] **AI事業者ガイドライン v1.2 完全対応**（37/37要件）← v0.8.2
- [ ] **🔴 MCPセキュリティスキャナー**（`aig mcp scan`）— ツール定義のポイズニング検知、シャドウイング検知、ラグプル検知、出力ポイズニング検知。**唯一のOSS MCP セキュリティツール**を目指す
- [ ] **レイテンシベンチマーク公開** — ゼロ依存の速度優位を数字で証明。競合との比較表
- [ ] **Base64/Unicode/Emoji難読化検出の強化** — エージェント向け攻撃の最新手法

### KPI 目標
| 指標 | 目標 |
|------|------|
| GitHub Stars | 300 |
| PyPI DL/月 | 1,000 |
| 外部 PR 数 | 3+ |
| Discussions 投稿数 | 10+ |

---

## Phase 2: 成長（2026-06-01 〜 2026-08-31）

**ゴール**: 1,000 スター・5,000 PyPI DL/月・SaaS β版リリース・初課金

### マーケティング
- [x] ~~Product Hunt Launch~~ → Phase 1 に前倒し（5/13 ローンチ予定）
- [ ] Lablab.ai x Anthropic Hackathon（5/26〜6/2）参加
- [ ] DevNetwork Hackathon（5/11〜28）参加
- [ ] 企業導入事例 1本作成（自社 or 知人企業）
- [ ] AI Security Conference 登壇（「個人開発でOSS作った話」）

### プロダクト（SaaS β）
- [x] **Cloud Dashboard β**: ログ可視化・課金ページ・使用量メーター・PlanGate
- [x] **Stripe 決済統合**: Free/Pro/Business/Enterprise プラン、Webhook 6件実装、プラン制御ミドルウェア
- [x] **チーム管理**: メンバー一覧・招待・ロール設定・プラン上限制御
- [x] **Slack 通知**: 高リスク検知時の Webhook 通知（Block Kit メッセージ、Settings UI、通知設定API）
- [ ] メールリスト → β招待フロー構築
- [ ] **自動レッドチーミング** (`aig redteam`) — 自社LLMの脆弱性を自動テスト。Promptfoo買収後のOSS空白を埋める
- [ ] **メモリポイズニング検出** — GPT-5/Sonnet 4.5向け新攻撃（90%+成功率）への対策
- [ ] **Second-Order インジェクション検出** — 低権限→高権限エージェント間の権限昇格攻撃

### KPI 目標
| 指標 | 目標 |
|------|------|
| GitHub Stars | 1,000 |
| PyPI DL/月 | 5,000 |
| SaaS β登録者 | 100 |
| MRR | 初収益（$1〜$500） |

---

## Phase 3: 収益化（2026-09-01 〜 2026-12-31）

**ゴール**: MRR $1,000+・企業導入 3 社・持続可能な開発体制

### マーケティング
- [ ] 「Powered by AI Guardian」ロゴプログラム開始
- [ ] 日経クロステック / IT Leaders への PR（情シス向けメディア）
- [ ] ISACAカンファレンス出展・登壇
- [ ] 企業向けウェビナー開催

### プロダクト（Enterprise 対応）
- [ ] **オンプレ版インストーラー**（Docker Compose one-command deploy）
- [ ] **LDAP/SSO 統合**（Okta, Azure AD）
- [ ] **コンプライアンスレポート自動生成**（AI事業者GL, ISO27001 対応）
- [ ] **マルチテナント強化**: テナント別ポリシー・使用量管理
- [ ] **SLA 付きサポート**（Pro: 24h, Enterprise: 4h）
- [ ] **軽量ML分類器（オプション）** — BERTベースのインジェクション検出をオプション依存として提供。ゼロ依存コアは維持
- [ ] **SIEM連携**（Splunk/Datadog/Azure Sentinel）— エンタープライズの既存インフラに組み込み

### KPI 目標
| 指標 | 目標 |
|------|------|
| MRR | $1,000 |
| 有料顧客数 | 20 |
| GitHub Stars | 3,000 |
| PyPI DL/月 | 10,000 |
| 企業導入 | 3社 |

---

## Phase 4: スケール（2027-01〜）

**ゴール**: MRR $10,000+・資金調達検討・チーム拡大

- [ ] シリーズ A / エンジェル調達検討
- [ ] フルタイム開発者採用（OSS コントリビューターから）
- [ ] AWS/GCP/Azure Marketplace 掲載
- [ ] GENIAC-PRIZE 応募
- [ ] 海外展開（US, EU）

---

## 競合との差別化軸

| 軸 | AI Guardian | Guardrails AI | NeMo Guardrails | llm-guard | Cisco AI Defense |
|----|-------------|---------------|-----------------|-----------|-----------------|
| インストール | `pip install aig-guardian`（1行） | 複雑 | 複雑 | やや複雑(ML) | SDK依存 |
| 依存 | **ゼロ**（stdlib のみ） | 多数 | NVIDIA必須 | ML多数 | Cisco必須 |
| 価格 | **無料 OSS** | OSS（一部有料） | 無料 | OSS | 有料 |
| 日本語対応 | **ネイティブ**（JA/KO/ZH） | なし | なし | なし | なし |
| MCPセキュリティ | **対応（唯一）** | なし | なし | なし | なし |
| AI事業者GL v1.2 | **37/37 完全対応** | なし | なし | なし | なし |
| コンプライアンス | OWASP/NIST/MITRE/CSA | なし | なし | 一部 | SOC 2 |
| Remediation | **あり**（修正方法を説明） | なし | なし | なし | なし |

### 市場動向（2026年4月）
- **独立系競合の大半が大手に買収**: Lakera→Check Point($300M), Prompt Security→SentinelOne(~$250M), Pangea→CrowdStrike($260M), CalypsoAI→F5($180M), Promptfoo→OpenAI
- **新興OSS脅威**: Meta LlamaFirewall（3層防御）、Cisco DefenseClaw（Zero Trust）
- **市場規模**: AIセキュリティツール市場は2026年に82億ドル規模
- **AI Guardianの機会**: 独立系OSSの選択肢激減 → ベンダーロックイン回避のOSS需要が増加

---

## 収益シミュレーション（保守的）

| 時期 | Pro ($49/月) | Business ($299/月) | MRR | ARR |
|------|-------------|-------------------|-----|-----|
| 2026-08（β） | 5社 | 0社 | $245 | $2,940 |
| 2026-12 | 15社 | 3社 | $1,632 | $19,584 |
| 2027-06 | 50社 | 15社 | $6,935 | $83,220 |
| 2027-12 | 100社 | 40社 | $16,860 | $202,320 |

> 日本市場は SMB が多く、$49/月は「月1回のランチ代」程度。意思決定が早い。
> エンタープライズ 1 社で Pro 20社分の売上。情シスルートを重点開拓。

---

## 直近アクション一覧（優先順位付き）

### 🔴 今すぐ（今週）
1. ~~HN 返信投稿~~ ✅ 完了（Show HN → 返信に変更）
2. ~~Zenn 記事投稿~~ ✅ 完了（別記事で代替）
3. ~~Reddit 3本投稿~~ ✅ 投稿済
4. ~~DEV.to 英語記事投稿~~ ✅ 投稿済
5. ~~Gandalf Challenge 動作確認~~ ✅ 修正済
6. ~~v0.7.0 リリース~~ ✅ 2026-03-31

### 🟠 今月（Phase 0 完走〜Phase 1 移行）
7. Awesome list PR 送信（3リスト）
8. AI Meetup LT 登壇申し込み

### 🔴 今すぐ（今週 4/6〜）
9. **PH アカウント作成 & Product Draft 登録**（〜4/8）
10. **PH で毎日 2-3件にコメント開始**（4/6〜 継続）

### 🟡 今月〜来月（Phase 1: PH ローンチ中心）
11. **Maker 信頼構築: PH コミュニティ参加**（〜4/20、目標: 20+コメント）
12. **ギャラリー画像 5枚 + OG image + デモ動画**（〜4/21）
13. **外部チャネル種まき & 支援者 50-100名 獲得**（4/14〜4/28）
14. **ローンチコピー最終レビュー & 支援者事前連絡**（〜4/28）
15. **LP 改善 & 全アセット PH アップロード**（〜5/5）
16. **Go/NoGo 判断**（5/5）
17. **Product Hunt ローンチ 12:01 AM PT**（5/13 水）
18. Qiita/Zenn 週1記事ペース（PH前に3本は出したい）
19. メールリスト → β招待フロー構築

---

---

## 自動開発ループ（Research → Dev → Content）

2026-04-03 より、以下の半自動ループで AI Guardian を継続的に強化する。

```
月曜 09:00 JST — Research Scout    → content/research_backlog/
水曜 09:00 JST — Feature Dev       → パターン追加・テスト・CHANGELOG
金曜 09:00 JST — Content Writer    → content/articles/ ドラフト + content/ph_comments/ PHコメント
人間レビュー   — 記事確認・投稿・PHコメント投稿・SNS展開
```

| トリガー名 | トリガーID | スケジュール | 出力 |
|-----------|-----------|------------|------|
| `aig-research-scout` | `trig_017oPfYD5zp4hy25sYM1gPvw` | 毎週月曜 00:00 UTC | content/research_backlog/ |
| `aig-feature-dev` | `trig_01DhcJ8X6TLdJrGD8V4bX6M2` | 毎週水曜 00:00 UTC | パターン追加・テスト |
| `aig-content-writer` | `trig_01Tqos8yAwkigrH4DiXaxsz4` | 毎週金曜 00:00 UTC | content/articles/ + content/ph_comments/ |

詳細: [docs/DEV_LOOP.md](docs/DEV_LOOP.md)

### KPI
| 指標 | 目標 |
|------|------|
| 週次リサーチ実行率 | 90%+ |
| 月間新パターン追加数 | 4-8個 |
| 月間記事投稿数 | 2-4本 |
| ベンチマーク精度維持 | 100% |

---

*このロードマップは月次で見直す。KPI 達成状況に応じてフェーズを前倒し・後ろ倒しする。*
