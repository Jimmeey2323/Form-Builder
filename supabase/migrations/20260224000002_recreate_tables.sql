-- ─────────────────────────────────────────────────────────────
-- Drop & recreate form_submissions and forms tables cleanly
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Drop existing tables (cascade removes indexes, policies, etc.)
drop table if exists public.form_submissions cascade;
drop table if exists public.forms cascade;

-- 2. Recreate forms table (stores form configs from the builder)
create table public.forms (
  id text primary key,
  title text not null default '',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Recreate form_submissions table
create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id text not null,
  form_title text not null default '',
  data jsonb not null default '{}'::jsonb,
  utm_params jsonb,
  submitted_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

-- 4. Enable RLS on both tables
alter table public.forms enable row level security;
alter table public.form_submissions enable row level security;

-- 5. forms policies — full access for authenticated (builder users)
create policy "forms: authenticated full access"
  on public.forms
  for all
  to authenticated
  using (true)
  with check (true);

-- Also allow anon to read forms (needed by deployed forms to verify config)
create policy "forms: anon read"
  on public.forms
  for select
  to anon
  using (true);

-- 6. form_submissions policies
-- Anyone (anon = public visitors on deployed forms) can INSERT
create policy "submissions: public insert"
  on public.form_submissions
  for insert
  to anon, authenticated
  with check (true);

-- Authenticated users (builder) can read all submissions
create policy "submissions: authenticated read"
  on public.form_submissions
  for select
  to authenticated
  using (true);

-- Authenticated users can delete submissions
create policy "submissions: authenticated delete"
  on public.form_submissions
  for delete
  to authenticated
  using (true);

-- 7. Grant schema + table permissions explicitly
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.forms to authenticated;
grant select on public.forms to anon;

grant insert on public.form_submissions to anon;
grant select, insert, update, delete on public.form_submissions to authenticated;
