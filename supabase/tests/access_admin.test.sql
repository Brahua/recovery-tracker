-- Access administration functions (supabase/migrations/20261005000000_access_admin.sql): only the
-- admin (app_metadata.role = 'admin' in auth.users) can list, invite, remove and change the mode.
begin;
create extension if not exists pgtap with schema extensions;

select plan(15);

delete from public.access_allowlist;
update public.app_access_settings set mode = 'invite_only';

insert into auth.users (id, email, raw_app_meta_data) values
  ('00000000-0000-4000-8000-0000000000a1', 'admin@example.com', '{"provider": "google", "role": "admin"}'),
  ('00000000-0000-4000-8000-0000000000b2', 'member@example.com', '{"provider": "google"}');

-- A regular signed-in user.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-4000-8000-0000000000b2", "role": "authenticated"}';

select is(public.is_app_admin(), false, 'a regular user is not the admin');
select throws_ok('select public.admin_list_access()', '42501', 'not_admin', 'a regular user cannot list access');
select throws_ok($$select public.admin_invite_email('x@gmail.com')$$, '42501', 'not_admin', 'a regular user cannot invite');
select throws_ok($$select public.admin_set_access_mode('open')$$, '42501', 'not_admin', 'a regular user cannot open access');

-- The admin.
set local request.jwt.claims = '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated"}';

select is(public.is_app_admin(), true, 'the admin is recognized from auth.users');
select is(public.admin_invite_email('  Friend@Gmail.com ', ' fisio '), true, 'the admin invites an email');
select is(public.admin_invite_email('friend@gmail.com'), false, 'inviting the same email again is a no-op');
select is(public.admin_invite_email('member@example.com'), true, 'the admin can invite an email that already has an account');

select is(
  (select i -> 'joined' from jsonb_array_elements(public.admin_list_access() -> 'invites') i where i ->> 'email' = 'friend@gmail.com'),
  'false'::jsonb,
  'an invited email without an account is pending'
);
select is(
  (select i -> 'joined' from jsonb_array_elements(public.admin_list_access() -> 'invites') i where i ->> 'email' = 'member@example.com'),
  'true'::jsonb,
  'an invited email with an account has joined'
);
select is(
  (select i ->> 'note' from jsonb_array_elements(public.admin_list_access() -> 'invites') i where i ->> 'email' = 'friend@gmail.com'),
  'fisio',
  'the note is stored trimmed'
);

select lives_ok($$select public.admin_set_access_mode('open')$$, 'the admin opens access');
select is(public.admin_list_access() ->> 'mode', 'open', 'the mode is now open');
select throws_ok($$select public.admin_set_access_mode('everyone')$$, '22023', 'invalid_access_mode', 'an unknown mode is rejected');

select is(
  array[public.admin_remove_email('FRIEND@gmail.com'), public.admin_remove_email('friend@gmail.com')],
  array[true, false],
  'the admin removes an email; removing it again is a no-op'
);

select * from finish();
rollback;
