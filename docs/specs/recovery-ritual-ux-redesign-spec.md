# Spec: Recovery Ritual UX Redesign and Claude Design Prompt Pack

## Status

Implemented and entering one-week field validation on 2026-07-16.

## Assumptions

1. This work is for the existing web app in `src/app/` and not for a native mobile app.
2. The core MVP behavior stays intact: Google auth, post-therapy check-in, nightly closeout, dashboard insights, and medical report.
3. The main problem to solve now is information architecture and product feel, not backend logic.
4. The redesign should be mobile-first and still scale cleanly to tablet and desktop.
5. Claude Design will be used as a visual exploration tool and prompt target, not as a source of production-ready code.
6. The signed-in flow should prioritize one next action at a time instead of exposing the full product on a single page.
7. Motivation should come from clarity, momentum, completion, and visible consistency, not from aggressive fitness gamification.
8. The current tone of the product remains Spanish-first, observational, and medically conservative.

## Objective

Redesign Recovery Ritual so the product feels focused, intuitive, and visually compelling without changing the MVP's core functionality.

The redesign must:

- break the current one-page experience into the right set of screens
- make the next action obvious in under 3 seconds on mobile
- feel premium, motivating, and habit-forming
- preserve the calm, trustworthy tone of a recovery product
- produce a reusable prompt pack for Claude Design so visual iterations can happen quickly and consistently

## Current Product Analysis

### What exists now

The current signed-in `/` route includes:

- `TodayOverview`
- `RecoveryDashboard`
- `MedicalReport`
- `PostTherapyForm`
- `NightlyCloseoutForm`

This means the product already contains at least five distinct jobs-to-be-done, but they are presented as one long stacked page.

### What is working

- The MVP logic is coherent.
- The visual baseline is already above average.
- The copy is product-aware and Spanish-first.
- The app already has a strong core loop: log session, close the day, review patterns.

### What is not working

- Too many product modes compete on the same screen.
- The main CTA loses force because multiple sections ask for attention at once.
- Dashboard and report content dilute the ritual feeling when shown before the user completes today's actions.
- The forms feel embedded inside a report page instead of feeling like primary rituals.
- Mobile scanning cost is too high because the user must move through several semantic layers in one vertical flow.

### Product conclusion

The issue is not "needs more visuals." The issue is that the MVP has already outgrown a one-page layout.

The correct next step is a screen-based product structure with contextual actions:

1. A focused `Hoy` home.
2. A dedicated `Registrar` flow for both rituals.
3. A dedicated `Insights` view for patterns.
4. A dedicated `Reporte` view for medical summaries.
5. A distinct signed-out landing/auth experience.

## Recommended Screen Distribution

## Screen 1: Signed-Out Landing

Purpose:
Explain the product value fast and convert into sign-in.

Primary content:

- emotional headline
- short benefit statement
- one strong CTA: `Entrar con Google`
- proof tiles: session logging, nightly closeout, trends, doctor report
- optional preview of the app visual direction

Why it should exist:
The current signed-out state is half landing, half scaffold notice. It should become a deliberate acquisition/warm-up screen.

## Screen 2: Hoy

Purpose:
Be the default signed-in screen and answer only one question first: what should I do now?

Primary content:

- today's status hero
- progress for the two daily rituals
- one dominant CTA based on current state
- secondary CTA for the other ritual
- compact "recent state" summary
- streak/consistency/momentum signal

Secondary content only:

- one short preview card for insights
- one short preview card for report

Why it should exist:
This is the motivational cockpit. It should feel like a ritual product, not a data wall.

## Screen 3: Registrar

Purpose:
Make logging feel fast, focused, and satisfying.

Structure:

- segmented switch or top tabs:
  - `Sesion`
  - `Cierre`
- keep each ritual on its own subview
- show only one form at a time
- sticky submit area on mobile when appropriate

Why it should exist:
The forms are core value creation. They should not compete with charts and reports.

## Screen 4: Insights

Purpose:
Answer recent pattern questions after data exists.

Primary content:

- pain trend
- weekly load
- rebound signal
- sleep vs pain
- frequent exercises
- short observational weekly story

Why it should exist:
This is analytical mode. It should be entered intentionally, not forced into the home ritual flow.

