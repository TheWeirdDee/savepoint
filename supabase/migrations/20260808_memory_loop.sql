-- Safe additive migration for an existing Save Point database.
-- Run this once in Supabase SQL Editor; it does not delete existing saves.
alter table public.save_points
  add column if not exists corrections jsonb not null default '[]'::jsonb;

alter table public.save_points
  add column if not exists orienting_answer text;

create table if not exists public.user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  origin_save_point_id uuid references public.save_points(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists user_memory_user_created_idx
  on public.user_memory (user_id, created_at desc);

alter table public.user_memory enable row level security;
