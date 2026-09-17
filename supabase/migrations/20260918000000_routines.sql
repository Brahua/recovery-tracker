-- Routines: named templates of catalog exercises with their own plan.
-- Spec: docs/specs/routines-spec.md

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  normalized_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint routines_user_normalized_name_key unique (user_id, normalized_name),
  constraint routines_id_user_id_key unique (id, user_id)
);

create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null,
  position integer not null check (position between 0 and 19),
  is_isometric boolean not null default false,
  duration_minutes numeric(7, 2) check (
    duration_minutes is null or (duration_minutes > 0 and duration_minutes <= 1440)
  ),
  distance_km numeric(8, 3) check (
    distance_km is null or (distance_km > 0 and distance_km <= 1000)
  ),
  created_at timestamptz not null default timezone('utc', now()),
  constraint routine_exercises_id_user_id_key unique (id, user_id),
  constraint routine_exercises_exercise_key unique (routine_id, exercise_id),
  constraint routine_exercises_position_key unique (routine_id, position),
  constraint routine_exercises_routine_fk
    foreign key (routine_id, user_id)
    references public.routines (id, user_id)
    on delete cascade,
  constraint routine_exercises_exercise_fk
    foreign key (exercise_id, user_id)
    references public.exercises (id, user_id)
);

create table if not exists public.routine_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  routine_exercise_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null check (position between 0 and 99),
  reps integer check (reps is null or reps between 1 and 1000),
  weight_kg numeric(7, 2) check (weight_kg is null or weight_kg between 0 and 1000),
  hold_seconds integer check (hold_seconds is null or hold_seconds between 1 and 3600),
  constraint routine_exercise_sets_position_key unique (routine_exercise_id, position),
  constraint routine_exercise_sets_content_check check (
    reps is not null or weight_kg is not null or hold_seconds is not null
  ),
  constraint routine_exercise_sets_exercise_fk
    foreign key (routine_exercise_id, user_id)
    references public.routine_exercises (id, user_id)
    on delete cascade
);

create index if not exists routine_exercises_exercise_id_idx
  on public.routine_exercises (exercise_id);

create or replace function public.set_routine_normalized_name()
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

drop trigger if exists routines_set_normalized_name on public.routines;
create trigger routines_set_normalized_name
before insert or update of name on public.routines
for each row
execute function public.set_routine_normalized_name();

drop trigger if exists routines_set_updated_at on public.routines;
create trigger routines_set_updated_at
before update on public.routines
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.routine_exercise_sets enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['routines', 'routine_exercises', 'routine_exercise_sets'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id)',
      table_name || '_select_own', table_name
    );
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
      table_name || '_insert_own', table_name
    );
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      table_name || '_update_own', table_name
    );
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id)',
      table_name || '_delete_own', table_name
    );
  end loop;
end;
$$;

