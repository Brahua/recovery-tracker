# Spec: design system CSS (dividir `globals.css` y tokenizar)

Estado: **implementada (2026-10-01)** — PRs #14 (división), #15 (limpieza del tema claro) y fase 2 (tokens + `design:check`). Aprobada con estas decisiones: se borran las 3 clases sin uso en un commit aparte y el chequeo no revisa estilos inline de TSX. Plan: `tasks/plan-design-system-css.md`; tareas: `tasks/todo-design-system-css.md`. Backlog: "Dividir `globals.css`" en `docs/ideas/recovery-ritual-backlog.md`.

## Objetivo

`src/app/globals.css` tiene 7.204 líneas (136 KB) en un solo archivo: tokens, base, componentes compartidos y los estilos de las 9 pantallas, con colores sueltos repartidos por todo el archivo. Encontrar o cambiar un estilo cuesta, y es fácil romper otra pantalla o volver a meter un color con contraste insuficiente (ya pasó 3 veces con `--rr-text-dim`).

Queremos un design system como el de `brahua-os`: tokens en un lugar, estilos compartidos separados de los de cada pantalla, y una regla automática que impida colores sueltos fuera de los tokens.

**Usuario:** quien mantiene el código (el owner y los agentes). **La app no cambia para quien la usa.**

### Criterios de aceptación

1. `src/app/globals.css` solo contiene `@import "tailwindcss"`, el `@source` y los `@import` del design system, en orden.
2. Los estilos viven en `src/design-system/styles/`, divididos en tokens, base, componentes compartidos y una carpeta por pantalla (estructura abajo). Ningún archivo supera ~800 líneas.
3. **Fase 1 (división):** el CSS compilado por Tailwind antes y después es **equivalente** (mismo contenido salvo espacios y comentarios). Verificado con un script, no a ojo.
4. **Fase 2 (tokens):** fuera de `tokens/` no queda ningún color literal (`#…`, `rgb(…)`, `rgba(…)`), ni curva `cubic-bezier(…)`, ni `font-family` con nombre de fuente. Los valores compilados, con los tokens resueltos, son **idénticos** a los de antes (mismos colores, mismas sombras, mismas curvas).
5. Un chequeo (`npm run design:check`) falla si aparece un valor suelto fuera de `tokens/`, y corre en CI.
6. CI en verde: lint, typecheck, unitarios, E2E críticos con axe.
7. Documentación: un `README` corto en `src/design-system/` (dónde va cada cosa y cómo agregar un token), y `AGENTS.md`/`HANDOFF` actualizados.

### Fuera de alcance

- Cambios visuales de cualquier tipo (salvo que aparezca un bug, que se trata aparte).
- Sincronizar con el proyecto de Claude Design (lockfile tipo `brahua-os`): queda en el backlog como fase 3.
- Pasar estilos a clases de Tailwind o a CSS Modules; se mantiene CSS global con prefijo `rr-`.
- Modo claro.

## Datos medidos (2026-10-01)

| Qué | Cantidad |
|---|---|
| Líneas / reglas de nivel superior / `@media` | 7.204 / 736 / 21 (14 de escritorio `min-width: 64rem`) |
| Clases `rr-*` definidas / sin uso en `src/` | 291 / 3 (`rr-card--featured`, `rr-card--paper`, `rr-control`) |
| Tokens `--rr-*` definidos / usos de `var(--rr-*)` | 48 / 570 |
| Hex sueltos fuera de `:root` | 44 (20 distintos; p. ej. `#e5a087` ×8, `#12100e` ×7) |
| `rgb()/rgba()` sueltos fuera de `:root` | 248 (133 distintos sobre ~15 colores base: ink `244,239,231` ×73, ink secundario `232,226,214` ×43, acento ×26, noche ×20, dolor ×17…) |
| `cubic-bezier` | 9 (2 curvas) |
| `font-family` | 43 (todas `var(--font-…)` + fallback) |
| Estilos inline en TSX | 7 (anchos dinámicos; quedan igual) |

El archivo ya está ordenado aproximadamente por pantalla (shell → Hoy → Registrar → … → catálogo → rutinas → feedback → skeleton), y cada pantalla trae su propio `@media` de escritorio. Las reglas con selectores duplicados son solo 2.

**Prueba de concepto hecha:** dividir el archivo en dos con `@import` y compilar con `@tailwindcss/postcss` (0,2 s, ~110 MB, sin `next build`) da un CSS equivalente al original.

## Tech stack

- Next.js 16.2 (App Router), Tailwind CSS 4 vía `@tailwindcss/postcss`; Tailwind resuelve los `@import` locales al compilar.
- CSS global con clases `rr-*` y variables `--rr-*`; `@theme inline` expone algunos tokens a Tailwind.
- Fuentes con `next/font` (`--font-archivo`, `--font-instrument-sans`).

## Estructura

