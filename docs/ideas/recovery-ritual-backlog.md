# Backlog de Recovery Ritual

> Backlog único del proyecto: lo que ya existe, lo pendiente y lo descartado.
> Última revisión: 2026-10-01, verificada contra el código en `main`. Visión del producto: `docs/ideas/recovery-ritual.md`.
>
> Regla: una idea pasa a construirse solo con una observación real que la justifique y una spec aprobada (`docs/specs/`), siguiendo el flujo de `AGENTS.md`.

## Estado actual

- MVP terminado y validado con uso real (la semana de validación de julio se cerró el 2026-10-01).
- El uso real produjo el catálogo de ejercicios, las rutinas, los arreglos de móvil, el nombre de la cuenta y el feedback global de carga; todo está en producción.
- No hay una feature en curso ni elegida. La última entregada fue la app de rehabilitación en general (2026-10-02).

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
| Momento de cierre animado | Estados de éxito tras sesión y cierre, con animación que respeta movimiento reducido | `src/components/session-saved-state.tsx`, `src/components/day-closed-state.tsx` |
| Diseño mobile-first con escritorio | Rediseño con Claude Design (8 pantallas), revisado en móvil, tablet y escritorio | `docs/specs/recovery-ritual-ux-redesign-spec.md` |
| Apariencia | Tema Oscuro (por defecto), Claro o Sistema y color principal Verde, Terracota o Ámbar, guardados en la cuenta | Ajustes → Apariencia, `src/lib/appearance.ts`, `docs/specs/access-onboarding-personalization-spec.md` |
| Acceso por invitación | Solo entran correos invitados (hook de Supabase); el admin invita, comparte y abre el acceso desde Ajustes | Ajustes → Acceso, ADR-005 |
| Onboarding | Recorrido de bienvenida y configuración rápida para cuentas nuevas, repetible desde Ajustes | `/bienvenida` |
| Design system CSS | Tokens por tipo, componentes y un archivo por pantalla; `design:check` impide valores sueltos | `src/design-system/` |
| Historial | Solo lectura, ventanas de 30 días, varias sesiones por día, series individuales | `/historial` |
| Registros con fecha anterior | Sesiones y cierres de días pasados, sin fechas futuras ni cierres duplicados | Registrar |
| App instalable (PWA) | Ícono en el inicio, pantalla completa, pantalla sin conexión | `src/app/manifest.ts`, `public/sw.js` |
| Recordatorios | Sesión y cierre con hora configurable, cada 5 min con `pg_cron`, una vez por día y solo si sigue pendiente | `docs/specs/pwa-and-reminders-spec.md` |
| Nombre en el saludo | Se elige en `/ajustes` y se mantiene entre inicios de sesión con Google | `src/features/settings/` |
| Feedback de carga | Barra de progreso global, toasts en cada escritura, pantalla de error | `docs/specs/global-loading-and-feedback-spec.md` |
| Editar o corregir registros pasados | Sesiones y cierres se editan (fecha incluida) o se eliminan con confirmación, desde Historial o "Corregir" tras guardar | `docs/specs/edit-past-records-spec.md` |
| App de rehabilitación en general (2026-10-02) | Textos neutros, lesión activa por cuenta (zona, lado, tipo y fecha) que adapta los textos, rigidez en el cierre, tipos de sesión Movilidad, Equilibrio y Respiración, y metas simples | `docs/specs/general-rehab-spec.md`, Ajustes → Mi recuperación, Hoy → Mis metas |
| Tratamientos del centro (parte de la línea de tiempo de tratamiento) | En Fisio guiada: agentes físicos, terapia manual, invasivas, vendaje e indicaciones del fisio; se ven en Historial, Insights y Reporte | `docs/specs/physio-treatments-spec.md` |

## Dirección: app de rehabilitación en general

Decidido el 2026-10-02: la app deja de ser solo de rodilla. Sigue pensada para el paciente, con registro fácil y datos que se entienden: **sin mediciones clínicas** (ROM, escalas, perímetros) ni alertas médicas, y **una sola lesión activa** por cuenta. Fases 0 a 3 entregadas el 2026-10-02 (texto neutro, lesión activa, rigidez y tipos de sesión, metas simples).

## Pendiente: producto

Ordenado por prioridad. "Se reabre cuando" es la señal de uso real que justificaría empezarla.

