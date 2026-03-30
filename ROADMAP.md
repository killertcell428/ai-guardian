# AI Guardian — OSS から収益化へのロードマップ

> 最終更新: 2026-03-29
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
| **OSS Free** | 個人・スタートアップ | 無料 | Guard クラス・48ルール・CLI |
| **Cloud Pro** | 小規模チーム (2-20名) | $49/月 | Webダッシュボード・Slack通知・月次レポート |
| **Business** | 中規模企業 (20-200名) | $299/月 | 複数テナント・SSO・SLA・カスタムポリシー |
| **Enterprise** | 大企業・金融・医療 | 要見積 | オンプレ・LDAP・監査対応・専任サポート |

---

## Phase 0: 種まき（〜2026-04-12）✅ Phase 1 先行完了

**ゴール**: 最初の 50 スター・100 PyPI DL/日・コミュニティの芽

### マーケティング
- [ ] Show HN 投稿（月曜夜 22:00 JST）← **最優先**
- [ ] Zenn 6本目（MCP信頼モデル）手動公開
- [x] Reddit r/Python, r/netsec, r/MachineLearning 投稿
- [x] DEV.to 英語記事投稿
- [ ] Awesome list への PR 送信（3リスト）

### プロダクト
- [x] PyPI v0.4.0 リリース
- [x] GitHub Discussions 有効化
- [x] good-first-issue 3件作成
- [ ] Gandalf Challenge の動作確認・デバッグ

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
- [ ] Product Hunt 準備（5月ローンチ想定）
- [ ] AI系 Meetup での 5分 LT 登壇
- [ ] LangChain/LlamaIndex Discord でシェア
- [ ] 全日本AIハッカソン 2026（4/25）参加

### プロダクト
- [x] Anthropic SDK 統合（Issue #3） ← v0.5.0 完了
- [x] Policy Template Hub 公開（業種別ポリシー YAML） ← v0.5.0 完了
- [x] バッジ「Secured by AI Guardian」作成（採用企業が README に貼れる） ← 完了
- [x] VS Code 拡張のプロトタイプ（aig scan をエディタから実行） ← v0.6.0 完了
- [x] **LangGraph GuardNode** 統合 ← v0.6.2 追加（Phase 1 先行実装）
- [x] **ベンチマーク 100% 精度達成**（53/53 attacks, 0% false positive） ← v0.6.1

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
- [ ] Product Hunt Launch（英語圏拡大）
- [ ] Lablab.ai x Anthropic Hackathon（5/26〜6/2）参加
- [ ] DevNetwork Hackathon（5/11〜28）参加
- [ ] 企業導入事例 1本作成（自社 or 知人企業）
- [ ] AI Security Conference 登壇（「個人開発でOSS作った話」）

### プロダクト（SaaS β）
- [ ] **Cloud Dashboard β**: ログ可視化・アラート設定・月次レポート
- [ ] **Stripe 決済統合**: Free/Pro/Business プラン切り替え
- [ ] **チーム管理**: 複数メンバー招待・ロール設定
- [ ] **Slack / Teams 通知**: 高リスク検知をリアルタイム通知
- [ ] メールリスト → β招待フロー構築

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

| 軸 | AI Guardian | Guardrails AI | NeMo Guardrails | Cisco Agent SDK |
|----|-------------|---------------|-----------------|-----------------|
| インストール | `pip install aig-guardian`（1行） | 複雑 | 複雑 | SDK依存 |
| 依存 | **ゼロ**（stdlib のみ） | 多数 | NVIDIA必須 | Cisco必須 |
| 価格 | **無料 OSS** | OSS（一部有料） | 無料 | 有料 |
| 対象 | **個人〜エンタープライズ** | エンタープライズ | エンタープライズ | エンタープライズ |
| 日本語対応 | **ネイティブ**（マイナンバー等） | なし | なし | なし |
| Remediation | **あり**（修正方法を説明） | なし | なし | なし |

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
1. Show HN 投稿（月曜夜 22:00 JST）
2. Zenn 6本目手動公開
3. ~~Reddit 3本投稿~~ ✅ 投稿済
4. ~~DEV.to 英語記事投稿~~ ✅ 投稿済
5. Gandalf Challenge 動作確認

### 🟠 今月（Phase 0 完走）
6. Awesome list PR 送信
7. AI Meetup LT 登壇申し込み
8. Policy Template Hub の設計
9. バッジ「Secured by AI Guardian」作成

### 🟡 来月（Phase 1 着手）
11. Product Hunt 準備開始
12. Anthropic SDK 統合（Issue #3）
13. SaaS β の基本設計・Stripe 統合
14. 全日本AIハッカソン 4/25 参加
15. メールリスト収集開始

---

*このロードマップは月次で見直す。KPI 達成状況に応じてフェーズを前倒し・後ろ倒しする。*
