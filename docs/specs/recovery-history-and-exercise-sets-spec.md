# Spec: Historial de recuperación y series individuales

## Estado

Aprobada para planificación el 2026-07-16. La implementación no debe comenzar hasta que el plan y la lista de tareas sean revisados y aprobados.

## Suposiciones validadas

1. La funcionalidad pertenece a la aplicación web existente y mantiene el enfoque mobile-first.
2. El historial será únicamente de lectura en esta fase; no permitirá editar ni eliminar registros.
3. El historial incluirá sesiones de ejercicios y cierres nocturnos, agrupados cronológicamente por fecha.
4. Una fecha puede contener varias sesiones, pero solo un cierre nocturno.
5. Cada ejercicio podrá contener series individuales con repeticiones, peso en kilogramos y una nota opcional.
6. El peso será opcional para permitir ejercicios con peso corporal.
7. Duración y distancia serán opcionales y pertenecerán al ejercicio completo, no a cada serie.
8. La carga percibida, el estado inmediato de la rodilla y el cierre nocturno son conceptos distintos y deben mostrarse por separado.
9. Los registros existentes deben conservarse sin inferir datos de series que nunca fueron registrados.

## Objetivo

Permitir que el usuario reconstruya con precisión qué hizo en días anteriores y registre la progresión real de cada ejercicio sin confundir la respuesta inmediata de la rodilla con su evolución al final del día.

La experiencia debe responder tres preguntas:

1. ¿Qué hice en una fecha determinada?
2. ¿Cuántas series, repeticiones y cuánto peso utilicé en cada ejercicio?
3. ¿Cómo respondió la rodilla inmediatamente después y varias horas más tarde?

## Experiencia propuesta

### Historial

Se añadirá un apartado autenticado `Historial`, con ruta `/historial` y acceso desde la navegación principal.

La vista inicial será una lista cronológica descendente, agrupada por fecha. No se utilizará un calendario mensual en esta fase.

Cada día mostrará un resumen compacto:

- fecha
- cantidad y hora de las sesiones
- cantidad de ejercicios realizados
- dolor antes y después de cada sesión
- existencia o ausencia de cierre nocturno

Al abrir un día se mostrarán todos sus datos, sin posibilidad de modificación:

- tipo y hora de cada sesión
- dolor antes, durante y después
- ejercicios en el orden registrado
- series individuales de cada ejercicio
- duración y distancia del ejercicio cuando existan
- esfuerzo percibido de la sesión
- estado de la rodilla al terminar
- notas de sesión y de series
- dolor, rebote, energía y sueño del cierre nocturno

La carga inicial cubrirá los 30 días más recientes. La interfaz permitirá cargar períodos anteriores progresivamente sin descargar todo el historial de una vez.

### Registro de ejercicios

Seleccionar un ejercicio predefinido o crear uno personalizado abrirá su detalle.

Cada ejercicio permitirá:

- agregar una o más series
- duplicar la última serie para acelerar registros repetitivos
- eliminar una serie antes de guardar
- registrar repeticiones opcionales por serie
- registrar peso opcional en kilogramos por serie
- registrar una nota opcional por serie
- registrar duración total opcional en minutos
- registrar distancia total opcional en kilómetros

Una serie será válida si contiene al menos repeticiones, peso o nota. Un ejercicio de duración o distancia podrá guardarse sin series si tiene al menos duración o distancia.

La sesión seguirá requiriendo al menos un ejercicio válido.

### Separación semántica del cierre

El título ambiguo `Carga y cierre` se eliminará.

Dentro del registro de sesión existirán dos bloques independientes:

1. **Esfuerzo de la sesión**
   - Pregunta: `¿Qué tan exigente fue la sesión?`
   - Conserva la escala actual de carga percibida de 1 a 5.

2. **Estado al terminar**
   - Pregunta: `¿Cómo quedó la rodilla justo al terminar?`
   - Conserva las opciones `Mejor`, `Igual` y `Peor`.

