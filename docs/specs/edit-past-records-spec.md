# Spec: Editar o corregir registros pasados

## Estado

Aprobada por el owner el 2026-10-01. Implementada y desplegada en producción el 2026-10-01: cierres (PR #27), sesiones con la migración `20261003000000_edit_past_records.sql` (PR #28) y "Corregir" en las pantallas de éxito con la documentación (PR 3).

## Decisiones validadas (owner, 2026-10-01)

1. Se pueden editar **sesiones y cierres del día**. En la sesión se corrige todo: contexto, dolor, esfuerzo, ejercicios y series, tratamientos, indicaciones del fisio y notas.
2. Se puede **eliminar** un registro hecho por error, con una **confirmación explícita**. El borrado es definitivo.
3. Se puede **cambiar la fecha** de las dos cosas: la fecha y hora de la sesión, y la fecha del cierre.
4. Se entra a editar desde **Historial** y desde la **pantalla de éxito** que aparece justo después de guardar ("Corregir").

## Suposiciones

1. Editar usa **el mismo formulario de Registrar**, con los datos cargados. No hay un formulario aparte para que no se desfasen.
2. Ninguna fecha puede quedar **en el futuro** (día de `America/Lima`), igual que al crear.
3. Al mover un cierre a otra fecha, esa fecha **no puede tener otro cierre**. Se mantiene "un cierre por usuario y fecha", y la base sigue siendo la que lo garantiza.
4. Guardar una sesión editada **reemplaza la sesión entera en una transacción** (como `save_routine`): se actualiza la fila y se reemplazan sus ejercicios, series y tratamientos. Si algo falla, no cambia nada.
5. **Copia histórica de nombres:** un ejercicio que no se toca conserva el nombre con que se registró, aunque después se haya renombrado en el catálogo. Solo cambia si el owner elige otro ejercicio en la fila. Un ejercicio archivado sigue enlazado a la sesión sin reactivarse.
6. Al editar **no se ofrece "Usar rutina"**, porque reemplazaría los ejercicios ya cargados. "Guardar como rutina" sigue disponible desde la pantalla de éxito.
7. No se marca qué registros se editaron ni se guarda un historial de versiones: Historial muestra solo el dato vigente.
8. Eliminar una sesión borra también sus ejercicios, series y tratamientos (`on delete cascade`, ya existe). El catálogo de ejercicios no se toca.
9. Tras editar o eliminar se recalculan la racha, Hoy, Insights y Reporte (`revalidatePath("/", "layout")` y las rutas). Si se elimina el registro de hoy, el recordatorio de ese día puede volver a salir, porque vuelve a estar pendiente.
10. No hay control de edición concurrente: hay una sola persona y un solo dispositivo a la vez. Gana el último guardado.
11. Mobile-first y accesible (axe en E2E), igual que el resto de la app.
12. **Registros antiguos con "N series × reps × kg" en una sola fila** (antes de las series individuales): al editarlos se convierten en N series iguales, para que guardar no pierda el dato.
13. **Hora de la sesión en hora de Lima:** el formulario muestra y envía la hora de Lima, y el servidor (que corre en UTC) la interpreta como Lima (UTC-5, sin horario de verano). Editar no corre la hora de la sesión.

## Objetivo

Que un error de carga (dolor mal marcado, una serie con el peso equivocado, la fecha de ayer registrada como hoy o una sesión duplicada) se pueda corregir desde la app. Así Historial, Insights y el Reporte para la cita reflejan lo que pasó de verdad.

## Experiencia

### Historial

En la sesión expandida y en el cierre del día aparece un botón secundario **Editar**:

```
Fisio guiada · 18:30                         Mejor  ⌃
  Dolor 3 · 4 · 2   Esfuerzo 3/5   Al terminar Mejor
  …ejercicios, tratamientos, notas…
                                             [Editar]

☾ Cierre del día · 22:10
  Dolor final 2/10 · Rebote leve · …
                                             [Editar]
```

- El texto de la cabecera "Todo lo que registraste, día a día. Solo lectura." cambia a "Todo lo que registraste, día a día.".

### Pantalla de éxito

En "Sesión guardada" y "Día cerrado", junto a "Ver historial", aparece un enlace **Corregir** que abre la edición del registro recién guardado.

### Editar sesión — `/registrar/sesion/[id]`

El formulario de Registrar en modo edición:

```
‹  Editar sesión                     [3 de 6]
   Fisio guiada · lun 29 sep · 18:30

[ …mismas secciones que al registrar, con los datos cargados… ]

[        Guardar cambios  →        ]
[ Eliminar sesión ]        [ Cancelar ]
```

- Título "Editar sesión"; sin el selector Sesión/Cierre ni "Usar rutina".
- El contexto muestra la fecha real de la sesión (no "Hoy") y deja cambiar fecha y hora.
- Se aplican las mismas reglas de progreso y validación que al registrar: el botón se activa con todo completo.
- "Cancelar" vuelve a Historial sin guardar.
- Al guardar: vuelve a Historial, en la ventana de 30 días que contiene la fecha de la sesión, con la sesión expandida y el toast **"Sesión actualizada"**.
- Si la sesión no existe o no es del usuario, se responde con `notFound()`. Como la app no tiene página 404 propia, se agrega una sencilla en `src/app/(app)/not-found.tsx` con un enlace a Historial.

### Editar cierre — `/registrar/cierre/[id]`

El formulario de Cierre del día con los datos cargados y la fecha editable (solo días pasados o hoy). Si la fecha nueva ya tiene cierre, se muestra el mismo mensaje que al registrar (`duplicateCloseoutDateMessage`). Al guardar vuelve a Historial con el toast **"Cierre actualizado"**.

### Eliminar

"Eliminar sesión" / "Eliminar cierre" abre un `ModalSheet`:

```
¿Eliminar esta sesión?
Fisio guiada · lun 29 sep · 18:30
Se borran sus ejercicios, series y tratamientos.
No se puede deshacer.

[ Eliminar ]   [ Cancelar ]
```

- El botón de eliminar usa el estilo destructivo y el foco inicial va a "Cancelar".
- Al confirmar: vuelve a Historial con el toast **"Sesión eliminada"** / **"Cierre eliminado"**.

## Datos

Migración aditiva `supabase/migrations/20261003000000_edit_past_records.sql`:

- `update_rehab_session(target_session_id uuid, payload jsonb) returns uuid`: `security invoker`, `search_path = ''`. Comprueba que la sesión existe y es de `auth.uid()`, valida las mismas reglas que `create_rehab_session` (tratamientos solo en fisio, ejercicios no repetidos), actualiza la fila de `rehab_sessions`, borra sus `session_exercises` (las series caen en cascada) y `session_treatments`, y los vuelve a insertar desde el payload.
- Para no duplicar la lógica, la inserción de ejercicios, series y tratamientos pasa a una función interna `insert_rehab_session_children(session_id uuid, payload jsonb)`, que usan `create_rehab_session` y `update_rehab_session`. El comportamiento de `create_rehab_session` no cambia.
- Sin tablas ni columnas nuevas. RLS ya permite `update` y `delete` a su dueño en `rehab_sessions` y `nightly_closeouts`, y `delete` en `session_exercises` y `session_treatments`.

Repositorio (`src/data/recovery-log-repository.ts`):

- `getRehabSession(id)` y `getNightlyCloseout(id)`: lectura por id, con hijos por lotes.
- `updateRehabSession(id, input)` → RPC `update_rehab_session`.
- `updateNightlyCloseout(id, input)` → `update` directo; el error de unicidad (`23505`) se traduce al mensaje de cierre duplicado.
- `deleteRehabSession(id)` y `deleteNightlyCloseout(id)` → `delete` directo; si no se borró ninguna fila, se trata como "no encontrado".

Server Actions (`"use server"`, solo funciones async): `updatePostTherapySessionAction`, `deleteRehabSessionAction`, `updateNightlyCloseoutAction` y `deleteNightlyCloseoutAction`. Tratan el id y el payload como datos no confiables: el id se valida como UUID y el payload con los mismos esquemas de `src/lib/validation/recovery.ts`.

## Fuera de alcance

- Historial de versiones o "deshacer".
- Editar o borrar varios registros a la vez.
- Guardar qué rutina se usó (otra feature del backlog).

## Plan de entrega

1. **PR 1 — Cierres:** repositorio (leer, actualizar, borrar), acciones, `/registrar/cierre/[id]`, Editar en Historial, eliminar con confirmación, unit y E2E. Sin migración.
2. **PR 2 — Sesiones:** migración (`update_rehab_session` y la función compartida), repositorio, acciones, `PostTherapyForm` en modo edición, `/registrar/sesion/[id]`, eliminar, unit y E2E.
3. **PR 3 — Entrada desde el éxito y cierre:** "Corregir" en las pantallas de éxito, axe en las pantallas nuevas, `CHANGELOG.md`, `RECAP.md`, `docs/HANDOFF.md` y el backlog.

## Verificación

- Unit: parseo y validación del id y del payload de edición; reglas de fecha (futuro, duplicado) al mover un cierre; carga de una sesión en el estado del formulario (`RehabSession` → borradores) y vuelta al payload sin pérdida (series, isométricos, tratamientos, notas).
- E2E (CI, Supabase local): editar una sesión (cambiar dolor, una serie y la fecha) y verlo en Historial; mover un cierre a una fecha libre y a una ocupada (error); eliminar una sesión y un cierre con confirmación; "Corregir" desde la pantalla de éxito; axe en ambas pantallas de edición.
- Local: `npm run lint && npm run design:check && npm run typecheck && npm test`.
