# Backlog de Recovery Ritual

> Backlog único del proyecto: lo que ya existe, lo pendiente y lo descartado.
> Última revisión: 2026-10-01, verificada contra el código en `main`. Visión del producto: `docs/ideas/recovery-ritual.md`.
>
> Regla: una idea pasa a construirse solo con una observación real que la justifique y una spec aprobada (`docs/specs/`), siguiendo el flujo de `AGENTS.md`.

## Estado actual

- MVP terminado y validado con uso real (la semana de validación de julio se cerró el 2026-10-01).
- El uso real produjo el catálogo de ejercicios, las rutinas, los arreglos de móvil, el nombre de la cuenta y el feedback global de carga; todo está en producción.
- No hay una feature en curso ni elegida.

## Ya hecho

Lo que el backlog original tenía como pendiente o diferido y hoy existe.

| Idea original | Cómo quedó | Dónde |
|---|---|---|
| Favoritos de ejercicios | Botones "Más usados" en Registrar | `src/components/exercise-entry-editor.tsx` |
| Biblioteca de ejercicios | Catálogo por usuario con valores por defecto, isométricos, archivar/reactivar y fusionar | `/ejercicios`, `docs/specs/exercise-catalog-spec.md` |
| Rutinas reutilizables | Plantillas con plan, "Usar rutina" y "Guardar como rutina" | `/ejercicios/rutinas`, `docs/specs/routines-spec.md` |
| Rachas por constancia (no por rendimiento) | "Racha de N días" en la barra lateral | `src/app/(app)/layout.tsx` |
| Vista semanal | Tira de la semana actual (lunes a domingo) y anillo de progreso de los rituales de hoy | `src/features/today/overview.tsx` |
| Insights básicos | Tendencia del dolor, carga semanal, rebote, sueño vs dolor | `/insights`, `src/lib/recovery-calculations.ts` |
| "Historia de la semana" | Resumen semanal en texto, por reglas | `buildWeeklyRecoveryStory` en `src/lib/recovery-insights.ts` |
| Reporte para la cita | Rangos de 7 y 30 días, evolución del dolor, preguntas para la cita (por reglas) | `/reporte`, `buildAppointmentQuestions` |
| Exportar el reporte | "Generar PDF" (imprimir del navegador) y "Compartir reporte" (compartir nativo o copiar enlace) | `src/components/report-actions.tsx` |
| Sliders táctiles de dolor | Slider propio para dolor antes/durante/después | `src/components/ritual-pain-slider.tsx` |
| Momento de cierre animado | Estados de éxito tras sesión y cierre, con animación que respeta movimiento reducido | `src/components/ritual-success-state.tsx` |
| Diseño mobile-first con escritorio | Rediseño con Claude Design (8 pantallas), revisado en móvil, tablet y escritorio | `docs/specs/recovery-ritual-ux-redesign-spec.md` |
| Modo oscuro | La app es oscura por diseño (no hay tema claro) | `src/app/globals.css` |
| Historial | Solo lectura, ventanas de 30 días, varias sesiones por día, series individuales | `/historial` |
| Registros con fecha anterior | Sesiones y cierres de días pasados, sin fechas futuras ni cierres duplicados | Registrar |
| Feedback de carga | Barra de progreso global, toasts en cada escritura, pantalla de error | `docs/specs/global-loading-and-feedback-spec.md` |

## Pendiente: producto

Ordenado por prioridad. "Se reabre cuando" es la señal de uso real que justificaría empezarla.

