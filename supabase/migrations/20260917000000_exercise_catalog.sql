-- Exercise catalog: per-user exercises with defaults, isometric logging,
-- atomic session creation and exercise merging.
-- Spec: docs/specs/exercise-catalog-spec.md

create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;

-- Must stay in sync with normalizeExerciseName in src/lib/exercise-name.ts.
create or replace function public.normalize_exercise_name(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(lower(extensions.unaccent(trim(value))), '\s+', ' ', 'g');
$$;

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  normalized_name text not null,
  default_isometric boolean not null default false,
  default_set_count integer check (
    default_set_count is null or default_set_count between 1 and 20
  ),
  default_reps integer check (
    default_reps is null or default_reps between 1 and 1000
  ),
  default_hold_seconds integer check (
    default_hold_seconds is null or default_hold_seconds between 1 and 3600
  ),
  default_weight_kg numeric(7, 2) check (
    default_weight_kg is null or default_weight_kg between 0 and 1000
  ),
  default_duration_minutes numeric(7, 2) check (
    default_duration_minutes is null
    or (default_duration_minutes > 0 and default_duration_minutes <= 1440)
  ),
  default_distance_km numeric(8, 3) check (
    default_distance_km is null
    or (default_distance_km > 0 and default_distance_km <= 1000)
  ),
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint exercises_user_normalized_name_key unique (user_id, normalized_name),
  constraint exercises_id_user_id_key unique (id, user_id)
);

create or replace function public.set_exercise_normalized_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name = trim(new.name);
  new.normalized_name = public.normalize_exercise_name(new.name);
  return new;
end;
$$;

drop trigger if exists exercises_set_normalized_name on public.exercises;
create trigger exercises_set_normalized_name
before insert or update of name on public.exercises
for each row
execute function public.set_exercise_normalized_name();

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
before update on public.exercises
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.exercises enable row level security;

drop policy if exists "exercises_select_own" on public.exercises;
create policy "exercises_select_own"
on public.exercises
for select
using (auth.uid() = user_id);

drop policy if exists "exercises_insert_own" on public.exercises;
create policy "exercises_insert_own"
on public.exercises
for insert
with check (auth.uid() = user_id);

drop policy if exists "exercises_update_own" on public.exercises;
create policy "exercises_update_own"
on public.exercises
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "exercises_delete_own" on public.exercises;
create policy "exercises_delete_own"
on public.exercises
for delete
using (auth.uid() = user_id);

alter table public.session_exercises
  add column if not exists exercise_id uuid,
  add column if not exists is_isometric boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'session_exercises_exercise_fk'
      and conrelid = 'public.session_exercises'::regclass
  ) then
    alter table public.session_exercises
      add constraint session_exercises_exercise_fk
      foreign key (exercise_id, user_id)
      references public.exercises (id, user_id);
  end if;
end;
$$;

create index if not exists session_exercises_exercise_id_idx
  on public.session_exercises (exercise_id);

alter table public.session_exercise_sets
  add column if not exists hold_seconds integer check (
    hold_seconds is null or hold_seconds between 1 and 3600
  );

alter table public.session_exercise_sets
  drop constraint if exists session_exercise_sets_content_check;

alter table public.session_exercise_sets
  add constraint session_exercise_sets_content_check check (
    reps is not null
    or weight_kg is not null
    or hold_seconds is not null
    or notes is not null
  );