-- Resolves a typed or linked exercise for the current user: by id, then by
-- normalized name (reactivating an archived one), creating it when missing.
create or replace function public.resolve_exercise_for_user(
  exercise_name text,
  requested_exercise_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  resolved_exercise_id uuid;
  trimmed_name text := trim(exercise_name);
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required.';
  end if;

  if requested_exercise_id is not null then
    select id into resolved_exercise_id
    from public.exercises
    where id = requested_exercise_id
      and user_id = current_user_id;
  end if;

  if resolved_exercise_id is null then
    update public.exercises
    set archived_at = null
    where user_id = current_user_id
      and normalized_name = public.normalize_exercise_name(trimmed_name)
      and archived_at is not null;

    select id into resolved_exercise_id
    from public.exercises
    where user_id = current_user_id
      and normalized_name = public.normalize_exercise_name(trimmed_name);
  end if;

  if resolved_exercise_id is null then
    insert into public.exercises (user_id, name)
    values (current_user_id, trimmed_name)
    on conflict (user_id, normalized_name) do nothing
    returning id into resolved_exercise_id;

    if resolved_exercise_id is null then
      select id into resolved_exercise_id
      from public.exercises
      where user_id = current_user_id
        and normalized_name = public.normalize_exercise_name(trimmed_name);
    end if;
  end if;

  return resolved_exercise_id;
end;
$$;

-- Same behavior as in the exercise catalog migration, now sharing the resolver.
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
  used_exercise_ids uuid[] := '{}';
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
    resolved_exercise_id := public.resolve_exercise_for_user(
      exercise_name,
      nullif(exercise_item ->> 'exerciseId', '')::uuid
    );

    if resolved_exercise_id = any(used_exercise_ids) then
      raise exception 'Exercise is repeated in the session.';
    end if;
    used_exercise_ids := array_append(used_exercise_ids, resolved_exercise_id);

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

-- Creates (target_routine_id null) or fully replaces a routine in one transaction.
create or replace function public.save_routine(target_routine_id uuid, payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_routine_id uuid;
  exercise_item jsonb;
  exercise_position integer := 0;
  resolved_exercise_id uuid;
  new_routine_exercise_id uuid;
  exercise_is_isometric boolean;
  set_item jsonb;
  used_exercise_ids uuid[] := '{}';
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required.';
  end if;

  if target_routine_id is null then
    insert into public.routines (user_id, name)
    values (current_user_id, payload ->> 'name')
    returning id into saved_routine_id;
  else
    update public.routines
    set name = payload ->> 'name'
    where id = target_routine_id
      and user_id = current_user_id
    returning id into saved_routine_id;

    if saved_routine_id is null then
      raise exception 'Routine not found.';
    end if;

    delete from public.routine_exercises
    where routine_id = saved_routine_id
      and user_id = current_user_id;
  end if;

  for exercise_item in
    select value from jsonb_array_elements(coalesce(payload -> 'exercises', '[]'::jsonb))
  loop
    exercise_is_isometric := coalesce((exercise_item ->> 'isIsometric')::boolean, false);
    resolved_exercise_id := public.resolve_exercise_for_user(
      exercise_item ->> 'name',
      nullif(exercise_item ->> 'exerciseId', '')::uuid
    );

    if resolved_exercise_id = any(used_exercise_ids) then
      raise exception 'Exercise is repeated in the routine.';
    end if;
    used_exercise_ids := array_append(used_exercise_ids, resolved_exercise_id);

    insert into public.routine_exercises (
      routine_id,
      user_id,
      exercise_id,
      position,
      is_isometric,
      duration_minutes,
      distance_km
    )
    values (
      saved_routine_id,
      current_user_id,
      resolved_exercise_id,
      exercise_position,
      exercise_is_isometric,
      (exercise_item ->> 'durationMinutes')::numeric,
      (exercise_item ->> 'distanceKm')::numeric
    )
    returning id into new_routine_exercise_id;

    for set_item in
      select value from jsonb_array_elements(coalesce(exercise_item -> 'sets', '[]'::jsonb))
    loop
      insert into public.routine_exercise_sets (
        routine_exercise_id,
        user_id,
        position,
        reps,
        weight_kg,
        hold_seconds
      )
      values (
        new_routine_exercise_id,
        current_user_id,
        (set_item ->> 'position')::integer,
        (set_item ->> 'reps')::integer,
        (set_item ->> 'weightKg')::numeric,
        case
          when exercise_is_isometric then (set_item ->> 'holdSeconds')::integer
          else null
        end
      );
    end loop;

    exercise_position := exercise_position + 1;
  end loop;

  if exercise_position = 0 then
    raise exception 'A routine requires at least one exercise.';
  end if;

  return saved_routine_id;
end;
$$;

-- Copies the linked exercises of a logged session (plan only, no notes).
create or replace function public.create_routine_from_session(
  source_session_id uuid,
  routine_name text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_routine_id uuid;
  session_exercise record;
  exercise_position integer := 0;
  new_routine_exercise_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required.';
  end if;

  if not exists (
    select 1
    from public.rehab_sessions
    where id = source_session_id
      and user_id = current_user_id
  ) then
    raise exception 'Session not found.';
  end if;

  insert into public.routines (user_id, name)
  values (current_user_id, routine_name)
  returning id into new_routine_id;

  for session_exercise in
    select *
    from (
      select distinct on (item.exercise_id)
        item.id,
        item.exercise_id,
        item.is_isometric,
        item.duration_minutes,
        item.distance_km,
        item.position
      from public.session_exercises as item
      where item.session_id = source_session_id
        and item.user_id = current_user_id
        and item.exercise_id is not null
      order by item.exercise_id, item.position
    ) as unique_items
    order by unique_items.position
    limit 20
  loop
    insert into public.routine_exercises (
      routine_id,
      user_id,
      exercise_id,
      position,
      is_isometric,
      duration_minutes,
      distance_km
    )
    values (
      new_routine_id,
      current_user_id,
      session_exercise.exercise_id,
      exercise_position,
      session_exercise.is_isometric,
      session_exercise.duration_minutes,
      session_exercise.distance_km
    )
    returning id into new_routine_exercise_id;

    insert into public.routine_exercise_sets (
      routine_exercise_id,
      user_id,
      position,
      reps,
      weight_kg,
      hold_seconds
    )
    select
      new_routine_exercise_id,
      current_user_id,
      (row_number() over (order by logged_set.position)) - 1,
      logged_set.reps,
      logged_set.weight_kg,
      case when session_exercise.is_isometric then logged_set.hold_seconds else null end
    from public.session_exercise_sets as logged_set
    where logged_set.session_exercise_id = session_exercise.id
      and logged_set.user_id = current_user_id
      and (
        logged_set.reps is not null
        or logged_set.weight_kg is not null
        or (session_exercise.is_isometric and logged_set.hold_seconds is not null)
      );

    exercise_position := exercise_position + 1;
  end loop;

  if exercise_position = 0 then
    raise exception 'Session has no catalog exercises.';
  end if;

  return new_routine_id;
end;
$$;

-- Moves every logged use and routine use of source into target, then removes source.
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

  -- A routine that already has target keeps its own plan for it.
  delete from public.routine_exercises as source_item
  where source_item.exercise_id = source_id
    and source_item.user_id = current_user_id
    and exists (
      select 1
      from public.routine_exercises as target_item
      where target_item.routine_id = source_item.routine_id
        and target_item.exercise_id = target_id
    );

  update public.routine_exercises
  set exercise_id = target_id
  where exercise_id = source_id
    and user_id = current_user_id;

  delete from public.exercises
  where id = source_id
    and user_id = current_user_id;

  return moved_count;
end;
$$;

grant select, insert, update, delete on public.routines to anon, authenticated;
grant select, insert, update, delete on public.routine_exercises to anon, authenticated;
grant select, insert, update, delete on public.routine_exercise_sets to anon, authenticated;
grant execute on function public.resolve_exercise_for_user(text, uuid) to authenticated;
grant execute on function public.save_routine(uuid, jsonb) to authenticated;
grant execute on function public.create_routine_from_session(uuid, text) to authenticated;
