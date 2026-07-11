# Recovery Tracker App — Brief para construir con Codex

## 1. Contexto del proyecto

Quiero desarrollar una aplicación web/app para llevar un registro ordenado de mi recuperación de rodilla. La idea nace porque quiero medir mejor mi dolor, ejercicios, terapias, sueño, medicación y evolución general.

La frase guía del proyecto es:

> Lo que no se mide no se controla, y lo que no se controla no se puede mejorar.

Además de ayudarme en mi recuperación, este proyecto debe servirme para mejorar mis skills como desarrollador, construir algo real con propósito y sumarlo a mi portafolio.

## 2. Objetivo principal

Crear una aplicación simple, rápida y útil para registrar diariamente variables relacionadas con la recuperación de una lesión de rodilla, visualizar tendencias y obtener insights accionables.

El objetivo no es reemplazar a un médico o fisioterapeuta, sino tener mejores datos para entender cómo responde mi rodilla a la carga, los ejercicios, el sueño, terapias y tratamientos.

## 3. Problema que resuelve

Actualmente, la recuperación se siente difícil de evaluar porque los síntomas cambian día a día. A veces hay dolor constante, a veces mejora con tratamiento, a veces empeora después del ejercicio o tras estar mucho tiempo sentado.

Sin un registro claro, es difícil saber:

- Si realmente estoy mejorando.
- Qué ejercicios me irritan.
- Qué terapias me ayudan.
- Qué relación hay entre sueño, carga y dolor.
- Si estoy progresando o estancado.
- Qué información concreta llevar al doctor o fisioterapeuta.

## 4. Principios del producto

La app debe ser:

- **Rápida:** registrar el día no debería tomar más de 2 minutos.
- **Simple:** no debe sentirse como una tarea pesada.
- **Visual:** debe mostrar progreso y tendencias con gráficos claros.
- **Accionable:** debe ayudarme a tomar mejores decisiones sobre carga, descanso y ejercicios.
- **Escalable:** debe poder crecer con más features, IA, reportes y análisis.
- **Útil para portafolio:** debe demostrar buenas prácticas de desarrollo frontend/full stack.

## 5. MVP inicial

### 5.1 Check-in diario

Formulario diario para registrar:

- Fecha.
- Dolor al despertar: 0–10.
- Dolor antes de ejercicios: 0–10.
- Dolor después de ejercicios: 0–10.
- Dolor al final del día: 0–10.
- Dolor al día siguiente relacionado con sesión anterior.
- Ubicación principal del dolor:
  - Tendón rotuliano.
  - Cara interna de la rodilla.
  - Cicatriz interna.
  - Cara externa.
  - Centro de la rodilla.
  - Pata de ganso.
  - Otro.
- Tipo de dolor:
  - Profundo.
  - Superficial.
  - Punzante.
  - Moretón/inflamación.
  - Ardor.
  - Corriente.
  - Sensibilidad al tacto.
- Horas de sueño.
- Calidad del sueño: 1–5.
- Energía: 1–5.
- Tiempo sentado prolongado.
- Minutos caminados.
- Notas libres.

### 5.2 Registro de sesiones de rehabilitación

Cada sesión debe permitir registrar:

- Fecha.
- Tipo de sesión:
  - Casa.
  - Fisioterapia.
  - Hidroterapia.
  - Gimnasio.
  - Caminata.
  - Otro.
- Ejercicios realizados.
- Series.
- Repeticiones.
- Peso/carga.
- Dolor antes/durante/después.
- Comentarios de respuesta de la rodilla.
- Si hubo rebote de dolor horas después o al día siguiente.

### 5.3 Registro de tratamientos

Registrar eventos como:

- Medicamentos.
- Infiltraciones.
- Fisioterapia.
- Descarga muscular.
- Punción seca.
- Electroestimulación.
- Ondas de choque.
- TENS/EMS.
- Frío/calor.
- Uso de pistola masajeadora.

Campos sugeridos:

- Fecha.
- Tipo de tratamiento.
- Descripción.
- Profesional o centro.
- Dolor antes.
- Dolor después.
- Efecto percibido.
- Notas.

### 5.4 Dashboard básico

Gráficos iniciales:

