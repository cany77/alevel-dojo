-- A-Level Dojo founder access helper
-- Use this manually in the Supabase SQL Editor. Do not expose this in the app.

-- 1) Find user by email
select id, email
from auth.users
where email = 'example@email.com';

-- 2) Give founder access
insert into public.subscriptions (
  user_id,
  plan,
  status,
  updated_at
)
values (
  'PASTE_USER_ID_HERE',
  'founder',
  'active',
  now()
)
on conflict (user_id)
do update set
  plan = 'founder',
  status = 'active',
  updated_at = now();

-- 3) Remove founder access / make user free again
update public.subscriptions
set status = 'canceled',
    updated_at = now()
where user_id = 'PASTE_USER_ID_HERE';