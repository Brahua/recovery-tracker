# Spec: rehabilitación en general

> Estado: entregada en producción (2026-10-02): fases 0 a 3. Decisiones del owner en `docs/ideas/recovery-ritual-backlog.md` → "Dirección: app de rehabilitación en general".

## Objetivo

Que la app sirva para la rehabilitación de cualquier zona del cuerpo, no solo la rodilla. Sigue pensada para el **paciente**: registro fácil y datos que se entienden.

## Fuera de alcance

- Mediciones clínicas (rango de movimiento, perímetros, fuerza, escalas LEFS/DASH/KOOS) y alertas médicas.
- Varias lesiones por cuenta: hay **una lesión activa**.
- Etapa de la recuperación, documentos médicos y portal de fisios (están en el backlog; el portal tendrá su propia spec).

## Fase 0: texto neutro (PR #47)

Landing, manifest, invitación, onboarding, preguntas del registro y del cierre y mensajes de éxito ya no dicen "rodilla".

## Fase 1: lesión activa

Una cuenta describe su lesión en **Ajustes → Mi recuperación** y en la configuración rápida del onboarding (opcional, se puede saltar).

| Campo | Valores |
|---|---|
| Zona (obligatoria) | Cuello, Hombro, Codo, Muñeca y mano, Espalda alta, Zona lumbar, Cadera, Muslo, Rodilla, Pierna, Tobillo y pie, Otra |
| Lado (solo en zonas que lo tienen) | Izquierdo, Derecho, Ambos |
| Tipo | Operación, Lesión o golpe, Dolor que viene de tiempo, Otro |
| Fecha (opcional) | "Fecha de la operación" si es una operación; "Desde cuándo" en el resto. No puede ser futura |

- Se guarda en `user_metadata.condition` (igual que `preferences`): no hay migración, ya viene con el usuario en cada pantalla y no necesita consultas nuevas. Se valida con Zod al guardar y **otra vez al leer** (el cliente puede escribir su propio `user_metadata`; solo se usa para mostrar).
- Sin lesión guardada la app usa los textos neutros de la Fase 0. No se asume ninguna zona para cuentas existentes: el owner la elige en Ajustes.
- Con lesión, los textos se adaptan: "Un paso más para tu rodilla derecha", "Un minuto para registrar cómo quedó tu rodilla derecha hoy", "¿Cómo quedó tu rodilla derecha justo al terminar?", "¿Se resintió tu rodilla derecha después de la sesión?", "Hoy también cuidaste tu rodilla derecha".
- Hoy muestra una línea con la lesión y el tiempo ("Rodilla derecha · semana 12 desde la operación"). El Reporte muestra la misma línea arriba.
- Las sugerencias de zona de los tratamientos del centro salen de la zona de la lesión (la zona sigue siendo texto libre; los registros viejos no cambian).

## Fase 2: rigidez y más tipos de sesión

- **Rigidez** en el cierre nocturno: Nada, Un poco, Bastante, Mucha (`nightly_closeouts.stiffness_level`, nullable: los cierres anteriores no la tienen). Se ve en el Historial y el Reporte; las preguntas del onboarding ya la mencionan.
- **Tipos de sesión** nuevos: Movilidad o estiramiento, Equilibrio, Respiración (se amplía el `check` de `rehab_sessions.session_type`; los valores anteriores siguen válidos).

## Fase 3: metas simples

- El paciente escribe metas con sus palabras ("subir escaleras sin dolor") y las marca como logradas. Tabla `recovery_goals` (propias, RLS por usuario), hasta 10 metas pendientes, texto de 3 a 80 caracteres.
- Se gestionan en una tarjeta en Hoy; el Reporte lista las metas logradas y las pendientes.
- Las metas no puntúan ni compiten: solo se marcan y se celebran.

## Criterios de aceptación

- Con y sin lesión guardada ningún texto del producto menciona una zona que el usuario no eligió.
- Una lesión inválida guardada a mano en `user_metadata` se ignora (la app se comporta como sin lesión).
- Los cierres y sesiones anteriores se siguen leyendo, editando y mostrando.
- Las migraciones son aditivas y no tocan datos.
