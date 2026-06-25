create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  current_period_end timestamptz,
  season_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_plan_check check (plan in ('free', 'dojo_plus', 'exam_season_pass')),
  constraint user_subscriptions_status_check check (status in ('inactive', 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'paid'))
);

alter table public.user_subscriptions enable row level security;

drop policy if exists "Users can read own subscription" on public.user_subscriptions;
create policy "Users can read own subscription"
on public.user_subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);

grant select on public.user_subscriptions to authenticated;
