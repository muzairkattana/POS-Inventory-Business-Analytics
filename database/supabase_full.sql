-- Supabase (Postgres) schema for Invoice Management System
-- Compatible with Supabase SQL Editor (no CREATE DATABASE/USE)

-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type invoice_status_enum as enum ('draft','sent','paid','overdue','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type client_status_enum as enum ('active','inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method_enum as enum ('cash','bank_transfer','cheque','credit_card','online','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type column_type_enum as enum ('text','number','percentage','date');
exception when duplicate_object then null; end $$;

do $$ begin
  create type setting_type_enum as enum ('string','number','boolean','json');
exception when duplicate_object then null; end $$;

-- Timestamp trigger helper
create or replace function trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text,
  address text,
  phone1 text,
  phone2 text,
  email text,
  ntn text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger companies_set_timestamp
before update on public.companies
for each row execute function trigger_set_timestamp();

-- Clients
create table if not exists public.clients (
  id bigserial primary key,
  name text not null,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  country text default 'Pakistan',
  tax_id text,
  notes text,
  status client_status_enum default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_clients_name on public.clients(name);
create index if not exists idx_clients_email on public.clients(email);
create index if not exists idx_clients_status on public.clients(status);
create or replace trigger clients_set_timestamp
before update on public.clients
for each row execute function trigger_set_timestamp();

-- Users profile table (ties to Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text check (role in ('admin','user')) default 'user',
  company_id uuid references public.companies(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger users_set_timestamp
before update on public.users
for each row execute function trigger_set_timestamp();

-- Invoices (owned by auth user)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  client_id bigint not null references public.clients(id) on delete restrict,
  company_id uuid references public.companies(id) on delete restrict,
  invoice_date date not null,
  due_date date,
  status invoice_status_enum not null default 'draft',
  subtotal numeric(15,2) not null default 0,
  discount_amount numeric(15,2) not null default 0,
  tax_amount numeric(15,2) not null default 0,
  total_amount numeric(15,2) not null,
  paid_amount numeric(15,2) not null default 0,
  pending_amount numeric(15,2) not null default 0,
  notes text,
  terms_conditions text,
  -- JSON columns for app compatibility
  items jsonb not null default '[]'::jsonb,
  company_info jsonb not null default '{}'::jsonb,
  table_columns jsonb not null default '[]'::jsonb,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_client on public.invoices(client_id);
create index if not exists idx_invoices_invoice_date on public.invoices(invoice_date);
create index if not exists idx_invoices_due_date on public.invoices(due_date);
create or replace trigger invoices_set_timestamp
before update on public.invoices
for each row execute function trigger_set_timestamp();

-- Invoice items
create table if not exists public.invoice_items (
  id bigserial primary key,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1.00,
  unit_price numeric(15,2) not null,
  tax_rate numeric(5,2) not null default 0.00,
  discount_percentage numeric(5,2) not null default 0.00,
  total numeric(15,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_invoice_items_invoice on public.invoice_items(invoice_id);
create or replace trigger invoice_items_set_timestamp
before update on public.invoice_items
for each row execute function trigger_set_timestamp();

-- Payments
create table if not exists public.payments (
  id bigserial primary key,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  payment_date date not null,
  amount numeric(15,2) not null,
  payment_method payment_method_enum not null default 'cash',
  reference_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payments_invoice on public.payments(invoice_id);
create index if not exists idx_payments_date on public.payments(payment_date);
create or replace trigger payments_set_timestamp
before update on public.payments
for each row execute function trigger_set_timestamp();

-- Table columns (custom columns metadata)
create table if not exists public.table_columns (
  id bigserial primary key,
  column_key text not null unique,
  column_name text not null,
  column_type column_type_enum not null default 'text',
  width text default '100px',
  is_required boolean not null default false,
  is_visible boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger table_columns_set_timestamp
before update on public.table_columns
for each row execute function trigger_set_timestamp();

-- App settings
create table if not exists public.app_settings (
  id bigserial primary key,
  setting_key text not null unique,
  setting_value text,
  setting_type setting_type_enum not null default 'string',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_app_settings_key on public.app_settings(setting_key);
create or replace trigger app_settings_set_timestamp
before update on public.app_settings
for each row execute function trigger_set_timestamp();

-- Audit logs
create table if not exists public.audit_logs (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id bigint,
  details text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_user on public.audit_logs(user_id);
create index if not exists idx_audit_action on public.audit_logs(action);
create index if not exists idx_audit_created on public.audit_logs(created_at);

-- Generic KV storage (for clients/settings JSON sync)
create table if not exists public.app_kv (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null,
  key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, collection, key)
);

-- RLS (owner-based) for invoices and app_kv
alter table public.invoices enable row level security;
alter table public.app_kv enable row level security;

-- Drop/create policies (Supabase Postgres doesn’t support IF NOT EXISTS for policies)
drop policy if exists invoices_select_own on public.invoices;
create policy invoices_select_own on public.invoices for select using (auth.uid() = user_id);
drop policy if exists invoices_insert_own on public.invoices;
create policy invoices_insert_own on public.invoices for insert with check (auth.uid() = user_id);
drop policy if exists invoices_update_own on public.invoices;
create policy invoices_update_own on public.invoices for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists invoices_delete_own on public.invoices;
create policy invoices_delete_own on public.invoices for delete using (auth.uid() = user_id);

drop policy if exists app_kv_select_own on public.app_kv;
create policy app_kv_select_own on public.app_kv for select using (auth.uid() = user_id);
drop policy if exists app_kv_upsert_own on public.app_kv;
create policy app_kv_upsert_own on public.app_kv for insert with check (auth.uid() = user_id);
drop policy if exists app_kv_update_own on public.app_kv;
create policy app_kv_update_own on public.app_kv for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists app_kv_delete_own on public.app_kv;
create policy app_kv_delete_own on public.app_kv for delete using (auth.uid() = user_id);

-- Functions to keep invoice totals and status in sync
create or replace function public.update_invoice_totals(inv uuid)
returns void as $$
declare
  inv_subtotal numeric(15,2);
  inv_discount numeric(15,2);
  inv_tax numeric(15,2);
  inv_total numeric(15,2);
  inv_paid numeric(15,2);
begin
  select coalesce(sum(quantity * unit_price),0) into inv_subtotal from public.invoice_items where invoice_id = inv;
  select coalesce(sum((quantity * unit_price) * (discount_percentage/100.0)),0) into inv_discount from public.invoice_items where invoice_id = inv;
  select coalesce(sum(((quantity * unit_price) - ((quantity * unit_price) * (discount_percentage/100.0))) * (tax_rate/100.0)),0) into inv_tax from public.invoice_items where invoice_id = inv;
  inv_total := coalesce(inv_subtotal,0) - coalesce(inv_discount,0) + coalesce(inv_tax,0);
  select coalesce(sum(amount),0) into inv_paid from public.payments where invoice_id = inv;
  update public.invoices
    set subtotal = inv_subtotal,
        discount_amount = inv_discount,
        tax_amount = inv_tax,
        total_amount = inv_total,
        paid_amount = inv_paid,
        pending_amount = inv_total - inv_paid,
        updated_at = now()
  where id = inv;
end; $$ language plpgsql;

create or replace function public.update_invoice_status(inv uuid)
returns void as $$
declare
  inv_total numeric(15,2);
  inv_paid numeric(15,2);
  inv_due date;
  new_status invoice_status_enum;
begin
  select total_amount, paid_amount, due_date into inv_total, inv_paid, inv_due from public.invoices where id = inv;
  if coalesce(inv_paid,0) >= coalesce(inv_total,0) then
    new_status := 'paid';
  elsif coalesce(inv_paid,0) > 0 then
    new_status := 'sent';
  elsif inv_due is not null and current_date > inv_due then
    new_status := 'overdue';
  else
    new_status := 'sent';
  end if;
  update public.invoices set status = new_status, updated_at = now() where id = inv;
end; $$ language plpgsql;

-- Triggers to keep totals/status updated
create or replace function public.after_invoice_item_change()
returns trigger as $$
begin
  perform public.update_invoice_totals(coalesce(new.invoice_id, old.invoice_id));
  return null;
end; $$ language plpgsql;

create or replace function public.after_payment_change()
returns trigger as $$
begin
  perform public.update_invoice_totals(coalesce(new.invoice_id, old.invoice_id));
  perform public.update_invoice_status(coalesce(new.invoice_id, old.invoice_id));
  return null;
end; $$ language plpgsql;

-- Attach triggers
create trigger trg_invoice_item_ins after insert on public.invoice_items
for each row execute function public.after_invoice_item_change();
create trigger trg_invoice_item_upd after update on public.invoice_items
for each row execute function public.after_invoice_item_change();
create trigger trg_invoice_item_del after delete on public.invoice_items
for each row execute function public.after_invoice_item_change();

create trigger trg_payment_ins after insert on public.payments
for each row execute function public.after_payment_change();
create trigger trg_payment_upd after update on public.payments
for each row execute function public.after_payment_change();

-- Views
create or replace view public.invoice_summary as
select 
  i.id,
  i.invoice_number,
  i.invoice_date,
  i.due_date,
  i.status,
  c.name as client_name,
  c.email as client_email,
  i.total_amount,
  i.paid_amount,
  i.pending_amount,
  (current_date - i.due_date) as days_overdue
from public.invoices i
join public.clients c on i.client_id = c.id;

create or replace view public.client_outstanding as
select 
  c.id as client_id,
  c.name as client_name,
  count(i.id) as total_invoices,
  coalesce(sum(i.total_amount),0) as total_billed,
  coalesce(sum(i.paid_amount),0) as total_paid,
  coalesce(sum(i.pending_amount),0) as total_outstanding
from public.clients c
left join public.invoices i on c.id = i.client_id
group by c.id, c.name;

create or replace view public.monthly_revenue as
select 
  extract(year from i.invoice_date)::int as year,
  extract(month from i.invoice_date)::int as month,
  count(*) as invoice_count,
  coalesce(sum(i.total_amount),0) as total_revenue,
  coalesce(sum(i.paid_amount),0) as revenue_collected,
  coalesce(sum(i.pending_amount),0) as revenue_pending
from public.invoices i
group by 1,2
order by year desc, month desc;

-- Default data (optional)
insert into public.companies (id, name, owner_name, address, phone1, email, ntn)
select gen_random_uuid(), 'Healthcare Invoice System', 'System Admin', 'Business Address', '0345-5167742', 'business@example.com', '6309621-3'
where not exists (select 1 from public.companies);

insert into public.app_settings (setting_key, setting_value, setting_type, description)
values
  ('invoice_prefix','INV','string','Invoice number prefix'),
  ('show_email_in_print','true','boolean','Show email in printed invoices'),
  ('show_phone_in_print','true','boolean','Show phone in printed invoices'),
  ('default_currency','PKR','string','Default currency symbol'),
  ('tax_rate','0','number','Default tax rate percentage'),
  ('payment_terms','30','number','Default payment terms in days')
on conflict (setting_key) do nothing;

insert into public.table_columns (column_key, column_name, column_type, width, is_required, is_visible, display_order)
values
  ('index','Item','text','60px', true, true, 1),
  ('description','Description','text','200px', true, true, 2),
  ('quantity','Qty','number','80px', true, true, 3),
  ('unitPrice','Unit Price','number','100px', true, true, 4),
  ('taxRate','Tax %','percentage','80px', false, true, 5),
  ('discount','Discount %','percentage','100px', false, true, 6),
  ('total','Total','number','100px', true, true, 7)
on conflict (column_key) do nothing;
