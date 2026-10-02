-- Closeout time (Registrar → Cierre): the hour the day was closed, as a Lima time of day next to
-- `date`. A time of day, not a timestamp, because `date` is the day being closed: closing the
-- night of Oct 1 at 00:30 keeps date = Oct 1. Nullable: older rows fall back to created_at.
-- Additive only.

alter table public.nightly_closeouts
  add column if not exists closed_time time;

-- Existing closeouts keep the time they were saved at, so nothing changes in Historial.
update public.nightly_closeouts
set closed_time = (created_at at time zone 'America/Lima')::time(0)
where closed_time is null;
