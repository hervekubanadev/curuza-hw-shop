# Deployment Guide

## Prerequisites

- [Bun](https://bun.sh) v1.2+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local DB)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (for Cloudflare)
- [Docker](https://docker.com) (optional, for containerized deployment)

---

## 1. Supabase (Database)

### Production Project

```bash
# Link your local project to the remote Supabase project
bunx supabase link --project-ref your-project-ref

# Push migrations (creates all tables, RLS, triggers, functions)
bunx supabase db push

# Apply seed data (if any)
bunx supabase db seed
```

### Local Development

```bash
# Start local Supabase stack
bunx supabase start

# This runs:
#   - PostgreSQL 16
#   - GoTrue (auth)
#   - REST API
#   - Realtime
#   - Storage
#   - Inbucket (email testing)

# Run migrations locally
bunx supabase db push

# View local Studio
open http://localhost:54323
```

### Environment Variables

Set these in your Supabase project dashboard → Settings → API or local `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

> **Security:** Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. The anon key is safe because RLS enforces tenant isolation.

---

## 2. Application

### Option A: Cloudflare Workers (Recommended)

```bash
# Install dependencies
bun install

# Build for production
bun run build

# Deploy to Cloudflare Workers
bunx wrangler deploy

# Or preview locally
bunx wrangler dev
```

The `wrangler.jsonc` file at the project root configures the worker name, routes, and environment variables.

### Option B: Docker

```bash
# Build the Docker image
docker compose build

# Run with PostgreSQL
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Option C: Traditional Hosting

```bash
# Build static + server assets
bun run build

# The output goes to dist/
# Serve with any Node.js server:
node dist/server/index.js

# Or serve static assets with Nginx/Caddy
```

---

## 3. Continuous Deployment (GitHub Actions)

The CI pipeline (`.github/workflows/ci.yml`) runs:

1. **Lint** — ESLint with TypeScript rules
2. **Type Check** — `tsc --noEmit`
3. **Build** — Production build
4. **Test** — Vitest (if tests exist)

To enable automatic deployment:

1. Add repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Uncomment the deploy step in `ci.yml` or create a separate deploy workflow.

---

## 4. Multi-Tenant Considerations

### PostgreSQL Indexing

The following indexes are critical for multi-tenant query performance:

```sql
-- All tenant-scoped tables must have a business_id index
CREATE INDEX ON inventory_items(business_id);
CREATE INDEX ON sales(business_id);
CREATE INDEX ON debts(business_id);
-- ... (already in migration)
```

### Connection Pooling

Supabase uses PgBouncer for connection pooling. Configure pool settings in the Supabase dashboard:

- **Pool Mode:** Transaction
- **Default Pool Size:** 15 (adjust based on plan)
- **Max Client Connections:** Matches your plan limit

### RLS Performance

Security-definer functions (`is_business_member`, `can_manage`) are stable, immutable, and indexed. They add minimal overhead (typically <2ms per query).

---

## 5. Environment Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Admin key (never expose to client) |
| `CLOUDFLARE_ACCOUNT_ID` | For CF deploy | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | For CF deploy | Cloudflare API token |
| `PUBLIC_URL` | For SSR | Canonical deployment URL |

---

## 6. Verification

After deployment, verify:

```bash
# Check the app is reachable
curl -I https://curuza.rw

# Verify API access
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $JWT" \
     https://project.supabase.co/rest/v1/inventory_items?select=count

# Confirm RLS isolation
# (try accessing another tenant's data — should return empty)
```

---

## Architecture Diagram

```
┌──────────┐    ┌───────────┐    ┌─────────────┐
│  Browser  │───▶│ Cloudflare │───▶│  Supabase   │
│  (React)  │    │  Workers   │    │ PostgreSQL  │
└──────────┘    └───────────┘    └─────────────┘
                      │                  │
                      ▼                  ▼
               Static Assets       RLS + Auth
               (CDN edge)         (tenant isolation)
```