El registro nocturno se llamará **Cierre del día** y seguirá siendo un ritual separado. Su propósito es registrar la respuesta tardía: dolor al final del día, rebote, energía y sueño.

## Modelo de dominio propuesto

`SessionExercise` dejará de representar series mediante tres valores agregados. Tendrá métricas generales y una colección ordenada de series.

```ts
interface ExerciseSet {
  position: number;
  reps?: number;
  weightKg?: number;
  notes?: string;
}

interface SessionExercise {
  name: string;
  shortcutId?: ExerciseShortcutId;
  durationMinutes?: number;
  distanceKm?: number;
  sets: ExerciseSet[];
  notes?: string;
}
```

### Persistencia

Se añadirá una tabla hija para las series individuales:

```text
session_exercise_sets
├── id
├── session_exercise_id
├── user_id
├── position
├── reps
├── weight_kg
├── notes
├── created_at
└── updated_at
```

También se añadirán `duration_minutes` y `distance_km` a `session_exercises`.

La nueva tabla debe:

- usar claves foráneas con borrado en cascada
- aplicar RLS por propietario, igual que las tablas actuales
- validar posiciones no negativas
- aceptar repeticiones positivas opcionales
- aceptar peso no negativo opcional
- mantener el orden de las series dentro del ejercicio

### Compatibilidad y migración

Los campos agregados actuales `sets`, `reps` y `weight` no se eliminarán en la primera migración.

Los registros antiguos que tengan esos valores se mostrarán como `Registro anterior` con su resumen agregado. No se crearán series individuales artificiales porque no se conoce la distribución real de repeticiones o peso entre ellas.

Las sesiones nuevas escribirán únicamente el nuevo formato de series. La retirada de los campos agregados será una decisión posterior y requerirá una migración separada.

## Stack técnico

- Next.js `16.2.10` con App Router
- React `19.2.4`
- TypeScript estricto
- Supabase/PostgreSQL con Auth y RLS
- Zod `4.4.3` para validación de límites
- Vitest `4.1.10` para pruebas unitarias
- Playwright `1.61.1` para pruebas de navegador

Antes de implementar componentes o rutas se deben consultar las guías correspondientes en `node_modules/next/dist/docs/`.

## Comandos

```bash
# Desarrollo
npm run dev

# Pruebas unitarias
npm test

# Pruebas críticas de navegador
npm run e2e:critical

# Suite completa de navegador
npm run e2e

# Calidad estática
npm run typecheck
npm run lint

# Compilación de producción
npm run build

# Validar y aplicar migraciones en staging
npm run supabase:push:dry
npm run supabase:push:linked
```

## Estructura del proyecto

```text
src/app/                         Rutas y composición del App Router
src/features/check-in/           Formularios y acciones de registro
src/features/history/            Componentes del historial de solo lectura
src/data/                        Repositorios y mapeo de persistencia
src/lib/validation/              Esquemas Zod y normalización
src/types/                       Contratos del dominio
supabase/migrations/             Migraciones SQL y políticas RLS
tests/e2e/                       Flujos críticos en navegador
docs/specs/                      Especificaciones aprobadas
tasks/                           Plan y tareas, después de aprobar la spec
```

## Estilo de código

Se mantendrán nombres de dominio en inglés y textos visibles en español. Los límites de persistencia deben mapear explícitamente `snake_case` de PostgreSQL a `camelCase` del dominio.

```ts
function mapExerciseSetRow(row: ExerciseSetRow): ExerciseSet {
  return {
    position: row.position,
    reps: row.reps ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    notes: row.notes ?? undefined,
  };
}
```

Las transformaciones y cálculos reutilizables deben ser funciones puras. Los componentes no accederán directamente a Supabase.

## Estrategia de pruebas

### Unitarias

