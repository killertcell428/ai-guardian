# AI Guardian — 自動開発ループ設計書

> 最終更新: 2026-04-03
> 概要: セキュリティリサーチ → 機能開発 → 記事投稿 の半自動ループで AI Guardian を継続的に強化する

---

## ループ概要

```
┌─────────────────────────────────────────────────────────┐
│                  Weekly Dev Loop                         │
│                                                         │
│  ① Research Scout (月曜)                                │
│     └→ content/research_backlog/YYYYMMDD_findings.md    │
│                                                         │
│  ② Feature Dev (水曜)                                   │
│     └→ gap_analysis → パターン追加 → テスト → version up│
│                                                         │
│  ③ Article Writer (金曜)                                │
│     └→ content/articles/YYYYMMDD_*.md (ドラフト)        │
│                                                         │
│  人間レビュー: 記事確認 → 投稿 → SNS展開               │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Research Scout（毎週月曜 09:00 JST）

### 目的
最新の AI エージェントセキュリティ脅威・ガバナンス動向を調査し、構造化されたファインディングスにまとめる。

### 調査対象
1. **脅威・脆弱性**: 新しい攻撃手法、CVE、インシデント報告
2. **ガバナンス・規制**: 各国の AI 規制動向、ガイドライン更新
3. **ツール・フレームワーク**: 競合製品のアップデート、新ツール
4. **学術・業界レポート**: OWASP、NIST、Gartner 等の新規レポート

### 出力先
```
content/research_backlog/
├── YYYYMMDD_findings.md      # 週次調査レポート
├── YYYYMMDD_findings.md
└── ...
```

### 出力フォーマット
```markdown
---
date: YYYY-MM-DD
type: weekly_research
status: new  # new → analyzed → developed → published
---

# 週次セキュリティリサーチ (YYYY-MM-DD)

## 発見事項サマリ
- 重要度高: N件
- 重要度中: N件
- 重要度低: N件

## 発見事項

### [HIGH] タイトル
- **概要**: ...
- **ソース**: URL
- **AI Guardian 関連度**: 高/中/低
- **対策の方向性**: ai-guardianで対応可能な内容
- **推奨アクション**: pattern追加 / policy更新 / 記事化 / ウォッチ継続

### [MED] タイトル
...
```

---

## Phase 2: Feature Dev（毎週水曜 09:00 JST）

### 目的
Research Scout のファインディングスを読み、ai-guardian の現状とのギャップを特定し、必要な機能を実装する。

### プロセス
1. **ギャップ分析**: `content/research_backlog/` の `status: new` エントリを読む
2. **優先度判定**: AI Guardian 関連度 × 実装コスト で優先順位付け
3. **実装**: 以下のいずれかを実行
   - `ai_guardian/patterns.py` に新検出パターン追加
   - `ai_guardian/filters/patterns.py` にGuardクラス用パターン追加
   - `ai_guardian/similarity.py` に新しい攻撃フレーズ追加
   - `policy_templates/` に新ポリシーテンプレート追加
   - `ai_guardian/compliance.py` に新規制マッピング追加
4. **テスト**: `tests/` にテストケース追加、ベンチマーク実行
5. **ステータス更新**: findings の status を `new` → `analyzed` → `developed` に更新

### 実装ルール
- 1回のループで実装するのは最大3パターンまで（品質優先）
- ベンチマーク精度が下がる変更は入れない（100% 維持）
- 既存テストが全パスすることを確認
- CHANGELOG.md にエントリ追加

### 出力
- 新パターン/機能のコード変更
- テストコード
- CHANGELOG.md 更新
- findings の status 更新

---

## Phase 3: Article Writer（毎週金曜 09:00 JST）

### 目的
リサーチ結果と新機能を組み合わせて、Zenn/Qiita 向けの技術記事ドラフトを生成する。

### 記事構成テンプレート
```markdown
---
title: "..."
emoji: "..."
type: "tech"
topics: ["AIセキュリティ", "AIエージェント", ...]
published: false
---

## はじめに
[最新の脅威/トレンドのフック]

## 問題の背景
[技術的な解説、なぜ重要か]

## 具体的なリスク
[実例、攻撃手法の解説]

## 対策アプローチ
[一般的な対策 + AI Guardian での対応方法]

## AI Guardian での実装
[コード例、使い方]

## まとめ
[要点の整理]

## 参考リンク
```

### 記事の方針
- **価値ファースト**: 記事の80%は純粋な技術解説。AI Guardian の紹介は自然な文脈で20%以内
- **実践的**: コード例、設定例を必ず含める
- **最新性**: 直近1-2週間のニュースやリサーチに基づく
- **投稿先の使い分け**:
  - Zenn: 深い技術解説、シリーズ記事
  - Qiita: ハウツー、実装ガイド
  - DEV.to: 英語版（月1回程度）

### 出力先
```
content/articles/YYYYMMDD_[topic]_[platform].md
```

---

## 運用ルール

### 人間の関与ポイント（半自動の「半」）
1. **リサーチレビュー**: 月曜の findings を確認し、方向性を修正
2. **実装レビュー**: 水曜の PR をレビュー・マージ
3. **記事レビュー**: 金曜のドラフトを確認・編集・投稿
4. **月次振り返り**: ループの効果測定と調整

### KPI
| 指標 | 目標 |
|------|------|
| 週次リサーチ実行率 | 90%+ |
| 月間新パターン追加数 | 4-8個 |
| 月間記事投稿数 | 2-4本 |
| ベンチマーク精度維持 | 100% |
| PyPI DL 増加率 | 月+20% |

### ディレクトリ構成（追加分）
```
content/
├── articles/              # 既存: 投稿用記事
├── research_backlog/      # 新規: リサーチ findings
│   └── YYYYMMDD_findings.md
└── ...
```

---

## リモートトリガー設定

| トリガー名 | スケジュール | 説明 |
|-----------|------------|------|
| `aig-research-scout` | 毎週月曜 09:00 JST | セキュリティリサーチ |
| `aig-feature-dev` | 毎週水曜 09:00 JST | ギャップ分析＆機能開発 |
| `aig-article-writer` | 毎週金曜 09:00 JST | 記事ドラフト生成 |

---

*このドキュメントは月次で見直す。*
