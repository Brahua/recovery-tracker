# Supabase Cloud Step By Step

The hosted Supabase project `pevrupenrzueyzidfeah` is **production** (it was created as `recovery-tracker-staging` and promoted on 2026-09-30; see `docs/decisions/ADR-004-promote-staging-to-production.md`). This guide records how it is configured, so it can be rebuilt if needed.

## 1. Project

- Supabase Cloud project, ref `pevrupenrzueyzidfeah`.
- Optional: rename it in Dashboard → Project Settings → General to `recovery-tracker` (the ref does not change).

## 2. Link The CLI

```bash
npm run supabase:login
npm run supabase:link   # project ref pevrupenrzueyzidfeah + database password
npm run supabase:push:dry
```

Migrations are applied by CI (`deploy` job), not from a laptop.

## 3. Google OAuth

In Supabase Dashboard → Authentication → Providers → Google: client ID and secret.

In Google Cloud Console, the OAuth client's authorized redirect URI is the Supabase callback shown in that provider screen (`https://pevrupenrzueyzidfeah.supabase.co/auth/v1/callback`). Changing the app domain does not require changes in Google.

## 4. URL Configuration

Dashboard → Authentication → URL Configuration:

- Site URL: `https://recovery-tracker.brahua.com`
- Redirect URLs: `https://recovery-tracker.brahua.com/**`, `https://recovery-tracker-brahua-lab.vercel.app/**` and, only if you log in locally against production, `http://localhost:3000/**`.

## 5. Anonymous Sign-Ins

Disabled in production. They are only for Playwright and are enabled in the local stack via `supabase/config.toml`.

## 6. App Environment

Production values live only in Vercel (see `docs/deployment.md`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://pevrupenrzueyzidfeah.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
NEXT_PUBLIC_SITE_URL=https://recovery-tracker.brahua.com
```

## 7. Smoke Test

After a deploy:

1. Open https://recovery-tracker.brahua.com and sign in with Google.
2. The callback returns to `/auth/callback` on the same domain and lands on `/`.
3. No auth redirect errors appear.
