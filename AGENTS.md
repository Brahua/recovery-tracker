<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# recovery-tracker (Recovery Ritual)

Spanish, mobile-first knee rehab tracker. Production: https://recovery-tracker.brahua.com

Read first when resuming: `docs/HANDOFF.md` (exact status, work in flight and machine limits), then `RECAP.md`, `docs/deployment.md`, `tasks/todo.md` and the spec of the feature in progress.

## Rules

- Code, file names, commits: **English**. UI copy, specs, docs: **Spanish**.
- Node 24 (`.nvmrc`) + npm. Run `nvm use` first.
- Before committing: `npm run format && npm run lint && npm run design:check && npm run typecheck && npm test`. CI runs `npm run format:check`; `next build` and E2E run in CI.
- **Machine limits:** on the owner's PC do not run Docker (local Supabase), `next build` or E2E unless the
  owner asks for it in that session; it has hung the machine before. `npm run dev` is fine when asked.
- GitHub: personal account `Brahua` only (`gh auth switch -u Brahua` if another account is active).

## Workflow (trunk-based)

- One short-lived branch per change: `feat/…`, `fix/…`, `chore/…`, `docs/…`. Open a PR against `main`.
- Merge only with CI green. Every push to `main` re-runs CI in `.github/workflows/ci-cd.yml`, and the
  `deploy` job migrates the production Supabase project and publishes to production **only if all checks pass**.
- Vercel's Git auto-deploy is disabled (`vercel.json`); GitHub Actions is the only deployer.
- There is a single hosted environment: production (Supabase `pevrupenrzueyzidfeah`, formerly "staging").
  It holds real data. Tests (unit and E2E) run against a throwaway local Supabase, never production.
- Migrations are additive; anything destructive needs the owner's OK and a backup first.

## Styles

- CSS lives in `src/design-system/styles/` (see `src/design-system/README.md`); `src/app/globals.css` only imports it,
  and the import order is the cascade order.
- No literal colors, easings or font stacks outside `src/design-system/styles/tokens/`: `npm run design:check` (also in CI).
- CSS refactors must prove the compiled stylesheet is unchanged: `npm run -s css:compare -- compare <baseline> [--resolve]`.
