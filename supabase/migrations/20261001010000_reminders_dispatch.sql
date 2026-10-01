-- Reminders dispatch (docs/specs/pwa-and-reminders-spec.md): every 5 minutes pg_cron calls
-- public.dispatch_reminders(), which POSTs to the app endpoint with a shared secret. The app decides
-- who gets a reminder and sends it.
--
-- The endpoint URL and the secret live in Supabase Vault, never in this file:
--   reminders_dispatch_url    → https://recovery-tracker.brahua.com/api/reminders/dispatch
--   reminders_dispatch_secret → same value as REMINDERS_DISPATCH_SECRET in Vercel
-- Without both (local and CI stacks) the function does nothing, so tests never call production.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.dispatch_reminders()
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  endpoint text;
  secret text;
  request_id bigint;
begin
  select decrypted_secret into endpoint
  from vault.decrypted_secrets
  where name = 'reminders_dispatch_url'
  limit 1;

  select decrypted_secret into secret
  from vault.decrypted_secrets
  where name = 'reminders_dispatch_secret'
  limit 1;

  if endpoint is null or secret is null then
    return null;
  end if;

  select net.http_post(
    url := endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  ) into request_id;

  return request_id;
end;
$$;

-- Only the cron job (run by the migration owner) may call it; API roles may not.
revoke all on function public.dispatch_reminders() from public, anon, authenticated;

-- Idempotent schedule: replace the job if it already exists.
select cron.unschedule(jobid) from cron.job where jobname = 'dispatch-reminders';
select cron.schedule('dispatch-reminders', '*/5 * * * *', $cron$select public.dispatch_reminders();$cron$);
