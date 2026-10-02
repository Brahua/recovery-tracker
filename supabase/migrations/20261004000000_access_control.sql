-- Invite-only access (docs/specs/access-onboarding-personalization-spec.md, ADR-005): an access
-- mode plus an allowlist of emails, enforced by Supabase Auth's before_user_created hook so that
-- no account is created for an email that is not invited. Additive only.

-- One row: 'invite_only' checks the allowlist; 'open' lets any Google account sign up.
create table if not exists public.app_access_settings (
  id boolean primary key default true check (id),
  mode text not null default 'invite_only' check (mode in ('invite_only', 'open')),
  updated_at timestamptz not null default now()
);

insert into public.app_access_settings (id, mode)
values (true, 'invite_only')
on conflict (id) do nothing;

drop trigger if exists app_access_settings_set_updated_at on public.app_access_settings;
create trigger app_access_settings_set_updated_at
before update on public.app_access_settings
for each row
execute function public.set_current_timestamp_updated_at();

-- Emails are stored trimmed and lowercased so lookups never depend on how they were typed.
create table if not exists public.access_allowlist (
  email text primary key check (email = lower(btrim(email)) and email like '%_@_%'),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);

-- Users never touch these tables directly: RLS with no policies, and no table privileges. The
-- hook below and the admin functions (security definer) are the only way in.
alter table public.app_access_settings enable row level security;
alter table public.access_allowlist enable row level security;
revoke all on public.app_access_settings from anon, authenticated;
revoke all on public.access_allowlist from anon, authenticated;

-- Runs before Supabase Auth creates any user (never on sign-in of an existing one). Returning
-- '{}' allows the sign-up; an error object rejects it, and the OAuth redirect then carries
-- error=access_denied&error_description=not_invited (403), which /auth/callback maps to a
-- friendly page. Anonymous users pass: production has anonymous sign-ins disabled and E2E uses them.
create or replace function public.before_user_created_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  candidate_email text := lower(btrim(coalesce(event -> 'user' ->> 'email', '')));
  access_mode text;
begin
  if coalesce((event -> 'user' ->> 'is_anonymous')::boolean, false) then
    return '{}'::jsonb;
  end if;

  select s.mode into access_mode from public.app_access_settings s where s.id;

  -- A missing settings row fails closed, like invite_only.
  if access_mode = 'open' then
    return '{}'::jsonb;
  end if;

  if candidate_email <> ''
    and exists (select 1 from public.access_allowlist a where a.email = candidate_email) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object('http_code', 403, 'message', 'not_invited')
  );
end;
$$;

revoke execute on function public.before_user_created_hook(jsonb) from public, anon, authenticated;
grant execute on function public.before_user_created_hook(jsonb) to supabase_auth_admin;
