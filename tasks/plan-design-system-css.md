# Plan: design system CSS

Spec: `docs/specs/design-system-css-spec.md` (aprobada el 2026-10-01, con: borrar las 3 clases sin uso en un commit aparte; el chequeo no revisa estilos inline de TSX).

## Hallazgos al preparar el plan

- **Bloque legado (líneas ~5144–5327):** clases sin prefijo `rr-` de antes del rediseño (`.app-shell`, `.page-frame`, `.primary-button`, `.bottom-nav`, `.success-banner`…). Casi todas sin uso. Las únicas usadas lo son por `src/components/ritual-success-state.tsx`, que **no se importa en ningún lado** (código muerto, con los 8 colores `bg-[#…]` sueltos de TSX).
- Ese bloque redefine **`body`** con el tema claro viejo (`--background: #f5f3ea` + degradados claros) y **`::selection`** (resaltado dorado). `body` sí se aplica; hoy queda tapado por el shell y `html` es oscuro, pero quitarlo cambia el CSS compilado → **requiere OK del owner** (tarea C3).

## Componentes y dependencias

```
T1 herramienta de comparación + línea base (main)
 └─ Fase 1 — división (PR A)
     T2 tokens/base/componentes/shell/hoy → T3 registrar/éxito/cierre → T4 insights/reporte/landing/legado/historial → T5 ejercicios/rutinas/feedback/skeleton + globals.css + README
 └─ Limpieza (PR B, chico)
     C1 código muerto TSX + clases sin uso → C2 bloque legado sin uso → C3 body/::selection legados (con OK)
 └─ Fase 2 — tokens (PR C)
     T6 tokens por archivo + canales RGB + comparación con valores resueltos → T7 hex → T8 rgba → T9 curvas y fuentes → T10 design:check en CI + docs
```

Todo es secuencial: cada tarea parte del CSS de la anterior y se compara contra la línea base.

## Fase 1: corte por tramos contiguos

El orden de los `@import` en `globals.css` reproduce el orden original. La carpeta de un archivo no afecta la cascada; el orden del `@import` sí. Por eso piezas compartidas que hoy están en medio del archivo (sheet, combobox) pueden vivir en `components/` siempre que se importen en su posición original.

Corte previsto (líneas aproximadas; el corte exacto cae siempre al final de una regla de nivel superior, con su `@media` de escritorio dentro del mismo archivo):

| Archivo | Líneas actuales | Contenido |
|---|---|---|
| `tokens/root.css` | 4–92 | `:root` tal cual (la fase 2 lo divide) |
| `tokens/theme.css` | 94–107 | `@theme inline` |
| `base.css` | 109–141 | `html`, `body`, encabezados, display, kicker |
| `components/primitives.css` | 143–225 | card, button, control |
| `surfaces/shell.css` | 227–529 | shell, sidebar, navegación móvil |
| `surfaces/today.css` | 531–1137 | Hoy |
| `surfaces/registrar.css` + `surfaces/session-exercises.css` | 1139–2121 | formulario de sesión (se parte en dos por tamaño) |
| `surfaces/success.css` | 2123–2513 | sesión guardada, racha, animaciones de éxito |
| `surfaces/closeout.css` | 2515–3500 | día cerrado y cierre nocturno (se parte si pasa de ~800) |
| `surfaces/insights.css` | 3502–4012 | Insights |
| `surfaces/report.css` | 4014–4584 | Reporte |
| `surfaces/landing.css` | 4586–5142 | Landing |
| `legacy.css` | 5144–5327 | bloque legado (se vacía en la limpieza) |
| `surfaces/history.css` | 5329–6130 | Historial |
| `surfaces/exercises.css`, `components/modal-sheet.css`, `components/combobox.css` | 6132–6866 | catálogo y editor de ejercicios |
| `surfaces/routines.css` | 6868–7004 | Rutinas |
| `components/feedback.css` | 7006–7139 | barra de progreso y toasts |
| `components/skeleton.css` | 7141–7204 | skeleton de rutas |

## Fase 2: tokens

- `tokens/root.css` se divide en `colors.css`, `typography.css`, `motion.css`, `shadows.css`, `radius.css` (varios bloques `:root` equivalen a uno).
- Colores con alfa: `--rr-<color>-rgb: R G B` y `rgb(var(--rr-<color>-rgb) / α)`; ~15 canales cubren los 248 `rgba`.
- Los 20 hex distintos pasan a tokens con nombre semántico.
- `cubic-bezier` → `--rr-ease-out` (0.22, 1, 0.36, 1) y `--rr-ease-soft` (0.2, 0.8, 0.2, 1).
- Fuentes → `--rr-font-display` y `--rr-font-body`.
- La comparación de la fase 2 resuelve `var(--rr-*)` a su valor y normaliza `rgb(R G B / α)` ↔ `rgba(R, G, B, α)` antes de comparar.

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Cambiar la cascada al reordenar | Fase 1 solo con tramos contiguos importados en el mismo orden; comparación del CSS compilado tras cada tarea |
| Un `@import` mal resuelto en producción | La prueba de concepto ya compiló con Tailwind; además CI hace `next build` y E2E sobre el build |
| La fase 2 cambia un color por error | Comparación con valores resueltos: cualquier diferencia de color, sombra o curva aparece |
| Equivalencia "por normalización" que oculte un cambio real | La normalización solo quita comentarios y espacios; se revisa el diff crudo cuando haya duda |
| Tamaño de los PR | Fase 1 = solo movimientos (el diff de `git` con detección de movimientos lo muestra); fase 2 por archivo de pantalla |

## Checkpoints

- **Tras T5 (PR A):** comparación EQUIVALENTE contra la línea base; lint/typecheck/test; CI verde; merge y deploy.
- **Tras C3 (PR B):** el diff del CSS compilado solo contiene reglas borradas (listadas en el PR); CI verde.
- **Tras T10 (PR C):** comparación IDÉNTICA con valores resueltos; `design:check` en CI; CI verde; revisión rápida del owner en producción.
