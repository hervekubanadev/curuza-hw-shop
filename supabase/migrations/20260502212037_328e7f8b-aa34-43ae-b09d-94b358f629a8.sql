
-- =========================================================
-- CURUZA Quincalleries: multi-tenant schema
-- =========================================================

-- Helper: updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

-- Role enum
do $$ begin
  create type public.app_role as enum ('owner','manager','employee');
exception when duplicate_object then null; end $$;

-- =========================================================
-- 1. businesses
-- =========================================================
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  owner_name text,
  business_phone text,
  whatsapp_number text,
  email text,
  province_city text,
  full_address text,
  tin_number text,
  logo_url text,
  company_stamp_url text,
  invoice_footer_note text,
  payment_terms text,
  payment_details text,
  default_signature_name text,
  default_signature_title text,
  currency text not null default 'RWF',
  initial_capital numeric not null default 0,
  target_capital numeric not null default 0,
  low_stock_default_limit numeric not null default 5,
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.businesses(owner_user_id);
create trigger trg_businesses_updated before update on public.businesses
  for each row execute function public.tg_set_updated_at();

-- =========================================================
-- 2. profiles
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  active_business_id uuid references public.businesses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Auto create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email)
  on conflict (id) do nothing;
  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- 3. employees
-- =========================================================
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  role public.app_role not null default 'employee',
  pin_code_hash text,
  is_active boolean not null default true,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, user_id)
);
create index on public.employees(business_id);
create index on public.employees(user_id);
create trigger trg_employees_updated before update on public.employees
  for each row execute function public.tg_set_updated_at();

-- =========================================================
-- Security definer helper functions (avoid RLS recursion)
-- =========================================================
create or replace function public.is_business_member(_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.businesses b where b.id = _business_id and b.owner_user_id = auth.uid()
  ) or exists(
    select 1 from public.employees e
    where e.business_id = _business_id and e.user_id = auth.uid() and e.is_active = true
  );
$$;

create or replace function public.get_business_role(_business_id uuid)
returns public.app_role language sql stable security definer set search_path = public as $$
  select case
    when exists(select 1 from public.businesses b where b.id = _business_id and b.owner_user_id = auth.uid())
      then 'owner'::public.app_role
    else (select e.role from public.employees e
          where e.business_id = _business_id and e.user_id = auth.uid() and e.is_active = true
          limit 1)
  end;
$$;

create or replace function public.is_business_owner(_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.businesses b where b.id = _business_id and b.owner_user_id = auth.uid());
$$;

create or replace function public.can_manage(_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.get_business_role(_business_id) in ('owner','manager');
$$;

-- =========================================================
-- Auto-create owner employee record when a business is created
-- =========================================================
create or replace function public.handle_new_business()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.employees (business_id, user_id, name, email, role, is_active)
  values (new.id, new.owner_user_id,
          coalesce(new.owner_name, 'Owner'),
          (select email from auth.users where id = new.owner_user_id),
          'owner', true)
  on conflict (business_id, user_id) do nothing;

  update public.profiles set active_business_id = new.id
  where id = new.owner_user_id and active_business_id is null;
  return new;
end$$;

create trigger on_business_created
  after insert on public.businesses
  for each row execute function public.handle_new_business();

-- =========================================================
-- Readable ID generator
-- =========================================================
create table public.business_counters (
  business_id uuid not null references public.businesses(id) on delete cascade,
  counter_key text not null,
  current_value bigint not null default 0,
  primary key(business_id, counter_key)
);

create or replace function public.next_readable_id(_business_id uuid, _key text, _prefix text)
returns text language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  insert into public.business_counters(business_id, counter_key, current_value)
  values (_business_id, _key, 1)
  on conflict(business_id, counter_key) do update set current_value = business_counters.current_value + 1
  returning current_value into v;
  return _prefix || '-' || lpad(v::text, 4, '0');
end$$;

-- =========================================================
-- 4. inventory_items
-- =========================================================
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  item_id text not null,
  item_name text not null,
  normalized_name text not null,
  category text,
  subcategory text,
  unit_type text not null default 'piece',
  quantity numeric not null default 0 check (quantity >= 0),
  cost_price numeric not null default 0 check (cost_price >= 0),
  selling_price numeric not null default 0 check (selling_price >= 0),
  supplier_name text,
  date_bought date,
  low_stock_limit numeric not null default 5,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, normalized_name),
  unique(business_id, item_id)
);
create index on public.inventory_items(business_id);
create index on public.inventory_items(normalized_name);
create trigger trg_inventory_updated before update on public.inventory_items
  for each row execute function public.tg_set_updated_at();

