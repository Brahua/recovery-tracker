# Supabase Setup

Primary workflow for this project: hosted Supabase only.

Recommended environments:

1. `staging`
2. `prod`

Use `staging` for all app development and smoke tests. Treat `prod` as migration-only unless you are releasing.

## Hosted Workflow

1. Create a dedicated Supabase Cloud project for `staging`.
2. Create a second Supabase Cloud project for `prod`.
3. Copy `.env.example` to `.env.local`.
4. Put `staging` values in `.env.local`.
5. Run `npm run supabase:login`.
6. Run `npm run supabase:link`.
7. Run `npm run supabase:push:dry`.
8. Run `npm run supabase:push:linked`.
9. Configure Google OAuth in the linked project.
10. Verify login and data writes from the app.

Then repeat the link and push flow for `prod`.

## Optional Local Workflow

This repo still supports the local CLI stack, but it is not the recommended path right now.

1. Make sure Docker Desktop is healthy.
2. Run `npm run supabase:start`.
3. Run `npm run supabase:env:local`.
4. Run `npm run supabase:types` if needed.

## Current Local Runtime Blocker Seen Here

`supabase start` failed in this environment with a Docker storage error:

`commit failed ... metadata.db: input/output error`

That is a Docker runtime issue, not a repo issue.
