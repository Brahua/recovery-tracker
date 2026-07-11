# Recovery Ritual Backlog

This backlog preserves strong ideas that are outside the first MVP. Items are intentionally framed with why they are deferred and what signal would justify bringing them forward.

## Product Directions Considered

### Recovery Quest

Recovery as a journey with levels, achievements, and a visual path.

- **Potential value:** Makes the app more motivating and memorable.
- **Why not full MVP:** Gamification can accidentally reward unsafe behavior if designed around intensity instead of consistency and recovery quality.
- **Keep for:** Light progress path, streaks, and achievements based on safe behaviors.
- **Reopen when:** The daily check-in habit works for at least 2 weeks.

### Athlete Cockpit

A premium sports-performance dashboard for pain, load, sleep, walking, and rebound.

- **Potential value:** Makes recovery feel active and measurable instead of passive.
- **Why not full MVP:** A dense dashboard is not useful until enough data exists.
- **Keep for:** Initial load, trend, readiness, and rebound views.
- **Reopen when:** There are 2-4 weeks of consistent entries.

### Doctor Briefing Machine

Reports designed specifically for doctor and fisio appointments.

- **Potential value:** Directly supports the goal of more fruitful appointments.
- **Why not full MVP:** Report quality depends on knowing which data points matter most in real appointments.
- **Keep for:** Simple weekly/monthly summary and questions list.
- **Reopen when:** The first real appointment report is used and reviewed.

### Pattern Detective

The app actively surfaces possible correlations and hypotheses.

- **Potential value:** Helps identify relationships between sleep, load, exercises, and pain.
- **Why not full MVP:** Pattern detection can become noisy or misleading with little data.
- **Keep for:** Simple rule-based insights.
- **Reopen when:** At least 30 days of data are available.

### Body Map + Timeline

A visual knee map plus timeline showing where pain appears and how it changes.

- **Potential value:** Highly visual, differentiated, and useful for medical conversations.
- **Why not full MVP:** Needs careful UX and data modeling to avoid becoming slow to log.
- **Keep for:** Basic pain zone chips in v1.
- **Reopen when:** Pain location becomes a frequent medical discussion point.

### Coach Companion

A supportive assistant that helps interpret progress, prepare questions, and maintain consistency.

- **Potential value:** Increases motivation and reduces the feeling of navigating recovery alone.
- **Why not full MVP:** Tone and medical boundaries need careful handling.
- **Keep for:** Encouraging completion states and appointment-prep prompts.
- **Reopen when:** The product has enough data to summarize without pretending to diagnose.

## Future Feature Backlog

| Feature | Priority | Why It Matters | Why Deferred | Validation Signal |
| --- | --- | --- | --- | --- |
| PWA installable app | High | Makes mobile daily use easier | Responsive web can validate first | User wants home-screen access after first prototype |
| Notifications/reminders | High | Supports habit formation | Can be annoying before timing is known | Missed entries are common |
| Body map | Medium | Makes pain location more visual | More UX work than chips | Pain location patterns become important |
| Exercise favorites | High | Speeds up post-therapy logging | Can start with free text | Repeated exercise entry feels tedious |
| Exercise library | Medium | Cleaner data and easier reports | Cataloging is scope-heavy | Favorites are not enough |
| Doctor/fisio PDF export | Medium | Useful for appointments | Summary screen may be enough first | Doctor/fisio asks for copy/shareable report |
| CSV export | Low | Useful for deeper analysis | Not core to daily use | Manual analysis becomes common |
| AI weekly summary | Medium | Saves time and improves insight quality | Needs enough data and medical guardrails | Rule-based summaries feel insufficient |
| AI question generator | Medium | Helps prepare appointments | Can start rule-based | Appointment preparation is used repeatedly |
| Apple Health/wearables | Low | Adds sleep, steps, HR data | Integration complexity | Manual sleep/walk tracking is unreliable |
| Multi-injury tracking | Low | Makes product more general | Personal knee recovery first | Other users request different injuries |
| Multiuser/accounts for others | Low | Enables broader product | Auth and privacy scope | External users are actively onboarded |
| Dark mode | Low | Comfort and polish | Not core validation | App is used frequently at night |
| Calendar view | Medium | Helps connect sessions and symptoms | Timeline may be enough | User asks "what happened that week?" often |
| Treatment timeline | Medium | Tracks meds, injections, therapy events | Could clutter MVP | Treatment effects are hard to remember |
| Load progression suggestions | Low | Could guide training decisions | Medically sensitive | Fisio wants to use app data collaboratively |

## Explicitly Parked Ideas

- **Automatic medical recommendations:** Do not build without professional review and clear medical disclaimers.
- **Pain-score competition or points for harder sessions:** This could push unsafe behavior.
- **Full social/community layer:** Not needed for the personal recovery use case.
- **Marketplace of routines or rehab plans:** Too far from the current problem.
- **Doctor portal:** Valuable only if multiple doctors/fisios engage with the app.

## Design Backlog

- Iterate key screen concepts in Google Stitch before final implementation.
- Animated completion moment after each ritual.
- Recovery path visualization with weekly milestones.
- Readiness or recovery state card.
- Streaks based on check-ins, not performance.
- Achievement badges for consistency, rest discipline, complete notes, and appointment preparation.
- Tactile sliders for pain and energy.
- Exercise chips and recent/favorite shortcuts.
- Weekly "story of the week" summary.
- Visual contrast between symptoms, load, sleep, and treatment events.
- Responsive mobile-first layout, then desktop dashboard expansion.

## Skills To Use Later

- **frontend-ui-engineering:** Use when building the first interface so it feels polished, accessible, and production-grade.
- **web-design-reviewer:** Use after a prototype is running to inspect visual quality, responsiveness, layout, and accessibility.
- **test-driven-development:** Use when implementing scoring, summaries, and insights so calculations stay reliable.
- **api-and-interface-design:** Use before finalizing the data model and public boundaries between UI, storage, and reporting.
