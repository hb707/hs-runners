-- Team Runner relational schema for Supabase (PostgreSQL)
-- Run this script in Supabase SQL Editor.

create table if not exists public.teams (
  id text primary key,
  name text not null,
  admin_user_id text not null,
  weekly_required_count integer not null check (weekly_required_count >= 0),
  fine_amount_per_shortfall integer not null check (fine_amount_per_shortfall >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.users (
  id text primary key,
  kakao_id text not null unique,
  nickname text not null,
  profile_image_url text not null default '',
  role text not null check (role in ('master_admin', 'team_admin', 'user')),
  team_id text null references public.teams(id) on delete set null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_users_team_id on public.users(team_id);

create table if not exists public.invitation_codes (
  id text primary key,
  code text not null unique,
  team_id text not null references public.teams(id) on delete cascade,
  created_by text not null references public.users(id) on delete restrict,
  used_by text null references public.users(id) on delete set null,
  used_at timestamptz null,
  expires_at timestamptz not null,
  created_at timestamptz not null
);

create index if not exists idx_invitation_codes_team_id on public.invitation_codes(team_id);

create table if not exists public.records (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  team_id text not null references public.teams(id) on delete cascade,
  image_url text not null,
  distance_km double precision null,
  vision_raw text null,
  vision_confidence text not null check (vision_confidence in ('high', 'medium', 'low', 'failed')),
  manual_distance_km double precision null,
  recorded_at timestamptz not null,
  week_number text not null,
  created_at timestamptz not null
);

create index if not exists idx_records_team_recorded_at on public.records(team_id, recorded_at desc);
create index if not exists idx_records_user_recorded_at on public.records(user_id, recorded_at desc);
create index if not exists idx_records_week_number on public.records(week_number);

create table if not exists public.fines (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  team_id text not null references public.teams(id) on delete cascade,
  week_number text not null,
  required_count integer not null check (required_count >= 0),
  actual_count integer not null check (actual_count >= 0),
  shortfall integer not null check (shortfall >= 0),
  fine_amount_per_shortfall integer not null check (fine_amount_per_shortfall >= 0),
  total_fine integer not null check (total_fine >= 0),
  is_paid boolean not null default false,
  paid_at timestamptz null,
  confirmed_by text null references public.users(id) on delete set null,
  created_at timestamptz not null,
  unique (team_id, user_id, week_number)
);

create index if not exists idx_fines_team_week on public.fines(team_id, week_number);
create index if not exists idx_fines_user_week on public.fines(user_id, week_number);

alter table public.teams enable row level security;
alter table public.users enable row level security;
alter table public.invitation_codes enable row level security;
alter table public.records enable row level security;
alter table public.fines enable row level security;