## Screen 5: Reporte

Purpose:
Help prepare for doctor or physio conversations.

Primary content:

- date-range switch
- average pain and trend
- high-pain days
- therapy response summary
- rebound associations
- sleep and energy summary
- highlighted notes
- appointment questions

Why it should exist:
This is a different mental mode from daily tracking. Separating it increases clarity and trust.

## Screen 6: Success / Completion States

Purpose:
Deliver reward and momentum after each ritual.

Format:

- lightweight confirmation state or modal sheet
- micro-summary
- "what next" CTA
- visual completion moment

Why it should exist:
This is where the dopamine comes from. The reward should come from completion, clarity, and progress.

## Navigation Recommendation

### Mobile-first navigation

Use a four-item bottom navigation for authenticated users:

- `Hoy`
- `Registrar`
- `Insights`
- `Reporte`

Rules:

- `Hoy` is the default route after sign-in.
- `Registrar` opens with the most relevant ritual preselected.
- If today's session is missing, `Registrar` defaults to `Sesion`.
- If the session exists but closeout is missing, `Registrar` defaults to `Cierre`.
- Success states should deep-link back into `Hoy` or into the next ritual.

### Desktop adaptation

- keep the same route model
- use a left rail or top nav instead of bottom nav
- preserve the mobile screen hierarchy instead of recombining everything into one page

## Experience Principles

- One screen, one job.
- The first screen must always answer "what do I do now?"
- Motivation comes from visible continuity, not from noisy gamification.
- Use bold typography, layered surfaces, and tactile controls.
- Reward completion and consistency only.
- Avoid medical-app coldness and avoid generic startup-dashboard energy.
- Make the user feel guided, never overwhelmed.

## Visual Direction

Desired tone:

- athletic recovery, not hospital
- premium habit product, not spreadsheet
- calm intensity, not hyperactive gamification
- tactile and cinematic, not cartoonish

Recommended visual ingredients:

- expressive typography with more personality than Geist
- strong hero moments on `Hoy`
- layered cards with depth and contrast
- subtle motion around progress and completion
- warm-organic palette with one energetic accent
- high legibility on mobile

Avoid:

- purple SaaS gradients
- generic wellness beige minimalism with no energy
- dense chart-first home screens
- trophy-heavy gamification
- excessive decorative animation

## Claude Design Deliverables

The Claude Design work should produce:

1. Landing screen concept
2. `Hoy` screen concept
3. `Registrar > Sesion` screen concept
4. `Registrar > Cierre` screen concept
5. `Insights` screen concept
6. `Reporte` screen concept
7. Success state concept after session save
8. Success state concept after nightly closeout save

## Claude Design Prompt Strategy

Each screen should be explored in three prompt rounds:

1. Structure prompt
2. Visual direction prompt
3. Polish/conversion prompt

Do not start with "make it beautiful." Start with information hierarchy and mobile behavior.

## Claude Design Prompt Pack

### Global base prompt

Use this as the common prefix for all screen prompts:

```text
Design a mobile-first web app screen for "Recovery Ritual", a premium Spanish-language recovery tracker for knee rehab after surgery. The app should feel motivating, calm, premium, and habit-forming. It is not a medical diagnosis app and should not feel clinical or cold. Avoid generic SaaS dashboard patterns and avoid purple gradients. Prioritize intuitive hierarchy, strong visual focus, bold but tasteful typography, layered cards, tactile controls, and emotionally rewarding completion states. The design should look native to a high-end mobile product while still being realistic for a responsive web app.
```

## Claude Design System Prompt Pack

Use these prompts to generate the shared visual language before or alongside screen exploration.

### Design System Base Prompt

```text
Create a UI design system for "Recovery Ritual", a premium Spanish-language recovery tracker for knee rehab after surgery. The product should combine athlete comeback energy with premium guided recovery calm. It should feel tactile, motivating, trustworthy, and emotionally rewarding without looking clinical, cold, childish, or like a generic SaaS dashboard.

Constraints:
- mobile-first responsive web app
- Spanish-first labels and component examples
- no purple gradients
- no dark-mode-first presentation unless explicitly shown as a secondary variant
- high readability, strong hierarchy, rounded surfaces, layered cards, calm premium color palette with one energetic accent
- suitable for recovery tracking, ritual logging, insights, and medical-summary screens

Output should be close to implementation quality and include reusable foundations, component states, and sample compositions.
```