-- Seeds the default catalog only for users that have no exercises yet, so
-- renamed, archived or merged exercises never come back.
create or replace function public.seed_default_exercises(
  target_user_id uuid default auth.uid()
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if target_user_id is null then
    raise exception 'Authenticated user is required.';
  end if;

  if exists (select 1 from public.exercises where user_id = target_user_id) then
    return;
  end if;

  insert into public.exercises (
    user_id,
    name,
    default_isometric,
    default_duration_minutes
  )
  values
    (target_user_id, 'Bicicleta 5-10 min', false, 10),
    (target_user_id, 'Sentadilla espanola', false, null),
    (target_user_id, 'Step-up', false, null),
    (target_user_id, 'Step-down', false, null),
    (target_user_id, 'Hip thrust', false, null),
    (target_user_id, 'Peso muerto rumano', false, null),
    (target_user_id, 'Caminata lateral con banda', false, null),
    (target_user_id, 'Propiocepcion', false, null),
    (target_user_id, 'Wall sit', true, null),
    (target_user_id, 'Puente de gluteos', false, null)
  on conflict (user_id, normalized_name) do nothing;
end;
$$;

-- Backfill: default catalog for existing users, then link logged exercises.
do $$
declare
  existing_user record;
begin
  for existing_user in select id from auth.users loop
    perform public.seed_default_exercises(existing_user.id);
  end loop;
end;
$$;

insert into public.exercises (user_id, name)
select distinct on (user_id, public.normalize_exercise_name(name))
  user_id,
  trim(name)
from public.session_exercises
where exercise_id is null
  and length(trim(name)) between 1 and 80
order by user_id, public.normalize_exercise_name(name), created_at
on conflict (user_id, normalized_name) do nothing;

update public.session_exercises as session_exercise
set exercise_id = exercise.id
from public.exercises as exercise
where session_exercise.exercise_id is null
  and exercise.user_id = session_exercise.user_id
  and exercise.normalized_name = public.normalize_exercise_name(session_exercise.name);

-- Distinct sessions per exercise for the current user.
create or replace function public.exercise_usage()
returns table (exercise_id uuid, session_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select session_exercise.exercise_id, count(distinct session_exercise.session_id)
  from public.session_exercises as session_exercise
  where session_exercise.user_id = auth.uid()
    and session_exercise.exercise_id is not null
  group by session_exercise.exercise_id;
$$;

-- Creates a session, its exercises and sets in one transaction. Exercises are
-- resolved by id, then by normalized name, and created when missing.
create or replace function public.create_rehab_session(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_session_id uuid;
  exercise_item jsonb;
  exercise_position integer := 0;
  resolved_exercise_id uuid;
  new_session_exercise_id uuid;
  exercise_name text;
  exercise_is_isometric boolean;
  set_item jsonb;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required.';
  end if;

  insert into public.rehab_sessions (
    user_id,
    occurred_at,
    session_type,
    pain_before,
    pain_during,
    pain_after,
    perceived_load,
    final_state,
    notes
  )
  values (
    current_user_id,
    (payload ->> 'occurredAt')::timestamptz,
    payload ->> 'sessionType',
    (payload ->> 'painBefore')::integer,
    (payload ->> 'painDuring')::integer,
    (payload ->> 'painAfter')::integer,
    (payload ->> 'perceivedLoad')::integer,
    payload ->> 'finalState',
    payload ->> 'notes'
  )
  returning id into new_session_id;

  for exercise_item in
    select value from jsonb_array_elements(coalesce(payload -> 'exercises', '[]'::jsonb))
  loop
    exercise_name := trim(exercise_item ->> 'name');
    exercise_is_isometric := coalesce((exercise_item ->> 'isIsometric')::boolean, false);
    resolved_exercise_id := null;

    if nullif(exercise_item ->> 'exerciseId', '') is not null then
      select id into resolved_exercise_id
      from public.exercises
      where id = (exercise_item ->> 'exerciseId')::uuid
        and user_id = current_user_id;
    end if;

    if resolved_exercise_id is null then
      select id into resolved_exercise_id
      from public.exercises
      where user_id = current_user_id
        and normalized_name = public.normalize_exercise_name(exercise_name);
    end if;

    if resolved_exercise_id is null then
      insert into public.exercises (user_id, name)
      values (current_user_id, exercise_name)
      on conflict (user_id, normalized_name) do nothing
      returning id into resolved_exercise_id;

      if resolved_exercise_id is null then
        select id into resolved_exercise_id
        from public.exercises
        where user_id = current_user_id
          and normalized_name = public.normalize_exercise_name(exercise_name);
      end if;
    end if;

    insert into public.session_exercises (
      session_id,
      user_id,
      position,
      name,
      exercise_id,
      is_isometric,
      duration_minutes,
      distance_km,
      notes
    )
    values (
      new_session_id,
      current_user_id,
      exercise_position,
      exercise_name,
      resolved_exercise_id,
      exercise_is_isometric,
      (exercise_item ->> 'durationMinutes')::numeric,
      (exercise_item ->> 'distanceKm')::numeric,
      exercise_item ->> 'notes'
    )
    returning id into new_session_exercise_id;

    for set_item in
      select value from jsonb_array_elements(coalesce(exercise_item -> 'sets', '[]'::jsonb))
    loop
      insert into public.session_exercise_sets (
        session_exercise_id,
        user_id,
        position,
        reps,
        weight_kg,
        hold_seconds,
        notes
      )
      values (
        new_session_exercise_id,
        current_user_id,
        (set_item ->> 'position')::integer,
        (set_item ->> 'reps')::integer,
        (set_item ->> 'weightKg')::numeric,
        case
          when exercise_is_isometric then (set_item ->> 'holdSeconds')::integer
          else null
        end,
        set_item ->> 'notes'
      );
    end loop;

    exercise_position := exercise_position + 1;
  end loop;

  return new_session_id;
end;
$$;

-- Moves every logged use of source into target and removes source.
-- Logged names are kept as they were recorded.
create or replace function public.merge_exercises(source_id uuid, target_id uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  moved_count integer;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required.';
  end if;

  if source_id = target_id then
    raise exception 'Cannot merge an exercise into itself.';
  end if;

  if (
    select count(*)
    from public.exercises
    where id in (source_id, target_id)
      and user_id = current_user_id
  ) <> 2 then
    raise exception 'Exercise not found.';
  end if;

  update public.session_exercises
  set exercise_id = target_id
  where exercise_id = source_id
    and user_id = current_user_id;

  get diagnostics moved_count = row_count;

  delete from public.exercises
  where id = source_id
    and user_id = current_user_id;

  return moved_count;
end;
$$;

grant select, insert, update, delete on public.exercises to anon, authenticated;
grant execute on function public.normalize_exercise_name(text) to anon, authenticated;
grant execute on function public.seed_default_exercises(uuid) to authenticated;
grant execute on function public.exercise_usage() to authenticated;
grant execute on function public.create_rehab_session(jsonb) to authenticated;
grant execute on function public.merge_exercises(uuid, uuid) to authenticated;
