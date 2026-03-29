# Human-in-the-Loop (Self-hosted Dashboard)

The open-source core library makes automatic block/allow decisions based on risk scores.
The **self-hosted backend** adds a Human-in-the-Loop (HITL) review layer for cases where
automatic decisions are insufficient — medium-risk requests that need human judgement,
compliance-driven audit trails, or multi-tenant policy management.

## Architecture

```
User request
     │
     ▼
ai-guardian core      ← pattern matching, risk scoring
     │
  CRITICAL ──────────► Auto-block (no human review needed)
     │
  MEDIUM/HIGH ────────► Review queue (human reviews)
     │
   LOW ────────────────► Auto-allow (no human review needed)
     │
     ▼
Human reviewer        ← approve / reject / escalate
     │
     ▼
Audit log             ← immutable event trail
```

## Quick start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/killertcell428/ai-guardian
cd ai-guardian

# Copy and fill in environment variables
cp .env.example .env
# Edit .env: set SECRET_KEY, OPENAI_API_KEY, POSTGRES_PASSWORD

# Start all services
docker compose up -d

# Run database migrations
docker compose exec backend alembic upgrade head

# Create the first admin user
docker compose exec backend python -m app.cli create-admin \
  --email admin@example.com --password changeme
```

Services:
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:8000
- **API docs**: http://localhost:8000/docs

## Review queue

Requests flagged as MEDIUM or HIGH are placed in the review queue.

### Reviewer workflow

1. Log in to the dashboard at http://localhost:3000
2. Navigate to **Review Queue**
3. For each item:
   - **Approve** — the request proceeds to the LLM
   - **Reject** — the request is permanently blocked
   - **Escalate** — route to a senior reviewer

### API endpoints

```
GET  /api/v1/review/queue          List pending items
GET  /api/v1/review/{id}           Get item detail
POST /api/v1/review/{id}/approve   Approve
POST /api/v1/review/{id}/reject    Reject
POST /api/v1/review/{id}/escalate  Escalate
```

Example:

```bash
curl -X POST http://localhost:8000/api/v1/review/abc123/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note": "Reviewed and approved — internal user, not a threat."}'
```

## Multi-tenant policy management

Each tenant (team, product, customer) can have its own policy:

```bash
# Create a tenant
curl -X POST http://localhost:8000/api/v1/admin/tenants \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Acme Corp", "policy": "strict"}'

# Update a tenant's policy
curl -X PUT http://localhost:8000/api/v1/policies/acme-corp \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"auto_block_threshold": 70, "custom_rules": [...]}'
```

## OpenAI-compatible proxy

The backend exposes an OpenAI-compatible proxy endpoint, so you can point any OpenAI
SDK client at your self-hosted instance:

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

All requests are scanned, logged, and — if MEDIUM/HIGH risk — placed in the review queue
before being forwarded to OpenAI.

## Audit log

Every scan event is written to an immutable audit log:

```
GET /api/v1/audit?tenant=acme-corp&from=2026-01-01&to=2026-12-31
```

Each entry includes:
- `request_id` — UUID
- `tenant_id`
- `risk_score`, `risk_level`
- `reasons`, `remediation`
- `decision` — `allowed` / `blocked` / `pending_review`
- `reviewer_id` (if human-reviewed)
- `timestamp`

## Scaling

For production deployments:

- Run multiple `backend` replicas behind a load balancer
- Use a managed PostgreSQL instance (e.g. AWS RDS, GCP Cloud SQL)
- Use a managed Redis instance (e.g. AWS ElastiCache)
- Set `WORKERS=4` (or 2× CPU cores) in the backend environment

See `backend/README.md` for full deployment documentation.

## SaaS vs. self-hosted

| Feature                     | Core library | Self-hosted | SaaS (coming soon) |
|-----------------------------|:------------:|:-----------:|:------------------:|
| Pattern detection           | ✅           | ✅          | ✅                 |
| Custom YAML policies        | ✅           | ✅          | ✅                 |
| Human-in-the-Loop queue     | —            | ✅          | ✅                 |
| Audit log                   | —            | ✅          | ✅                 |
| Multi-tenant management     | —            | ✅          | ✅                 |
| Analytics dashboard         | —            | ✅          | ✅                 |
| Managed hosting             | —            | —           | ✅                 |
| SSO / SAML                  | —            | —           | ✅                 |

Interested in the managed SaaS version? [Join the waitlist →](https://github.com/killertcell428/ai-guardian/discussions)
