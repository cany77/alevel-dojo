create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null,
  status text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  current_period_end timestamptz,
  season_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists plan text,
  add column if not exists status text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists current_period_end timestamptz,
  add column if not exists season_expires_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.subscriptions
set id = gen_random_uuid()
where id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.subscriptions'::regclass
      and contype = 'p'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_pkey primary key (id);
  end if;
end $$;

alter table public.subscriptions
  alter column id set default gen_random_uuid(),
  alter column user_id set not null,
  alter column plan set not null,
  alter column status set not null;

create unique index if not exists subscriptions_user_id_key
  on public.subscriptions(user_id);

create unique index if not exists subscriptions_stripe_subscription_id_key
  on public.subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

create unique index if not exists subscriptions_stripe_checkout_session_id_key
  on public.subscriptions(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

alter table public.subscriptions enable row level security;

drop policy if exists "Users can select own subscription" on public.subscriptions;
create policy "Users can select own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own subscription" on public.subscriptions;
drop policy if exists "Users can update own subscription" on public.subscriptions;
drop policy if exists "Users can delete own subscription" on public.subscriptions;

select pg_notify('pgrst', 'reload schema');
