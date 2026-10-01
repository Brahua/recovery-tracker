-- Editing past sessions: update_rehab_session replaces a session (row, exercises,
-- sets and treatments) in one transaction. The child inserts move to a shared
-- function so create_rehab_session and update_rehab_session cannot drift apart.
-- Additive: no tables or columns change, and create_rehab_session keeps its behavior.

-- Inserts the payload's exercises (with sets) and treatments for a session the
-- caller owns. Runs as the caller (security invoker): RLS and the composite
-- (session_id, user_id) foreign keys keep it to the caller's own session.
create or replace function public.insert_rehab_session_children(
  target_session_id uuid,
  payload jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  exercise_item jsonb;
  exercise_position integer := 0;
  resolved_exercise_id uuid;
  new_session_exercise_id uuid;
  exercise_name text;
  exercise_is_isometric boolean;
  set_item jsonb;
  used_exercise_ids uuid[] := '{}';
  treatment_item jsonb;
  treatment_position integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required.';
  end if;

  if payload ->> 'sessionType' <> 'PHYSIOTHERAPY'
    and jsonb_array_length(coalesce(payload -> 'treatments', '[]'::jsonb)) > 0 then
    raise exception 'Treatments are only recorded for physiotherapy sessions.';
  end if;

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
      target_session_id,
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

  for treatment_item in
    select value from jsonb_array_elements(coalesce(payload -> 'treatments', '[]'::jsonb))
  loop
    insert into public.session_treatments (
      session_id,
      user_id,
      position,
      category,
      modality,
      custom_name,
      body_zone,
      duration_minutes
    )
    values (
      target_session_id,
      current_user_id,
      treatment_position,
      treatment_item ->> 'category',
      treatment_item ->> 'modality',
      nullif(trim(treatment_item ->> 'customName'), ''),
      nullif(trim(treatment_item ->> 'bodyZone'), ''),
      (treatment_item ->> 'durationMinutes')::integer
    );

    treatment_position := treatment_position + 1;
  end loop;
end;
$$;

-- Same behavior as in the session treatments migration, now sharing the child inserts.
create or replace function public.create_rehab_session(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_session_id uuid;
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
    notes,
    therapist_notes
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
    payload ->> 'notes',
    case
      when payload ->> 'sessionType' = 'PHYSIOTHERAPY' then nullif(trim(payload ->> 'therapistNotes'), '')
      else null
    end
  )
  returning id into new_session_id;

  perform public.insert_rehab_session_children(new_session_id, payload);

  return new_session_id;
end;
$$;

-- Replaces a saved session with the payload: updates the row, then swaps its
-- exercises (sets cascade) and treatments. Everything or nothing.
create or replace function public.update_rehab_session(
  target_session_id uuid,
  payload jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authenticated user is required.';
  end if;

  update public.rehab_sessions
  set
    occurred_at = (payload ->> 'occurredAt')::timestamptz,
    session_type = payload ->> 'sessionType',
    pain_before = (payload ->> 'painBefore')::integer,
    pain_during = (payload ->> 'painDuring')::integer,
    pain_after = (payload ->> 'painAfter')::integer,
    perceived_load = (payload ->> 'perceivedLoad')::integer,
    final_state = payload ->> 'finalState',
    notes = payload ->> 'notes',
    therapist_notes = case
      when payload ->> 'sessionType' = 'PHYSIOTHERAPY' then nullif(trim(payload ->> 'therapistNotes'), '')
      else null
    end
  where id = target_session_id
    and user_id = current_user_id;

  if not found then
    raise exception 'Rehab session not found.' using errcode = 'P0002';
  end if;

  delete from public.session_exercises
  where session_id = target_session_id
    and user_id = current_user_id;

  delete from public.session_treatments
  where session_id = target_session_id
    and user_id = current_user_id;

  perform public.insert_rehab_session_children(target_session_id, payload);

  return target_session_id;
end;
$$;

grant execute on function public.insert_rehab_session_children(uuid, jsonb) to authenticated;
grant execute on function public.update_rehab_session(uuid, jsonb) to authenticated;
