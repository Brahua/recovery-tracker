# ADR-002: Use Google Login with Supabase Auth

## Status

Accepted

## Date

2026-07-08

## Context

Recovery Ritual will store real personal recovery data. Even though the MVP starts as a personal single-user app, the data is sensitive enough that write access should not be open or protected only by deployment obscurity.

The preferred login experience should also be low-friction on mobile. A separate email/password account flow adds setup friction and password management overhead. Google login is more convenient for the initial user and still gives the app a clean path toward future multiuser support.

## Decision

Use **Supabase Auth with Google as the primary login method** for the MVP.

The database schema should include `user_id` ownership columns from the start, and Row Level Security should be designed so users can only access their own recovery records.

## Alternatives Considered

### Google Login with Supabase Auth

- Pros:
  - Lowest-friction login for the intended user.
  - Avoids building password reset and credential management flows.
  - Works naturally with Supabase Auth and future Row Level Security.
  - Prepares the app for future multiuser support without making the MVP multiuser-focused.
- Cons:
  - Requires Google OAuth provider setup.
  - Slightly more configuration than a no-auth prototype.
  - Local development needs redirect URL configuration.
- Accepted because usability and data protection matter from the first real-data version.

### Email/Password Auth

- Pros:
  - Common and straightforward.
  - Does not require third-party OAuth provider setup.
- Cons:
  - More friction for a personal daily-use app.
  - Requires password reset and credential UX.
  - Worse mobile experience than Google login for this use case.
- Rejected for MVP.

### No Auth / Private Deployment Only

- Pros:
  - Fastest possible setup.
  - Fewer moving parts.
- Cons:
  - Risky for real health-adjacent personal data.
  - Makes future RLS/user ownership migration more annoying.
  - Does not match the requirement for real persistence with reasonable privacy.
- Rejected.

## Consequences

- The scaffold should include Supabase Auth setup and Google OAuth callback handling.
- Database tables should include `user_id` linked to Supabase auth users.
- RLS policies should protect rehab sessions, session exercises, and nightly closeouts by `user_id`.
- UI should provide a simple Google sign-in screen and a sign-out action.
- App routes that show or mutate recovery data should require an authenticated user.
- The MVP remains personal/single-user in product scope, but technically supports more than one user safely.

## Follow-Up Work

- Configure Google OAuth provider in Supabase.
- Add local and deployed redirect URLs.
- Add `.env.example` entries for Supabase URL and anon key.
- Document any Supabase dashboard setup steps needed during scaffold.