-- =========================================================
-- 5. stock_movements
-- =========================================================
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  movement_type text not null,
  quantity_change numeric not null,
  quantity_before numeric not null,
  quantity_after numeric not null,
  cost_price_snapshot numeric,
  selling_price_snapshot numeric,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on public.stock_movements(business_id);
create index on public.stock_movements(inventory_item_id);
create index on public.stock_movements(created_at desc);

-- =========================================================
-- 6. customers
-- =========================================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id text not null,
  name text not null,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, customer_id)
);
create index on public.customers(business_id);
create trigger trg_customers_updated before update on public.customers
  for each row execute function public.tg_set_updated_at();

-- =========================================================
-- 7. sales
-- =========================================================
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sale_id text not null,
  customer_id uuid references public.customers(id) on delete set null,
  total_amount numeric not null default 0,
  total_cost numeric not null default 0,
  profit numeric not null default 0,
  sold_by uuid references auth.users(id),
  sale_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, sale_id)
);
create index on public.sales(business_id);
create index on public.sales(sale_date desc);
create trigger trg_sales_updated before update on public.sales
  for each row execute function public.tg_set_updated_at();

-- =========================================================
-- 8. sale_items
-- =========================================================
create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  item_name text not null,
  quantity numeric not null,
  cost_price_snapshot numeric not null default 0,
  selling_price_snapshot numeric not null default 0,
  total_amount numeric not null default 0,
  profit numeric not null default 0,
  created_at timestamptz not null default now()
);
create index on public.sale_items(business_id);
create index on public.sale_items(sale_id);

-- =========================================================
-- 9. debts
-- =========================================================
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  debt_id text not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  total_amount numeric not null default 0,
  amount_paid numeric not null default 0,
  remaining_amount numeric not null default 0,
  status text not null default 'unpaid',
  date_taken timestamptz not null default now(),
  due_date date,
  created_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, debt_id)
);
create index on public.debts(business_id);
create index on public.debts(customer_id);
create index on public.debts(status);
create trigger trg_debts_updated before update on public.debts
  for each row execute function public.tg_set_updated_at();

-- =========================================================
-- 10. debt_items
-- =========================================================
create table public.debt_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  debt_id uuid not null references public.debts(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  item_name text not null,
  quantity numeric not null,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  cost_price_snapshot numeric not null default 0,
  profit_snapshot numeric not null default 0,
  created_at timestamptz not null default now()
);
create index on public.debt_items(business_id);
create index on public.debt_items(debt_id);

-- =========================================================
-- 11. debt_payments
-- =========================================================
create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  payment_id text not null,
  debt_id uuid not null references public.debts(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  amount_paid numeric not null,
  paid_at timestamptz not null default now(),
  received_by uuid references auth.users(id),
  note text,
  created_at timestamptz not null default now(),
  unique(business_id, payment_id)
);
create index on public.debt_payments(business_id);
create index on public.debt_payments(debt_id);

-- =========================================================
-- 12-13. proformas + items
-- =========================================================
create table public.proformas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  proforma_id text not null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  customer_phone text,
  subtotal numeric not null default 0,
  vat_enabled boolean not null default false,
  vat_percentage numeric not null default 0,
  vat_amount numeric not null default 0,
  grand_total numeric not null default 0,
  notes text,
  status text not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, proforma_id)
);
create index on public.proformas(business_id);
create trigger trg_proformas_updated before update on public.proformas
  for each row execute function public.tg_set_updated_at();

