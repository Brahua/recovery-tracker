-- Morning check-in (docs/specs/morning-checkin-and-daily-goal-spec.md): "¿Cómo amaneciste?",
-- optional, one per day. `date` is the day the patient wakes up: the sleep is the night before
-- (date-1 → date) and the rebound answers to the sessions of date-1, so it is null when that day
-- had none. It replaces the nightly closeout in the app; nightly_closeouts stays untouched and
-- readable. Additive only.

create table if not exists public.morning_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  sleep_hours numeric(4, 1) not null check (sleep_hours >= 0 and sleep_hours <= 24),
  sleep_quality integer not null check (sleep_quality between 1 and 5),
  waking_pain integer not null check (waking_pain between 0 and 10),
  stiffness_level text not null check (stiffness_level in ('NONE', 'MILD', 'MODERATE', 'STRONG')),
  rebound_pain_level text check (
    rebound_pain_level is null or rebound_pain_level in ('NONE', 'MILD', 'MODERATE', 'STRONG')
  ),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date)
);

create index if not exists morning_checkins_user_date_idx
  on public.morning_checkins (user_id, date desc);

drop trigger if exists morning_checkins_set_updated_at on public.morning_checkins;
create trigger morning_checkins_set_updated_at
before update on public.morning_checkins
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.morning_checkins enable row level security;

drop policy if exists "morning_checkins_select_own" on public.morning_checkins;
create policy "morning_checkins_select_own"
on public.morning_checkins
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "morning_checkins_insert_own" on public.morning_checkins;
create policy "morning_checkins_insert_own"
on public.morning_checkins
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "morning_checkins_update_own" on public.morning_checkins;
create policy "morning_checkins_update_own"
on public.morning_checkins
for update
to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "morning_checkins_delete_own" on public.morning_checkins;
create policy "morning_checkins_delete_own"
on public.morning_checkins
for delete
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

grant select, insert, update, delete on public.morning_checkins to anon, authenticated;
