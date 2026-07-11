# ADR-001: Use Supabase Directly for MVP Persistence

## Status

Accepted

## Date

2026-07-08

## Context

Recovery Ritual needs real persistence from the start. The MVP is initially single-user, Spanish-first, and focused on proving the core recovery tracking loop:

- Post-therapy check-ins.
- Nightly closeouts.
- Dashboard trends.
- Medical appointment reports.

The project does not yet have an application scaffold, database schema, authentication, or deployment setup. The persistence choice should minimize setup overhead while still supporting a credible path to real user data, future auth, row-level security, and deployment.

## Decision

Use **Supabase directly** for MVP persistence.

The initial implementation should use Supabase/PostgreSQL as the backing store and keep application code behind a small repository/data-access layer so the UI does not depend on Supabase details directly.

## Alternatives Considered

### Supabase Direct

- Pros:
  - Fastest path to real persistence.
  - Managed PostgreSQL from the start.
  - Natural future path for auth and Row Level Security.
  - Good fit for a small personal MVP.
  - Fewer moving pieces than adding an ORM immediately.
- Cons:
  - Supabase client and query patterns can leak into app code if not contained.
  - Type generation and migrations need discipline.
  - More vendor coupling than a generic PostgreSQL abstraction.
- Accepted because it best matches MVP speed and real persistence needs.

### Prisma with PostgreSQL

- Pros:
  - Strong schema modeling and migrations.
  - Type-safe database access.
  - Less vendor-specific app code.
- Cons:
  - More setup and operational surface for the MVP.
  - Auth/RLS path is less direct if Supabase is still used underneath.
  - Adds an ORM before the domain complexity clearly needs it.
- Rejected for MVP. Reconsider if the schema grows, query complexity increases, or Supabase-specific code becomes constraining.

### Local Storage / Browser-Only Persistence

- Pros:
  - Very fast for UI prototyping.
  - No backend setup.
- Cons:
  - Does not satisfy the requirement for real recovery data.
  - Data loss risk.
  - Not suitable for medical appointment reporting over time.
- Rejected because persistence must be real from the start.

## Consequences

- The first scaffold should include Supabase environment configuration and `.env.example`.
- Database tables should include auth user ownership from the start.
- Data access should go through repository functions such as `createRehabSession`, `listRehabSessions`, `createNightlyCloseout`, and `listNightlyCloseouts`.
- UI components should not call Supabase directly.
- Auth is handled from the MVP through Google login with Supabase Auth. See `docs/decisions/ADR-002-use-google-login-with-supabase-auth.md`.
- Future migration to Prisma remains possible if Supabase access is contained behind the data layer.

## Follow-Up Work

- Define the initial Supabase schema for rehab sessions, session exercises, and nightly closeouts.
- Implement user-owned tables and RLS policies compatible with Google login through Supabase Auth.
- Add `.env.example` with required Supabase variables.
- Document Supabase setup commands once the app is scaffolded.
