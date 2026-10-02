-- Invite-only access: before_user_created_hook and the privileges on its tables
-- (supabase/migrations/20261004000000_access_control.sql). Run with `npx supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

-- The migration seeds invite_only; tests own the allowlist inside this transaction.
delete from public.access_allowlist;
update public.app_access_settings set mode = 'invite_only';
insert into public.access_allowlist (email) values ('invited@gmail.com');

select is(
  public.before_user_created_hook('{"user": {"email": "stranger@gmail.com", "is_anonymous": false}}'),
  '{"error": {"http_code": 403, "message": "not_invited"}}'::jsonb,
  'invite_only rejects an email that is not in the allowlist'
);

select is(
  public.before_user_created_hook('{"user": {"email": "  Invited@Gmail.com ", "is_anonymous": false}}'),
  '{}'::jsonb,
  'invite_only allows an allowlisted email regardless of case and spaces'
);

select is(
  public.before_user_created_hook('{"user": {"email": "", "is_anonymous": false}}'),
  '{"error": {"http_code": 403, "message": "not_invited"}}'::jsonb,
  'invite_only rejects a user without an email'
);

select is(
  public.before_user_created_hook('{"user": {"email": "", "is_anonymous": true}}'),
  '{}'::jsonb,
  'anonymous users pass the hook'
);

update public.app_access_settings set mode = 'open';

select is(
  public.before_user_created_hook('{"user": {"email": "stranger@gmail.com", "is_anonymous": false}}'),
  '{}'::jsonb,
  'open mode allows any email'
);

delete from public.app_access_settings;

select is(
  public.before_user_created_hook('{"user": {"email": "stranger@gmail.com", "is_anonymous": false}}'),
  '{"error": {"http_code": 403, "message": "not_invited"}}'::jsonb,
  'a missing settings row fails closed'
);

select throws_ok(
  $$insert into public.access_allowlist (email) values ('Mixed@Gmail.com')$$,
  '23514',
  null,
  'the allowlist only stores trimmed, lowercased emails'
);

select ok(
  has_function_privilege('supabase_auth_admin', 'public.before_user_created_hook(jsonb)', 'execute'),
  'Supabase Auth can run the hook'
);

select ok(
  not has_function_privilege('authenticated', 'public.before_user_created_hook(jsonb)', 'execute'),
  'signed-in users cannot run the hook'
);

select ok(
  not has_table_privilege('authenticated', 'public.access_allowlist', 'select')
    and not has_table_privilege('anon', 'public.access_allowlist', 'select')
    and not has_table_privilege('authenticated', 'public.app_access_settings', 'update'),
  'users have no direct privileges on the access tables'
);

select * from finish();
rollback;