- Dolor promedio por día.
- Dolor al despertar vs dolor después de ejercicio.
- Horas de sueño vs dolor.
- Carga semanal de ejercicios.
- Minutos caminados por semana.
- Frecuencia de dolor por zona.
- Tendencia de dolor de los últimos 7, 14 y 30 días.

### 5.5 Insights simples

Reglas básicas sin IA al inicio:

- “Tu dolor promedio subió esta semana respecto a la anterior.”
- “Los días con menos de 6 horas de sueño tu dolor fue mayor.”
- “Después de ciertos ejercicios, el dolor al día siguiente aumenta.”
- “La zona de dolor más frecuente esta semana fue la cara interna.”
- “La carga semanal aumentó más de X% respecto a la semana anterior.”

## 6. Roadmap por fases

### Fase 1 — MVP funcional

Objetivo: poder registrar datos diarios y verlos en un dashboard simple.

Features:

- Crear check-in diario.
- Crear sesión de rehabilitación.
- Listar registros.
- Editar registros.
- Dashboard básico.
- Persistencia en base de datos.

### Fase 2 — Análisis e insights

Objetivo: encontrar patrones útiles.

Features:

- Comparar dolor semanal.
- Relacionar sueño con dolor.
- Relacionar ejercicios con dolor al día siguiente.
- Detectar picos de carga.
- Detectar semanas de estancamiento.
- Filtros por rango de fechas.
- Filtros por zona de dolor.

### Fase 3 — Reportes para doctor/fisio

Objetivo: generar información clara para consultas médicas.

Features:

- Resumen semanal.
- Resumen mensual.
- Exportar PDF.
- Exportar CSV.
- Gráficos imprimibles.
- Sección de “preguntas para mi doctor/fisio”.

### Fase 4 — IA aplicada

Objetivo: usar IA para resumir datos y encontrar patrones, sin hacer diagnóstico médico.

Features:

- Resumen semanal automático.
- Detección de posibles correlaciones.
- Recomendaciones no médicas sobre organización del registro.
- Generación de preguntas para la siguiente cita médica.
- Resumen de evolución para fisioterapeuta.

Ejemplo de output de IA:

> Esta semana tu dolor promedio fue 3.4/10, similar a la semana anterior. El dolor aumentó principalmente después de sesiones con step-ups y sentadillas. Los días con menos de 6 horas de sueño coincidieron con mayor dolor basal. La zona más reportada fue cara interna de la rodilla y cicatriz medial. Podrías comentar este patrón con tu fisioterapeuta.

### Fase 5 — Versión más completa

Ideas futuras:

- PWA instalable en celular.
- Notificaciones para check-in diario.
- Integración con wearable o Apple Health.
- Calendario de terapias.
- Biblioteca de ejercicios.
- Progresión automática de cargas.
- Modo oscuro.
- Multi-lesión o multi-parte del cuerpo.
- Multiusuario.

## 7. Stack recomendado

### Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui para componentes.
- Recharts para gráficos.
- React Hook Form para formularios.
- Zod para validaciones.

### Backend / Base de datos

Opción recomendada para MVP:

- Supabase.
- PostgreSQL.
- Supabase Auth.
- Row Level Security.

Alternativa más full stack:

- Next.js API Routes o Server Actions.
- Prisma ORM.
- PostgreSQL.
- Auth.js.

### IA

- OpenAI API o modelo compatible.
- Prompting estructurado.
- Generación de resúmenes semanales.
- Clasificación de notas libres.
- Extracción de patrones.

### Deploy

- Vercel para frontend.
- Supabase para base de datos.
- GitHub para versionamiento.

## 8. Modelo de datos inicial

### users

- id
- email
- name
- created_at

### daily_checkins

- id
- user_id
- date
- pain_morning
- pain_before_exercise
- pain_after_exercise
- pain_evening
- pain_next_day
- main_pain_location
- pain_type
- sleep_hours
- sleep_quality
- energy_level
- prolonged_sitting_minutes
- walking_minutes
- notes
- created_at
- updated_at

### rehab_sessions

- id
- user_id
- date
- session_type
- pain_before
- pain_during
- pain_after
- pain_later
- notes
- created_at
- updated_at

### rehab_exercises

- id
- session_id
- name
- sets
- reps
- load
- duration_seconds
- pain_during
- notes

### treatments