| Prioridad | Feature | Por qué importa | Se reabre cuando |
|---|---|---|---|
| Alta | **PWA instalable** (ícono en el inicio, pantalla completa) | Uso diario desde el celular sin abrir el navegador | Quieras abrirla como una app más |
| Alta | **Recordatorios / notificaciones** | Sostener el hábito de sesión y cierre | Se te olviden registros con frecuencia |
| Media | **Editar o corregir registros pasados** | Hoy un error de carga no se puede arreglar desde la app | Aparezca un registro mal cargado que importe |
| Media | **Análisis por ejercicio** (progresión de peso, repeticiones, segundos) | Ver si un ejercicio concreto progresa | Quieras saber "¿cómo voy en X?" |
| Media | **Guardar qué rutina se usó en cada sesión** | Comparar rutinas en Historial e Insights | Uses varias rutinas y quieras compararlas |
| Media | Vista de calendario | Conectar sesiones y síntomas de una semana o mes | Te preguntes seguido "¿qué pasó esa semana?" |
| Media | Línea de tiempo de tratamiento (medicamentos, infiltraciones, controles) | Recordar el efecto de cada intervención | Cueste recordar cuándo empezó un tratamiento |
| Media | PDF real del reporte (archivo generado, no impresión del navegador) | Enviar el reporte por correo o WhatsApp | El fisio o el médico pida un archivo |
| Media | Zonas de dolor / mapa de la rodilla | La ubicación del dolor en las citas | La ubicación del dolor sea tema en las citas |
| Media | Resumen semanal y preguntas para la cita con IA | Mejores resúmenes que las reglas actuales | Los textos por reglas se queden cortos (con límites médicos claros) |
| Baja | Editar el nombre de la cuenta desde la app | Hoy solo se cambia por SQL | Quieras cambiarlo |
| Baja | Registrar rigidez y ánimo en el cierre nocturno | La landing promete "Dolor, rigidez y ánimo" pero el cierre registra dolor, energía, sueño y rebote | Decidir si se agrega el dato o se ajusta el texto de la landing |
| Baja | Exportar a CSV | Análisis propio en una hoja de cálculo | Hagas análisis a mano seguido |
| Baja | Apple Health / wearables (sueño, pasos) | Datos sin cargarlos a mano | El registro manual de sueño sea poco fiable |
| Baja | Sugerencias de progresión de carga | Guiar el entrenamiento | El fisio quiera usar los datos contigo (tema médico sensible) |
| Baja | Varias lesiones / multiusuario | Producto más general | Otras personas quieran usarla |

## Pendiente: diseño

- Camino de recuperación con hitos semanales.
- Tarjeta de estado o "readiness" del día.
- Insignias por constancia: descanso, notas completas, preparación de citas (nunca por intensidad).
- Contraste visual entre síntomas, carga, sueño y eventos de tratamiento.

## Pendiente: técnico

| Prioridad | Tarea | Por qué |
|---|---|---|
| Media | Dividir `globals.css` (136 KB) en tokens y componentes, como el design system de `brahua-os` | Es el mayor problema de mantenimiento; necesita su propia spec |
| Media | Detectar en CI cambios de esquema sin migración (`supabase db diff`) | Evita desfasar la base respecto de `supabase/migrations/` |
| Baja | Prettier + `format:check` en CI | Diffs más limpios, igual que `brahua-os` |
| Baja | Vigilar el cambio de `ubuntu-latest` a Ubuntu 26 (19 oct 2026) | Aviso de GitHub; no debería afectar |
| ⏰ | Renovar `SUPABASE_ACCESS_TOKEN` antes del ~30 sep 2027 | Pasos en `docs/deployment.md` → "Vencimientos y renovaciones" |

## Descartado a propósito

- **Recomendaciones médicas automáticas:** no sin revisión profesional y avisos médicos claros.
- **Competir por dolor o puntos por sesiones más duras:** puede empujar a conductas inseguras.
- **Comunidad o capa social:** no aporta al caso de uso personal.
- **Marketplace de rutinas o planes de rehabilitación:** lejos del problema actual.
- **Portal para médicos:** solo tendría sentido con varios profesionales usando la app.

## Direcciones de producto consideradas al inicio

Se mantienen como referencia de la visión; lo concreto de cada una ya está arriba.

| Dirección | Qué tomó el producto | Qué queda |
|---|---|---|
| Recovery Quest (gamificación) | Racha por constancia | Camino de hitos e insignias seguras |
| Athlete Cockpit (panel deportivo) | Insights de dolor, carga, sueño y rebote | Estado del día / readiness |
| Doctor Briefing Machine | Reporte de 7 y 30 días con preguntas | PDF real, línea de tiempo de tratamiento |
| Pattern Detective | Insights por reglas | Correlaciones con más datos (30+ días) |
| Body Map + Timeline | — | Zonas de dolor, calendario |
| Coach Companion | Estados de éxito y preguntas para la cita | Resumen con IA con límites médicos |
