# Plan: registro de la mañana y meta de sesiones

Spec: `docs/specs/morning-checkin-and-daily-goal-spec.md` (aprobada por el owner el 2026-11-16).
Tareas: `tasks/todo-morning-checkin.md`.

## Enfoque

Dos rebanadas verticales que se pueden publicar por separado, en este orden:

1. **Meta de sesiones** (fase 1). No depende del registro de la mañana: el cierre nocturno sigue existiendo, pero deja de ser necesario para completar el día. Al terminar esta fase, la app ya resuelve la parte más visible del problema.
2. **Registro de la mañana** (fase 2). Tabla nueva, formulario, Hoy, Historial, Insights, Reporte, recordatorios y demo. Al terminar, el cierre nocturno desaparece de la UI nueva (los viejos se siguen viendo y editando).
3. **Documentación** (fase 3).

Toda la lógica de fechas y metas va en funciones puras de `src/lib/` con tests de Vitest; las pantallas solo muestran lo que devuelven.

## Componentes y dependencias

```
session-goal (preferencia + cálculo)          morning_checkins (migración + tipos + repo)
   ├─ Ajustes / onboarding                         ├─ formulario + Registrar
   ├─ Hoy (tarjeta, semana)                        ├─ Hoy (tarjeta "¿Cómo amaneciste?", racha)
   ├─ mensajes de Registrar                        ├─ Historial
   ├─ Reporte (adherencia)                         ├─ Insights / dashboard / Reporte (alinear D-1)
   └─ recordatorio de sesión ────────────────┐     ├─ recordatorio de la mañana
                                             └──── └─ demo + e2e
```

- La fase 2 usa la meta de la fase 1 (Hoy y recordatorios), así que va después.
- Dentro de la fase 2, la migración y el repositorio (M1) bloquean todo lo demás; Historial (M4) e Insights/Reporte (M5) son independientes entre sí.

## Decisiones técnicas

- **Meta:** `user_metadata.session_goal = { perDay, daysPerWeek }`, leída con un parser tolerante (como `appearance.ts` y `condition.ts`). Clave propia: `saveAppearanceAction` reemplaza `preferences` entero y la borraría.
- **Semana:** `getRecoveryWeekKeys` (lunes a domingo, Lima). La adherencia del Reporte usa solo semanas completas dentro del periodo.
- **Registro de la mañana:** tabla `morning_checkins` (RLS de 4 políticas, `unique (user_id, date)`, `rebound_pain_level` nullable). Repositorio con `list/get/create/update/delete` igual que los cierres. Se pide en `/registrar?mode=morning` y se edita en `/registrar/manana/[id]`.
- **Fuentes combinadas:** una función pura convierte cierres viejos y registros de la mañana a una forma común de "señales del día" (`DailySignal`: fecha, origen, dolor, sueño, rebote con la fecha de la sesión a la que responde, rigidez). Insights, dashboard y Reporte consumen esa forma, en vez de leer cada tabla por separado.
- **Recordatorios:** el dispatcher lee `rehab_sessions` de la semana (no solo de hoy), `morning_checkins` de hoy y la meta de cada usuario con recordatorios activos (`auth.admin.getUserById`, con `service_role`; son pocos usuarios). `closeout_enabled/closeout_time` se reutilizan para la mañana; una hora guardada después de las 12:00 se interpreta como 08:00 en la app hasta que el usuario la cambie.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Errores de fecha al alinear rebote D-1 y sueño D-1→D | Funciones puras con tests de fechas en Lima, cambio de mes y semana; ninguna pantalla calcula fechas |
| El dispatcher hace una llamada de admin por usuario | Pocos usuarios; se limita a los que tienen push y un recordatorio pendiente |
| Migración y E2E no se pueden correr en la PC del owner | Se validan en CI en cada PR; en la PC solo typecheck, lint, design:check y unitarios |
| `npm run demo:reset` escribe en producción | Se ejecuta solo con el OK del owner, después del deploy de la fase 2 |
| Romper la edición de cierres viejos | E2E dedicado (`edit-records.spec.ts`) se mantiene y se amplía |

## Entregas (PRs)

| PR | Tareas | Resultado visible |
|---|---|---|
| 1 | G1–G3 | Meta configurable; Hoy y Registrar la usan |
| 2 | G4–G5 | Recordatorio de sesión según la meta; adherencia en el Reporte |
| 3 | M1–M3 | Registro de la mañana guardable y visible en Hoy |
| 4 | M4–M5 | Historial, Insights y Reporte con ambas fuentes |
| 5 | M6–M8 | Recordatorio de la mañana, textos, demo y e2e finales |
| 6 | D1 | Documentación |

## Checkpoints

- **A (tras PR 2):** con meta 1×7, una sesión completa el día sin cierre; con meta 2×5 se ven "1 de 2" y "k de 5 días"; el recordatorio de sesión respeta la meta. CI en verde y deploy.
- **B (tras PR 5):** el cierre nocturno ya no se ofrece; el registro de la mañana funciona de punta a punta; los cierres viejos siguen visibles y editables; Insights y Reporte combinan ambas fuentes. CI en verde y deploy.
- **C (tras PR 6):** HANDOFF, RECAP, CHANGELOG y la spec marcados como entregados.
