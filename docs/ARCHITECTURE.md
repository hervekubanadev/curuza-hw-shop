# Architecture

## System Overview

CURUZA is a multi-tenant SaaS platform built on the **React 19 + TanStack Start** stack with **Supabase** as the BaaS layer. The architecture follows a **JAMstack** pattern with server-side rendering (SSR) via TanStack Start and edge-deployed static assets on Cloudflare Workers.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              React 19 + TanStack Router (SSR)              │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────────────┐  │  │
│  │  │Inventory│ │  Sales   │ │ Credit │ │ Documents      │  │  │
│  │  │  Mgmt   │ │   POS    │ │Tracking│ │(Proformas/DNs) │  │  │
│  │  └────┬────┘ └────┬─────┘ └───┬────┘ └───────┬────────┘  │  │
│  │       └───────────┴───────────┴───────────────┘           │  │
│  │                          │                                 │  │
│  │              TanStack Query (Data Fetching)                 │  │
│  └──────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKERS (Edge)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  TanStack Start SSR Server (Cloudflare Workers runtime)   │  │
│  │  - Request handling & routing                             │  │
│  │  - Server-side rendering                                  │  │
│  │  - API middleware (service role restricted)               │  │
│  └──────────────────────┬────────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐
│   Supabase Auth      │   │   Supabase REST/    │
│   (GoTrue)           │   │   GraphQL API        │
│   - Email/password   │   │                      │
│   - JWT tokens       │   │   RLS enforced       │
│   - Session mgmt     │   │   Security definer   │
└─────────┬───────────┘   └──────────┬────────────┘
          │                          │
          └──────────┬──────────────┘
                     ▼
┌─────────────────────────────────────┐
│         PostgreSQL (Supabase)        │
│                                      │
│  ┌─────────────┐ ┌───────────────┐  │
│  │  businesses  │ │  profiles     │  │
│  │  employees   │ │  counters     │  │
│  ├─────────────┤ ├───────────────┤  │
│  │ inventory   │ │ stock_moves   │  │
│  │ customers   │ │ sales/items   │  │
│  ├─────────────┤ ├───────────────┤  │
│  │ debts/items │ │ debt_payments │  │
│  │ proformas   │ │ delivery_notes│  │
│  ├─────────────┤ ├───────────────┤  │
│  │ app_settings│ │ audit_logs    │  │
│  └─────────────┘ └───────────────┘  │
│                                      │
│  Row-Level Security on ALL tables    │
│  + Security-definer helper functions │
└─────────────────────────────────────┘
```

## Key Design Decisions

### 1. Supabase as Backend Layer
- **PostgreSQL** provides relational integrity, indexing, and complex queries.
- **Row-Level Security (RLS)** enforces tenant isolation at the database level, eliminating the need for a traditional API gateway.
- **Supabase Auth** handles JWT issuance and session management.
- **Security-definer functions** (`is_business_member`, `get_business_role`) prevent RLS recursion while exposing safe tenant-checking logic.

### 2. TanStack Start for SSR
- File-based routing with automatic code splitting.
- Server-side rendering for fast initial loads and SEO.
- Cloudflare Workers as the deployment target for global edge distribution.

### 3. Multi-tenancy via `business_id`
Every data table carries a `business_id` foreign key. RLS policies use `is_business_member(business_id)` to scope all queries to the authenticated user's tenant. This provides:

- **Isolation:** No tenant can access another tenant's data.
- **Performance:** Indexed `business_id` columns ensure efficient query filtering.
- **Simplicity:** No separate database per tenant; shared infrastructure with logical separation.

### 4. Audit Logging
All data mutations are recorded in `audit_logs` with before/after JSON snapshots, enabling full traceability for compliance and dispute resolution.

## Data Flow

```
User Request
    │
    ▼
TanStack Router ──► Route Component
    │                      │
    │              TanStack Query
    │                      │
    ▼                      ▼
Supabase Client ──────► Supabase REST API
(anon key + JWT)            │
                            ▼
                    PostgreSQL + RLS
                    (filters by business_id)
                            │
                            ▼
                    Response (scoped data)
```

## Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 19 + TanStack Start | UI, routing, SSR |
| Styling | Tailwind CSS v4 + shadcn/ui | Design system |
| Database | PostgreSQL 16 (via Supabase) | Primary data store |
| Auth | Supabase Auth (GoTrue) | Authentication, JWT |
| Storage | Supabase Storage | Business assets (logos, stamps) |
| PDF | jsPDF + jspdf-autotable | Proformas, delivery notes, receipts |
| Deployment | Cloudflare Workers | Edge SSR + static assets |
| CI/CD | GitHub Actions | Lint, typecheck, build, test |