create table public.proforma_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  proforma_id uuid not null references public.proformas(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  item_name text not null,
  quantity numeric not null,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  created_at timestamptz not null default now()
);
create index on public.proforma_items(business_id);
create index on public.proforma_items(proforma_id);

-- =========================================================
-- 14-15. delivery_notes + items
-- =========================================================
create table public.delivery_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  delivery_note_id text not null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  customer_phone text,
  delivery_address text,
  delivery_date date,
  delivered_by text,
  received_by text,
  status text not null default 'pending',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, delivery_note_id)
);
create index on public.delivery_notes(business_id);
create trigger trg_dn_updated before update on public.delivery_notes
  for each row execute function public.tg_set_updated_at();

create table public.delivery_note_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  delivery_note_id uuid not null references public.delivery_notes(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  item_name text not null,
  quantity numeric not null,
  unit_type text,
  created_at timestamptz not null default now()
);
create index on public.delivery_note_items(business_id);

-- =========================================================
-- 16. app_settings
-- =========================================================
create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, setting_key)
);
create trigger trg_app_settings_updated before update on public.app_settings
  for each row execute function public.tg_set_updated_at();

-- =========================================================
-- 17. audit_logs
-- =========================================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs(business_id);
create index on public.audit_logs(created_at desc);

-- =========================================================
-- ENABLE RLS
-- =========================================================
alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.business_counters enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.debts enable row level security;
alter table public.debt_items enable row level security;
alter table public.debt_payments enable row level security;
alter table public.proformas enable row level security;
alter table public.proforma_items enable row level security;
alter table public.delivery_notes enable row level security;
alter table public.delivery_note_items enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles
create policy "profiles self read" on public.profiles for select using (id = auth.uid());
create policy "profiles self update" on public.profiles for update using (id = auth.uid());
create policy "profiles self insert" on public.profiles for insert with check (id = auth.uid());

-- Businesses
create policy "businesses members read" on public.businesses for select
  using (owner_user_id = auth.uid() or public.is_business_member(id));
create policy "businesses owner insert" on public.businesses for insert
  with check (owner_user_id = auth.uid());
create policy "businesses owner update" on public.businesses for update
  using (owner_user_id = auth.uid());
create policy "businesses owner delete" on public.businesses for delete
  using (owner_user_id = auth.uid());

-- Employees
create policy "employees members read" on public.employees for select
  using (public.is_business_member(business_id));
create policy "employees owner manage" on public.employees for all
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

-- Business counters (internal — only via security definer fn). Allow members to read for safety.
create policy "counters members read" on public.business_counters for select
  using (public.is_business_member(business_id));

-- Generic per-business policies
do $$
declare t text;
begin
  for t in select unnest(array[
    'inventory_items','stock_movements','customers','sales','sale_items',
    'debts','debt_items','debt_payments','proformas','proforma_items',
    'delivery_notes','delivery_note_items','app_settings','audit_logs'
  ]) loop
    execute format('create policy %I on public.%I for select using (public.is_business_member(business_id));',
                   t||'_select', t);
    execute format('create policy %I on public.%I for insert with check (public.is_business_member(business_id));',
                   t||'_insert', t);
    execute format('create policy %I on public.%I for update using (public.can_manage(business_id));',
                   t||'_update', t);
    execute format('create policy %I on public.%I for delete using (public.can_manage(business_id));',
                   t||'_delete', t);
  end loop;
end$$;

-- =========================================================
-- Storage bucket
-- =========================================================
insert into storage.buckets (id, name, public) values ('business-assets','business-assets', true)
on conflict (id) do nothing;

create policy "business assets public read" on storage.objects for select
  using (bucket_id = 'business-assets');
create policy "business assets owner write" on storage.objects for insert
  with check (bucket_id = 'business-assets' and auth.uid() is not null);
create policy "business assets owner update" on storage.objects for update
  using (bucket_id = 'business-assets' and auth.uid() is not null);
create policy "business assets owner delete" on storage.objects for delete
  using (bucket_id = 'business-assets' and auth.uid() is not null);
