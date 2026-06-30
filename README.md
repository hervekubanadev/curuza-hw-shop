<div align="center">
  <h1>CURUZA · Fintech Infrastructure Platform for African Retail</h1>
  <p><strong>Multi-tenant SaaS purpose-built for hardware & construction material retailers in emerging markets</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB" alt="React 19">
    <img src="https://img.shields.io/badge/Supabase-FF4438" alt="Supabase">
    <img src="https://img.shields.io/badge/TanStack-0041E8" alt="TanStack">
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/TypeScript-3178C6" alt="TypeScript">
    <img src="https://img.shields.io/badge/Cloudflare-380D9F" alt="Cloudflare Workers">
    <img src="https://img.shields.io/badge/License-MIT-success" alt="MIT License">
  </p>
  <p>
    <a href="#architecture">Architecture</a> •
    <a href="#api">API</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#roadmap">Roadmap</a>
  </p>
</div>

---

## The Problem

**African hardware retailers operate on paper and trust.**

A typical shop in Kigali, Nairobi, or Lagos runs on:
- Handwritten ledgers for sales and credit
- WhatsApp messages for order tracking
- Memory-based inventory management
- No digital record of customer debt

This leads to stock shrinkage, uncollected debts (30–50% of revenue), no credit history, and an inability to access working capital from financial institutions.

**CURUZA solves this** by providing a complete digital operations platform — inventory, POS, credit tracking, and professional document generation — with a clear upgrade path to fintech services.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React 19 + TanStack Start (SSR)              │
│  ┌──────────┐ ┌────────┐ ┌───────────┐ ┌────────────────────┐  │
│  │ Inventory│ │  POS   │ │ Credit    │ │ Proformas / DNs    │  │
│  │  Mgmt    │ │  Sales │ │ Tracking  │ │ + PDF Generation   │  │
│  └────┬─────┘ └───┬────┘ └─────┬─────┘ └─────────┬──────────┘  │
│       └───────────┴────────────┴─────────────────┘              │
│                         │                                       │
│               TanStack Query + Supabase Client                  │
│                  (RLS-secured, JWT-authenticated)                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
┌─────────────────────┐   ┌───────────────────────────┐
│   Supabase Auth      │   │   Supabase REST + GraphQL │
│   (GoTrue)           │   │   PostgreSQL 16 + RLS     │
│   JWT Sessions       │   │   17 tables, 12 RPCs      │
└─────────────────────┘   └───────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TanStack Router, TanStack Start (SSR) | UI, routing, server-side rendering |
| **Styling** | Tailwind CSS v4, shadcn/ui, Radix Primitives | Design system, accessibility |
| **State** | TanStack Query, React Context | Server state, optimistic updates |
| **Database** | Supabase — PostgreSQL 16, RLS, Auth, Storage | Data persistence, access control |
| **PDF** | jsPDF + jspdf-autotable | Proforma invoices, delivery notes, receipts |
| **Edge** | Cloudflare Workers | SSR deployment, global CDN |
| **CI/CD** | GitHub Actions | Lint, typecheck, build, deploy |

---

## Features

### Inventory Management
- Full CRUD with categories, subcategories, unit types
- Stock movement audit trail with before/after snapshots
- Low-stock and out-of-stock alerts with configurable thresholds
- Auto-generated readable IDs (`ITEM-0001`)

### Point of Sale
- Record sales with customer and item line items
- Automatic stock deduction and profit calculation
- Sale reversal with full stock restoration
- PDF receipt generation

### Credit & Debt Tracking
<!-- SCREENSHOT: credit-dashboard.png -->
- Itemized debt records with partial payment support
- Automated overdue detection and status tracking
- WhatsApp payment reminders
- Outstanding balance aggregation per customer

### Professional Documents
- Proforma invoices with optional VAT calculation
- Delivery notes with customer signature fields
- All documents downloadable as PDF

### Role-Based Access Control
| Role | Permissions |
|------|-----------|
| **Owner** | Full control, employee management, factory reset |
| **Manager** | Daily operations, reporting, inventory management |
| **Employee** | Sales processing, customer lookup, basic operations |

### Audit Logging
Every data mutation is logged with before/after JSON snapshots, user ID, and timestamp — providing full traceability for compliance and dispute resolution.

---

## API

CURUZA uses **Supabase** as its API layer. There is no custom backend — the PostgreSQL schema (17 tables), RLS policies, and security-definer functions _are_ the API contract.

### Database Schema

| Domain | Tables |
|--------|--------|
| **Multi-tenant core** | `businesses`, `profiles`, `employees`, `business_counters` |
| **Inventory** | `inventory_items`, `stock_movements` |
| **Sales** | `sales`, `sale_items` |
| **Credit** | `debts`, `debt_items`, `debt_payments` |
| **Documents** | `proformas`, `proforma_items`, `delivery_notes`, `delivery_note_items` |
| **System** | `app_settings`, `audit_logs` |

### RLS Policy Pattern

All tables protected by Row-Level Security:

```
SELECT  → is_business_member(business_id)      — any active member
INSERT  → is_business_member(business_id)      — any active member
UPDATE  → can_manage(business_id)              — owner or manager only
DELETE  → can_manage(business_id)              — owner or manager only
```

### Key RPCs

