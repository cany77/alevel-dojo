create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  resource_id text,
  resource_label text,
  created_at timestamptz default now()
);

create index if not exists usage_events_user_type_created_idx
  on public.usage_events (user_id, event_type, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "Users can select own usage events" on public.usage_events;
create policy "Users can select own usage events"
  on public.usage_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own usage events" on public.usage_events;
create policy "Users can insert own usage events"
  on public.usage_events
  for insert
  with check (auth.uid() = user_id);
