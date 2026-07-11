create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.rehab_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_at timestamptz not null,
  session_type text not null check (
    session_type in ('HOME', 'PHYSIOTHERAPY', 'HYDROTHERAPY', 'GYM', 'WALK', 'OTHER')
  ),
  pain_before integer not null check (pain_before between 0 and 10),
  pain_during integer check (pain_during between 0 and 10),
  pain_after integer not null check (pain_after between 0 and 10),
  perceived_load integer not null check (perceived_load between 1 and 5),
  final_state text not null check (final_state in ('BETTER', 'SAME', 'WORSE')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id)
);

create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  name text not null,
  shortcut_id text check (
    shortcut_id is null
    or shortcut_id in (
      'BICICLETA',
      'SENTADILLA_ESPANOLA',
      'TKE',
      'STEP_UP',
      'STEP_DOWN',
      'HIP_THRUST',
      'PESO_MUERTO_RUMANO',
      'CAMINATA_LATERAL_BANDA',
      'PROPIOCEPCION',
      'ESTIRAMIENTOS_SUAVES'
    )
  ),
  sets integer check (sets is null or sets > 0),
  reps integer check (reps is null or reps > 0),
  weight numeric(6, 2) check (weight is null or weight >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint session_exercises_session_fk
    foreign key (session_id, user_id)
    references public.rehab_sessions (id, user_id)
    on delete cascade
);

create table if not exists public.nightly_closeouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  end_of_day_pain integer not null check (end_of_day_pain between 0 and 10),
  energy integer not null check (energy between 1 and 5),
  sleep_hours numeric(4, 1) not null check (sleep_hours >= 0 and sleep_hours <= 24),
  sleep_quality integer not null check (sleep_quality between 1 and 5),
  rebound_pain_level text not null check (
    rebound_pain_level in ('NONE', 'MILD', 'MODERATE', 'STRONG')
  ),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date)
);

create index if not exists rehab_sessions_user_occurred_at_idx
  on public.rehab_sessions (user_id, occurred_at desc);

create index if not exists session_exercises_session_position_idx
  on public.session_exercises (session_id, position asc);

create index if not exists nightly_closeouts_user_date_idx
  on public.nightly_closeouts (user_id, date desc);

drop trigger if exists rehab_sessions_set_updated_at on public.rehab_sessions;
create trigger rehab_sessions_set_updated_at
before update on public.rehab_sessions
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists session_exercises_set_updated_at on public.session_exercises;
create trigger session_exercises_set_updated_at
before update on public.session_exercises
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists nightly_closeouts_set_updated_at on public.nightly_closeouts;
create trigger nightly_closeouts_set_updated_at
before update on public.nightly_closeouts
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.rehab_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.nightly_closeouts enable row level security;

drop policy if exists "rehab_sessions_select_own" on public.rehab_sessions;
create policy "rehab_sessions_select_own"
on public.rehab_sessions
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "rehab_sessions_insert_own" on public.rehab_sessions;
create policy "rehab_sessions_insert_own"
on public.rehab_sessions
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "rehab_sessions_update_own" on public.rehab_sessions;
create policy "rehab_sessions_update_own"
on public.rehab_sessions
for update
to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "rehab_sessions_delete_own" on public.rehab_sessions;
create policy "rehab_sessions_delete_own"
on public.rehab_sessions
for delete
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "session_exercises_select_own" on public.session_exercises;
create policy "session_exercises_select_own"
on public.session_exercises
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "session_exercises_insert_own" on public.session_exercises;
create policy "session_exercises_insert_own"
on public.session_exercises
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "session_exercises_update_own" on public.session_exercises;
create policy "session_exercises_update_own"
on public.session_exercises
for update
to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "session_exercises_delete_own" on public.session_exercises;
create policy "session_exercises_delete_own"
on public.session_exercises
for delete
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "nightly_closeouts_select_own" on public.nightly_closeouts;
create policy "nightly_closeouts_select_own"
on public.nightly_closeouts
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "nightly_closeouts_insert_own" on public.nightly_closeouts;
create policy "nightly_closeouts_insert_own"
on public.nightly_closeouts
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "nightly_closeouts_update_own" on public.nightly_closeouts;
create policy "nightly_closeouts_update_own"
on public.nightly_closeouts
for update
to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "nightly_closeouts_delete_own" on public.nightly_closeouts;
create policy "nightly_closeouts_delete_own"
on public.nightly_closeouts
for delete
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);
