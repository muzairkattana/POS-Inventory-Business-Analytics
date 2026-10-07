-- Supabase schema for cloud sync
-- Enable required extensions
create extension if not exists pgcrypto;

-- Invoices table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null,
  customer_name text not null,
  customer_email text default ''::text,
  customer_phone text default ''::text,
  customer_address text default ''::text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  due_date date,
  user_id uuid not null references auth.users(id) on delete cascade,
  company_info jsonb default '{}'::jsonb,
  table_columns jsonb default '[]'::jsonb
);

alter table public.invoices enable row level security;

-- Policies for invoices (owner-based)
create policy if not exists "Enable read access for own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

create policy if not exists "Enable insert for authenticated users"
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy if not exists "Enable update for own invoices"
  on public.invoices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Enable delete for own invoices"
  on public.invoices for delete
  using (auth.uid() = user_id);

-- Generic key-value storage for app data (clients, settings, etc.)
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

alter table public.app_kv enable row level security;

create policy if not exists "Enable read access for own kv"
  on public.app_kv for select
  using (auth.uid() = user_id);

create policy if not exists "Enable upsert for own kv"
  on public.app_kv for insert
  with check (auth.uid() = user_id);

create policy if not exists "Enable update for own kv"
  on public.app_kv for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Enable delete for own kv"
  on public.app_kv for delete
  using (auth.uid() = user_id);