```
src/app/globals.css                  @import "tailwindcss" + @source + @import del design system (en orden)
src/design-system/
  README.md                          dónde va cada cosa, cómo agregar un token
  styles/
    tokens/
      colors.css                     colores con nombre + canales RGB para transparencias
      typography.css                 familias (--rr-font-display, --rr-font-body), escalas si aplica
      motion.css                     curvas (--rr-ease-*) y duraciones repetidas
      shadows.css                    sombras
      radius.css                     radios (ya existen como --rr-radius-*)
      spacing.css                    medidas de layout (ancho de contenido, sidebar, barra móvil)
      theme.css                      @theme inline (puente a Tailwind)
    base.css                         html, body, encabezados, utilidades base
    animations.css                   @keyframes compartidos
    components/                      piezas usadas en varias pantallas
      card.css  button.css  kicker.css  modal-sheet.css  combobox.css
      pain-slider.css  toast.css  progress.css  skeleton.css
    surfaces/                        una por pantalla o flujo
      shell.css  today.css  registrar.css  closeout.css  success.css
      insights.css  report.css  history.css  landing.css
      exercises.css  routines.css
```

Los nombres finales salen del corte real del archivo (plan). Regla: **el orden de los `@import` respeta el orden original de las reglas**; en la fase 1 cada archivo es un tramo contiguo del original, para no alterar la cascada.

## Estilo de código

```css
/* tokens/colors.css */
:root {
  --rr-ink: #f4efe7;
  --rr-ink-rgb: 244 239 231;          /* canales para transparencias */
  --rr-pain-soft: #e5a087;            /* antes suelto ×8 */
}

/* surfaces/history.css — después de la fase 2 */
.rr-history-day {
  border: 1px solid rgb(var(--rr-ink-rgb) / 0.08);   /* antes: rgba(244, 239, 231, 0.08) */
  color: var(--rr-text-muted);
}
```

- Transparencias: canal RGB del token + alfa (`rgb(var(--rr-x-rgb) / α)`), en vez de 133 tokens distintos. Las transparencias que se repiten mucho y tienen un significado (bordes, lavados) ya tienen o tendrán token con nombre (`--rr-border`, `--rr-wash`…).
- Tokens con nombre semántico (`--rr-pain-soft`), no por valor (`--rr-orange-2`).
- Texto pequeño sobre fondo oscuro: `--rr-text-muted` o más claro; `--rr-text-dim` y `--rr-text-faint` solo para glifos decorativos (`docs/HANDOFF.md`).
- Un comentario de una línea al inicio de cada archivo: qué contiene.

## Comandos

```bash
npm run lint && npm run typecheck && npm test        # en la PC, antes de commitear
npm run design:check                                 # nuevo: falla si hay valores sueltos fuera de tokens/
node scripts/design-system/compare-css.mjs <base> <nuevo>   # nuevo: compila con Tailwind y compara (equivalencia / valores resueltos)
```

`next build` y E2E corren en CI (límites de la PC en `AGENTS.md`). El script de comparación compila con PostCSS + Tailwind en ~0,2 s y está permitido en la PC.

## Estrategia de pruebas

| Nivel | Qué prueba | Dónde |
|---|---|---|
| Equivalencia del CSS compilado | Fase 1: mismo CSS salvo espacios/comentarios. Fase 2: mismo CSS con los tokens resueltos a sus valores | `scripts/design-system/compare-css.mjs`, contra una línea base generada desde `main` antes de empezar |
| Unitario | El chequeo de valores sueltos detecta hex, `rgb(a)`, `cubic-bezier` y fuentes fuera de `tokens/`, y permite `tokens/` | `scripts/design-system/*.test.mjs` (en `npm test`) |
| E2E + axe | Las pantallas siguen funcionando y sin violaciones WCAG A/AA | CI (`e2e:critical`) |
| Visual | No hace falta captura por captura: la equivalencia del CSS compilado lo garantiza. Revisión rápida del owner en producción al final | Manual |

## Límites

- **Siempre:** comparar el CSS compilado después de cada tarea; mantener el orden de la cascada; un PR por fase; CI en verde antes del merge.
- **Preguntar antes:** cualquier cambio que altere el CSS compilado (aunque sea un bug evidente); borrar las 3 clases sin uso; agregar dependencias (por ejemplo `stylelint`); cambiar nombres de clases `rr-*`.
- **Nunca:** cambiar valores visuales "de paso"; reordenar reglas entre archivos en la fase 1; correr `next build` o E2E en la PC sin pedirlo.

## Criterios de éxito (resumen verificable)

- [x] `wc -l src/app/globals.css` ≤ 40 y ningún archivo de `src/design-system/styles/` > ~800 líneas.
- [x] `compare-css.mjs` da EQUIVALENTE al final de la fase 1 e IDÉNTICO (valores resueltos) al final de la fase 2.
- [x] `npm run design:check` en verde y en CI; con un `#fff` agregado a una pantalla, falla.
- [x] Sin hex, `rgb()/rgba()` literales ni `cubic-bezier` fuera de `tokens/` (lo verifica `design:check`).
- [ ] CI en verde y deploy correcto; la app se ve igual en producción.

## Decisiones

1. Las 3 clases sin uso (`rr-card--featured`, `rr-card--paper`, `rr-control`) se borran en un commit aparte (limpieza, PR B).
2. El chequeo de valores sueltos no revisa los 7 estilos inline de TSX (son anchos dinámicos).
3. Hallazgo posterior: bloque legado de clases sin `rr-` y `src/components/ritual-success-state.tsx` sin uso; se limpian en el PR B. El `body` claro y el `::selection` legados cambian el CSS compilado y requieren OK del owner (tarea C3).
