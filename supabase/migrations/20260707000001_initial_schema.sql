-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── PROFILES ───────────────────────────────────────────────
-- Extended user info beyond auth.users
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  full_name    text,
  avatar_url   text,
  plan         text not null default 'free' check (plan in ('free', 'pro', 'business')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Username: lowercase, alphanumeric + hyphens, 3-32 chars
alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[a-z0-9][a-z0-9\-]{1,30}[a-z0-9]$');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── EXPERIENCES ────────────────────────────────────────────
create table public.experiences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null default 'Untitled experience',
  slug            text not null,                     -- unique per user
  status          text not null default 'draft' check (status in ('draft', 'published', 'archived')),

  -- 3D model
  model_url       text,                              -- Storage path
  model_name      text,
  animation_type  text default 'none' check (animation_type in ('none', 'spin', 'float', 'pulse')),
  scale           numeric(5,2) default 1.0,

  -- Marker
  marker_url      text,                              -- Storage path
  marker_name     text,

  -- AR config stored as JSON (position, rotation etc.)
  scene_config    jsonb default '{}'::jsonb,

  -- Password protection
  is_protected    boolean default false,
  password_hash   text,

  -- Stats (denormalised for speed)
  total_views     bigint default 0,
  total_scans     bigint default 0,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (user_id, slug)
);

-- ─── VIEWS / ANALYTICS ──────────────────────────────────────
create table public.experience_views (
  id              bigserial primary key,
  experience_id   uuid not null references public.experiences(id) on delete cascade,
  event_type      text not null check (event_type in ('view', 'scan', 'ar_start')),
  visitor_id      text,                              -- anonymous fingerprint
  user_agent      text,
  country         text,
  created_at      timestamptz not null default now()
);

-- Increment denormalised counters on insert
create or replace function public.increment_experience_stats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.event_type = 'view' then
    update public.experiences set total_views = total_views + 1 where id = new.experience_id;
  elsif new.event_type = 'scan' then
    update public.experiences set total_scans = total_scans + 1 where id = new.experience_id;
  end if;
  return new;
end;
$$;

create trigger on_experience_view_insert
  after insert on public.experience_views
  for each row execute procedure public.increment_experience_stats();

-- ─── UPDATED_AT TRIGGER ─────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_experiences_updated_at
  before update on public.experiences
  for each row execute procedure public.set_updated_at();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────

-- profiles: users see all, edit only their own
alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- experiences: owners manage theirs, published ones are public
alter table public.experiences enable row level security;

create policy "experiences_select_published" on public.experiences
  for select using (status = 'published' or auth.uid() = user_id);

create policy "experiences_insert_own" on public.experiences
  for insert with check (auth.uid() = user_id);

create policy "experiences_update_own" on public.experiences
  for update using (auth.uid() = user_id);

create policy "experiences_delete_own" on public.experiences
  for delete using (auth.uid() = user_id);

-- experience_views: anyone can insert, only owner can select
alter table public.experience_views enable row level security;

create policy "views_insert_anon" on public.experience_views
  for insert with check (true);

create policy "views_select_owner" on public.experience_views
  for select using (
    auth.uid() = (
      select user_id from public.experiences where id = experience_id
    )
  );

-- ─── PLAN LIMITS ────────────────────────────────────────────
-- Prevent free users from exceeding 20 experiences
create or replace function public.check_experience_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_plan text;
  experience_count int;
begin
  select plan into user_plan from public.profiles where id = new.user_id;
  if user_plan = 'free' then
    select count(*) into experience_count
      from public.experiences
      where user_id = new.user_id and status != 'archived';
    if experience_count >= 20 then
      raise exception 'Free plan limit reached. Upgrade to Pro for unlimited experiences.';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_experience_limit
  before insert on public.experiences
  for each row execute procedure public.check_experience_limit();

-- ─── INDEXES ────────────────────────────────────────────────
create index idx_experiences_user_id on public.experiences(user_id);
create index idx_experiences_slug on public.experiences(user_id, slug);
create index idx_experiences_status on public.experiences(status);
create index idx_experience_views_experience_id on public.experience_views(experience_id);
create index idx_experience_views_created_at on public.experience_views(created_at desc);
