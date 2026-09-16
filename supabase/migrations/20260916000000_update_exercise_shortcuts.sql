-- Replace TKE and ESTIRAMIENTOS_SUAVES shortcuts with WALL_SIT and PUENTE_GLUTEOS.
-- Existing rows keep their stored name and become free-form exercises.
update public.session_exercises
set shortcut_id = null
where shortcut_id in ('TKE', 'ESTIRAMIENTOS_SUAVES');

alter table public.session_exercises
  drop constraint if exists session_exercises_shortcut_id_check;

alter table public.session_exercises
  add constraint session_exercises_shortcut_id_check check (
    shortcut_id is null
    or shortcut_id in (
      'BICICLETA',
      'SENTADILLA_ESPANOLA',
      'STEP_UP',
      'STEP_DOWN',
      'HIP_THRUST',
      'PESO_MUERTO_RUMANO',
      'CAMINATA_LATERAL_BANDA',
      'PROPIOCEPCION',
      'WALL_SIT',
      'PUENTE_GLUTEOS'
    )
  );
