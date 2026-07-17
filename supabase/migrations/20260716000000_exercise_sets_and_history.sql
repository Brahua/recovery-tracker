alter table public.session_exercises
  add column if not exists duration_minutes numeric(7, 2)
    check (
      duration_minutes is null
      or (duration_minutes > 0 and duration_minutes <= 1440)
    ),
  add column if not exists distance_km numeric(8, 3)
    check (
      distance_km is null
      or (distance_km > 0 and distance_km <= 1000)
    );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'session_exercises_id_user_id_key'
      and conrelid = 'public.session_exercises'::regclass
  ) then
    alter table public.session_exercises
      add constraint session_exercises_id_user_id_key unique (id, user_id);
  end if;
end;
$$;

create table if not exists public.session_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null check (position >= 0 and position < 100),
  reps integer check (reps is null or (reps > 0 and reps <= 1000)),
  weight_kg numeric(7, 2) check (
    weight_kg is null
    or (weight_kg >= 0 and weight_kg <= 1000)
  ),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint session_exercise_sets_exercise_fk
    foreign key (session_exercise_id, user_id)
    references public.session_exercises (id, user_id)
    on delete cascade,
  constraint session_exercise_sets_position_key
    unique (session_exercise_id, position),
  constraint session_exercise_sets_content_check
    check (reps is not null or weight_kg is not null or notes is not null)
);

create index if not exists session_exercise_sets_exercise_position_idx
  on public.session_exercise_sets (session_exercise_id, position asc);

drop trigger if exists session_exercise_sets_set_updated_at
  on public.session_exercise_sets;
create trigger session_exercise_sets_set_updated_at
before update on public.session_exercise_sets
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.session_exercise_sets enable row level security;

drop policy if exists "session_exercise_sets_select_own"
  on public.session_exercise_sets;
create policy "session_exercise_sets_select_own"
on public.session_exercise_sets
for select
using (auth.uid() = user_id);

drop policy if exists "session_exercise_sets_insert_own"
  on public.session_exercise_sets;
create policy "session_exercise_sets_insert_own"
on public.session_exercise_sets
for insert
with check (auth.uid() = user_id);

drop policy if exists "session_exercise_sets_update_own"
  on public.session_exercise_sets;
create policy "session_exercise_sets_update_own"
on public.session_exercise_sets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "session_exercise_sets_delete_own"
  on public.session_exercise_sets;
create policy "session_exercise_sets_delete_own"
on public.session_exercise_sets
for delete
using (auth.uid() = user_id);
