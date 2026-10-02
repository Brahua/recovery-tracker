-- General rehab (docs/specs/general-rehab-spec.md, phase 2): stiffness in the nightly closeout
-- and three more session types. Additive only: older closeouts keep a null stiffness and every
-- session type that was valid stays valid.

alter table public.nightly_closeouts
  add column if not exists stiffness_level text
  check (stiffness_level is null or stiffness_level in ('NONE', 'MILD', 'MODERATE', 'STRONG'));

alter table public.rehab_sessions
  drop constraint if exists rehab_sessions_session_type_check;

alter table public.rehab_sessions
  add constraint rehab_sessions_session_type_check
  check (
    session_type in (
      'HOME',
      'PHYSIOTHERAPY',
      'HYDROTHERAPY',
      'GYM',
      'WALK',
      'OTHER',
      'MOBILITY',
      'BALANCE',
      'BREATHING'
    )
  );
