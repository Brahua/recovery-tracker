# Spec: Recovery Ritual MVP

## Status

Accepted for implementation. Foundation scaffold is complete.

## Assumptions

1. The first version is a responsive web app in Spanish, optimized for mobile usage after therapy and at night.
2. The initial user is the project owner. Multiuser support is intentionally deferred.
3. The product must store real recovery data, but it must not provide medical diagnosis or treatment recommendations.
4. The MVP should prioritize habit formation and useful reports over exhaustive tracking.
5. Persistence should be real from the start. Local storage can be used only for temporary UI state, not as the primary recovery log.
6. PWA support is deferred until after the responsive MVP works.
7. Rebound tracking in the MVP means delayed pain only. Stiffness, inflammation, and sensitivity are deferred.
8. Authentication should use Google login through Supabase Auth from the MVP. See `docs/decisions/ADR-002-use-google-login-with-supabase-auth.md`.
9. Product scope remains single-user/personal first, but data tables should include user ownership from the start.
10. The implementation stack is scaffolded. Commands and base dependency versions are already established in `package.json`.

## Objective

Build the first usable version of Recovery Ritual: a recovery tracking app for knee surgery rehab that makes daily logging fast, visual, and motivating while producing useful summaries for doctor/fisio appointments.

The core user job:

> After a therapy session and at the end of the day, I want to quickly record how my knee responded so I can understand patterns, feel more in control, and bring clearer evidence to medical appointments.

## Success Criteria

- A post-therapy check-in can be completed in under 2 minutes.
- A nightly closeout can be completed in under 1 minute.
- The dashboard answers at least these questions:
  - Is pain trending up, down, or stable?
  - Did recent sessions cause rebound?
  - How does sleep relate to pain?
  - What changed this week?
- The medical report summarizes the last 7 or 30 days without raw-data overload.
- The UI feels vital, tactile, and motivating, without rewarding unsafe overtraining.
- All MVP flows work on mobile width first.

## Tech Stack Recommendation

Final stack should be confirmed during scaffold, but the current recommendation is:

- Next.js with React and TypeScript.
- Tailwind CSS for styling.
- shadcn/ui or equivalent accessible primitives for core components.
- Recharts or a similarly lightweight charting library for dashboard charts.
- Zod for validation schemas.
- React Hook Form for form workflows if form complexity justifies it.
- Supabase/PostgreSQL for persistence from the start, using Supabase directly for the MVP. See `docs/decisions/ADR-001-use-supabase-direct-for-mvp-persistence.md`.
- Supabase Auth with Google login from the MVP. See `docs/decisions/ADR-002-use-google-login-with-supabase-auth.md`.

Local mocked data is acceptable for isolated component development, but the app's primary flows should persist to the real database before the MVP is considered usable.

## Commands

Current commands:

```bash
npm run dev
npm run build
npm run lint
npm test
```

## Project Structure

Expected structure after scaffold:

```text
app/ or src/app/           Application routes
src/components/            Reusable UI components
src/features/check-in/     Post-therapy and nightly logging flows
src/features/dashboard/    Trends, insights, and summary cards
src/features/reports/      Medical report views
src/lib/                   Shared utilities, dates, calculations
src/types/                 Shared domain types
src/data/                  Data access layer or mock data during prototype
docs/ideas/                Product idea and backlog docs
docs/specs/                Product and implementation specs
tasks/                     Implementation plan and task list
```

## Core Experience

### 0. Auth

Purpose: protect real recovery data without making account setup feel heavy.

Content:

- Google login as the primary sign-in action.
- Simple signed-out state.
- Sign-out action available after login.
- Recovery data routes require an authenticated user.

Design notes:

- Keep auth minimal and fast.
- Do not build email/password flows in the MVP.
- Treat auth as a gateway to the ritual, not as a product surface.

### 1. Home / Today

Purpose: make the next useful action obvious.

Content:

- Current recovery day or week label.
- Main recovery state card.
- Primary action: `Log therapy session` when a session is expected or missing.
- Secondary action: `Nightly closeout`.
- Compact trend preview: pain, load, sleep, rebound.
- Streak or consistency indicator.

Design notes:

- This should be the most motivating screen.
- Avoid a generic analytics dashboard as the first screen.
- Use motion for completion and state changes, not constant decorative animation.

### 2. Post-Therapy Check-In

Purpose: capture the most important response data immediately after therapy.

Fields:

- Session date and time.
- Session type: home, fisioterapia, hidroterapia, gym, walk, other.
- Pain before session: 0-10.
- Pain during session: 0-10.
- Pain after session: 0-10.
- Perceived load: 1-5.
- Main exercises: free entry with recent/favorite shortcuts.
- Final state: better, same, worse.
- Notes: optional short text.

Completion feedback:

- Confirm the session was logged.
- Show one useful micro-summary, for example: "Pain ended 1 point lower than before" or "Track tonight to confirm rebound."
- Do not show medical advice.

### 3. Nightly Closeout

Purpose: capture delayed response and end-of-day state.

Fields:

- End-of-day pain: 0-10.
- Energy: 1-5.
- Previous-night sleep hours.
- Sleep quality: 1-5.
- Rebound pain since last session: none, mild, moderate, strong.
- Optional note.

Completion feedback:

- Update streak/progress.
- Show a calm closeout animation.
- Preview whether the day looks stable, improved, or irritated based on logged values.

### 4. Dashboard

Purpose: show patterns without requiring data-science interpretation.

MVP cards/charts:

- Pain trend over 7, 14, and 30 days.
- Weekly load total.
- Sleep vs. pain comparison.
- Rebound after sessions.
- Most frequent exercises in recent sessions.
- Weekly recovery story: short rule-based summary.

Rule examples:

- "Average pain is lower than last week."
- "Rebound appeared after 2 of the last 4 sessions."
- "Days under 6 hours of sleep had higher end-of-day pain."

Rules must be framed as observations, not medical conclusions.

### 5. Medical Report

Purpose: make appointments more productive.

Report sections:

- Date range.
- Average pain and trend.
- Highest-pain days.
- Recent therapy sessions and response.
- Exercises associated with rebound.
- Sleep and energy summary.
- Frequent pain notes if available.
- Questions to ask doctor/fisio.

MVP output can be an on-screen report. PDF export is deferred.

## Domain Model Draft

These are conceptual contracts, not final database schema.

```ts
type PainScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type Rating1To5 = 1 | 2 | 3 | 4 | 5;

type SessionType =
  | 'HOME'
  | 'PHYSIOTHERAPY'
  | 'HYDROTHERAPY'
  | 'GYM'
  | 'WALK'
  | 'OTHER';

type FinalState = 'BETTER' | 'SAME' | 'WORSE';
type ReboundLevel = 'NONE' | 'MILD' | 'MODERATE' | 'STRONG';

type ExerciseShortcut =
  | 'BICICLETA'
  | 'SENTADILLA_ESPANOLA'
  | 'TKE'
  | 'STEP_UP'
  | 'STEP_DOWN'
  | 'HIP_THRUST'
  | 'PESO_MUERTO_RUMANO'
  | 'CAMINATA_LATERAL_BANDA'
  | 'PROPIOCEPCION'
  | 'ESTIRAMIENTOS_SUAVES';

interface RehabSession {
  id: string;
  occurredAt: string;
  sessionType: SessionType;
  painBefore: PainScore;
  painDuring?: PainScore;
  painAfter: PainScore;
  perceivedLoad: Rating1To5;
  exercises: SessionExercise[];
  finalState: FinalState;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionExercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  notes?: string;
}

interface NightlyCloseout {
  id: string;
  date: string;
  endOfDayPain: PainScore;
  energy: Rating1To5;
  sleepHours: number;
  sleepQuality: Rating1To5;
  reboundPainLevel: ReboundLevel;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

Initial exercise shortcuts:

- Bicicleta 5-10 min.
- Sentadilla española.
- TKE.
- Step-up.
- Step-down.
- Hip Thrust.
- Peso muerto rumano.
- Caminata lateral con banda.
- Propiocepción.
- Estiramientos suaves.

## API / Data Boundary Draft

The UI should depend on domain-level functions, not directly on storage details.

```ts
interface RecoveryLogRepository {
  createRehabSession(input: CreateRehabSessionInput): Promise<RehabSession>;
  updateRehabSession(id: string, input: UpdateRehabSessionInput): Promise<RehabSession>;
  listRehabSessions(params: DateRangeParams): Promise<RehabSession[]>;

  createNightlyCloseout(input: CreateNightlyCloseoutInput): Promise<NightlyCloseout>;
  updateNightlyCloseout(id: string, input: UpdateNightlyCloseoutInput): Promise<NightlyCloseout>;
  listNightlyCloseouts(params: DateRangeParams): Promise<NightlyCloseout[]>;
}
```

Validation belongs at the boundary:

- Form submission validates inputs before save.
- Repository/data-access functions validate inputs again before persistence.
- Report and dashboard calculations consume already-validated domain objects.

## Design Principles

- Mobile-first, because logging happens near therapy and at night.
- Use rich interaction where it improves motivation or speed.
- Iterate important screen designs with Claude Design before or during UI implementation.
- Avoid generic purple-gradient AI-app styling.
- Use progress states and achievements for consistency, not performance intensity.
- Prefer chips, sliders, steppers, and recent shortcuts over long forms.
- Make charts readable before making them decorative.
- Support reduced motion for users who prefer it.
- Never use color alone to communicate pain or warning state.

## Testing Strategy

Initial testing should focus on calculation correctness and core flows:

- **Vitest:** unit tests for trend calculations, weekly summaries, rebound detection, date ranges, and Zod validation schemas.
- **React Testing Library:** component tests for form behavior and key UI states when components become complex enough to justify it.
- **Playwright:** a small set of end-to-end tests for critical flows such as Google login, post-therapy check-in, nightly closeout, and report access.
- Manual mobile checks at narrow widths before treating UI as done.
- Browser visual review once a working prototype exists.

## Boundaries

### Always

- Keep check-ins short.
- Validate user input at boundaries.
- Phrase insights as observations, not medical guidance.
- Preserve deferred ideas in the backlog instead of silently deleting them.
- Optimize the first screen for the next useful action.

### Ask First

- Adding AI-generated summaries.
- Adding dependencies beyond the agreed stack.
- Changing the domain model in ways that remove existing fields.
- Building multiuser/auth before the personal version is useful.
- Adding medical recommendation language.

### Never

- Claim diagnosis or treatment advice.
- Reward higher pain tolerance or pushing through pain.
- Store secrets in source files.
- Add large fields or flows to the daily ritual without rechecking the 2-minute target.

## Open Questions

1. What does the doctor/fisio usually ask that the app should prepare?
2. Which exact Spanish labels should be used for the main navigation and ritual actions?
3. What Claude Design outputs should be treated as source of truth: screenshots, exported code, or only visual direction?
