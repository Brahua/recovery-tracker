# Recovery Ritual

## Problem Statement

How might we turn knee surgery recovery into a fast, visual, motivating daily ritual that helps detect real patterns and prepare better medical appointments without making tracking feel like clinical homework?

## Recommended Direction

Build Recovery Ritual around a post-therapy check-in plus a short nightly closeout. The habit is the product. If logging is fast, satisfying, and gives immediate feedback, the data will exist. If logging feels heavy, the analytics will not matter.

The experience should feel like a blend of premium fitness app, visual journal, and light game. Use tactile sliders, quick chips, completion animations, visible progress, and achievement moments. The content stays serious: pain, load, sleep, rebound, pain zones, therapy notes, and doctor/fisio questions.

The dashboard should not be a generic chart gallery. It should answer practical questions: am I improving, what irritates the knee, what changed this week, and what should I bring to my next appointment?

## Product Thesis

Recovery Ritual should combine:

- **Two-Minute Ritual:** protects the daily habit.
- **Athlete Cockpit:** makes progress, load, and readiness visible.
- **Doctor Briefing:** turns data into better appointments.
- **Light Recovery Quest:** adds motivation without rewarding unsafe overtraining.

## Key Assumptions to Validate

- [ ] A check-in under 2 minutes is enough for daily use. Test with a 7-day prototype.
- [ ] The most useful patterns can come from a small dataset: pain, sleep, load, rebound, and notes.
- [ ] Progress and achievement mechanics increase motivation without trivializing recovery.
- [ ] Doctor/fisio reports are more useful when they summarize changes, patterns, and questions than when they export raw data.

## MVP Scope

### Post-Therapy Check-In

- Session type.
- Pain before, during, and after.
- Main exercises performed.
- Perceived load.
- Quick note.
- Final state: better, same, or worse.

### Nightly Closeout

- End-of-day pain.
- Energy.
- Previous-night sleep.
- Rebound or delayed discomfort.
- Optional note.

### Initial Dashboard

- Pain trend over 7, 14, and 30 days.
- Weekly load.
- Sleep vs. pain.
- Post-session rebound.
- Check-in streak.
- Weekly recovery state.

### Medical Report

- Weekly or monthly summary.
- Exercises associated with rebound.
- Frequent pain zones or pain types.
- Suggested questions for the next doctor/fisio visit.

### Design Direction

- Mobile-first.
- Vital, tactile, and animated.
- Clear visual recovery path.
- Achievements for consistency, reflection, and better control.
- Avoid incentives that reward pushing through pain.

## Not Doing For MVP

- **Diagnostic AI:** risky and unnecessary early. Future AI should summarize and organize, not diagnose.
- **Exhaustive clinical record:** too many fields will hurt habit formation.
- **Wearables or Apple Health:** useful later, not needed to validate the core loop.
- **Multiuser support:** start with the real personal use case.
- **Complete exercise library:** begin with free-form or favorite exercises.
- **Automatic load progression:** medically sensitive. Show evidence for discussion instead.
- **Aggressive gamification:** the app should motivate consistency, not overtraining.

## Open Questions

- What does the doctor/fisio usually ask during appointments?
- Should the first version track only the affected knee or compare with the healthy knee?
- Which exact Spanish labels should be used for main navigation and ritual actions?

## Decisions Since Initial Draft

- First implementation uses real persistence from the start.
- UI language is Spanish.
- Rebound means delayed pain only for the MVP.
- First release is responsive web; PWA is deferred.
- Initial exercise shortcuts:
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