- id
- user_id
- date
- treatment_type
- description
- professional
- pain_before
- pain_after
- perceived_effect
- notes
- created_at

### weekly_summaries

- id
- user_id
- week_start
- week_end
- average_pain
- max_pain
- min_pain
- total_sessions
- total_walking_minutes
- average_sleep
- ai_summary
- created_at

## 9. Pantallas principales

### Home / Dashboard

Debe mostrar:

- Dolor promedio de la semana.
- Comparación contra semana anterior.
- Último check-in.
- Próximo recordatorio o sesión.
- Gráficos principales.
- Insight destacado.

### Nuevo check-in

Formulario rápido para registrar el día.

Debe priorizar velocidad y facilidad.

### Nueva sesión de rehab

Formulario para registrar ejercicios y respuesta de dolor.

### Tratamientos

Historial de terapias, medicamentos, infiltraciones y técnicas usadas.

### Insights

Vista con patrones detectados.

### Reportes

Resumen semanal/mensual exportable.

## 10. Oportunidades de aprendizaje técnico

Este proyecto puede ser un reto muy interesante porque combina producto real, datos, visualización, IA y buenas prácticas.

### 10.1 TypeScript avanzado

Aprendizaje:

- Tipado estricto de formularios.
- Tipos compartidos entre frontend y backend.
- Modelado de entidades.
- Tipos derivados desde esquemas Zod.

Por qué importa:

Te ayuda a escribir código más seguro y profesional.

### 10.2 Arquitectura frontend

Aprendizaje:

- Separación de componentes presentacionales y de lógica.
- Estructura por features.
- Custom hooks.
- Manejo de estados de carga/error.
- Componentes reutilizables.

Ejemplo:

- `features/checkins`
- `features/sessions`
- `features/treatments`
- `features/dashboard`

### 10.3 Formularios robustos

Aprendizaje:

- React Hook Form.
- Validaciones con Zod.
- Mensajes de error.
- Formularios dinámicos para ejercicios.
- Guardado parcial o autosave.

Reto interesante:

Crear un formulario donde puedas agregar varios ejercicios dentro de una misma sesión.

### 10.4 Base de datos relacional

Aprendizaje:

- Diseño de tablas.
- Relaciones 1:N.
- Queries con filtros por fecha.
- Agregaciones semanales.
- Índices.
- Seguridad por usuario.

Reto interesante:

Calcular tendencias semanales de dolor y carga.

### 10.5 Visualización de datos

Aprendizaje:

- Recharts.
- Line charts.
- Bar charts.
- Heatmaps simples.
- Comparaciones semana contra semana.
- Diseño de dashboards.

Reto interesante:

Crear una vista donde puedas ver claramente qué días subió el dolor y qué pasó antes.

### 10.6 Product thinking

Aprendizaje:

- Diseñar un producto útil, no solo una app bonita.
- Definir MVP.
- Priorizar features.
- Reducir fricción de uso.
- Pensar en el usuario real: tú mismo.

Pregunta clave:

> ¿Esta feature me ayuda a recuperarme o solo complica la app?

### 10.7 IA para resúmenes semanales

Esta es una de las partes más interesantes del proyecto.

La idea no es que la IA diagnostique, sino que ayude a resumir datos y detectar patrones.

#### Cómo se haría

1. Cada semana se agrupan los registros:
   - check-ins diarios;
   - sesiones de rehab;
   - tratamientos;
   - notas;
   - dolor promedio;
   - sueño promedio;
   - zonas más frecuentes de dolor.

2. Se genera un objeto JSON con esos datos.

3. Se envía a un modelo de IA con un prompt controlado.

4. La IA devuelve un resumen estructurado.

Ejemplo de prompt:

```text
Eres un asistente que ayuda a resumir datos de recuperación física. No debes diagnosticar ni reemplazar a un médico. Resume la evolución semanal, identifica patrones posibles y sugiere preguntas para comentar con el fisioterapeuta o traumatólogo.

Datos de la semana:
{{weeklyData}}

Devuelve:
1. Resumen de evolución.
2. Posibles patrones observados.
3. Señales de mejora.
4. Señales a vigilar.
5. Preguntas sugeridas para el fisioterapeuta.
```

#### Oportunidad de aprendizaje

Aquí puedes aprender:

