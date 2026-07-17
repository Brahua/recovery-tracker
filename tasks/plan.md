# Implementation Plan: Historial de recuperación y series individuales

## Estado

Implementado y verificado en staging el 2026-07-16. Las cuatro fases y sus checkpoints están completos.

Especificación aprobada: `docs/specs/recovery-history-and-exercise-sets-spec.md`.

## Resumen

Agregar un historial cronológico de solo lectura y reemplazar los valores agregados de ejercicio por series individuales, conservando los datos existentes y separando con claridad el esfuerzo de la sesión, el estado inmediato y el cierre nocturno.

El trabajo se entregará en cortes verticales. Primero se probará el cambio de persistencia y su compatibilidad; después se completará el registro de series de extremo a extremo; finalmente se construirá el historial sobre el contrato ya estable.

## Decisiones de arquitectura

- **Tabla hija para series:** `session_exercise_sets` representará cada serie y mantendrá su orden mediante `position`.
- **Métricas generales en el ejercicio:** `duration_minutes` y `distance_km` vivirán en `session_exercises`, porque describen el ejercicio completo.
- **Compatibilidad explícita:** el dominio conservará una representación separada para la prescripción agregada anterior; no convertirá automáticamente datos incompletos en series individuales.
- **Escritura compensada:** se mantendrá el repositorio directo sobre Supabase. Si falla la inserción de ejercicios o series, se eliminará la sesión recién creada y el borrado en cascada evitará persistencia parcial.
- **Lectura acotada y sin N+1:** cada ventana de historial se resolverá con consultas por lotes para sesiones, ejercicios, series y cierres, no con una consulta por elemento.
- **Paginación por fecha:** `/historial` cargará ventanas de 30 días mediante un límite temporal estable. La agrupación utilizará `America/Lima`.
- **Server Component para la ruta:** la composición y lectura inicial del historial permanecerán en servidor; solo las interacciones que necesiten estado local serán componentes cliente.
- **Payload anidado validado:** el editor dinámico serializará los ejercicios y series en un payload estructurado; la acción y el repositorio lo validarán con Zod antes de persistirlo.
- **Sin dependencias nuevas:** se utilizarán React, Zod, Supabase y las utilidades existentes.
- **Navegación de cinco destinos:** `Historial` se añadirá al shell existente y se verificará especialmente la densidad en móvil.

## Grafo de dependencias

```text
Spec aprobada
  -> Contrato de dominio y validación
    -> Migración aditiva + RLS
      -> Repositorio: escribir y leer series
        -> Formulario: capturar series, duración y distancia
          -> Flujo E2E de registro persistente
        -> Consulta y agrupación del historial
          -> Ruta /historial + navegación
            -> Flujo E2E de consulta
              -> Compatibilidad, responsive y gates finales
```

## Fase 1: Contrato y migración segura

### Resultado esperado

El sistema puede representar series individuales y aplicar una migración aditiva sin perder ni reinterpretar registros existentes.

### Trabajo previsto

- Definir `ExerciseSet`, métricas generales del ejercicio y representación de valores agregados anteriores.
- Escribir primero las pruebas de validación para series, ejercicios basados en series y ejercicios basados en duración/distancia.
- Crear la migración de `session_exercise_sets`, columnas generales, índices, claves foráneas y políticas RLS.
- Probar el dry run de la migración contra staging antes de aplicarla.
- Registrar conteos previos y posteriores para demostrar que sesiones y ejercicios existentes permanecen intactos.

### Checkpoint: Persistencia preparada

- La suite de validación pasa.
- La migración es aditiva y supera `npm run supabase:push:dry`.
- RLS y borrado en cascada están definidos para la tabla nueva.
- Los datos antiguos conservan exactamente sus valores agregados.
- Se requiere revisión antes de aplicar la migración a staging.

## Fase 2: Registro vertical de series individuales

### Resultado esperado

El usuario puede registrar un ejercicio con varias series diferentes o un ejercicio basado en duración/distancia, recargar la aplicación y recuperar exactamente los mismos valores.

### Trabajo previsto

- Extender los mapeos y consultas del repositorio para insertar y leer series por lotes.
- Añadir compensación completa si falla cualquier nivel de la escritura anidada.
- Construir un modelo de estado puro para agregar, duplicar, actualizar y eliminar series.
- Rediseñar cada ejercicio seleccionado como un detalle desplegable con métricas generales y series.
- Permitir el mismo detalle para ejercicios predefinidos y personalizados.
- Separar visual y semánticamente `Esfuerzo de la sesión` y `Estado al terminar`.
- Renombrar el ritual nocturno como `Cierre del día` donde corresponda.
- Cubrir parsing, validación, interacción y persistencia con pruebas unitarias y E2E.

### Checkpoint: Registro completo

