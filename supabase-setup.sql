-- ================================================================
-- FINANCEIQ — SUPABASE DATABASE SETUP
-- Run this in your Supabase project: SQL Editor → New Query
-- ================================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id        uuid references auth.users on delete cascade primary key,
  full_name text,
  currency  text not null default 'INR',
  theme     text not null default 'light',
  created_at timestamptz not null default now()
);

-- 2. TRANSACTIONS
create table if not exists public.transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users on delete cascade not null,
  type           text check (type in ('income','expense')) not null,
  amount         numeric(12,2) not null,
  category       text not null,
  description    text,
  date           date not null,
  payment_method text,
  receipt_url    text,
  created_at     timestamptz not null default now()
);

-- Ensure receipt_url exists if table was already created
alter table public.transactions add column if not exists receipt_url text;

-- 3. BUDGETS
create table if not exists public.budgets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  category   text not null,
  "limit"    numeric(12,2) not null,
  month      text not null,   -- format: 'YYYY-MM'
  created_at timestamptz not null default now(),
  unique (user_id, category, month)
);

-- 4. GOALS
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users on delete cascade not null,
  name           text not null,
  target_amount  numeric(12,2) not null,
  current_amount numeric(12,2) not null default 0,
  target_date    date,
  icon           text,
  color          text,
  created_at     timestamptz not null default now()
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

alter table public.profiles     enable row level security;
alter table public.transactions  enable row level security;
alter table public.budgets       enable row level security;
alter table public.goals         enable row level security;

-- Profiles: users can only see/edit their own profile
create policy "Users can manage own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Transactions: users can only see/edit their own transactions
create policy "Users can manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Budgets: users can only see/edit their own budgets
create policy "Users can manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Goals: users can only see/edit their own goals
create policy "Users can manage own goals"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ================================================================
-- AUTO-CREATE PROFILE ON SIGNUP (optional trigger)
-- ================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, currency, theme)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'INR',
    'light'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================================
-- INDEXES for performance
-- ================================================================

create index if not exists idx_transactions_user_date   on public.transactions (user_id, date desc);
create index if not exists idx_transactions_user_type   on public.transactions (user_id, type);
create index if not exists idx_budgets_user_month       on public.budgets (user_id, month);
create index if not exists idx_goals_user               on public.goals (user_id);

-- ================================================================
-- 5. SUPABASE STORAGE (Receipts Bucket & RLS)
-- ================================================================

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do update set public = true;

-- Storage RLS: Users can upload, read, and delete their own receipt files
create policy "Users can upload own receipts"
  on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own receipts"
  on storage.objects for select
  using (bucket_id = 'receipts' and (auth.uid()::text = (storage.foldername(name))[1] or bucket_id = 'receipts'));

create policy "Users can update own receipts"
  on storage.objects for update
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own receipts"
  on storage.objects for delete
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

-- ================================================================
-- 6. SUPABASE REALTIME REPLICATION
-- ================================================================

-- Enable real-time updates on transactions table
alter publication supabase_realtime add table public.transactions;

