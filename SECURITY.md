# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | ✅ Active support  |

## Vulnerability Disclosure

CURUZA handles financial data, personally identifiable information (PII), and business records. We take security seriously.

### Reporting a Vulnerability

If you discover a security vulnerability, **do not open a public issue**. Instead, report it privately:

- **Email**: herve@curuza.com
- **PGP Key**: Available at [hervekubana.dev/pgp](https://hervekubana.dev/pgp)

Please include:

- Description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Any proof-of-concept (if available)

You should receive a response within 48 hours. We will keep you informed of the resolution timeline.

### Disclosure Policy

We follow a **90-day disclosure window**:

1. Report received and acknowledged within 48 hours.
2. Patch developed and tested (target: 30 days for critical issues).
3. Patch released, and reporter notified.
4. Public disclosure after 90 days or when the fix is widely deployed.

## Security Best Practices

### For Developers

1. **Never commit secrets** — API keys, tokens, passwords, or database URLs. Use `.env` files and environment variables.
2. **RLS is mandatory** — Every database query must go through Supabase Row-Level Security. Never use the service role key client-side.
3. **Validate inputs** — Use Zod schemas for all API inputs. Never trust user-supplied data.
4. **Avoid `any`** — Use strict TypeScript types. Unsafe casts can hide type confusion bugs.
5. **Sanitize output** — Escape user-generated content rendered in the UI.
6. **Audit dependencies** — Run `npm audit` regularly. Keep packages up to date.
7. **Least privilege** — Employees should have the minimum role needed for their work.

### Authentication & Authorization

- JWT sessions are managed by Supabase Auth (GoTrue).
- Tokens are short-lived (1 hour) with refresh token rotation.
- Row-Level Security enforces tenant isolation on all 17 tables.
- Helper functions (`is_business_member`, `can_manage`) prevent RLS recursion.

### Data Protection

- All data in transit is encrypted via HTTPS/TLS.
- Sensitive environment variables are never exposed to the client.
- Audit logs capture every mutation with before/after snapshots.
- Database backups are encrypted at rest.

### Infrastructure

- Supabase handles database encryption at rest.
- Cloudflare Workers terminate TLS and provide DDoS protection.
- Docker images use a non-root user in production.

## RLS Documentation

All database tables are protected by Row-Level Security (RLS). The policy pattern is consistent:

| Operation | Policy                                | Role            |
| --------- | ------------------------------------- | --------------- |
| `SELECT`  | `is_business_member(business_id)`     | Any active user |
| `INSERT`  | `is_business_member(business_id)`     | Any active user |
| `UPDATE`  | `can_manage(business_id)`             | Owner / Manager |
| `DELETE`  | `can_manage(business_id)`             | Owner / Manager |

### Key Security-Definer Functions

These functions run with the privileges of the creator to avoid RLS recursion:

- `is_business_member(biz_id)` — returns true if the calling user belongs to the business
- `get_business_role(biz_id)` — returns the role (`owner`, `manager`, `employee`)
- `can_manage(biz_id)` — returns true if role is `owner` or `manager`

### Audit Logging

Every data mutation is logged to the `audit_logs` table:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

This provides full traceability for compliance and dispute resolution.
