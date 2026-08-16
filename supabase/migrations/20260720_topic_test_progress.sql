-- Stores saved/completed state for authenticated users' topic tests.
-- Past-paper completion stays in completed_papers; this table is namespaced only for topic tests.

create table if not exists public.topic_test_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_test_id text not null,
  saved boolean not null default false,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_test_id)
);

alter table public.topic_test_progress enable row level security;

create policy if not exists "Users can read own topic test progress"
on public.topic_test_progress
for select
using (auth.uid() = user_id);

create policy if not exists "Users can insert own topic test progress"
on public.topic_test_progress
for insert
with check (auth.uid() = user_id);

create policy if not exists "Users can update own topic test progress"
on public.topic_test_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users can delete own topic test progress"
on public.topic_test_progress
for delete
using (auth.uid() = user_id);
