# Deployment (CI/CD → Vercel · Supabase staging)

Automated pipeline: **GitHub Actions** runs quality gates on every push/PR to
`main`, and deploys to **Vercel** (pointing at **Supabase staging**) on push to
`main`. Vercel's native Git auto-deploy is disabled (`vercel.json`) so GitHub
Actions is the single deployer — no double deploys.

- Workflow: `.github/workflows/ci-cd.yml`
- Spec / plan / tasks: `tasks/spec-ci-cd-vercel.md`, `tasks/plan-ci-cd-vercel.md`, `tasks/todo-ci-cd-vercel.md`
- Live staging URL: https://recovery-tracker-brahua-lab.vercel.app
- Vercel project: `brahua-lab/recovery-tracker`
- Supabase staging ref: `pevrupenrzueyzidfeah` (`recovery-tracker-staging`)

## Pipeline

```
push/PR → main ─┬─ quality  (lint · typecheck · vitest)
                └─ e2e      (Supabase local in Docker · Playwright e2e:critical)
                              │
push → main only ─────────────┴─ deploy
                                   1. supabase db push  → staging migrations
                                   2. vercel pull / build / deploy --prod
```

E2E always runs against **local Supabase** spun up in the runner — never against
staging. Migrations are applied to staging only in the `deploy` job, before the
Vercel deploy.

## Required GitHub Secrets

Repo → Settings → Secrets and variables → Actions:

| Secret | Purpose |
|---|---|
| `VERCEL_TOKEN` | Vercel CLI auth (https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel scope (`team_…`) |
| `VERCEL_PROJECT_ID` | Vercel project (`prj_…`) |
| `SUPABASE_ACCESS_TOKEN` | `supabase link` / `db push` auth |
| `SUPABASE_DB_PASSWORD` | Staging DB password for `db push` |

## Required Vercel env vars (project → Settings → Environment Variables)

All must be type **`encrypted`** (NOT `sensitive` — sensitive vars are not
readable at build time, so `NEXT_PUBLIC_*` values would break the build):

| Var | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pevrupenrzueyzidfeah.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | staging publishable key (`sb_publishable_…`) |
| `NEXT_PUBLIC_SITE_URL` | `https://recovery-tracker-brahua-lab.vercel.app` |

## Deployment protection

Vercel Authentication (SSO protection) is **disabled** so the staging URL is
publicly reachable. Real security is handled by the app's Supabase/Google auth.

## Manual deploy (bootstrap / debugging)

Mirrors what CI runs:

```bash
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```
