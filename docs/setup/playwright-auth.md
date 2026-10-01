# Playwright Auth Setup

The E2E suite uses Playwright `storageState`, but it does not automate Google OAuth.

Instead, in development and CI it signs in with a Supabase anonymous user during the setup project, always against the **local** Supabase stack (never production). Supabase documents that anonymous users are authenticated users and use the `authenticated` Postgres role, so RLS still applies.

References:

- https://playwright.dev/docs/auth
- https://supabase.com/docs/guides/auth/auth-anonymous
- https://supabase.com/docs/guides/troubleshooting/security-of-anonymous-sign-ins-iOrGCL

## Required Supabase setting

Anonymous sign-ins are enabled in the local stack by `supabase/config.toml` (`enable_anonymous_sign_ins = true`). Start it before running the suite:

```bash
npm run supabase:start
npm run supabase:env:local
```

Anonymous sign-ins stay **disabled** in the production project.

`playwright.config.ts` refuses to start unless `NEXT_PUBLIC_SUPABASE_URL` (process env or `.env*`) is the local stack, and only reuses an already-running server with `E2E_REUSE_SERVER=1`. `E2E_PORT` (default 3000) avoids clashing with another dev server.

Example without touching `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY from `npx supabase status`> \
E2E_PORT=3100 npm run e2e:critical -- --workers=1
```

On a loaded machine run with `--workers=1`: in parallel the specs share one anonymous user and time out.

## How the suite works

1. Playwright opens the app
2. The setup test clicks `Entrar anonimo para pruebas`
3. Supabase creates an authenticated anonymous user
4. Playwright stores that session in `playwright/.auth/user.json`
5. The main tests reuse that session

## Run the full suite

```bash
npm run e2e
```

## Run focused commands

```bash
npm run e2e:auth
npm run e2e:critical
```

## What is covered now

- Save a post-therapy session using shortcuts
- Verify success feedback
- Reload and verify persistence
- Save a session with a custom exercise only
- Verify the server-side validation error when no exercise is provided
- Accessibility: `tests/e2e/accessibility.spec.ts` logs a session and a closeout, then runs axe (WCAG 2.1 A/AA) with reduced motion on Hoy, Registrar (session and closeout), Historial, Insights, Reporte, Ejercicios, Nueva rutina and the signed-out landing. Part of `npm run e2e:critical`.
