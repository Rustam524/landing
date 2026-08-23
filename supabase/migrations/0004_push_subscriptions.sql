-- Push notifications: one row per browser/device a user enabled
-- notifications on (a user can have several — phone + laptop, etc).

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- A user manages only their own subscriptions from the browser. Sending a
-- push to *someone else* (e.g. notifying an assignee about a new task) goes
-- through the service-role admin client server-side, same pattern as
-- employee creation — it deliberately bypasses these policies rather than
-- adding a policy that would let any employee read another's push endpoint.
create policy push_subscriptions_select_self on public.push_subscriptions
  for select to authenticated
  using (user_id = auth.uid());

create policy push_subscriptions_insert_self on public.push_subscriptions
  for insert to authenticated
  with check (user_id = auth.uid());

create policy push_subscriptions_delete_self on public.push_subscriptions
  for delete to authenticated
  using (user_id = auth.uid());