- Varias series con valores distintos sobreviven una recarga.
- Duración y distancia pueden guardarse sin series.
- Un fallo de series no deja una sesión parcial.
- Los tres conceptos de respuesta están separados en copy e interfaz.
- Pruebas focalizadas, lint y typecheck pasan.
- Se realiza revisión manual en móvil antes de continuar.

## Fase 3: Historial vertical de solo lectura

### Resultado esperado

El usuario puede recorrer los últimos 30 días, abrir una fecha y reconstruir todas sus sesiones y su cierre nocturno sin encontrar controles de edición.

### Trabajo previsto

- Crear un view model puro que agrupe por fecha de Lima, preserve varias sesiones y ordene ejercicios y series.
- Extender el límite de datos con una consulta de historial paginada por fecha.
- Añadir `/historial` como Server Component autenticado.
- Implementar resumen por día y detalle expandible accesible.
- Mostrar series nuevas, métricas generales y el bloque `Registro anterior` cuando corresponda.
- Añadir `Historial` a la navegación principal y estados activo, vacío, carga anterior y error.
- Mantener separado el historial factual de las interpretaciones de `Insights`.

### Checkpoint: Consulta completa

- La ventana inicial contiene los 30 días más recientes.
- Varias sesiones y un cierre del mismo día aparecen juntos sin sobrescribirse.
- La carga anterior conserva un orden cronológico estable.
- No existen acciones de editar o eliminar.
- Los datos anteriores y nuevos se distinguen correctamente.
- Pruebas de view model, ruta y navegador pasan.

## Fase 4: Integración, accesibilidad y endurecimiento

### Resultado esperado

La funcionalidad completa cumple la spec, mantiene los flujos existentes y funciona correctamente en móvil, tablet y escritorio.

### Trabajo previsto

- Ejecutar la suite completa y corregir regresiones en Hoy, Registrar, Insights y Reporte.
- Verificar que cálculos existentes sigan contando ejercicios sin duplicarlos por cantidad de series.
- Revisar navegación por teclado, etiquetas, foco y anuncios de errores.
- Comprobar que editores con muchas series no produzcan desbordamiento horizontal.
- Verificar el shell de cinco destinos en anchos móviles estrechos.
- Revisar runtime, consola y red en navegador real.
- Actualizar README, changelog, handoff y documentación de comportamiento.

### Checkpoint: Listo para entrega

- `npm test` pasa.
- `npm run e2e` pasa.
- `npm run lint` pasa.
- `npm run typecheck` pasa.
- `npm run build` pasa.
- La revisión responsive y de accesibilidad no deja defectos bloqueantes.
- Todos los criterios de éxito de la spec tienen evidencia verificable.

## Estrategia de cortes y commits

Los commits deben seguir resultados verificables y no capas incompletas:

1. Contrato, validación y migración aditiva.
2. Persistencia y registro completo de series.
3. Separación semántica de los tres momentos de respuesta, si no cabe limpiamente en el corte anterior.
4. Consulta y UI del historial.
5. E2E, hardening y documentación final.

Ningún commit debe dejar el formulario escribiendo un contrato que el repositorio todavía no pueda leer.

## Paralelización

Aunque técnicamente podrían separarse algunas pruebas y la exploración visual, esta iteración se recomienda mayormente secuencial porque formulario, dominio, repositorio e historial comparten el mismo contrato.

Después de estabilizar el contrato y la migración sí podrían avanzar de forma independiente:

- componentes visuales del historial
- pruebas del view model de historial
- copy y separación semántica del registro

La integración final debe permanecer coordinada.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Una escritura falla después de crear la sesión | Alto | Inserciones ordenadas, compensación mediante borrado de la sesión y prueba específica de fallo parcial. |
| La migración altera registros anteriores | Alto | Migración solo aditiva, dry run, conteos antes/después y lectura dual explícita. |
| El historial genera consultas N+1 | Alto | Cargar por lotes usando IDs de sesión y ejercicio dentro de una ventana acotada. |
| Las series hacen lento el registro móvil | Alto | Duplicar última serie, controles compactos, foco predecible y prueba manual con varias series. |
| Los cálculos cuentan cada serie como un ejercicio | Medio | Mantener Insights basado en ejercicios de sesión y añadir regresión específica. |
| Cinco destinos saturan la navegación móvil | Medio | Etiquetas breves, revisión en el ancho mínimo soportado y alternativa contextual si no cabe. |
| Fechas UTC separan datos del día incorrecto | Alto | Agrupar siempre con `America/Lima` y cubrir bordes de medianoche con pruebas. |
| El payload dinámico es manipulado | Alto | Tratarlo como entrada no confiable y validarlo de nuevo en acción y repositorio. |
| La tabla nueva expone datos entre usuarios | Alto | RLS por propietario y verificación autenticada con usuarios aislados. |

