-- General rehab (docs/specs/general-rehab-spec.md, phase 3): simple goals the patient writes in
-- their own words ("subir escaleras sin dolor") and marks as achieved. Additive only.

create table if not exists public.recovery_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(trim(title)) between 3 and 80),
  achieved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists recovery_goals_user_created_at_idx
  on public.recovery_goals (user_id, created_at);

drop trigger if exists recovery_goals_set_updated_at on public.recovery_goals;
create trigger recovery_goals_set_updated_at
before update on public.recovery_goals
for each row
execute function public.set_current_timestamp_updated_at();

-- At most 10 pending goals per account (the app checks it too, to show a friendly message).
create or replace function public.enforce_recovery_goal_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.achieved_at is null
    and (
      select count(*)
      from public.recovery_goals
      where user_id = new.user_id and achieved_at is null
    ) >= 10 then
    raise exception 'recovery_goals_limit' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists recovery_goals_enforce_limit on public.recovery_goals;
create trigger recovery_goals_enforce_limit
before insert on public.recovery_goals
for each row
execute function public.enforce_recovery_goal_limit();

alter table public.recovery_goals enable row level security;

drop policy if exists "recovery_goals_select_own" on public.recovery_goals;
create policy "recovery_goals_select_own"
on public.recovery_goals
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "recovery_goals_insert_own" on public.recovery_goals;
create policy "recovery_goals_insert_own"
on public.recovery_goals
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "recovery_goals_update_own" on public.recovery_goals;
create policy "recovery_goals_update_own"
on public.recovery_goals
for update
to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "recovery_goals_delete_own" on public.recovery_goals;
create policy "recovery_goals_delete_own"
on public.recovery_goals
for delete
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);
