# Spec: Tratamientos del centro (Fisio guiada)

## Estado

Aprobada el 2026-10-01. Fase 1: PR #23. Fase 2 (Insights y Reporte): rama `feat/physio-treatments-insights`.

## Decisiones validadas (owner, 2026-10-01)

1. Al elegir **Fisio guiada** aparece una sección nueva para registrar lo que se hizo en el centro de terapia.
2. Por cada tratamiento se registra: **qué se aplicó**, y opcionalmente **zona** y **minutos**.
3. Alcance: **agentes físicos**, **terapia manual**, **punción e invasivas**, **vendaje** y **notas del fisio**.
4. En Fisio guiada se puede guardar con **ejercicios o tratamientos**: basta con uno de los dos.
5. Se ve en **Historial** (fase 1) y en **Insights / Reporte** (fase 2).
6. El catálogo de tratamientos queda como está por ahora.
7. Las **indicaciones del fisio** de la última sesión de fisio se muestran en **Hoy** hasta la siguiente sesión de fisio.

## Suposiciones

1. La lista de tratamientos es **fija y la define la app** (códigos en TS y en un `check` de SQL), con un **"Otro"** por categoría que acepta un nombre libre. No hay un catálogo editable por el usuario, como el de ejercicios.
2. Cada tratamiento aparece **una vez por sesión**. Si se aplicó en dos zonas, se escriben ambas en el campo de zona. "Otro" puede repetirse si los nombres son distintos.
3. La **zona** es texto libre (máx. 60) con sugerencias de zonas de rodilla. Los **minutos** son enteros de 1 a 120. El vendaje no pide minutos.
4. Los tratamientos solo se guardan si la sesión es `PHYSIOTHERAPY`; la base lo comprueba. Si se cambia el tipo después de marcar tratamientos, la sección se oculta y no se envían, pero se conservan en pantalla por si se vuelve a Fisio guiada.
5. Las **indicaciones del fisio** son un texto aparte de la nota de la sesión (máx. 1000), porque responden a otra pregunta ("¿qué me dijo el terapeuta?").
6. Las sesiones no se editan después de guardarse (igual que hoy), así que no hay pantalla de edición.
7. Mobile-first y accesibilidad (axe en E2E) como en el resto de la app.

## Objetivo

Que una sesión en el centro de terapia quede registrada completa (lo que el fisio aplicó, no solo los ejercicios) y que, con el tiempo, se pueda ver si algo (por ejemplo, ondas de choque) coincide con menos dolor.

## Catálogo de tratamientos

| Categoría | Código | Etiqueta | Minutos |
|---|---|---|---|
| Agentes físicos (`PHYSICAL_AGENT`) | `TECAR` | Tecarterapia | sí |
| | `SHOCKWAVE` | Ondas de choque | sí |
| | `LASER` | Láser | sí |
| | `ULTRASOUND` | Ultrasonido | sí |
| | `ELECTROTHERAPY` | Electroterapia (TENS/EMS) | sí |
| | `MAGNETOTHERAPY` | Magnetoterapia | sí |
| | `CRYOTHERAPY` | Crioterapia / hielo | sí |
| | `THERMOTHERAPY` | Calor | sí |
| | `PRESSOTHERAPY` | Presoterapia | sí |
| Terapia manual (`MANUAL_THERAPY`) | `MASSAGE` | Masaje | sí |
| | `JOINT_MOBILIZATION` | Movilización articular | sí |
| | `MYOFASCIAL_RELEASE` | Liberación miofascial | sí |
| | `LYMPHATIC_DRAINAGE` | Drenaje linfático | sí |
| Punción e invasivas (`INVASIVE`) | `DRY_NEEDLING` | Punción seca | sí |
| | `EPI` | EPI (electrólisis percutánea) | sí |
| | `MESOTHERAPY` | Mesoterapia | no |
| | `INFILTRATION` | Infiltración | no |
| Vendaje (`TAPING`) | `KINESIO_TAPE` | Kinesiotape | no |
| | `FUNCTIONAL_TAPE` | Vendaje funcional | no |
| Todas | `OTHER` | Otro (nombre libre, máx. 60) | sí |

Sugerencias de zona: Rodilla anterior, Tendón rotuliano, Rodilla medial, Rodilla lateral, Hueco poplíteo, Cuádriceps, Isquiotibiales, Cintilla iliotibial, Gemelos.

## Experiencia

### Registrar sesión (`/registrar`), tipo Fisio guiada

Una tarjeta nueva **Tratamientos del centro**, después de Ejercicios y antes de la nota. Solo se ve con Fisio guiada.

