-- Treatments applied at the therapy center (physical agents, manual therapy,
-- invasive techniques, taping) and the therapist's instructions.
-- Additive: one nullable column, one new table, and create_rehab_session
-- extended to save both in the same transaction.

alter table public.rehab_sessions
  add column if not exists therapist_notes text
  constraint rehab_sessions_therapist_notes_length
  check (therapist_notes is null or length(therapist_notes) between 1 and 1000);

create table if not exists public.session_treatments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null check (position between 0 and 14),
  category text not null check (
    category in ('PHYSICAL_AGENT', 'MANUAL_THERAPY', 'INVASIVE', 'TAPING')
  ),
  modality text not null,
  custom_name text check (
    custom_name is null or length(trim(custom_name)) between 1 and 60
  ),
  body_zone text check (
    body_zone is null or length(trim(body_zone)) between 1 and 60
  ),
  duration_minutes integer check (duration_minutes between 1 and 120),
  created_at timestamptz not null default timezone('utc', now()),
  constraint session_treatments_session_position_key unique (session_id, position),
  constraint session_treatments_modality_category check (
    modality = 'OTHER'
    or (category, modality) in (
      ('PHYSICAL_AGENT', 'TECAR'),
      ('PHYSICAL_AGENT', 'SHOCKWAVE'),
      ('PHYSICAL_AGENT', 'LASER'),
      ('PHYSICAL_AGENT', 'ULTRASOUND'),
      ('PHYSICAL_AGENT', 'ELECTROTHERAPY'),
      ('PHYSICAL_AGENT', 'MAGNETOTHERAPY'),
      ('PHYSICAL_AGENT', 'CRYOTHERAPY'),
      ('PHYSICAL_AGENT', 'THERMOTHERAPY'),
      ('PHYSICAL_AGENT', 'PRESSOTHERAPY'),
      ('MANUAL_THERAPY', 'MASSAGE'),
      ('MANUAL_THERAPY', 'JOINT_MOBILIZATION'),
      ('MANUAL_THERAPY', 'MYOFASCIAL_RELEASE'),
      ('MANUAL_THERAPY', 'LYMPHATIC_DRAINAGE'),
      ('INVASIVE', 'DRY_NEEDLING'),
      ('INVASIVE', 'EPI'),
      ('INVASIVE', 'MESOTHERAPY'),
      ('INVASIVE', 'INFILTRATION'),
      ('TAPING', 'KINESIO_TAPE'),
      ('TAPING', 'FUNCTIONAL_TAPE')
    )
  ),
  constraint session_treatments_custom_name_only_other check (
    (modality = 'OTHER') = (custom_name is not null)
  ),
  constraint session_treatments_session_fkey
    foreign key (session_id, user_id)
    references public.rehab_sessions (id, user_id)
    on delete cascade
);

create unique index if not exists session_treatments_unique_modality
  on public.session_treatments (session_id, modality, coalesce(lower(trim(custom_name)), ''));

create index if not exists session_treatments_user_id_idx
  on public.session_treatments (user_id);

alter table public.session_treatments enable row level security;

drop policy if exists "session_treatments_select_own" on public.session_treatments;
create policy "session_treatments_select_own"
on public.session_treatments
for select
using (auth.uid() = user_id);

drop policy if exists "session_treatments_insert_own" on public.session_treatments;
create policy "session_treatments_insert_own"
on public.session_treatments
for insert
with check (auth.uid() = user_id);

drop policy if exists "session_treatments_delete_own" on public.session_treatments;
create policy "session_treatments_delete_own"
on public.session_treatments
for delete
using (auth.uid() = user_id);

grant select, insert, delete on public.session_treatments to anon, authenticated;

-- Same behavior as in the routines migration, plus therapist notes and treatments.
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
      new_session_id,
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

  return new_session_id;
end;
$$;
