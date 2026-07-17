# Claude Design Reference: Recovery Tracker

## Status

Canonical design inventory received on 2026-07-15. All 19 selected artifacts are implemented across the shared design system and nine responsive product surfaces. Browser comparison, reduced-motion handling, responsive review, and regression coverage are complete; the product entered a one-week field trial on 2026-07-16.

## Project Access

- Project ID: `74a9f44b-7927-4c4c-85a3-4424c2f105d8`
- MCP endpoint: `https://api.anthropic.com/v1/design/mcp`
- Authentication command: `/design-login`
- Import instruction: open the linked project file and implement the exact `.dc.html` artifact named below.

## Canonical References

| Surface | Viewport | Artifact | Claude Design project |
| --- | --- | --- | --- |
| Design system | Shared | `Recovery Tracker Design System.dc.html` | [Open design system](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Design+System.dc.html) |
| Landing | Desktop | `Recovery Tracker Landing Desktop.dc.html` | [Open desktop design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Landing+Desktop.dc.html) |
| Landing | Mobile | `Recovery Tracker Landing.dc.html` | [Open mobile design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Landing.dc.html) |
| Registrar: Cierre | Desktop | `Recovery Tracker Registrar Cierre Desktop.dc.html` | [Open desktop design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Registrar+Cierre+Desktop.dc.html) |
| Registrar: Cierre | Mobile | `Recovery Tracker Registrar Cierre.dc.html` | [Open mobile design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Registrar+Cierre.dc.html) |
| Registrar: Sesion | Desktop | `Recovery Tracker Registrar Sesion Desktop.dc.html` | [Open desktop design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Registrar+Sesion+Desktop.dc.html) |
| Registrar: Sesion | Mobile | `Recovery Tracker Registrar Sesion.dc.html` | [Open mobile design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Registrar+Sesion.dc.html) |
| Insights | Desktop | `Recovery Tracker Insights Desktop.dc.html` | [Open desktop design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Insights+Desktop.dc.html) |
| Insights | Mobile | `Recovery Tracker Insights.dc.html` | [Open mobile design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Insights.dc.html) |
| Reporte | Desktop | `Recovery Tracker Reporte Desktop.dc.html` | [Open desktop design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Reporte+Desktop.dc.html) |
| Reporte | Mobile | `Recovery Tracker Reporte.dc.html` | [Open mobile design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Reporte.dc.html) |
| Dia cerrado | Desktop | `Recovery Tracker Dia Cerrado Desktop.dc.html` | [Open desktop design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Dia+Cerrado+Desktop.dc.html) |
| Dia cerrado | Mobile | `Recovery Tracker Dia Cerrado.dc.html` | [Open mobile design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Dia+Cerrado.dc.html) |
| Sesion guardada | Desktop | `Recovery Tracker Sesion Guardada Desktop.dc.html` | [Open desktop design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Sesion+Guardada+Desktop.dc.html) |
| Sesion guardada | Mobile | `Recovery Tracker Sesion Guardada.dc.html` | [Open mobile design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Sesion+Guardada.dc.html) |
| Hoy | Desktop | `Recovery Tracker Hoy Desktop.dc.html` | [Open desktop design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Hoy+Desktop.dc.html) |
| Hoy | Mobile | `Recovery Tracker Hoy.dc.html` | [Open mobile design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Hoy.dc.html) |
| Historial | Desktop | `Recovery Tracker Historial Desktop.dc.html` | [Open desktop design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Historial+Desktop.dc.html) |
| Historial | Mobile | `Recovery Tracker Historial.dc.html` | [Open mobile design](https://claude.ai/design/p/74a9f44b-7927-4c4c-85a3-4424c2f105d8?file=Recovery+Tracker+Historial.dc.html) |

## Implementation Order

Each increment must preserve the current product behavior and finish with a mobile/desktop comparison against its references.

1. [x] Design system: extract tokens, typography, icons, controls, surfaces, spacing, motion, and responsive rules.
2. [x] Hoy: apply the system to the authenticated shell, primary navigation, status hero, and next-action hierarchy.
3. [x] Registrar: Sesion: implement the session form and responsive interaction details.
4. [x] Sesion guardada: implement the session completion state and onward navigation.
5. [x] Registrar: Cierre: implement the nightly closeout form and responsive interaction details.
6. [x] Dia cerrado: implement the closeout completion state and onward navigation.
7. [x] Insights: implement analytical cards, charts, empty states, and responsive layout.
8. [x] Reporte: implement date controls, summaries, notes, and responsive layout.
9. [x] Landing: implement the signed-out mobile and desktop compositions after shared visual primitives stabilize.
10. [x] Historial: implement the responsive read-only timeline, session accordion, exercise sets, and separate closeout cards from the mobile and desktop references.

## Per-Screen Definition of Done

- The mobile and desktop references have both been inspected before implementation.
- Existing data, validation, authentication, and save behavior remain intact.
- Intermediate widths are intentionally responsive rather than a literal interpolation of two screenshots.
- Keyboard focus, semantic labels, contrast, reduced motion, loading, error, and empty states are covered even when absent from the visual reference.
- `npm run lint`, `npm run typecheck`, relevant tests, and `npm run build` pass.
- The result is compared in a real browser at representative mobile and desktop widths before the increment is marked complete.

## Interpretation Rules

- Claude Design is the visual source of truth; the product spec and existing behavior remain the functional source of truth.
- Reuse shared primitives instead of reproducing each screen with isolated CSS.
- Do not copy generated application logic blindly. Adapt the visual structure to the existing Next.js routes and server actions.
- Record any deliberate deviation from a reference in this document before marking that screen complete.

## Deviations

- **Hoy mobile navigation:** the persistent bottom navigation from the earlier UX plan is omitted because the selected Hoy reference does not include it. Desktop keeps the full primary sidebar; mobile uses the screen CTAs and preview links until each destination receives its reference-specific navigation.
- **Milestone model:** the reference's physiotherapy appointment milestone is represented as progress toward 30 days with recorded activity. The product has no appointment data model, so inventing a consultation date would be misleading.
- **Sign-out access:** desktop includes an accessible sign-out action in the user row even though it is not prominent in the reference. Mobile sign-out remains outside the Hoy composition until account navigation is designed.
- **Small muted text:** auxiliary text contrast was increased slightly from the reference palette so the implemented screen meets WCAG AA.
- **Registrar Sesion domain options:** the implementation keeps the product's 6 session types, 10 canonical exercise shortcuts, and complete 1-5 perceived-load scale. The reference shows only 3 types, 8 illustrative exercises, and 3 load buckets; removing persisted domain values would be a functional regression.
- **Registrar Sesion context:** the prototype's fictional "Dia 24" and hard-coded recent sessions are replaced with the actual local date/time and the authenticated user's recent records.
- **Registrar Sesion completion:** saving continues through the existing server action and redirects to the dedicated Sesion Guardada state. The prototype's unused in-page success overlay is not reproduced because the next approved artifact owns that moment.
- **Sesion Guardada metrics:** the fictional 18-minute duration, 8/8 exercise count, "Dia 24" label, and claim of three improving sessions are replaced with the persisted session type, actual exercise count, real pain delta, local session date, and the server-generated summary.
- **Sesion Guardada reminder:** the reference says a 22:30 notification will be sent, but no notification system exists. The implementation invites the user to close the day later without promising an unscheduled reminder.
- **Sesion Guardada streak:** dots and copy use the calculated logging streak. They do not claim a personal record because historical best-streak data is not currently modeled.
- **Registrar Cierre domain scales:** the implementation keeps all 5 energy values, 4 rebound levels, 5 sleep-quality values, and the validated 0-24 hour range. The reference reduces these to three qualitative choices and caps sleep at 14 hours; adopting that would remove valid persisted inputs.
- **Registrar Cierre recap:** the desktop recap uses the latest persisted session's exercise count and pain response rather than the fictional 8/8 and 18-minute values. When no session exists, it explicitly says the closeout can still be recorded.
- **Registrar Cierre context:** fictional day numbers and hard-coded recent closeouts are replaced with the current local date/time and authenticated user's records.
- **Dia Cerrado context:** the fictional "Dia 24", fixed 8/8 count, fixed pain value, and fixed seven-day streak are replaced with the persisted ritual times, actual exercise count, end-of-day pain, and calculated logging streak. The title omits a recovery-day number because that concept is not currently modeled.
- **Dia Cerrado summary:** after a real save, the deterministic server-generated closeout summary replaces the prototype's fixed subtitle so the existing recovery feedback is preserved.
- **Dia Cerrado incomplete fallback:** a closeout can be persisted without a same-day session. In that case the screen truthfully presents one of two rituals completed, keeps the ring at 50%, and links to session registration instead of claiming that nothing remains pending.
- **Insights time context:** the prototype's "Semanas 1-4 desde la cirugia" is replaced with "Ultimas 4 semanas" because the product does not store a surgery date. The "Todo" option loads the authenticated user's complete persisted history and is functional rather than a visual-only toggle.
- **Insights chart data:** all fictional pain, session, rebound, sleep, and exercise series are replaced with calculated values from persisted records. One-point pain series render horizontally to avoid implying a trend, and insufficient sleep/history samples use explicit empty states.
- **Insights summary:** the deterministic observational rules remain the source of the highlighted summary instead of the prototype's fixed improvement claims.
- **Insights contrast:** axis labels, range context, and the trend badge use slightly brighter local tones than the reference so small text meets WCAG AA.
- **Reporte date context:** the prototype's surgery and appointment dates are not modeled. The header shows the selected report window, and the controls provide functional 30-, 14-, and 7-day ranges instead of a fictional "Desde cirugia" or non-functional custom picker.
- **Reporte content:** all summary counts, pain evolution, high-pain days, session response, rebound associations, sleep/energy metrics, notes, and appointment questions come from persisted records and deterministic report rules rather than the populated demo.
- **Reporte export:** "Generar PDF" opens the browser's native print/PDF flow, and only checked appointment questions remain in print output. Sharing uses the Web Share API when available and copies the report URL otherwise; prototype alerts are not reproduced.
- **Reporte sparse data:** cards remain structurally stable with explicit empty states and a "Sin datos" status when the selected range has no records.
- **Landing hero image:** the reference's warm rehabilitation photography is represented by the generated, project-owned `public/images/recovery-athlete-hero.webp` asset rather than a remote stock dependency.
- **Landing preview:** the 68%, day/week, and streak card is explicitly an illustrative product preview for signed-out visitors; it is not presented as authenticated user data.
- **Landing demo access:** anonymous access remains development-only and is omitted from production. The approved secondary CTA maps to the existing auth-safe test action without weakening the server-side environment guard.
- **Landing contrast:** the preview eyebrow and medical disclaimer are slightly brighter than the reference so their 10px text meets WCAG AA.
- **Historial data:** fictional dates, sessions, exercise sets, and closeouts are replaced with the authenticated user's persisted records and Lima-local timestamps.
- **Historial navigation:** the mobile reference's five-tab pill is scoped to small screens, while the approved desktop reference uses the shared fixed sidebar with the authenticated user's real identity and streak.
- **Historial pagination:** the prototype's previous-period control loads a real preceding 30-day window and resets the single-open session accordion to the newest session in that window.
- **Historial desktop contrast:** the period pill uses a slightly brighter muted tone than the reference so its 11.5px text meets WCAG AA.