```
✓ Tratamientos del centro        2 registrados

Agentes físicos
[Tecarterapia ✓] [Ondas de choque] [Láser ✓] [Ultrasonido]
[Electroterapia] [Magneto] [Crioterapia] [Calor] [+ Otro]
Terapia manual
[Masaje] [Movilización] [Liberación miofascial] [+ Otro]
Punción e invasivas
[Punción seca] [EPI] [Mesoterapia] [Infiltración] [+ Otro]
Vendaje
[Kinesiotape] [Vendaje funcional] [+ Otro]

┌──────────────────────────────────────┐
│ Tecarterapia                       ✕ │
│ Zona [Rodilla anterior    ]  Min [10]│
├──────────────────────────────────────┤
│ Láser                              ✕ │
│ Zona [Tendón rotuliano    ]  Min [ 5]│
└──────────────────────────────────────┘

Indicaciones del fisio (opcional)
[ Bajar carga en sentadilla esta semana… ]
```

- Tocar un chip lo marca (`aria-pressed`) y agrega su fila; volver a tocarlo, o ✕, la quita.
- "+ Otro" agrega una fila con un campo de nombre obligatorio.
- Zona y minutos son opcionales; la fila de un tratamiento sin minutos no muestra ese campo.
- Máximo 15 tratamientos por sesión.

### Progreso y guardado

- El paso 5 se llama **Ejercicios** en los demás tipos y **Ejercicios o tratamientos** en Fisio guiada.
- En Fisio guiada el paso está completo si (a) hay al menos un ejercicio y todos están completos, o (b) hay al menos un tratamiento válido y los ejercicios agregados (si hay) están completos.
- El botón muestra `N ejercicios · M tratamientos` cuando hay tratamientos.

### Historial

En la tarjeta de la sesión, debajo de los ejercicios:

```
Tratamientos
Tecarterapia · rodilla anterior · 10 min
Láser · tendón rotuliano · 5 min
Indicaciones del fisio: Bajar carga en sentadilla esta semana.
```

El resumen de la sesión (`N ejercicios`) suma ` · M tratamientos` cuando hay.

### Hoy

Si la última sesión de fisio (por fecha) tiene indicaciones, Hoy muestra una tarjeta **Indicaciones del fisio** con la fecha de esa sesión. Una sesión de fisio más reciente sin indicaciones la quita.

### Fase 2: Insights y Reporte

No necesita migración: usa los datos de la fase 1.

- **Insights → tarjeta "Tratamientos del centro"** (solo si hay sesiones de fisio en el rango). Por cada tratamiento (máx. 6, los más frecuentes):
  - cuántas sesiones lo incluyeron;
  - con **3 o más sesiones**: el cambio medio de dolor en la sesión (después − antes) y el % de noches con rebote (cierre del mismo día), **con** el tratamiento frente a las demás sesiones de fisio **sin** él;
  - con menos: "Aún pocos datos: N de 3 sesiones para comparar".
  - Leyenda: "Es una coincidencia, no una causa."
- **Reporte → tarjeta "Respuesta a las sesiones"**: bloque "Tratamientos del centro · N sesiones de fisio" con cada tratamiento, cuántas veces se aplicó y las zonas registradas. Solo datos, sin interpretación.
- **Reporte → Notas destacadas**: incluye las indicaciones del fisio, con la fuente "Indicaciones del fisio".
- Lógica pura en `src/lib/treatment-insights.ts` (`calculateTreatmentFrequency`, `calculateTreatmentResponse`), con tests.

## Modelo de datos

Migración nueva y aditiva: `supabase/migrations/20261002000000_session_treatments.sql`.

```sql
alter table public.rehab_sessions
  add column therapist_notes text check (therapist_notes is null or length(therapist_notes) <= 1000);

create table public.session_treatments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null,
  position integer not null check (position between 0 and 14),
  category text not null check (category in ('PHYSICAL_AGENT', 'MANUAL_THERAPY', 'INVASIVE', 'TAPING')),
  modality text not null check (modality in (
    'TECAR', 'SHOCKWAVE', 'LASER', 'ULTRASOUND', 'ELECTROTHERAPY', 'MAGNETOTHERAPY',
    'CRYOTHERAPY', 'THERMOTHERAPY', 'PRESSOTHERAPY', 'MASSAGE', 'JOINT_MOBILIZATION',
    'MYOFASCIAL_RELEASE', 'LYMPHATIC_DRAINAGE', 'DRY_NEEDLING', 'EPI', 'MESOTHERAPY',
    'INFILTRATION', 'KINESIO_TAPE', 'FUNCTIONAL_TAPE', 'OTHER'
  )),
  custom_name text check (custom_name is null or length(trim(custom_name)) between 1 and 60),
  body_zone text check (body_zone is null or length(trim(body_zone)) between 1 and 60),
  duration_minutes integer check (duration_minutes between 1 and 120),
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, position),
  check ((modality = 'OTHER') = (custom_name is not null)),
  foreign key (session_id, user_id) references public.rehab_sessions (id, user_id) on delete cascade
);

create unique index session_treatments_unique_modality
  on public.session_treatments (session_id, modality, coalesce(lower(custom_name), ''));
```

