# Todo: design system CSS

Spec: `docs/specs/design-system-css-spec.md` · Plan: `tasks/plan-design-system-css.md`

Verificación común: `npm run lint && npm run typecheck && npm test` y la comparación del CSS compilado. `next build` y E2E, solo en CI.

## Preparación

- [ ] T1. Herramienta de comparación y línea base
  - Acceptance: `scripts/design-system/compare-css.mjs <base.css> <nuevo.css>` compila ambos con `@tailwindcss/postcss` y compara normalizado (comentarios y espacios); modo `--resolve` para la fase 2. Línea base generada desde `main` y guardada fuera del repo.
  - Verify: test unitario del normalizador (`scripts/design-system/compare-css.test.mjs`); `compare-css` de `main` contra sí mismo da EQUIVALENTE.
  - Files: `scripts/design-system/compare-css.mjs`, `scripts/design-system/compare-css.test.mjs`, `package.json` (script `css:compare`)

## Fase 1: división (PR A)

- [ ] T2. Tokens, base, primitivas, shell y Hoy
  - Acceptance: `tokens/root.css`, `tokens/theme.css`, `base.css`, `components/primitives.css`, `surfaces/shell.css`, `surfaces/today.css`; `globals.css` los importa en orden y conserva el resto.
  - Verify: `npm run css:compare` EQUIVALENTE.
  - Files: `src/app/globals.css`, `src/design-system/styles/**`

- [ ] T3. Registrar, éxito y cierre
  - Acceptance: `surfaces/registrar.css`, `surfaces/session-exercises.css`, `surfaces/success.css`, `surfaces/closeout.css` (partido si pasa de ~800 líneas).
  - Verify: EQUIVALENTE.
  - Files: `src/app/globals.css`, `src/design-system/styles/surfaces/*`

- [ ] T4. Insights, reporte, landing, legado e historial
  - Acceptance: `surfaces/insights.css`, `surfaces/report.css`, `surfaces/landing.css`, `legacy.css`, `surfaces/history.css`.
  - Verify: EQUIVALENTE.
  - Files: `src/app/globals.css`, `src/design-system/styles/**`

- [ ] T5. Ejercicios, rutinas, feedback y skeleton; cierre de la fase
  - Acceptance: resto del archivo movido; `globals.css` ≤ 40 líneas (solo `@import` y `@source`); ningún archivo > ~800 líneas; `src/design-system/README.md`; `AGENTS.md` y `docs/HANDOFF.md` apuntan al design system.
  - Verify: EQUIVALENTE; lint/typecheck/test; PR A con CI verde → merge → deploy.
  - Files: `src/app/globals.css`, `src/design-system/**`, `AGENTS.md`, `docs/HANDOFF.md`

## Limpieza (PR B)

- [ ] C1. Código muerto y clases sin uso
  - Acceptance: se borra `src/components/ritual-success-state.tsx` (no se importa) y las clases `rr-card--featured`, `rr-card--paper`, `rr-control`.
  - Verify: typecheck/test; el diff del CSS compilado solo quita esas reglas.
  - Files: `src/components/ritual-success-state.tsx`, `src/design-system/styles/components/primitives.css`

- [ ] C2. Clases legadas sin uso
  - Acceptance: `legacy.css` sin las clases que ya nada usa (tras C1, todas salvo `body` y `::selection`).
  - Verify: el diff del CSS compilado solo quita esas reglas; búsqueda de cada clase en `src/` sin resultados.
  - Files: `src/design-system/styles/legacy.css`

- [ ] C3. `body` y `::selection` legados — **requiere OK del owner**
  - Acceptance: decisión registrada. Propuesta: borrar el `body` claro (queda el de `base.css`) y pasar `::selection` a un token del tema oscuro; `legacy.css` desaparece.
  - Verify: diff del CSS compilado acotado a esas reglas; revisión del owner en producción (selección de texto y bordes de pantalla en móvil).
  - Files: `src/design-system/styles/legacy.css`, `src/app/globals.css`, `src/design-system/styles/tokens/root.css`

## Fase 2: tokens (PR C)

- [ ] T6. Tokens por archivo y comparación con valores resueltos
  - Acceptance: `tokens/colors.css`, `typography.css`, `motion.css`, `shadows.css`, `radius.css` reemplazan a `root.css`; canales `--rr-*-rgb` para los ~15 colores con alfa; `compare-css --resolve` resuelve `var()` y normaliza `rgb()/rgba()`.
  - Verify: `--resolve` IDÉNTICO; test del resolvedor.
  - Files: `src/design-system/styles/tokens/*`, `scripts/design-system/*`

- [ ] T7. Hex sueltos → tokens con nombre
  - Acceptance: 0 hex fuera de `tokens/`.
  - Verify: `--resolve` IDÉNTICO.
  - Files: `src/design-system/styles/surfaces/*`, `components/*`, `tokens/colors.css`

- [ ] T8. `rgba()` sueltos → canales de tokens
  - Acceptance: 0 `rgb()/rgba()` literales fuera de `tokens/` (pantalla por pantalla).
  - Verify: `--resolve` IDÉNTICO tras cada archivo.
  - Files: `src/design-system/styles/surfaces/*`, `components/*`

- [ ] T9. Curvas y fuentes
  - Acceptance: 0 `cubic-bezier(` y 0 `font-family` con nombre de fuente fuera de `tokens/`.
  - Verify: `--resolve` IDÉNTICO.
  - Files: `src/design-system/styles/**`

- [ ] T10. `design:check` en CI y documentación
  - Acceptance: `scripts/design-system/check-tokens.mjs` falla con hex, `rgb(a)`, `cubic-bezier` o fuentes fuera de `tokens/`; `npm run design:check` en el job `quality`; README del design system con cómo agregar un token; spec marcada como implementada; `CHANGELOG`, `HANDOFF` y backlog actualizados.
  - Verify: test unitario del chequeo; agregar un `#fff` a una pantalla lo hace fallar; CI verde → merge → deploy → revisión del owner.
  - Files: `scripts/design-system/check-tokens.mjs`, `scripts/design-system/check-tokens.test.mjs`, `package.json`, `.github/workflows/ci-cd.yml`, `src/design-system/README.md`, docs