## Verificación transversal

- TDD para cada cambio de comportamiento.
- Prueba focalizada después de cada corte vertical.
- `git diff --check` y revisión de secretos antes de commits.
- Navegador real para flujos de registro e historial.
- Base staging únicamente; producción requiere autorización separada.
- No se considera terminado un corte si tiene regresiones conocidas, documentación desactualizada o comportamiento sin verificar en runtime.

## Preguntas abiertas

No quedan preguntas abiertas para este alcance. La edición histórica, las rutinas reutilizables y los gráficos por ejercicio permanecen fuera de alcance.

## Resultado de implementación

- Migración aditiva aplicada a staging sin pérdida de datos.
- Registro de series individuales, duración y distancia verificado por unidad y navegador.
- `/historial` entrega ventanas de 30 días, agrupación por fecha de Lima y detalle de solo lectura.
- Navegación de cinco destinos revisada a 320 y 1440 px; Lighthouse móvil: 100 en accesibilidad, buenas prácticas, SEO y navegación agente.
- Gate final: pruebas, typecheck, lint, build y 6 E2E en verde.
- Staging restaurado a 0 registros funcionales, 0 usuarios anónimos y 1 usuario real conservado.

No quedan decisiones técnicas bloqueantes para desglosar este plan en tareas. La referencia `references/definition-of-done.md` mencionada por la skill de planificación no existe en el repositorio; este plan usa como barra transversal los criterios de la spec, las verificaciones anteriores y la definición resumida por el catálogo de skills: pruebas sin regresiones, runtime verificado y documentación actualizada.

---

# Plan archivado: Recovery Ritual UX Redesign

## Overview

Restructure Recovery Ritual from a single long signed-in page into a mobile-first multi-screen product that preserves the current MVP behavior while improving clarity, motivation, and perceived quality.

The redesign should separate the product into clear modes:

- signed-out landing
- `Hoy`
- `Registrar`
- `Insights`
- `Reporte`
- success/completion states

Claude Design will be used to generate near-implementation layout explorations, but final UI decisions must be filtered through the existing product behavior, route constraints, and accessibility needs.

## Architecture Decisions

- **Behavior first, architecture second, polish third:** keep current session/closeout/dashboard/report functionality intact while reorganizing routes and screen responsibilities.
- **One screen, one job:** every authenticated route should have one primary product purpose.
- **`Hoy` as the default cockpit:** the main signed-in landing route should prioritize the next useful action and current momentum.
- **Dedicated logging surface:** post-therapy and nightly closeout forms move into a shared `Registrar` route with an explicit mode switch.
- **Insights and report remain separate tabs:** analytics and appointment-prep stay distinct to reduce cognitive mixing.
- **Navigation follows the selected references:** desktop uses a persistent sidebar; mobile keeps each screen focused and exposes route transitions through contextual actions rather than adding navigation absent from the approved compositions.
- **Claude Design as guided exploration, not authority:** prompts should yield strong mobile layouts, but implementation should stay grounded in the repo's functional constraints and copy tone.
- **Visual direction combines recovery calm with comeback energy:** premium, motivating, tactile, and serious.

## Dependency Graph

```text
Redesign spec approval
  -> Route and navigation architecture
    -> Signed-out landing redesign
    -> Hoy route refactor
    -> Registrar route and ritual split
      -> Success/completion states
    -> Insights route extraction
    -> Reporte route extraction
      -> Shared layout shell and navigation polish
        -> Claude Design-informed visual refinement
          -> Browser verification and regression pass
```

## Phase 1: UX Architecture and Design Inputs

- [x] Task 1: Convert the redesign spec into an implementation-ready route map and UI shell plan.
- [x] Task 2: Catalog the selected Claude Design outputs for all key screens.

### Checkpoint: UX Direction Locked

- [x] The route model for `Hoy`, `Registrar`, `Insights`, and `Reporte` is explicit.
- [x] Mobile and desktop Claude Design references are selected and cataloged for all key screens.
- [x] Mobile navigation behavior is defined before route code changes begin.

## Phase 2: Screen Separation

- [x] Task 3: Build the shared authenticated app shell with mobile-first navigation.
- [x] Task 4: Refactor `/` into a focused `Hoy` screen with only secondary previews for insights/report.
- [x] Task 5: Create the `Registrar` route with dedicated session and closeout subviews.
- [x] Task 6: Move dashboard content into `Insights`.
- [x] Task 7: Move medical report content into `Reporte`.

### Checkpoint: Product Modes Separated

- [x] The signed-in app no longer presents all product modes in one vertical page.
- [x] Logging flows are accessible from a dedicated route and preserve existing save behavior.
- [x] Insights and report are reachable from primary navigation and render independently.

## Phase 3: Motivation and Completion

