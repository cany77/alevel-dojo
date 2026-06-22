create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists name text,
  add column if not exists subjects jsonb default '[]'::jsonb,
  add column if not exists selected_subjects jsonb default '[]'::jsonb,
  add column if not exists year_group text,
  add column if not exists preferences jsonb default '{}'::jsonb,
  add column if not exists ai_profile jsonb default '{}'::jsonb,
  add column if not exists onboarding_completed boolean default false,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists last_login_at timestamptz;

alter table public.profiles
  alter column subjects set default '[]'::jsonb,
  alter column selected_subjects set default '[]'::jsonb,
  alter column preferences set default '{}'::jsonb,
  alter column ai_profile set default '{}'::jsonb,
  alter column onboarding_completed set default false,
  alter column created_at set default now(),
  alter column updated_at set default now();

update public.profiles
set
  subjects = coalesce(subjects, '[]'::jsonb),
  selected_subjects = coalesce(selected_subjects, subjects, '[]'::jsonb),
  preferences = coalesce(preferences, '{}'::jsonb),
  ai_profile = coalesce(ai_profile, '{}'::jsonb),
  onboarding_completed = coalesce(onboarding_completed, false),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now()),
  full_name = coalesce(full_name, name),
  name = coalesce(name, full_name);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

grant select, insert, update on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    name = coalesce(nullif(public.profiles.name, ''), excluded.name);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
