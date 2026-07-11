# Supabase Cloud Step By Step

This is the recommended setup for this project.

## Target Shape

- One Supabase Cloud project for `staging`
- One Supabase Cloud project for `prod`
- Local app points to `staging`
- Migrations are promoted from git to `staging` first, then `prod`

## 1. Create The Projects

In Supabase Dashboard create:

1. `recovery-tracker-staging`
2. `recovery-tracker-prod`

Keep both project refs, URLs, and database passwords.

## 2. Configure Local App Against Staging

Create `.env.local` with the `staging` project values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-STAGING-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-STAGING-PUBLISHABLE-KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Authenticate The CLI

Run:

```bash
npm run supabase:login
```

This opens the Supabase CLI auth flow in the browser.

## 4. Link The Repo To Staging

Run:

```bash
npm run supabase:link
```

You will need:

- `staging` project ref
- `staging` database password

## 5. Preview The Migration

Run:

```bash
npm run supabase:push:dry
```

This shows what will be applied to the linked remote project.

## 6. Apply The Migration To Staging

Run:

```bash
npm run supabase:push:linked
```

This should apply:

- `supabase/migrations/20260709000000_recovery_log_foundation.sql`

## 7. Configure Google OAuth In Staging

In Supabase Dashboard:

1. Go to `Authentication` -> `Providers`
2. Enable `Google`
3. Add your Google client ID
4. Add your Google client secret

Allowed redirect URLs to configure in Supabase:

- `http://localhost:3000/auth/callback`
- your future deployed staging callback URL

## 8. Configure Google Console

In Google Cloud Console:

1. Create or reuse an OAuth client
2. Add the Supabase callback URL shown by the Google provider setup screen in Supabase
3. Add your app origins if requested by Google

The exact callback URL is provided by Supabase in the provider UI. Use that exact value.

## 9. Smoke Test Staging

Run the app:

```bash
npm run dev
```

Then verify:

1. Google login returns to `/auth/callback`
2. The session is visible on `/`
3. No auth redirect errors appear

## 10. Repeat For Production

When staging is verified:

1. Run `npm run supabase:link` again
2. Link to the `prod` project ref
3. Run `npm run supabase:push:dry`
4. Run `npm run supabase:push:linked`
5. Configure Google OAuth in `prod`
6. Use production env vars only in the production deployment

## Notes

- Keep `.env.local` pointed to `staging`.
- Do not use `prod` for day-to-day experiments.
- If later you want stronger isolation, add Supabase Branching on top of this workflow.
