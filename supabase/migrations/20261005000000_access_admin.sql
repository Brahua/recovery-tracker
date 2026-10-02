-- Access administration from Ajustes → Acceso (docs/specs/access-onboarding-personalization-spec.md,
-- ADR-005): the admin lists, invites and removes emails and switches the access mode. Additive only.
--
-- The admin role is app_metadata.role = 'admin' (only service_role or SQL can write it). It is read
-- from auth.users instead of the JWT so granting or revoking it applies on the next call, without
-- signing in again.

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select u.raw_app_meta_data ->> 'role' = 'admin' from auth.users u where u.id = auth.uid()),
    false
  );
$$;

-- Raises insufficient_privilege unless the caller is the admin.
create or replace function public.require_app_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_app_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
end;
$$;

-- Mode plus every invited email, newest first, with whether that email already has an account.
create or replace function public.admin_list_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_app_admin();

  return jsonb_build_object(
    'mode', coalesce((select s.mode from public.app_access_settings s where s.id), 'invite_only'),
    'invites', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'email', a.email,
            'note', a.note,
            'created_at', a.created_at,
            'joined', exists (select 1 from auth.users u where lower(u.email) = a.email)
          )
          order by a.created_at desc, a.email
        )
        from public.access_allowlist a
      ),
      '[]'::jsonb
    )
  );
end;
$$;

-- Returns false when the email was already invited.
create or replace function public.admin_invite_email(p_email text, p_note text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  perform public.require_app_admin();

  insert into public.access_allowlist (email, note)
  values (lower(btrim(p_email)), nullif(btrim(p_note), ''))
  on conflict (email) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count > 0;
end;
$$;

-- Returns false when the email was not in the list. An account that already exists keeps working
-- (ban it from the Supabase dashboard to revoke access).
create or replace function public.admin_remove_email(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  perform public.require_app_admin();

  delete from public.access_allowlist where email = lower(btrim(p_email));

  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

create or replace function public.admin_set_access_mode(p_mode text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_app_admin();

  if p_mode not in ('invite_only', 'open') then
    raise exception 'invalid_access_mode' using errcode = '22023';
  end if;

  insert into public.app_access_settings (id, mode)
  values (true, p_mode)
  on conflict (id) do update set mode = excluded.mode;
end;
$$;

revoke execute on function public.is_app_admin() from public, anon;
revoke execute on function public.require_app_admin() from public, anon;
revoke execute on function public.admin_list_access() from public, anon;
revoke execute on function public.admin_invite_email(text, text) from public, anon;
revoke execute on function public.admin_remove_email(text) from public, anon;
revoke execute on function public.admin_set_access_mode(text) from public, anon;

grant execute on function public.is_app_admin() to authenticated;
grant execute on function public.require_app_admin() to authenticated;
grant execute on function public.admin_list_access() to authenticated;
grant execute on function public.admin_invite_email(text, text) to authenticated;
grant execute on function public.admin_remove_email(text) to authenticated;
grant execute on function public.admin_set_access_mode(text) to authenticated;
