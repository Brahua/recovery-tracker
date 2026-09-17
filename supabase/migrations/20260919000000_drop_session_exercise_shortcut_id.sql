-- shortcut_id was replaced by exercise_id (exercise catalog, 20260917000000).
-- No code reads or writes it; dropping the column also drops its check constraint.
alter table public.session_exercises
  drop column if exists shortcut_id;
