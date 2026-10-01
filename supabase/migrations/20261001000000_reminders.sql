-- Reminders (docs/specs/pwa-and-reminders-spec.md): push subscriptions per device, reminder
-- settings per user and a log of what was sent (one reminder per user, kind and local day).
-- Additive only.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz,
  constraint push_subscriptions_endpoint_https check (endpoint like 'https://%')
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

create table if not exists public.reminder_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  session_enabled boolean not null default false,
  session_time time not null default '18:00',
  closeout_enabled boolean not null default true,
  closeout_time time not null default '21:30',
  timezone text not null default 'America/Lima',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists reminder_settings_set_updated_at on public.reminder_settings;
create trigger reminder_settings_set_updated_at
before update on public.reminder_settings
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.reminder_deliveries (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('session', 'closeout')),
  local_date date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, local_date)
);

alter table public.push_subscriptions enable row level security;
alter table public.reminder_settings enable row level security;
alter table public.reminder_deliveries enable row level security;

-- push_subscriptions: owners read and remove their devices; registration goes through
-- register_push_subscription() so a device that changes account is moved, not duplicated.
drop policy if exists push_subscriptions_select_own on public.push_subscriptions;
create policy push_subscriptions_select_own on public.push_subscriptions
  for select using (auth.uid() = user_id);
drop policy if exists push_subscriptions_delete_own on public.push_subscriptions;
create policy push_subscriptions_delete_own on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- reminder_settings: owners read, create and change their own row.
drop policy if exists reminder_settings_select_own on public.reminder_settings;
create policy reminder_settings_select_own on public.reminder_settings
  for select using (auth.uid() = user_id);
drop policy if exists reminder_settings_insert_own on public.reminder_settings;
create policy reminder_settings_insert_own on public.reminder_settings
  for insert with check (auth.uid() = user_id);
drop policy if exists reminder_settings_update_own on public.reminder_settings;
create policy reminder_settings_update_own on public.reminder_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reminder_deliveries: owners can read their log; only the dispatcher (service_role) writes.
drop policy if exists reminder_deliveries_select_own on public.reminder_deliveries;
create policy reminder_deliveries_select_own on public.reminder_deliveries
  for select using (auth.uid() = user_id);

-- Saves this browser's push subscription for the signed-in user. The endpoint is unique per
-- browser install; if it belonged to another account (same phone, different login) it moves to
-- the current one.
create or replace function public.register_push_subscription(
  subscription_endpoint text,
  subscription_p256dh text,
  subscription_auth text,
  subscription_user_agent text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required.' using errcode = '28000';
  end if;

  if subscription_endpoint is null or subscription_endpoint not like 'https://%' then
    raise exception 'Invalid push endpoint.' using errcode = '22023';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (
    current_user_id,
    subscription_endpoint,
    subscription_p256dh,
    subscription_auth,
    left(subscription_user_agent, 300)
  )
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent;
end;
$$;

revoke all on function public.register_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.register_push_subscription(text, text, text, text) to authenticated;