| Prioridad | Feature | Por qué importa | Se reabre cuando |
|---|---|---|---|
| Media | **Análisis por ejercicio** (progresión de peso, repeticiones, segundos) | Ver si un ejercicio concreto progresa | Quieras saber "¿cómo voy en X?" |
| Media | **Guardar qué rutina se usó en cada sesión** | Comparar rutinas en Historial e Insights | Uses varias rutinas y quieras compararlas |
| Media | Vista de calendario | Conectar sesiones y síntomas de una semana o mes | Te preguntes seguido "¿qué pasó esa semana?" |
| Media | Línea de tiempo de tratamiento (medicamentos, infiltraciones, controles) | Recordar el efecto de cada intervención | Cueste recordar cuándo empezó un tratamiento |
| Media | PDF real del reporte (archivo generado, no impresión del navegador) | Enviar el reporte por correo o WhatsApp | El fisio o el médico pida un archivo |
| Media | Zonas de dolor / mapa de la rodilla | La ubicación del dolor en las citas | La ubicación del dolor sea tema en las citas |
| Media | Resumen semanal y preguntas para la cita con IA | Mejores resúmenes que las reglas actuales | Los textos por reglas se queden cortos (con límites médicos claros) |
| Baja | Exportar a CSV | Análisis propio en una hoja de cálculo | Hagas análisis a mano seguido |
| Baja | Apple Health / wearables (sueño, pasos) | Datos sin cargarlos a mano | El registro manual de sueño sea poco fiable |
| Baja | Sugerencias de progresión de carga | Guiar el entrenamiento | El fisio quiera usar los datos contigo (tema médico sensible) |
| Media | **Etapa de la recuperación** (opcional, elegida por el paciente: "Primeras semanas", "Recuperando movilidad", "Fortaleciendo", "Volviendo a mi actividad") | Da estructura al proceso sin términos técnicos | Se quiera ver en qué punto del proceso estás (idea del 2026-10-02, para más adelante) |
| Media | **Módulo de documentos médicos** (exámenes, recetas, resonancias; Storage privado con RLS y URL firmadas, PDF/JPG/PNG/HEIC, subida desde el celular) | Tener a mano los documentos de la recuperación | Se retome (2026-10-02: se deja para más adelante; compartirlos y el límite de almacenamiento quedaron descartados por ahora) |
| Media | **Portal para fisios** (crear ejercicios y rutinas y asignarlos a un paciente por correo; el paciente acepta o rechaza) | Que el fisio prescriba y el paciente lo reciba en la app | Hay un fisio dispuesto a usarlo. Idea del 2026-10-02, requiere spec propia (reemplaza la idea de documentos como siguiente gran feature). Decisiones: el fisio es una cuenta invitada por el admin; el paciente recibe una copia propia que puede editar sin afectar al fisio; el fisio no ve nada del paciente por ahora; se puede asignar a un correo sin cuenta y le aparece al entrar; las indicaciones van en las notas que ya existen |
| Baja | Varias lesiones por cuenta (decidido el 2026-10-02: por ahora una sola lesión activa) | Seguir más de una lesión | Alguien quiera registrar dos lesiones a la vez (varias cuentas ya funcionan: acceso por invitación) |
| Baja | Invitación por correo desde la app | Hoy la invitación se comparte con el menú del celular | Se invite a mucha gente o desde escritorio (necesita un servicio de email) |

## Pendiente: diseño

- Camino de recuperación con hitos semanales.
- Tarjeta de estado o "readiness" del día.
- Insignias por constancia: descanso, notas completas, preparación de citas (nunca por intensidad).
- Contraste visual entre síntomas, carga, sueño y eventos de tratamiento (ahora también los tratamientos del centro).

Antes de construir cualquiera de estos: los cuatro son features nuevas, no ajustes visuales. Cada uno necesita una observación de uso real, decisiones del owner y una spec, igual que el resto del producto. Para cada uno hay que definir:

- **Hitos semanales:** qué cuenta como hito (constancia, nunca dolor o intensidad) y dónde se ve (Hoy o Insights).
- **Readiness del día:** con qué datos se calcula (dolor final, rebote, sueño, energía del cierre anterior) y cómo evitar que parezca una recomendación médica.
- **Insignias:** qué conductas premian (descanso, notas completas, preparar la cita) y cómo se muestran sin infantilizar.
- **Contraste visual:** qué paleta separa síntomas, carga, sueño y tratamientos en las gráficas de Insights y Reporte (tokens nuevos en `src/design-system/styles/tokens/`).

## Pendiente: técnico

| Prioridad | Tarea | Por qué |
|---|---|---|
| Baja | Sincronizar los tokens con el proyecto de Claude Design (lockfile que impida editarlos a mano, como `brahua-os`) | Fase 3 del design system; solo si Claude Design vuelve a ser la fuente activa de cambios |
| ⏰ | Renovar `SUPABASE_ACCESS_TOKEN` antes del ~30 sep 2027 | Pasos en `docs/deployment.md` → "Vencimientos y renovaciones" |

## Descartado a propósito

- **Recomendaciones médicas automáticas:** no sin revisión profesional y avisos médicos claros.
- **Competir por dolor o puntos por sesiones más duras:** puede empujar a conductas inseguras.
- **Comunidad o capa social:** no aporta al caso de uso personal.
- **Marketplace de rutinas o planes de rehabilitación:** lejos del problema actual.
- **Portal para médicos:** reabierto solo como portal para fisios (ver Pendiente: producto). Un portal de lectura para médicos sigue descartado.

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
