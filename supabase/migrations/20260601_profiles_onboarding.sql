create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  name text,
  subjects jsonb default '[]'::jsonb,
  selected_subjects jsonb default '[]'::jsonb,
  year_group text,
  target_grade text,
  predicted_grade text,
  ai_profile jsonb default '{}'::jsonb,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists name text,
  add column if not exists subjects jsonb default '[]'::jsonb,
  add column if not exists selected_subjects jsonb default '[]'::jsonb,
  add column if not exists year_group text,
  add column if not exists target_grade text,
  add column if not exists predicted_grade text,
  add column if not exists ai_profile jsonb default '{}'::jsonb,
  add column if not exists onboarding_completed boolean default false,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists last_login_at timestamptz;

alter table public.profiles
  alter column subjects set default '[]'::jsonb,
  alter column selected_subjects set default '[]'::jsonb,
  alter column ai_profile set default '{}'::jsonb,
  alter column onboarding_completed set default false,
  alter column created_at set default now(),
  alter column updated_at set default now();

update public.profiles
set
  subjects = coalesce(subjects, '[]'::jsonb),
  selected_subjects = coalesce(selected_subjects, subjects, '[]'::jsonb),
  ai_profile = coalesce(ai_profile, '{}'::jsonb),
  onboarding_completed = coalesce(onboarding_completed, false),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now()),
  name = coalesce(name, full_name);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can read their own profile'
  ) then
    create policy "Users can read their own profile"
    on public.profiles
    for select
    to authenticated
    using (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can insert their own profile'
  ) then
    create policy "Users can insert their own profile"
    on public.profiles
    for insert
    to authenticated
    with check (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update their own profile'
  ) then
    create policy "Users can update their own profile"
    on public.profiles
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);
  end if;
end $$;