- validación de una serie individual
- validación de ejercicios basados en series, duración o distancia
- orden estable de ejercicios y series
- mapeo entre filas de PostgreSQL y objetos de dominio
- agrupación del historial por fecha de `America/Lima`
- múltiples sesiones en la misma fecha
- compatibilidad de lectura con registros agregados anteriores

### Persistencia e integración

- migración aplicable sobre el esquema actual
- restricciones y claves foráneas
- borrado en cascada
- aislamiento por usuario mediante RLS
- lectura eficiente del historial sin consultas por cada ejercicio o serie

### Navegador

- registrar un ejercicio con varias series distintas y verificar persistencia después de recargar
- registrar un ejercicio solo con duración y distancia
- consultar una sesión anterior desde Historial
- visualizar varias sesiones y un cierre dentro del mismo día
- comprobar que Historial no ofrece controles de edición o eliminación
- verificar los bloques separados de esfuerzo, estado inmediato y cierre del día

### Calidad visual

- revisar móvil, tablet y escritorio en navegador real
- comprobar navegación por teclado, etiquetas y foco visible
- evitar que varias series produzcan desbordamiento horizontal
- respetar preferencias de movimiento reducido

## Límites

### Siempre hacer

- desarrollar contra Supabase staging
- aplicar TDD a validación, transformaciones y comportamiento nuevo
- validar datos tanto en la acción como en el repositorio
- mantener RLS para toda tabla nueva
- usar `America/Lima` para agrupaciones de calendario y UTC para timestamps persistidos
- conservar registros existentes
- ejecutar pruebas, lint, typecheck y build antes de cualquier commit

### Preguntar antes

- eliminar o transformar destructivamente columnas existentes
- agregar dependencias
- cambiar el límite inicial de 30 días
- añadir edición o eliminación desde el historial
- desplegar migraciones en producción

### Nunca hacer

- inventar series individuales para datos históricos agregados
- almacenar secretos o credenciales en el repositorio
- saltarse RLS o confiar en un `user_id` enviado por el cliente
- mezclar Historial con Insights: uno muestra hechos y el otro interpreta tendencias
- presentar correlaciones de recuperación como conclusiones médicas

## Criterios de éxito

- [ ] Existe un acceso principal a `/historial` para usuarios autenticados.
- [ ] El historial muestra al menos los 30 días más recientes, agrupados por fecha y en orden descendente.
- [ ] Cada fecha muestra todas sus sesiones y su cierre nocturno, si existe.
- [ ] El historial es estrictamente de lectura y no expone acciones de edición o eliminación.
- [ ] Cada ejercicio nuevo admite múltiples series ordenadas con repeticiones, peso y nota independientes.
- [ ] Un ejercicio admite duración total y distancia total opcionales.
- [ ] Los valores guardados permanecen iguales después de recargar la aplicación.
- [ ] Los registros agregados anteriores siguen siendo legibles y se identifican como anteriores.
- [ ] `Esfuerzo de la sesión`, `Estado al terminar` y `Cierre del día` aparecen como conceptos separados.
- [ ] Varias sesiones del mismo día se representan sin sobrescribirse.
- [ ] Las nuevas tablas y consultas respetan Auth y RLS.
- [ ] Pruebas unitarias, E2E, lint, typecheck y build terminan correctamente.
- [ ] La experiencia funciona sin desbordamientos en móvil, tablet y escritorio.

## Fuera de alcance

- editar o eliminar sesiones anteriores
- editar o eliminar cierres nocturnos
- calendario mensual
- plantillas o rutinas reutilizables
- copiar automáticamente una sesión anterior
- temporizadores de descanso
- gráficos de progresión por serie o ejercicio
- unidades distintas de kilogramos y kilómetros
- recomendaciones clínicas automáticas

## Preguntas abiertas

No quedan preguntas funcionales bloqueantes para pasar a planificación. Cualquier cambio de alcance debe actualizar primero esta especificación.
