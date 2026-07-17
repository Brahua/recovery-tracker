# ADR-003: Guardar series individuales mediante una tabla hija aditiva

## Estado

Aceptada e implementada el 2026-07-16.

## Contexto

El modelo inicial guardaba una prescripción agregada por ejercicio (`sets`, `reps`, `weight`). Ese formato no podía representar series con repeticiones o pesos distintos y tampoco distinguía datos realmente realizados de una pauta general. El cambio debía conservar los registros existentes sin inventar su distribución por serie.

## Decisión

- Cada serie nueva se guarda en `session_exercise_sets`, ordenada por `position` y vinculada al ejercicio y al propietario mediante una clave foránea compuesta.
- Duración y distancia total permanecen en `session_exercises` porque describen el ejercicio completo.
- Las columnas agregadas anteriores no se eliminan. Las lecturas las exponen como `legacyPrescription` y la interfaz las identifica como `Registro anterior`.
- Las escrituras nuevas usan únicamente el formato individual.
- La tabla hija aplica las mismas garantías de Auth, RLS, validación y borrado en cascada que el resto del registro.

## Consecuencias

- Se pueden reconstruir series distintas sin perder compatibilidad histórica.
- Las consultas de sesión requieren una lectura adicional por lote para las series, pero no generan consultas por elemento.
- Retirar las columnas agregadas exigirá una decisión y migración posterior; no forma parte de esta entrega.

## Evidencia

- Migración: `supabase/migrations/20260716000000_exercise_sets_and_history.sql`
- Especificación: `docs/specs/recovery-history-and-exercise-sets-spec.md`
- Pruebas de mapeo, validación, estado y navegador incluidas en la suite del proyecto.