- Prompt engineering.
- Estructuración de datos para IA.
- Uso de JSON como entrada.
- Guardado de respuestas generadas.
- Manejo de límites y costos de API.
- Cómo diseñar IA con restricciones de seguridad.
- Cómo evitar que la IA dé consejos médicos peligrosos.

#### Reto técnico

Crear una función tipo:

```ts
async function generateWeeklyRecoverySummary(userId: string, weekStart: Date, weekEnd: Date) {
  const data = await getWeeklyRecoveryData(userId, weekStart, weekEnd);
  const summary = await callAIModel(data);
  await saveWeeklySummary(userId, weekStart, weekEnd, summary);
  return summary;
}
```

### 10.8 Seguridad y privacidad

Como la app manejaría datos de salud, aunque sea personal, es buena oportunidad para aprender:

- Autenticación.
- Row Level Security.
- Protección de rutas.
- Variables de entorno.
- Buen manejo de datos sensibles.
- No exponer información personal en logs.

### 10.9 Testing

Aprendizaje:

- Unit tests para funciones de cálculo.
- Tests de componentes.
- Tests de formularios.
- Tests de queries.

Ejemplos de funciones a testear:

- Calcular dolor promedio semanal.
- Detectar aumento de dolor respecto a semana anterior.
- Detectar ejercicios asociados a mayor dolor posterior.

### 10.10 Exportación de reportes

Aprendizaje:

- Generación de PDF.
- Exportación CSV.
- Reportes imprimibles.
- Diseño de documentos útiles para médicos/fisios.

Reto interesante:

Generar un PDF con:

- Resumen semanal.
- Gráfico de dolor.
- Lista de tratamientos.
- Ejercicios que más irritaron.
- Preguntas para consulta.

### 10.11 PWA y experiencia móvil

Aprendizaje:

- Progressive Web App.
- Instalación en celular.
- Offline support.
- Local storage.
- Sincronización posterior.
- Notificaciones.

Esto es muy útil porque el registro debería hacerse rápido desde el celular.

### 10.12 Analítica personal

Aprendizaje:

- Métricas personales.
- Tendencias.
- Correlaciones simples.
- Interpretación de datos.
- Diseño de insights.

Ejemplo:

> Cuando duermo menos de 6 horas, mi dolor promedio al día siguiente sube 1.2 puntos.

## 11. Ideas de features interesantes para portfolio

### Feature 1 — Pain Heatmap

Un calendario tipo heatmap donde cada día cambia de intensidad según el dolor promedio.

Aprendizaje:

- Visualización de datos.
- UX de calendario.
- Agregación diaria.

### Feature 2 — Exercise Impact Score

Calcular qué ejercicios tienden a aumentar el dolor posterior.

Ejemplo:

- Step-up: +1.2 dolor promedio al día siguiente.
- Sentadilla parcial: +0.3.
- Puente de glúteo: -0.2.

Aprendizaje:

- Relación entre eventos y resultados posteriores.
- Análisis simple de datos.
- Algoritmos básicos de scoring.

### Feature 3 — Weekly AI Recovery Report

Resumen generado por IA cada semana.

Aprendizaje:

- IA aplicada a producto real.
- Prompting.
- Seguridad médica.
- Backend jobs.

### Feature 4 — Doctor/Fisio Mode

Vista exportable para mostrar en consulta.

Aprendizaje:

- Diseño de reportes.
- UX para usuarios secundarios.
- Exportación PDF.

### Feature 5 — Rehab Load Tracker

Medir carga semanal de rehabilitación.

Ejemplo:

- Total de series.
- Total de reps.
- Minutos caminados.
- Sesiones completadas.
- Variación semanal.

Aprendizaje:

- Métricas de entrenamiento.
- Agregación de datos.
- Prevención de picos bruscos.

### Feature 6 — Recovery Timeline

Una línea de tiempo con eventos importantes:

- Cirugía.
- Infiltraciones.
- Cambios de medicación.
- Nuevos síntomas.
- Fases de fisioterapia.
- Reevaluaciones médicas.

Aprendizaje:

- UX narrativa.
- Modelado de eventos.
- Visualización cronológica.

## 12. Métricas importantes

### Métricas de recuperación

