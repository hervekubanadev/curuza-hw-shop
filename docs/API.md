# API Documentation

CURUZA uses **Supabase** as its API layer. All data access goes through the Supabase REST API with Row-Level Security (RLS) enforcing tenant isolation. There is no custom backend API — the PostgreSQL schema, RLS policies, and security-definer functions _are_ the API contract.

## Base URL

```
https://<project>.supabase.co/rest/v1/
```

All requests require a valid JWT in the `Authorization: Bearer <token>` header and the Supabase anon key in `apikey` header.

---

## Table Schemas

### Multi-Tenant Core

#### `businesses`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `owner_user_id` | `uuid FK → auth.users` | Business owner |
| `name` | `text` | Business name |
| `currency` | `text` | Default: RWF |
| `initial_capital` | `numeric` | Starting capital |
| `target_capital` | `numeric` | Target revenue goal |
| `low_stock_default_limit` | `numeric` | Default: 5 |

#### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK → auth.users` | Matches auth user ID |
| `full_name` | `text` | Display name |
| `active_business_id` | `uuid FK → businesses` | Current session tenant |

#### `employees`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `business_id` | `uuid FK` | Tenant scope |
| `user_id` | `uuid FK → auth.users` | Linked auth user |
| `role` | `app_role enum` | `owner`, `manager`, `employee` |
| `permissions` | `jsonb` | Granular permission overrides |

### Inventory

#### `inventory_items`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `business_id` | `uuid FK` | Tenant scope |
| `item_id` | `text` | Readable ID (e.g. `ITEM-0001`) |
| `item_name` | `text` | Item name |
| `normalized_name` | `text` | Lowercased, for uniqueness |
| `category` | `text` | Product category |
| `subcategory` | `text` | Product subcategory |
| `unit_type` | `text` | piece, kg, meter, etc. |
| `quantity` | `numeric` | Current stock (≥ 0) |
| `cost_price` | `numeric` | Unit cost price |
| `selling_price` | `numeric` | Unit selling price |
| `low_stock_limit` | `numeric` | Alert threshold |

**Uniques:** `(business_id, normalized_name)`, `(business_id, item_id)`

#### `stock_movements`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `business_id` | `uuid FK` | Tenant scope |
| `inventory_item_id` | `uuid FK` | Item reference |
| `movement_type` | `text` | e.g. `purchase`, `sale`, `adjustment`, `reversal` |
| `quantity_change` | `numeric` | Signed change |
| `quantity_before` | `numeric` | Snapshot before |
| `quantity_after` | `numeric` | Snapshot after |

### Sales

#### `sales`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `business_id` | `uuid FK` | Tenant scope |
| `sale_id` | `text` | Readable ID (e.g. `SALE-0001`) |
| `customer_id` | `uuid FK → customers` | Optional |
| `total_amount` | `numeric` | Sum of line items |
| `total_cost` | `numeric` | Sum of cost prices |
| `profit` | `numeric` | total_amount - total_cost |
| `sold_by` | `uuid FK → auth.users` | Staff who processed |

#### `sale_items`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `sale_id` | `uuid FK → sales` | Parent sale |
| `inventory_item_id` | `uuid FK` | Item reference |
| `quantity` | `numeric` | Quantity sold |
| `cost_price_snapshot` | `numeric` | Cost at time of sale |
| `selling_price_snapshot` | `numeric` | Price at time of sale |

### Credit

#### `debts`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `business_id` | `uuid FK` | Tenant scope |
| `debt_id` | `text` | Readable ID |
| `customer_id` | `uuid FK` | Debtor |
| `total_amount` | `numeric` | Original amount |
| `amount_paid` | `numeric` | Sum of payments |
| `remaining_amount` | `numeric` | Outstanding balance |
| `status` | `text` | `unpaid`, `partial`, `paid`, `overdue` |
| `due_date` | `date` | Payment deadline |

#### `debt_payments`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `payment_id` | `text` | Readable ID |
| `debt_id` | `uuid FK` | Parent debt |
| `amount_paid` | `numeric` | Payment amount |

### Documents

#### `proformas`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `business_id` | `uuid FK` | Tenant scope |
| `proforma_id` | `text` | Readable ID |
| `vat_enabled` | `boolean` | VAT toggle |
| `vat_percentage` | `numeric` | VAT rate |
| `vat_amount` | `numeric` | Computed VAT |
| `grand_total` | `numeric` | Subtotal + VAT |
| `status` | `text` | `draft`, `sent`, `converted` |

#### `delivery_notes`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `delivery_note_id` | `text` | Readable ID |
| `delivery_address` | `text` | Shipping address |
| `delivery_date` | `date` | Scheduled/actual delivery |
| `received_by` | `text` | Recipient name |

### System

#### `app_settings`
| Column | Type | Description |
|--------|------|-------------|
| `business_id` | `uuid FK` | Tenant scope |
| `setting_key` | `text` | Setting identifier |
| `setting_value` | `jsonb` | Arbitrary JSON value |

#### `audit_logs`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `business_id` | `uuid FK` | Tenant scope |
| `user_id` | `uuid FK` | Who performed the action |
| `action` | `text` | `INSERT`, `UPDATE`, `DELETE` |
| `entity_type` | `text` | Table name |
| `entity_id` | `text` | Affected row ID |
| `old_values` | `jsonb` | Prior state |
| `new_values` | `jsonb` | New state |

---

## Row-Level Security Policies

All 17 tables have RLS enabled. Policies follow a consistent pattern:

### Core Tables

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| `profiles` | Self (`id = auth.uid()`) | Self | Self | — |
| `businesses` | Members | Owner | Owner | Owner |
| `employees` | Members | Owner | Owner | Owner |

### Domain Tables
For all domain tables (`inventory_items`, `sales`, `debts`, `proformas`, `delivery_notes`, `stock_movements`, `customers`, `sale_items`, `debt_items`, `debt_payments`, `proforma_items`, `delivery_note_items`, `app_settings`, `audit_logs`):

| Operation | Policy |
|-----------|--------|
| **SELECT** | `is_business_member(business_id)` |
| **INSERT** | `is_business_member(business_id)` |
| **UPDATE** | `can_manage(business_id)` (Owner or Manager) |
| **DELETE** | `can_manage(business_id)` (Owner or Manager) |

### Security-Definer Functions

```sql
is_business_member(_business_id uuid) → boolean
-- Returns true if auth.uid() is the business owner or an active employee

get_business_role(_business_id uuid) → app_role
-- Returns 'owner', 'manager', or 'employee' for the current user

is_business_owner(_business_id uuid) → boolean
-- Returns true only if auth.uid() matches owner_user_id

can_manage(_business_id uuid) → boolean
-- Returns true if role is 'owner' or 'manager'
```

---

## RPC Functions (via `rpc()`)

### `next_readable_id`

Generates auto-incrementing readable IDs in the format `PREFIX-0001`.

```sql
select next_readable_id(
  _business_id := 'uuid',
  _key := 'sales',
  _prefix := 'SALE'
);
-- Returns: 'SALE-0007'
```

### `handle_new_user`

Auto-creates a profile row when a new user signs up. Triggered by `on_auth_user_created`.

### `handle_new_business`

Auto-creates an owner employee record and sets `active_business_id` when a business is created. Triggered by `on_business_created`.

---

## Storage

**Bucket:** `business-assets` (public read)

| Policy | Scope |
|--------|-------|
| SELECT | Public (anyone can view) |
| INSERT | Authenticated users only |
| UPDATE | Authenticated users only |
| DELETE | Authenticated users only |

Used for: business logos, company stamps
