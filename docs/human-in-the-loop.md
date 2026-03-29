# Human-in-the-Loop（セルフホスト型ダッシュボード）

オープンソースのコアライブラリは、リスクスコアに基づいて自動的にブロック/許可の判定を行います。
**セルフホスト型バックエンド**は、自動判定では対応しきれないケースに向けた Human-in-the-Loop（HITL）レビュー機能を追加します。人間の判断が必要な中リスクのリクエスト、コンプライアンス上の監査証跡、マルチテナントのポリシー管理などに対応します。

## アーキテクチャ

```
ユーザーリクエスト
     │
     ▼
ai-guardian core      ← パターンマッチング、リスクスコアリング
     │
  CRITICAL ──────────► 自動ブロック（人間のレビュー不要）
     │
  MEDIUM/HIGH ────────► レビューキュー（人間がレビュー）
     │
   LOW ────────────────► 自動許可（人間のレビュー不要）
     │
     ▼
人間のレビュアー      ← 承認 / 却下 / エスカレーション
     │
     ▼
監査ログ             ← 変更不可能なイベント証跡
```

## Docker Compose でのクイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/killertcell428/ai-guardian
cd ai-guardian

# 環境変数をコピーして設定
cp .env.example .env
# .env を編集: SECRET_KEY, OPENAI_API_KEY, POSTGRES_PASSWORD を設定

# 全サービスを起動
docker compose up -d

# データベースマイグレーションを実行
docker compose exec backend alembic upgrade head

# 最初の管理者ユーザーを作成
docker compose exec backend python -m app.cli create-admin \
  --email admin@example.com --password changeme
```

サービス一覧:
- **ダッシュボード**: http://localhost:3000
- **API**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs

## レビューキュー

MEDIUM または HIGH と判定されたリクエストはレビューキューに入ります。

### レビュアーのワークフロー

1. http://localhost:3000 のダッシュボードにログイン
2. **Review Queue** に移動
3. 各アイテムに対して以下を実行:
   - **Approve** — リクエストを LLM に転送
   - **Reject** — リクエストを恒久的にブロック
   - **Escalate** — 上位レビュアーに回付

### API エンドポイント

```
GET  /api/v1/review/queue          保留中のアイテム一覧
GET  /api/v1/review/{id}           アイテムの詳細取得
POST /api/v1/review/{id}/approve   承認
POST /api/v1/review/{id}/reject    却下
POST /api/v1/review/{id}/escalate  エスカレーション
```

使用例:

```bash
curl -X POST http://localhost:8000/api/v1/review/abc123/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note": "Reviewed and approved — internal user, not a threat."}'
```

## マルチテナントポリシー管理

テナント（チーム、プロダクト、顧客）ごとに独自のポリシーを設定できます。

```bash
# テナントを作成
curl -X POST http://localhost:8000/api/v1/admin/tenants \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Acme Corp", "policy": "strict"}'

# テナントのポリシーを更新
curl -X PUT http://localhost:8000/api/v1/policies/acme-corp \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"auto_block_threshold": 70, "custom_rules": [...]}'
```

## OpenAI 互換プロキシ

バックエンドは OpenAI 互換のプロキシエンドポイントを公開しています。任意の OpenAI SDK クライアントからセルフホストインスタンスに接続できます。

```python
import openai

client = openai.OpenAI(
    api_key="your-ai-guardian-api-key",
    base_url="http://localhost:8000/api/v1/proxy",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)
```

すべてのリクエストはスキャン・ログ記録され、MEDIUM/HIGH リスクの場合は OpenAI に転送される前にレビューキューに入ります。

## 監査ログ

すべてのスキャンイベントは変更不可能な監査ログに記録されます。

```
GET /api/v1/audit?tenant=acme-corp&from=2026-01-01&to=2026-12-31
```

各エントリには以下が含まれます:
- `request_id` — UUID
- `tenant_id`
- `risk_score`, `risk_level`
- `reasons`, `remediation`
- `decision` — `allowed` / `blocked` / `pending_review`
- `reviewer_id`（人間がレビューした場合）
- `timestamp`

## スケーリング

本番環境へのデプロイでは以下を推奨します:

- ロードバランサーの背後に `backend` の複数レプリカを配置
- マネージド PostgreSQL を使用（例: AWS RDS, GCP Cloud SQL）
- マネージド Redis を使用（例: AWS ElastiCache）
- バックエンド環境で `WORKERS=4`（または CPU コア数の 2 倍）を設定

詳細なデプロイ手順は `backend/README.md` を参照してください。

## SaaS 版とセルフホスト版の比較

| 機能                        | コアライブラリ | セルフホスト | SaaS（近日公開） |
|-----------------------------|:------------:|:-----------:|:------------------:|
| パターン検出                | ✅           | ✅          | ✅                 |
| カスタム YAML ポリシー      | ✅           | ✅          | ✅                 |
| Human-in-the-Loop キュー    | —            | ✅          | ✅                 |
| 監査ログ                    | —            | ✅          | ✅                 |
| マルチテナント管理          | —            | ✅          | ✅                 |
| 分析ダッシュボード          | —            | ✅          | ✅                 |
| マネージドホスティング      | —            | —           | ✅                 |
| SSO / SAML                  | —            | —           | ✅                 |

マネージド SaaS 版に興味がありますか？ [ウェイトリストに登録 →](https://github.com/killertcell428/ai-guardian/discussions)