```sql
-- Generate auto-incrementing readable IDs
SELECT next_readable_id('business-id', 'sales', 'SALE');
-- Returns: 'SALE-0042'

-- Role checking (security-definer, prevents RLS recursion)
SELECT is_business_member('business-id');
SELECT get_business_role('business-id');
SELECT can_manage('business-id');
```

Full API reference: [`docs/API.md`](docs/API.md)

---

## Security

| Layer | Control |
|-------|---------|
| **Transport** | HTTPS enforced, HSTS headers |
| **Authentication** | Supabase Auth (GoTrue) — JWT-based sessions |
| **Authorization** | Row-Level Security on all 17 tables |
| **Role Enforcement** | Security-definer helper functions prevent RLS recursion |
| **Audit** | `audit_logs` table captures all mutations with before/after snapshots |
| **Secrets** | Service role key restricted to server-side middleware; anon key is safe with RLS |

---

## Scalability

- **Multi-tenancy:** Logical isolation via `business_id` foreign key on every table. All queries filtered through RLS.
- **PostgreSQL Indexes:** `business_id` indexed on all tenant-scoped tables. `created_at DESC` indexes for time-series queries.
- **Connection Pooling:** Supabase uses PgBouncer in transaction mode.
- **Edge Deployment:** Cloudflare Workers serve SSR globally with <50ms cold starts.
- **Stateless Design:** All session state in JWT tokens — horizontally scalable without shared memory.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.2+ or Node.js v22+
- [Supabase](https://supabase.com) project (local or cloud)
- [Docker](https://docker.com) (optional, for containerized setup)

### Quick Start

```bash
# Clone
git clone https://github.com/hervekubanadev/curuza-hw-shop.git
cd curuza-hw-shop

# Install
bun install

# Configure
cp .env.example .env
# Edit .env with your Supabase project URL and anon key

# Run migrations
bunx supabase link --project-ref your-project-ref
bunx supabase db push

# Start dev server
bun run dev
```

### With Docker

```bash
docker compose up -d
```

### Environment Variables

See [`.env.example`](.env.example) for all required variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Admin key (never expose to client) |

---

## Deployment

### Production Build

```bash
bun run build
```

### Cloudflare Workers

```bash
bunx wrangler deploy
```

### Docker

```bash
docker compose -f docker-compose.yml up -d
```

Full deployment guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

---

## Project Structure

```
src/
├── routes/              # File-based routing (TanStack Router)
│   ├── __root.tsx       # Root layout + providers
│   ├── index.tsx        # Entry / redirect
│   ├── login.tsx        # Authentication
│   ├── onboarding.tsx   # Business setup wizard
│   └── _app/            # Authenticated routes
│       ├── dashboard.tsx
│       ├── inventory.tsx
│       ├── sales.tsx
│       ├── debts.tsx
│       ├── customers.tsx
│       ├── proformas.tsx
│       ├── delivery-notes.tsx
│       ├── inbox.tsx
│       ├── reports.tsx
│       ├── employees.tsx
│       └── settings.tsx
├── pages/               # Page components
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── layout/          # AppShell, sidebar, navigation
│   └── common/          # Shared domain components
├── contexts/            # AuthContext, BusinessContext
├── lib/                 # Utilities, queries, PDF generation
└── integrations/        # Supabase client configuration
```

---

## Roadmap

### Current (v1.0)
- [x] Multi-tenant business isolation
- [x] Inventory management with stock tracking
- [x] Point of sale with profit analytics
- [x] Credit and debt management
- [x] Proforma invoice and delivery note generation
- [x] Role-based access control (Owner / Manager / Employee)
- [x] Audit logging

### Fintech Milestones
- [ ] **Mobile Money Integration** — MTN MoMo, Airtel Money for POS payments and debt collection
- [ ] **Automated Reconciliation** — Match payments to debts and sales
- [ ] **Credit Scoring** — Build customer credit profiles from payment history
- [ ] **Working Capital Loans** — Partner with fintech lenders for inventory financing
- [ ] **Multi-Currency Support** — RWF, KES, UGX, USD with real-time FX
- [ ] **Supplier Management** — Purchase orders, supplier credit, automated reordering

### Platform
- [ ] Offline-first support with local caching (PWA)
- [ ] Mobile app (Flutter) for field sales and deliveries
- [ ] Barcode/QR scanning for inventory
- [ ] Advanced analytics and demand forecasting
- [ ] API marketplace for third-party integrations

---

## Screenshots

<!-- SCREENSHOT: dashboard.png — Real-time KPI dashboard with today/7-day/30-day metrics -->
<!-- SCREENSHOT: inventory.png — Inventory list with search, filters, and stock alerts -->
<!-- SCREENSHOT: pos.png — Point of sale interface with item search and cart -->
<!-- SCREENSHOT: credit.png — Credit tracking dashboard with overdue alerts -->
<!-- SCREENSHOT: proforma.png — Proforma invoice editor with VAT toggle -->

---

## Contributing

We welcome contributions. Please open an issue first to discuss proposed changes.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

## Contact

**KUBANA Friend Herve** — [hervekubana.dev](https://hervekubana.dev)

Project Link: [https://github.com/hervekubanadev/curuza-hw-shop](https://github.com/hervekubanadev/curuza-hw-shop)

---

<div align="center">
  <sub>Built with ❤️ for African hardware retailers | Kigali, Rwanda</sub>
  <br>
  <sub><strong>Positioning:</strong> Fintech Infrastructure Platform for African Retail — from digital operations to financial inclusion</sub>
</div>