- Dolor promedio semanal.
- Dolor máximo semanal.
- Dolor mínimo semanal.
- Dolor al despertar.
- Dolor post ejercicio.
- Dolor al día siguiente.
- Sueño promedio.
- Minutos caminados.
- Número de sesiones de rehab.
- Carga total semanal.
- Zonas de dolor más frecuentes.

### Métricas de adherencia

- Días registrados por semana.
- Sesiones completadas.
- Tratamientos registrados.
- Check-ins omitidos.

### Métricas de producto

- Tiempo promedio para crear check-in.
- Número de clicks para registrar sesión.
- Frecuencia de uso.
- Features más usadas.

## 13. Reglas de seguridad médica

La app debe dejar claro:

- No reemplaza a un médico.
- No diagnostica.
- No recomienda medicamentos.
- No indica suspender tratamientos.
- No reemplaza la fisioterapia.
- Los insights son observaciones basadas en datos, no conclusiones médicas.

La IA debe evitar frases como:

- “Tienes X lesión.”
- “Debes dejar de hacer este ejercicio.”
- “No necesitas ir al doctor.”
- “Toma este medicamento.”

Debe usar frases como:

- “Podría ser útil comentar este patrón con tu fisioterapeuta.”
- “Los datos sugieren que este ejercicio coincide con mayor dolor posterior.”
- “Este patrón merece seguimiento.”

## 14. Prompt inicial para Codex

Usar este prompt para iniciar la construcción:

```text
Quiero construir una aplicación llamada Recovery Tracker usando Next.js, TypeScript, Tailwind, shadcn/ui, Supabase y Recharts.

La app debe ayudarme a registrar mi recuperación de rodilla. Necesito un MVP con:

1. Check-in diario con dolor, sueño, energía, ubicación del dolor, tipo de dolor, tiempo sentado, caminata y notas.
2. Registro de sesiones de rehabilitación con ejercicios, series, reps, carga y dolor antes/durante/después.
3. Registro de tratamientos como fisioterapia, medicamentos, infiltraciones, TENS, punción seca, etc.
4. Dashboard con gráficos básicos de dolor, sueño, caminata, carga semanal y zonas de dolor.
5. Estructura de base de datos en Supabase.
6. Código limpio, modular y escalable.

Quiero que primero me propongas la arquitectura del proyecto, estructura de carpetas, modelo de datos y luego empecemos implementando el MVP paso a paso.
```

## 15. Prompt para agregar IA más adelante

```text
Quiero agregar una feature de resumen semanal con IA a mi app Recovery Tracker.

La IA no debe diagnosticar ni dar consejos médicos. Solo debe resumir datos, detectar posibles patrones y generar preguntas para comentar con mi fisioterapeuta o traumatólogo.

Los datos disponibles son check-ins diarios, sesiones de rehabilitación, ejercicios, tratamientos, dolor, sueño, caminatas y notas.

Ayúdame a diseñar:

1. El flujo técnico.
2. La función backend para recolectar datos semanales.
3. El prompt seguro para enviar al modelo.
4. El esquema de respuesta JSON.
5. La tabla para guardar los resúmenes.
6. La UI para mostrar el reporte semanal.
```

## 16. Versión mínima ideal para empezar

Para no abrumarme, la primera versión debe limitarse a:

- Login simple.
- Check-in diario.
- Lista de check-ins.
- Dashboard con gráfico de dolor.
- Registro básico de sesión de rehab.

Una vez que eso funcione, recién agregar:

- Tratamientos.
- Insights.
- Reportes.
- IA.

## 17. Criterio de éxito del MVP

El MVP será exitoso si:

- Puedo registrar mi día en menos de 2 minutos.
- Puedo registrar una sesión de ejercicios fácilmente.
- Puedo ver si mi dolor está subiendo, bajando o estancado.
- Puedo mostrarle datos concretos a mi fisioterapeuta o doctor.
- El proyecto me ayuda a practicar skills reales de desarrollo.

## 18. Nota personal de enfoque

Esta app debe ayudarme a recuperarme, no convertirse en otra fuente de estrés.

Es mejor construir una versión simple que use todos los días, que una app perfecta que nunca termino.

La prioridad es:

1. Registro rápido.
2. Datos útiles.
3. Visualización clara.
4. Insights simples.
5. IA y features avanzadas después.
