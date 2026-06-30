<div align="center">
  <h1>CURUZA · Hardware Shop Management</h1>
  <p><strong>Multi-tenant SaaS for hardware retailers in emerging markets</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB" alt="React 19">
    <img src="https://img.shields.io/badge/Supabase-FF4438" alt="Supabase">
    <img src="https://img.shields.io/badge/TanStack-0041E8" alt="TanStack">
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/TypeScript-3178C6" alt="TypeScript">
    <img src="https://img.shields.io/badge/Cloudflare-380D9F" alt="Cloudflare">
  </p>
</div>

---

## Overview

CURUZA is a production-grade, multi-tenant SaaS platform purpose-built for hardware and construction material retailers in Rwanda and across Africa. It replaces paper ledgers and fragmented spreadsheets with a unified dashboard for inventory, sales, credit tracking, and business intelligence.

**Live demo:** [curuza.rw](https://curuza.rw) (demo credentials available on request)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React 19 + TanStack Start          │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐  │
│  │Inventory│ │  Sales   │ │ Debts  │ │Proformas   │  │
│  └────┬────┘ └────┬─────┘ └───┬────┘ └─────┬─────┘  │
│       └───────────┴───────────┴────────────┘         │
│                        │                             │
│              Supabase Client (RLS-secured)            │
└────────────────────────┬────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │     Supabase         │
              │  PostgreSQL + Auth   │
              │  + Storage + RLS     │
              └─────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TanStack Router, TanStack Start (SSR) |
| **Styling** | Tailwind CSS v4, shadcn/ui, Radix Primitives |
| **Backend** | Supabase (PostgreSQL, Auth, RLS, Storage) |
| **State** | TanStack Query, React Context |
| **PDF** | jsPDF + jspdf-autotable |
| **Deployment** | Cloudflare Workers |
| **Language** | TypeScript (strict mode) |

### Database Schema (17 tables)

- **Multi-tenant core:** `businesses`, `profiles`, `employees`, `business_counters`
- **Inventory:** `inventory_items`, `stock_movements`
- **Sales:** `sales`, `sale_items`
- **Credit:** `debts`, `debt_items`, `debt_payments`
- **Documents:** `proformas`, `proforma_items`, `delivery_notes`, `delivery_note_items`
- **System:** `app_settings`, `audit_logs`

All tables protected by Row-Level Security with security-definer helper functions and role-based access (Owner / Manager / Employee).

---

## Features

### Inventory Management
- Full CRUD with categories, subcategories, and unit types
- Stock movement audit trail with before/after snapshots
- Low-stock and out-of-stock alerts
- Auto-generated readable item IDs (`ITEM-0001`)

### Point of Sale
- Record sales with customer and item line items
- Automatic stock deduction and profit calculation
- Sale reversal with stock restoration
- PDF receipts

### Credit & Debt Tracking
- Issue credit with itemized debt records
- Partial payment support with status tracking
- Automated overdue detection
- WhatsApp payment reminders

### Business Intelligence
- Real-time KPI dashboard (today, 7-day, 30-day)
- Profit margin analysis
- Outstanding debt aggregation
- Stock value reporting

### Role-Based Access
- **Owner:** Full control, employee management, factory reset
- **Manager:** Daily operations, reporting
- **Employee:** Sales and basic operations only

### Professional Documents
- Proforma invoices with optional VAT
- Delivery notes with customer signatures
- All documents downloadable as PDF

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.2+ or Node.js v22+
- [Supabase](https://supabase.com) project (local or cloud)

### Setup

```bash
# Clone the repository
git clone https://github.com/hervekubanadev/curuza-hw-shop.git
cd curuza-hw-shop

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase project URL and anon key

# Run database migrations
bunx supabase link --project-ref your-project-ref
bunx supabase db push

# Start development server
bun run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Project Structure

```
src/
├── routes/              # File-based routing (TanStack Router)
│   ├── __root.tsx       # Root layout (providers + shell)
│   ├── index.tsx        # Entry redirect
│   ├── login.tsx        # Authentication
│   ├── onboarding.tsx   # First-time business setup
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

- [x] Multi-tenant business isolation
- [x] Inventory management with stock tracking
- [x] Point of sale with profit analytics
- [x] Credit and debt management
- [x] Proforma invoice and delivery note generation
- [x] Role-based access control
- [x] Audit logging
- [ ] Payment gateway integration (mobile money)
- [ ] Offline-first support with local caching
- [ ] Mobile app (Flutter) for field sales
- [ ] Barcode scanning for inventory
- [ ] Advanced analytics and forecasting
- [ ] Multi-currency support
- [ ] Supplier management and purchase orders

---

## Security

- Row-Level Security enforced on all database tables
- Role-based access control with granular permissions
- Security-definer helper functions to prevent RLS recursion
- Audit logging for all data mutations
- Supabase Auth with email/password authentication
- Service role key restricted to server-side middleware only

---

## Contributing

Contributions are welcome. Please open an issue first to discuss proposed changes.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Contact

**KUBANA Friend Herve** - [hervekubana.dev](https://hervekubana.dev)

Project Link: [https://github.com/hervekubanadev/curuza-hw-shop](https://github.com/hervekubanadev/curuza-hw-shop)

---

<div align="center">
  <sub>Built with ❤️ for African hardware retailers | Kigali, Rwanda</sub>
</div>