### Prompt DS-1: Foundation Tokens

```text
[Design System Base Prompt]

Generate the foundational design system for this product.

Include:
- color system: background, surface, elevated surface, border, text, muted text, success, warning, error, accent, accent-soft
- spacing scale
- border radius scale
- shadow system
- typography system with display, heading, body, label, caption styles
- motion guidance for subtle completion and state changes
- icon style direction

Show the result as a clear design-system board with naming that feels production-ready for a responsive web app.
```

### Prompt DS-2: Core UI Kit

```text
[Design System Base Prompt]

Generate a reusable UI kit for Recovery Ritual using the established visual foundation.

Include:
- primary button
- secondary button
- ghost/subtle button
- segmented control
- tab item
- input field
- select field
- textarea
- checkbox row
- status chip
- metric card
- content card
- success banner
- error banner
- bottom navigation item

Show default, hover, focus, active, disabled, success, and error states where relevant. Keep everything mobile-first and realistic for implementation.
```

### Prompt DS-3: Form System

```text
[Design System Base Prompt]

Generate the form design language for Recovery Ritual.

Focus on:
- fast post-therapy logging
- calm nightly closeout logging
- compact field grouping
- large touch-friendly controls
- clear labels in Spanish
- low-friction validation and inline feedback
- sticky action area for mobile when useful

Include examples for:
- numeric/select inputs
- datetime/date inputs
- grouped exercise selection rows
- optional section treatment
- success/error inline states

The result should feel premium and lightweight, not like an enterprise admin form.
```

### Prompt DS-4: Navigation System

```text
[Design System Base Prompt]

Generate the navigation system for Recovery Ritual.

Include:
- mobile bottom navigation for Hoy, Registrar, Insights, Reporte
- desktop top navigation and/or left-rail adaptation
- active, inactive, hover, and focus states
- app header treatment for authenticated routes
- signed-out header treatment

The navigation should feel compact, premium, and consistent with a ritual-focused product. It must not overpower the content.
```

### Prompt DS-5: Card and Surface Language

```text
[Design System Base Prompt]

Generate the card system and surface language for Recovery Ritual.

Include:
- hero card
- ritual card
- insight card
- report summary card
- empty state card
- completion/success state card
- sticky side panel or supporting panel for large screens

Explore depth, layering, border treatment, background tone, and subtle gradients. Keep the system warm, calm, and premium with a tactile feel.
```

### Prompt DS-6: Data Visualization Style

```text
[Design System Base Prompt]

Generate the visual style guide for lightweight data visualization in Recovery Ritual.

Include:
- pain trend line chart
- weekly load bars
- sleep vs pain comparison cards
- rebound summary blocks
- exercise frequency bars

The charts should feel approachable, premium, and minimal. Avoid noisy dashboards, overly technical financial-chart styling, and unnecessary decoration.
```

### Prompt DS-7: State Library

```text
[Design System Base Prompt]

Generate a UI state library for Recovery Ritual.

Include:
- empty state
- loading state
- saved/success state
- validation error state
- signed-out state
- no-data-yet insight state
- completed-day state
- incomplete-day state

The goal is to keep the experience emotionally consistent across the product: calm, encouraging, premium, and clear.
```

### Prompt DS-8: Full UI Kit Board

```text
[Design System Base Prompt]

Create a complete UI kit board for Recovery Ritual that combines the visual foundations and the reusable components into one coherent design-system presentation.

Include:
- tokens
- typography
- colors
- spacing and radii
- buttons
- inputs
- segmented controls
- chips
- cards
- banners
- bottom navigation
- empty/success/error states
- sample mini-compositions for Hoy, Registrar, Insights, and Reporte

This board should be presentation-quality and close enough to implementation that an engineer/designer can use it as the practical reference for the product.
```

### Prompt 1A: Landing structure

