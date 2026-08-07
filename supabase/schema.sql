-- Save Point — Supabase schema
-- Run this in the Supabase SQL editor.
--
-- Design notes:
-- - Simple username/password accounts (no email verification, no OAuth). All
--   reads/writes go through server route handlers using the service role key,
--   so the anon key is never required and RLS can stay locked down.
-- - Save points are owned by a signed-in user (user_id), not an anonymous
--   device id — this replaces the earlier device-id pairing scheme entirely.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create table if not exists public.users (
  id              uuid primary key default gen_random_uuid(),
  email           citext not null unique,   -- the "Gmail" collected at signup
  full_name       text not null,
  username        citext not null unique,
  password_hash   text not null,
  created_at      timestamptz not null default now()
);

-- Fresh schema for save_points (demo scope — dropping any earlier anonymous
-- rows keyed by device_id is fine; there is no migration path for those).
drop table if exists public.save_points;

create table public.save_points (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,

  -- Raw capture packet (what the workspace or extension sent).
  source          text not null check (source in ('workspace', 'extension')),
  user_note       text,
  active_context  jsonb not null default '{}'::jsonb,
  open_tabs       jsonb not null default '[]'::jsonb,
  workspace_context jsonb not null default '{}'::jsonb,

  -- AI reconstruction (filled on first Restore, then cached).
  reconstruction  jsonb,

  -- Restore tracking — drives the calm "Welcome back" offer on workspace load.
  restored        boolean not null default false,
  restored_at     timestamptz,

  created_at      timestamptz not null default now()
);

create index if not exists save_points_user_created_idx
  on public.save_points (user_id, created_at desc);

create index if not exists save_points_user_unrestored_idx
  on public.save_points (user_id, restored, created_at desc);

-- Lock both tables down. The server uses the service role key, which bypasses
-- RLS. No public policies are created on purpose: the anon/public role cannot
-- read or write directly.
alter table public.users enable row level security;
alter table public.save_points enable row level security;
