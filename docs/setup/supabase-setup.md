# Supabase Setup

Two Supabase targets exist for this project:

| Target | Used for |
|---|---|
| **Local** (Supabase CLI in Docker) | Playwright E2E in CI; locally only on a machine that can run Docker (not the owner's PC unless asked) |
| **Production** (hosted, ref `pevrupenrzueyzidfeah`, formerly `staging`) | The live app at https://recovery-tracker.brahua.com; real data |

There is no separate staging project anymore (see `docs/decisions/ADR-004-promote-staging-to-production.md`).
Migrations reach production only through the `deploy` job in `.github/workflows/ci-cd.yml` (see `docs/deployment.md`).

## Local Workflow (Docker)

1. Make sure Docker Desktop is healthy.
2. Run `npm run supabase:start` (applies every migration in `supabase/migrations/` and `supabase/seed.sql`).
3. Run `npm run supabase:env:local` to write the local URL and keys into `.env.local` (this overwrites it; back it up if it points at production). Alternatively export `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the shell: process env wins over `.env.local`.
4. Run `npm run dev`. The dev-only anonymous entry (`Entrar anonimo para pruebas`) works because `supabase/config.toml` enables anonymous sign-ins locally.
5. Run `npm run supabase:types` after schema changes, and `npm run supabase:reset` to start clean.

## Production (hosted)

Normally untouched by hand. When needed:

1. `npm run supabase:login`
2. `npm run supabase:link` → project ref `pevrupenrzueyzidfeah`
3. `npm run supabase:push:dry` to see pending migrations (read-only).

Avoid `npm run supabase:push:linked` from a laptop: let CI apply migrations after all checks pass.

Hosted-only settings (Dashboard):

- Authentication → URL Configuration: see `docs/deployment.md`.
- Authentication → Providers: Google enabled; **Email and Anonymous Sign-Ins disabled** (verified 2026-10-01).
- The CI access token expires around 2027-09-30; renewal steps in `docs/deployment.md`.

## Known local blocker

`supabase start` once failed here with a Docker storage error (`commit failed ... metadata.db: input/output error`). That is a Docker runtime issue, not a repo issue; restarting or resetting Docker Desktop fixes it.
