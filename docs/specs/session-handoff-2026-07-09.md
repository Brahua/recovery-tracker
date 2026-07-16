# Session Handoff - 2026-07-09

## Current State

- Frontend stack is **Next.js + React + TypeScript + Tailwind CSS**.
- Package manager is **npm**.
- Task 1 is complete: scaffold, lint, build, and dev server are working.
- Product placeholder page is in `src/app/page.tsx`.
- Product docs, ADRs, MVP spec, plan, and todo list are present and aligned with Next.js.

## Verified Today

- `npm run dev` starts successfully on `http://localhost:3000`.
- `npm run lint` passes.
- `npm run build` passes.

## Decisions Locked In

- Use Supabase directly for MVP persistence.
- Use Google login via Supabase Auth from the MVP.
- Keep the MVP responsive-web first; PWA is deferred.
- Use Claude Design to iterate key visual directions before final UI polish.

## Testing Direction

- **Vitest** for unit tests and schema validation tests.
- **React Testing Library** for component behavior tests.
- **Playwright** for a small number of critical end-to-end flows.

These tools are documented in `docs/specs/recovery-ritual-mvp-spec.md` but are **not installed yet**.

## Known Caveat

- `npm audit` reports 2 moderate vulnerabilities through `next` -> `postcss`.
- The suggested `npm audit fix --force` would introduce breaking changes, so it was not applied.

## Next Task

Continue with **Task 2** from `tasks/todo.md`:

- Define domain types in `src/types/recovery.ts`.
- Add exercise constants in `src/lib/constants/exercises.ts`.
- Add Zod validation schemas in `src/lib/validation/recovery.ts`.
- Start the first unit tests alongside those schemas and calculations.

## Files To Read First Next Session

- `README.md`
- `docs/specs/recovery-ritual-mvp-spec.md`
- `tasks/plan.md`
- `tasks/todo.md`
- `docs/decisions/ADR-001-use-supabase-direct-for-mvp-persistence.md`
- `docs/decisions/ADR-002-use-google-login-with-supabase-auth.md`
