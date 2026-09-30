<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# recovery-tracker (Recovery Ritual)

Spanish, mobile-first knee rehab tracker. Production: https://recovery-tracker.brahua.com

Read first when resuming: `RECAP.md`, then `docs/deployment.md`, `tasks/todo.md` and the spec of the feature in progress.

## Rules

- Code, file names, commits: **English**. UI copy, specs, docs: **Spanish**.
- Node 24 (`.nvmrc`) + npm. Run `nvm use` first.
- Before committing: `npm run lint && npm run typecheck && npm test && npm run build`.
- GitHub: personal account `Brahua` only (`gh auth switch -u Brahua` if another account is active).

## Workflow (trunk-based)

- One short-lived branch per change: `feat/…`, `fix/…`, `chore/…`, `docs/…`. Open a PR against `main`.
- Merge only with CI green. Every push to `main` re-runs CI in `.github/workflows/ci-cd.yml`, and the
  `deploy` job migrates the production Supabase project and publishes to production **only if all checks pass**.
- Vercel's Git auto-deploy is disabled (`vercel.json`); GitHub Actions is the only deployer.
- There is a single hosted environment: production (Supabase `pevrupenrzueyzidfeah`, formerly "staging").
  It holds real data. Tests (unit and E2E) run against a throwaway local Supabase, never production.
- Migrations are additive; anything destructive needs the owner's OK and a backup first.