- [x] Task 8: Add completion-state UX for session and nightly closeout saves.
- [x] Task 9: Redesign the signed-out landing and auth entry experience.
- [x] Task 10: Apply the selected Claude Design system and screens one increment at a time.

### Checkpoint: Emotional Product Quality

- [x] `Hoy` matches the selected mobile and desktop direction while remaining action-first.
- [x] Completion moments match their selected references without childish gamification.
- [x] The signed-out state matches its selected mobile and desktop direction.

## Phase 4: Verification and Hardening

- [x] Task 11: Add route-level and state-selection test coverage for the redesigned flow.
- [x] Task 12: Run browser review across mobile and desktop and fix layout/accessibility regressions.

### Checkpoint: Redesign Review

- [x] Build succeeds.
- [x] Existing validation/calculation coverage remains green.
- [x] Core signed-in flows work across route boundaries.
- [x] Mobile navigation, primary CTA behavior, and responsive shells are manually verified.

## Phase 5: One-Week Field Validation

- [ ] Use the staging application daily from 2026-07-16 through 2026-07-23.
- [ ] Record friction, incorrect assumptions, confusing copy, missing history, and data-quality issues as they occur.
- [ ] Prioritize fixes and additions from observed use after the trial instead of expanding the product spec during the observation window.

### Checkpoint: Field Evidence Collected

- [ ] The session and nightly closeout rituals have been exercised under normal daily use.
- [ ] Week boundaries, multiple same-day sessions, timestamps, insights, and reports have been observed with real data.
- [ ] Findings are classified as defects, usability improvements, or new product requirements.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Route separation breaks current save/redirect behavior | High | Move screens incrementally and verify each flow after extraction. |
| Bottom nav increases UI chrome and reduces focus | Medium | Keep nav compact, persistent, and subordinate to screen content. |
| Claude Design outputs drift into visually attractive but impractical layouts | Medium | Treat prompts as exploration input and filter against real component/data needs. |
| `Hoy` becomes another dashboard in disguise | High | Limit `Hoy` to action-first status, compact summaries, and previews only. |
| Reworked forms feel slower than the current MVP | High | Preserve current field model and optimize grouping, defaults, and CTA placement. |
| Visual redesign harms trust by over-indexing on hype | Medium | Balance athletic energy with calm recovery cues and medically conservative copy. |

## Parallelization Notes

Can be done in parallel:

- Claude Design prompt iteration and route-map planning
- landing redesign and authenticated shell exploration
- insights/report route extraction after shell decisions stabilize

Must stay mostly sequential:

- navigation shell before final route extraction
- `Hoy` refactor before final CTA deep-link rules
- success-state UX after `Registrar` flow shape is stable

## Verification Strategy

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- targeted Playwright checks for route flow and mobile nav
- manual browser review for visual quality, scanability, and responsive behavior

## Open Questions

- Whether the signed-out landing should remain tightly personal or lightly future-facing for a broader audience.
- Whether detailed day-by-day history is necessary after observing the current recent-summary, Insights, and Reporte surfaces for one week.

## Progress Notes

- The redesign spec and Claude Design prompt pack are captured in `docs/specs/recovery-ritual-ux-redesign-spec.md`.
- The authenticated app now uses distinct routes for `Hoy`, `Registrar`, `Insights`, and `Reporte`.
- Save flows now redirect back into `Registrar` with route-local success/error states instead of returning to the old one-page home.
- Mobile browser review was run against landing, `Hoy`, `Registrar`, `Insights`, and `Reporte`, followed by a shell-density cleanup and naming consistency fixes.
- The 17 selected Claude Design artifacts are cataloged in `docs/design/claude-design-reference.md`.
- The shared Design System and both Hoy compositions are implemented, browser-compared, and covered by deterministic state-selection tests.
- Registrar: Sesion now matches its mobile/desktop compositions while preserving all persisted session types, exercise shortcuts, the 1-5 load scale, and the existing server action.
- Sesion Guardada is now an immersive, data-driven completion screen with real session metrics, day progress, streak, and reference-aligned onward navigation.
- Registrar: Cierre now uses the approved night composition, full persisted domain scales, four-step progress, and the existing closeout server action.
- Dia Cerrado is now an immersive, data-driven completion screen with the animated ritual ring, actual session/closeout details, calculated streak, and reference-aligned navigation.
- Insights now matches the approved dark analytical composition with functional range selection, real pain/load/rebound/sleep/exercise charts, and truthful sparse-data states.
- Reporte now matches the approved responsive composition with real range controls, six data-driven sections, selectable appointment questions, native PDF printing, and share fallback.
- Landing now matches the approved photo-led mobile and split desktop compositions, preserves Google OAuth, and keeps anonymous demo access development-only.
- All 17 selected Claude Design artifacts are now implemented across the shared system and eight responsive product surfaces.