```text
[Base prompt]

Create the signed-out landing screen. Mobile-first. The goal is to explain the product in under one screen and drive sign-in with Google.

Include:
- product headline in Spanish
- one-line value proposition
- one primary CTA for Google sign-in
- four compact benefit cards: log session, nightly closeout, trends, doctor report
- subtle preview of app credibility and visual energy

The layout should feel impactful and emotionally motivating, but still trustworthy. Make it feel like a product people want to open daily.
```

### Prompt 1B: Landing visual iteration

```text
[Base prompt]

Iterate the signed-out landing screen with a more cinematic and premium visual direction. Keep the same information hierarchy, but increase emotional pull. Use a stronger hero area, richer depth, a warmer athletic-recovery mood, and clearer CTA prominence. Keep it mobile-first and realistic.
```

### Prompt 2A: Hoy structure

```text
[Base prompt]

Create the main authenticated "Hoy" screen for a knee rehab tracking app. This is the default home screen after sign-in. The screen must answer "what should I do now?" in under 3 seconds.

Include:
- a hero card with today's status
- one dominant CTA
- one secondary CTA
- progress for the two daily rituals: session and nightly closeout
- a visible streak or consistency signal
- a compact recent state summary for latest session and latest closeout
- small previews for insights and medical report, but they must stay secondary

Do not show full forms, full dashboard charts, or full report content on this screen.
```

### Prompt 2B: Hoy motivation iteration

```text
[Base prompt]

Iterate the "Hoy" screen to feel more motivating and dopamine-inducing without becoming childish. Emphasize momentum, completion, progress, and confidence. Use stronger visual hierarchy, more tactile CTA treatment, and a premium progress language. Keep the app serious and grounded in recovery.
```

### Prompt 3A: Registrar sesion structure

```text
[Base prompt]

Create the mobile-first "Registrar" screen with the "Sesion" tab active. This screen is for a fast post-therapy check-in.

Include:
- top segmented control with "Sesion" and "Cierre"
- focused form layout for session logging
- clear grouping for date/time, session type, pain values, load, exercises, final state, and optional note
- compact recent sessions area kept visually secondary
- sticky or strongly visible save action

The form should feel fast, guided, and low-friction, not like a long admin form.
```

### Prompt 3B: Registrar sesion polish

```text
[Base prompt]

Iterate the "Registrar > Sesion" screen to improve perceived speed and tactile quality. Make selections feel easier on mobile, reduce visual fatigue, and create a stronger sense of forward flow toward completion. Keep the form compact and emotionally rewarding.
```

### Prompt 4A: Registrar cierre structure

```text
[Base prompt]

Create the mobile-first "Registrar" screen with the "Cierre" tab active. This screen is for the nightly closeout ritual.

Include:
- top segmented control with "Sesion" and "Cierre"
- focused form layout for end-of-day pain, energy, sleep hours, sleep quality, rebound level, and optional note
- compact recent closeouts area kept visually secondary
- clear save action

The experience should feel calm, fast, and lightweight, suitable for end-of-day use.
```

### Prompt 4B: Registrar cierre mood iteration

```text
[Base prompt]

Iterate the "Registrar > Cierre" screen so it feels calmer and more reflective than the session screen while staying in the same design system. Increase the sense of closure, softness, and end-of-day completion without making it sleepy or dull.
```

### Prompt 5A: Insights structure

```text
[Base prompt]

Create the mobile-first "Insights" screen for the recovery app. This screen is analytical mode, not home mode.

Include:
- pain trend
- weekly load
- rebound summary
- sleep versus pain
- frequent exercises
- short observational weekly summary

The screen should feel readable and premium, but not overloaded. Use card grouping and hierarchy so the user can scan patterns quickly on mobile.
```

### Prompt 5B: Insights readability iteration

```text
[Base prompt]

Iterate the "Insights" screen for maximum scanability on mobile. Reduce clutter, improve chart/card rhythm, and make analytical content feel approachable rather than dense. Keep the visual language premium and consistent with the rest of the product.
```

### Prompt 6A: Reporte structure

```text
[Base prompt]

Create the mobile-first "Reporte" screen for doctor or physio preparation.

Include:
- date range selector
- average pain and trend
- high-pain days
- session response summary
- rebound and exercise associations
- sleep and energy summary
- highlighted notes
- suggested questions for appointment

The screen should feel credible, concise, and easy to reference in a real conversation with a clinician.
```

