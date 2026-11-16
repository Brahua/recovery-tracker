# Spec: registro de la mañana y meta de sesiones

> Estado: **entregada en producción** (2026-11-16, PRs #58–#61). Aprobada por el owner el mismo día. Plan: `tasks/plan-morning-checkin.md` · Tareas: `tasks/todo-morning-checkin.md`.

## Problema

Hoy el día queda "completo" con **1 sesión + 1 cierre nocturno**, y el cierre se hace al acostarse. Eso confunde:

- Pide **horas y calidad de sueño** justo cuando vas a dormir: esa noche todavía no existe, así que en realidad se responde por la noche anterior.
- El **dolor de rebote** es la reacción 12–24 h después del esfuerzo y la **rigidez** típica es la matinal: las dos se ven mejor al despertar.
- Obliga a un segundo registro cada noche para "cerrar" el día, aunque lo importante (la sesión) ya está guardado.

## Objetivo

1. El avance se mide por **sesiones** con una meta que el paciente configura: **N sesiones por día, D días por semana** (por defecto 1 sesión, 7 días). Ej.: "2 sesiones al día, 5 días a la semana".
2. El cierre nocturno se reemplaza por un **registro de la mañana** ("¿Cómo amaneciste?"), **opcional**, que pregunta lo que se sabe al despertar.
3. Insights, Historial y Reporte siguen teniendo datos de sueño, rebote, rigidez y dolor, ahora con fecha y sentido correctos.
4. Los cierres nocturnos guardados **no se pierden ni cambian**.

## Decisiones (owner, 2026-11-16)

- Cierre → registro de la mañana opcional (no eliminarlo del todo).
- Meta de sesiones **por día** + **cuántos días por semana** hay que cumplirla.
- Sin **energía** en el registro de la mañana.
- La tarjeta "¿Cómo amaneciste?" se muestra **todo el día** mientras no se haya hecho.
- **Racha suave**: cuenta cualquier día con un registro.
- Los "eventos importantes" son las sesiones (ejercicio, fisio guiada con tratamientos, caminata, etc.): no cambian.

## Fuera de alcance

- Elegir **qué** días de la semana toca entrenar (solo se elige cuántos).
- Guardar el historial de metas (ver limitación abajo).
- Cambios en el formulario de sesión, tratamientos, rutinas o ejercicios.
- Convertir o borrar los cierres nocturnos existentes.
- Nuevas métricas o gráficos en Insights (solo se adaptan los que existen).

## Comportamiento

### 1. Meta de sesiones

Se configura en **Ajustes → Mi recuperación** y en la configuración rápida del onboarding, con dos campos:

| Campo | Valores | Por defecto |
|---|---|---|
| Sesiones por día | 1 a 5 | 1 |
| Días por semana | 1 a 7 | 7 |

- Se muestra como una frase: "**2 sesiones al día, 5 días a la semana**" (con 7 días: "todos los días").
- Un **día cumplido** es un día con al menos N sesiones. La **semana** es de lunes a domingo (hora de Lima, `getRecoveryWeekKeys`) y se cumple con D días cumplidos.
- Se guarda en `user_metadata.session_goal = { perDay, daysPerWeek }`, una clave propia como `condition` (no dentro de `preferences`: guardar la apariencia reemplaza `preferences` entero). Sin migración, validado con Zod al guardar y leído con un parser tolerante: cada parte inválida cuenta como su valor por defecto.
- Cambiar la meta **no reescribe el pasado**: las semanas anteriores se evalúan con la meta actual (no se guarda la meta por fecha). Es una app personal y simple; se documenta como limitación.

**Hoy**

| Sesiones hoy | Tarjeta |
|---|---|
| 0 | "Te toca la sesión de hoy" · progreso 0 % · botón "Empezar sesión" |
| 1 … N-1 | "Llevas k de N sesiones" · progreso k/N · botón "Registrar otra sesión" |
| ≥ N | "Día completo" · progreso 100 % · botones "Ver insights" / "Registrar otra sesión" |

- Con meta 1 el texto no muestra "1 de 1": dice "Sesión hecha. Día completo."
- Si la **semana ya está cumplida** y hoy no hay sesiones, la tarjeta cambia a "Semana cumplida. Hoy puedes descansar o sumar una sesión" (sin tono de pendiente).
- El registro de la mañana **no** cuenta para completar el día. Mientras no se haya hecho ese día, Hoy muestra **todo el día** una tarjeta secundaria "¿Cómo amaneciste? · 1 min".

**Semana**

- Debajo de los puntos de la semana: "**3 de 5 días** esta semana". Al cumplirla: "Semana cumplida".
- Cada día: **lleno** si llegó a N sesiones, **medio** si tiene al menos una sesión pero no llegó, **vacío** si no tiene sesiones.
- Si ya no quedan días suficientes para cumplir la semana, no se muestra ningún aviso de fracaso: solo el conteo.

**Racha**

- Cuenta días seguidos **con al menos un registro** (sesión o registro de la mañana), como hoy. No se rompe por no llegar a la meta: la app acompaña, no castiga.

### 2. Registro de la mañana

Ruta: **Registrar → "Cómo amaneciste"** (reemplaza la pestaña "Cierre"). Una por día; la fecha es el día en que despiertas (por defecto hoy, se puede elegir una fecha pasada como el cierre actual, nunca futura).

| Pregunta | Valores | Obligatoria |
|---|---|---|
| ¿Cuántas horas dormiste? | 0–24, pasos de 0,5 (por defecto 7,5) | Sí |
| ¿Cómo dormiste? | Muy mal … Muy bien (1–5) | Sí |
| ¿Cómo amaneció tu {zona}? (dolor al despertar) | 0–10 | Sí |
| Rigidez al despertar | Ninguna, Un poco, Bastante, Mucha | Sí |
| ¿Se resintió tu {zona} por lo de ayer? (rebote) | Nada, Leve, Moderado, Fuerte | **Solo si ayer hubo sesión**; si no, no se muestra |
| Notas | texto libre | No |

- **Sin energía** (decisión del owner). La energía de los cierres viejos se sigue mostrando donde ya se muestra.
- Mensaje al guardar: "Listo. Que tengas buen día." con botón a Hoy (o a "Empezar sesión" si hoy aún no hay sesiones).

### 3. Datos y migración

Tabla nueva **`morning_checkins`** (aditiva; `nightly_closeouts` queda intacta y de solo lectura en la UI nueva):

```
id, user_id, date (día en que despierta), sleep_hours numeric(4,1), sleep_quality 1–5,
waking_pain 0–10, stiffness_level, rebound_pain_level (nullable), notes,
created_at, updated_at, unique (user_id, date), RLS por usuario como el resto
```

Por qué tabla nueva y no reutilizar `nightly_closeouts`: el significado de las fechas cambia (el rebote de un registro del día D habla de la sesión del día D-1; el sueño es la noche D-1→D). Mezclarlos en una tabla haría que cada consulta tenga que adivinar qué tipo de fila es.

### 4. Insights, Historial y Reporte

Se combinan **cierres viejos** y **registros de la mañana**, alineando fechas:

| Señal | Cierre nocturno del día D | Registro de la mañana del día D |
|---|---|---|
| Rebote | respuesta a la sesión del día D | respuesta a la sesión del día **D-1** |
| Sueño | noche registrada en D | noche **D-1 → D** |
| Dolor | dolor al final de D | dolor al despertar en D |
| Rigidez | de D | al despertar en D |

- Insights "sueño vs. dolor": usa sueño de la noche y dolor del día siguiente cuando hay registros de la mañana; con cierres viejos sigue como hoy. Los textos dicen "dolor al despertar" o "dolor al final del día" según el origen.
- **Historial**: los registros de la mañana aparecen como "Cómo amaneciste" en el día en que se hicieron. Los cierres viejos siguen apareciendo como "Cierre nocturno", se pueden abrir y editar como hoy.
- **Reporte**: promedios de sueño, dolor y rebote con ambas fuentes; la energía solo con cierres viejos (si no hay, la línea no aparece). Nueva línea de **adherencia**: "Meta: 2 sesiones al día, 5 días a la semana · cumplida 6 de 8 semanas" (semanas completas del periodo del reporte, sin contar la semana en curso).

### 5. Recordatorios

- El recordatorio de "cierre" pasa a ser **"Cómo amaneciste"**: mismas columnas `closeout_enabled` / `closeout_time` de `reminder_settings`, con nuevo texto. Al desplegar, si la hora guardada es posterior a las 12:00 se trata como **08:00** en la app (sin migración de datos); el usuario la puede cambiar en Ajustes.
- Se envía solo si ese día no hay registro de la mañana.
- El recordatorio de sesión se envía si las sesiones de hoy son **menos que la meta diaria** y la **semana no está cumplida**. Con la semana cumplida no se recuerda (día de descanso permitido).

### 6. Otros lugares

- Onboarding y tour: los pasos que explican el cierre pasan a explicar el registro de la mañana y la meta de sesiones.
- Modo demo (`npm run demo:reset`): genera registros de la mañana en lugar de cierres y una meta distinta por perfil (p. ej. 1×7, 2×5 y 1×3).
- Landing, manifest y textos que digan "cierre nocturno" se revisan.

## Criterios de aceptación

1. Con meta 1 por día, una sesión deja el día "completo" en Hoy sin pedir ningún registro adicional.
2. Con meta 2 por día, una sesión muestra "Llevas 1 de 2" y 50 %; la segunda deja el día completo.
3. Con meta 5 días por semana, Hoy muestra "k de 5 días esta semana" contando solo días con N sesiones (lunes a domingo, Lima); al llegar a 5 dice "Semana cumplida" y el recordatorio de sesión deja de enviarse esa semana.
4. La meta se cambia en Ajustes y en el onboarding, acepta solo 1–5 sesiones y 1–7 días, y un valor inválido en `user_metadata` se trata como el valor por defecto (1 y 7).
5. El Reporte muestra cuántas semanas completas del periodo cumplieron la meta.
6. El registro de la mañana no pide horas de sueño de una noche futura: las preguntas hablan de "anoche" y "al despertar".
7. La pregunta de rebote aparece solo si el día anterior a la fecha elegida tiene al menos una sesión.
8. Los cierres nocturnos anteriores se ven en Historial y se pueden editar; sus datos siguen en Insights y Reporte.
9. Insights empareja el rebote de un registro de la mañana con la sesión del día anterior (test unitario con fechas).
10. Los recordatorios respetan la meta diaria y semanal (sesión) y el registro de la mañana (sin registro hoy).
11. La migración es aditiva y no toca filas existentes.
12. `npm run format && npm run lint && npm run design:check && npm run typecheck && npm test` en verde; E2E en CI cubre: sesión → día completo (meta 1), cambio de meta en Ajustes, registro de la mañana, y Historial con un cierre viejo.

## Cómo se trabaja

- **Comandos:** `nvm use`, luego `npm run format && npm run lint && npm run design:check && npm run typecheck && npm test`. `next build`, E2E y Supabase local corren en CI (no en la PC del owner salvo que lo pida).
- **Dónde va el código:** lógica pura y testeable en `src/lib/` (view models: `today-view-model`, `registrar-flow`, `recovery-calculations`, `recovery-insights`, `report-view-model`, `reminders/*`); formulario en `src/features/check-in/morning-checkin/`; ruta en `src/app/(app)/registrar/`; estilos en `src/design-system/styles/` sin colores literales; migración en `supabase/migrations/`.
- **Tests:** Vitest junto a cada módulo de `src/lib/` (fechas Lima, meta diaria 1/2/inválida, semana lunes–domingo con D días, semana cumplida, rebote D-1, combinación de fuentes); E2E de Playwright en `e2e/` para los flujos de los criterios.
- **Siempre:** migraciones aditivas, textos de UI en español, código en inglés, una rama corta por PR.
- **Preguntar antes:** borrar o convertir datos de `nightly_closeouts`, cambiar columnas de `reminder_settings`, agregar dependencias.
- **Nunca:** tocar datos de producción a mano, desplegar sin CI en verde.

## Preguntas abiertas

Ninguna. Resueltas por el owner el 2026-11-16: sin energía, tarjeta de la mañana todo el día, racha suave, meta semanal en días.
