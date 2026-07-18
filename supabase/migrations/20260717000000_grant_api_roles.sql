-- Grant the standard Supabase API-role privileges on the public schema.
--
-- Supabase Cloud auto-applies these grants to `anon` / `authenticated` on new
-- tables, so hosted projects (e.g. staging) work without them being in SQL. A
-- fresh local/CI stack started from `supabase start` does NOT get them, which
-- surfaced as `permission denied for table rehab_sessions` in CI. Declaring the
-- grants here makes the schema self-sufficient on any fresh bootstrap; on hosted
-- projects it is an idempotent no-op. Row Level Security (enabled with per-owner
-- policies in the foundation migration) remains the actual access control.

grant usage on schema public to anon, authenticated;

grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;

alter default privileges in schema public
  grant all on tables to anon, authenticated;
alter default privileges in schema public
  grant all on sequences to anon, authenticated;
alter default privileges in schema public
  grant all on routines to anon, authenticated;