### Prompt 6B: Reporte credibility iteration

```text
[Base prompt]

Iterate the "Reporte" screen to feel more trustworthy, concise, and consultation-ready. Increase clarity and information confidence. Avoid making it feel like a medical records system or a generic dashboard export.
```

### Prompt 7A: Session success state

```text
[Base prompt]

Create a mobile success state after saving a therapy session in Recovery Ritual.

Include:
- clear confirmation
- one short observational micro-summary
- a sense of reward and progress
- next-step CTA, ideally guiding to nightly closeout or back to Hoy

This should create a satisfying dopamine moment through completion and momentum, not through childish celebration.
```

### Prompt 7B: Nightly closeout success state

```text
[Base prompt]

Create a mobile success state after saving the nightly closeout in Recovery Ritual.

Include:
- clear confirmation
- sense of calm closure
- completed daily ritual feedback
- CTA back to Hoy or to view progress

The emotional tone should feel relieving, grounded, and rewarding.
```

## Tech Stack

- Next.js `16.2.10`
- React `19.2.4`
- TypeScript `5`
- Tailwind CSS `4`
- Supabase SSR/Auth stack already in repo
- Claude Design for visual exploration only

## Commands

Development:

```bash
npm run dev
```

Validation:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Project Structure

Current areas relevant to this redesign:

```text
src/app/                  App Router routes and layout
src/features/today/       Home / today experience
src/features/check-in/    Session and nightly logging flows
src/features/dashboard/   Insight cards and charts
src/features/reports/     Medical report UI
src/components/           Shared UI building blocks
src/app/globals.css       Global design tokens and motion
docs/specs/               Product and redesign specs
tasks/                    Plan and task breakdown
```

## Code Style

UI code should preserve the existing tone: server-first where possible, small feature boundaries, and explicit copy.

Example style:

```tsx
export function TodayHero({ title, primaryHref }: TodayHeroProps) {
  return (
    <section className="rounded-[30px] border p-6 sm:p-8">
      <h1 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
      <a className="rounded-2xl px-5 py-3 text-sm font-semibold" href={primaryHref}>
        Registrar sesion
      </a>
    </section>
  );
}
```

Conventions:

- Spanish-first user-facing copy
- one component per clear product responsibility
- avoid route-level screens that combine unrelated product modes
- keep visual tokens centralized
- prefer calm, explicit names like `TodayHero`, `InsightsPreview`, `ReportSummaryCard`

## Testing Strategy

This redesign phase is primarily product/UX architecture, but later implementation should verify:

- route-level navigation behavior
- mobile layout and bottom navigation behavior
- state-based CTA switching on `Hoy`
- form completion flows after route separation
- no regression in existing calculation and validation tests

Test levels:

- `vitest` for pure logic and state-selection helpers
- `playwright` for route flow and mobile UX regression
- manual browser review for visual quality and responsive behavior

## Boundaries

- Always: keep MVP behavior intact, preserve Spanish-first copy, keep medical language conservative, design mobile-first.
- Ask first: adding dependencies, changing auth flow, changing data model, introducing onboarding beyond light empty-state guidance.
- Never: collapse all signed-in product modes back into one long page, reward pain tolerance or unsafe training behavior, use Claude Design output as production code without adaptation.

## Success Criteria

- The signed-in product is restructured into distinct screens with clear jobs.
- `Hoy` becomes the single default screen for daily motivation and next action.
- Both ritual forms move into a dedicated logging surface.
- Insights and report become secondary intentional destinations.
- The Claude Design prompt pack is complete enough to generate all key screens consistently.
- The redesign direction clearly increases visual impact without increasing cognitive load.
- The resulting architecture is implementable inside the current Next.js App Router structure.

## Decisions After Review

- Authenticated mobile navigation keeps four main tabs: `Hoy`, `Registrar`, `Insights`, and `Reporte`.
- The visual tone should combine `athlete comeback` energy with `premium guided recovery` calm.
- Claude Design should generate layouts that are closer to implementation, but final product decisions still depend on product judgment and the existing functional MVP.

## Open Questions

- Should the landing screen target only the current single-user self-tracking case, or hint at a future broader audience?