- **RLS:** select, insert y delete solo del propio `user_id` (sin update: las sesiones no se editan).
- La categoría de cada código se valida en la RPC (un código pertenece a una sola categoría, salvo `OTHER`).
- **`create_rehab_session(payload jsonb)`** se reemplaza (`create or replace`) en la migración nueva: lee `therapistNotes` y `treatments[]` (`category`, `modality`, `customName`, `bodyZone`, `durationMinutes`) e inserta en la misma transacción. Rechaza tratamientos si `sessionType <> 'PHYSIOTHERAPY'`. Todo lo demás queda igual.
- Lectura: el repositorio trae los tratamientos de todas las sesiones en **una sola consulta** por lote (sin N+1), igual que los ejercicios.

## Project Structure

```
supabase/migrations/20261002000000_session_treatments.sql → columna, tabla, RLS, create_rehab_session ampliada
src/types/recovery.ts                         → TreatmentCategory, TreatmentModality, SessionTreatment; RehabSession.treatments y therapistNotes
src/lib/treatments.ts (+ .test.ts)            → catálogo (código → categoría, etiqueta, si pide minutos), borradores ↔ payload, formato para historial
src/lib/validation/recovery.ts (+ .test.ts)   → schema de tratamientos y regla "solo en fisio"
src/lib/session-form-state.ts (+ .test.ts)    → paso 5 "ejercicios o tratamientos"
src/data/recovery-log-repository.ts           → enviar y leer tratamientos por lote
src/data/recovery-log-mappers.ts (+ .test.ts) → fila ↔ SessionTreatment
src/features/check-in/post-therapy/           → tarjeta TreatmentsCard, payload oculto, acción
src/features/history/history-session-card.tsx → bloque Tratamientos e indicaciones
src/features/today/overview.tsx               → tarjeta Indicaciones del fisio
src/design-system/styles/                     → estilos de la tarjeta (solo tokens)
tests/e2e/physio-treatments.spec.ts           → flujo completo
```

## Testing Strategy

- **Unitarios (Vitest):**
  - catálogo: cada código tiene categoría y etiqueta; `OTHER` exige nombre
  - borradores → payload: quita zona y minutos vacíos, ignora minutos en vendaje, conserva el orden
  - schema: máx. 15, sin repetidos, minutos 1–120, zona ≤ 60, rechaza tratamientos fuera de fisio
  - progreso: fisio solo con tratamientos = completo; con un ejercicio incompleto = incompleto; otros tipos sin cambios
  - mappers y formato de historial
- **E2E (solo en CI):**
  1. Fisio guiada con 2 tratamientos (uno "Otro"), sin ejercicios, con indicaciones: guarda y se ve en Historial
  2. marcar tratamientos, cambiar a "En casa": la tarjeta se oculta, sin ejercicios no deja guardar y lo guardado no tiene tratamientos
  3. axe en Registrar con la tarjeta abierta
  4. las indicaciones de la última sesión de fisio se ven en Hoy

## Boundaries

- **Siempre:** migración aditiva; RLS; Zod; `npm run lint && npm run design:check && npm run typecheck && npm test` antes de cada commit; PR con CI verde.
- **Preguntar antes:** merge a `main` (despliega y migra producción); agregar dependencias.
- **Nunca:** Docker, `next build` ni E2E en la PC local; tocar migraciones ya aplicadas; cambiar sesiones ya guardadas.

## Success Criteria

1. Con Fisio guiada aparece la tarjeta Tratamientos del centro; con otros tipos no.
2. Se registran tratamientos con zona y minutos opcionales, "Otro" con nombre libre, e indicaciones del fisio.
3. Una sesión de fisio se guarda solo con tratamientos, sin ejercicios.
4. Historial muestra los tratamientos y las indicaciones de la sesión.
5. Las sesiones antiguas se siguen viendo igual.
6. Lint, design:check, typecheck, unitarios y E2E en verde en CI.

## Decisiones sobre preguntas abiertas

1. El catálogo no cambia por ahora; se amplía cuando haga falta (migración que reemplaza el `check`).
2. Las indicaciones del fisio se ven en **Hoy** (ver la sección "Hoy").
