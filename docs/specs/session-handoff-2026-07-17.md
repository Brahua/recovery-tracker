# Session Handoff - 2026-07-17

## Estado actual

Recovery Ritual tiene implementados y verificados el MVP, el rediseño multipantalla, el historial de solo lectura, las series individuales y el registro retrospectivo de sesiones y cierres. La aplicación sigue en validación de uso real; no hay una nueva feature seleccionada todavía.

La próxima implementación debe partir de observaciones reales, convertir el problema elegido en una especificación acotada y preservar los contratos descritos aquí.

## Funcionalidad entregada

- Rutas autenticadas para `Hoy`, `Registrar`, `Historial`, `Insights` y `Reporte`.
- Formulario de sesión con fecha y hora editables, múltiples sesiones por día y ejercicios con series individuales, repeticiones, peso, notas, duración y distancia.
- Validación coherente de ejercicios: todos los ejercicios seleccionados deben estar completos para habilitar el guardado, y el servidor vuelve a validar el payload.
- Errores de sesión mostrados dentro del formulario mediante `useActionState`, sin perder dolor, ejercicios, series, peso ni notas.
- Cierre del día con selector de fecha: admite cualquier fecha válida hasta hoy y mantiene un único cierre por usuario y día.
- Contexto del cierre asociado a la sesión exacta del día seleccionado, incluso cuando la fecha queda fuera de la ventana reciente habitual.
- Rechazo explícito de fechas futuras, inválidas o ya cerradas; los valores del cierre permanecen en pantalla ante errores del servidor.
- Confirmaciones vinculadas por ID al registro recién creado para no mostrar otra sesión o cierre en escenarios concurrentes.
- Historial responsive de solo lectura con ventanas de 30 días, múltiples sesiones por día, series individuales y cierres separados.
- Navegación de Historial sin reemplazar el shell por una pantalla blanca de carga.
- Diseño móvil y escritorio de Historial alineado con las referencias de Claude Design.

## Contratos funcionales que deben preservarse

### Sesiones

- Se permiten varias sesiones en una misma fecha.
- `occurred_at` indica cuándo ocurrió la sesión; `created_at` indica cuándo se insertó en PostgreSQL.
- La UI permite registrar una sesión anterior con precisión de minutos.
- Un ejercicio seleccionado solo está completo si tiene nombre y al menos una serie válida, duración o distancia.
- Un payload manipulado debe ser rechazado por el servidor con un mensaje seguro y sin perder el formulario.

### Cierres

- Solo puede existir un cierre por `user_id` y fecha; la restricción también existe en PostgreSQL.
- La UI permite seleccionar fechas anteriores, pero nunca una fecha futura.
- Al cambiar la fecha, `/registrar` usa `?mode=closeout&date=YYYY-MM-DD` y carga una consulta acotada al día elegido.
- La tarjeta de contexto debe usar la sesión del día seleccionado, no simplemente la última sesión disponible.
- La confirmación usa `closeoutId` para resolver exactamente el cierre recién guardado.
- Un error esperado se devuelve como estado de la Server Action; no debe redirigir ni reconstruir el formulario.

### Fechas e historial

- El día funcional de recuperación se calcula en `America/Lima`.
- Los timestamps persistidos siguen siendo compatibles con UTC.
- Historial es factual y de solo lectura; las interpretaciones permanecen en Insights y Reporte.
- Las lecturas de sesiones, ejercicios y series deben continuar por lotes para evitar N+1.

## Decisiones y gotchas técnicos

- El proyecto usa Next.js `16.2.10`. Antes de modificar convenciones, rutas, formularios o Server Actions se deben leer las guías relevantes de `node_modules/next/dist/docs/`.
- Los archivos con `"use server"` solo pueden exportar funciones asíncronas. Constantes y reglas compartidas deben vivir en módulos separados.
- Las Server Actions se consideran endpoints alcanzables directamente: autenticación, RLS y validación en servidor no se pueden sustituir por controles de UI.
- Para errores esperados de formularios se usa `useActionState`; el primer argumento de la acción es el estado anterior y el segundo es `FormData`.
- Playwright usa usuarios anónimos reales de staging. Después de pruebas E2E se deben eliminar únicamente usuarios anónimos y verificar conteos; nunca borrar datos del usuario real por asumir que son residuos de pruebas.
- El servidor de desarrollo en el puerto 3000 puede pertenecer al usuario. No se debe detener sin autorización; primero revisar su estado y reutilizarlo.

## Estado de datos en staging

Después de la última limpieza de datos E2E:

- usuarios anónimos: 0
- usuarios reales conservados: 1
- sesiones reales: 1
- ejercicios de esa sesión: 6
- series de esos ejercicios: 8
- cierres: 0

La sesión existente pertenece al usuario real y debe conservarse. Este estado ya no es la línea base vacía del handoff del 2026-07-16.

## Verificación del checkpoint

Verificado el 2026-07-17:

- `npm test`: 94 pruebas aprobadas.
- `npm run typecheck`: aprobado.
- `npm run lint`: aprobado.
- `npm run build`: aprobado con Next.js 16.2.10.
- `npm run e2e`: 9 pruebas aprobadas en Chromium.
- Flujo focalizado de cierres: 5 pruebas aprobadas después de extraer el selector de fecha.
- Revisión real en 390 px y 1440 px sin errores de consola.
- Lighthouse desktop: 100 en accesibilidad, buenas prácticas, SEO y navegación agente; 30 auditorías aprobadas y 0 fallidas.
- Base restaurada a 0 usuarios anónimos sin modificar la sesión real.

## Commits que forman este checkpoint

- `c9f8c64` — cierres retrospectivos y validación de fechas.
- `3545859` — ejercicios incompletos, mensajes seguros y preservación del formulario de sesión.
- `482f8f2` — diseño desktop de Historial.
- `d4ebb48` — diseño móvil de Historial.
- `cb7d7d4` — navegación a Historial sin pantalla blanca.

## Próxima feature: protocolo de inicio

No hay una feature comprometida. Para iniciar la siguiente:

1. Registrar la observación real con fecha, ruta, acción, expectativa e impacto.
2. Clasificarla como defecto, fricción, instrumentación o nueva necesidad.
3. Elegir un solo resultado de usuario y escribir/actualizar una spec antes de programar.
4. Actualizar `tasks/plan.md` y `tasks/todo.md` con cortes verticales y criterios verificables.
5. Crear una rama corta desde `main` (`feature/...` o `fix/...`).
6. Aplicar TDD a cambios de comportamiento y verificar UI en navegador real.
7. Ejecutar el gate completo, limpiar únicamente datos demo, actualizar changelog/handoff y hacer commit.

Ideas ya identificadas pero no aprobadas incluyen edición histórica, rutinas reutilizables y análisis por ejercicio. Deben competir con las observaciones de la semana; no se deben implementar por anticipado.

## Archivos que debe leer primero la próxima sesión

1. `AGENTS.md`
2. `README.md`
3. `docs/specs/session-handoff-2026-07-17.md`
4. `tasks/plan.md`
5. `tasks/todo.md`
6. `CHANGELOG.md`
7. La spec relacionada con la feature elegida.

Para registro e historial también son especialmente relevantes:

- `src/app/registrar/page.tsx`
- `src/features/check-in/post-therapy/form.tsx`
- `src/features/check-in/nightly-closeout/form.tsx`
- `src/features/check-in/nightly-closeout/actions.ts`
- `src/lib/recovery-date.ts`
- `src/lib/recovery-page-data.ts`
- `src/lib/history-view-model.ts`
