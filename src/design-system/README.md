# Design system (CSS)

Estilos globales de Recovery Ritual, con clases `rr-*` y variables `--rr-*`. La fuente visual es el proyecto de Claude Design (`docs/design/claude-design-reference.md`). Spec: `docs/specs/design-system-css-spec.md`.

## Estructura

```
src/app/globals.css          solo @import "tailwindcss", @source (excluye docs/, tasks/, scripts/, public/ y este README: su texto generaría utilidades) y los @import de abajo, EN ORDEN
styles/
  tokens/                    variables --rr-*: colors, typography, motion, shadows, radius, spacing; theme.css = puente a Tailwind
  base.css                   html, body, encabezados
  components/                piezas usadas en varias pantallas (tarjetas, botones, sheet, combobox, feedback, skeleton, edición de registros)
  surfaces/                  una por pantalla o flujo (shell, Hoy, Registrar, cierre, Insights, Reporte, Historial, landing, ejercicios, rutinas)
```

## Reglas

- **El orden de los `@import` en `globals.css` es el orden de la cascada.** La carpeta de un archivo no importa; su posición en la lista sí. Para un estilo nuevo, agrégalo al archivo de su pantalla; si una regla debe ganarle a otra de otro archivo, súbele especificidad en vez de reordenar imports.
- Cada archivo empieza con un comentario de una línea que dice qué contiene, y su `@media` de escritorio (`min-width: 64rem`) va en el mismo archivo.
- **Fuera de `tokens/` no hay valores sueltos**: ni hex, ni `rgb()/rgba()` literales, ni `cubic-bezier()`, ni `font-family` con nombre de fuente. `npm run design:check` lo verifica y corre en CI.
- Texto pequeño sobre fondo oscuro: `--rr-text-muted` o más claro; `--rr-text-dim` y `--rr-text-faint` solo para glifos decorativos (axe en E2E lo controla).

## Tokens

| Archivo | Qué define | Ejemplo de uso |
|---|---|---|
| `tokens/colors.css` | Colores de marca, texto, superficies, lavados y bordes; colores con nombre; canales RGB | `color: var(--rr-pain-soft)` · `border: 1px solid rgb(var(--rr-ink-rgb) / 0.08)` |
| `tokens/typography.css` | Familias tipográficas | `font-family: var(--rr-font-display)` |
| `tokens/motion.css` | Curvas de animación | `transition: transform 200ms var(--rr-ease-out)` |
| `tokens/shadows.css` | Sombras y brillos | `box-shadow: var(--rr-shadow-cta)` |
| `tokens/radius.css` | Radios | `border-radius: var(--rr-radius-card)` |
| `tokens/spacing.css` | Medidas de layout | `padding-bottom: var(--rr-bottom-nav-offset)` |

**Transparencias:** en vez de un token por cada alfa, usa el canal del color: `rgb(var(--rr-accent-rgb) / 0.22)`. Si una transparencia se repite y tiene un significado (borde, lavado, tinte), dale un token con nombre en `colors.css`.

### Agregar un token

1. Busca si ya existe uno con el mismo valor o el mismo significado en `tokens/`.
2. Si no, agrégalo al archivo de su tipo con un **nombre semántico** (`--rr-pain-soft`, no `--rr-orange-2`). Para un color que también se usa con transparencia, agrega su canal `--rr-<nombre>-rgb: R G B`.
3. `npm run design:check` y, si fue un refactor, `npm run -s css:compare -- compare <base> --resolve`.

## Comprobar que un cambio de CSS no altera nada

Para refactors (mover reglas, renombrar archivos, pasar valores a tokens):

```bash
npm run -s css:compare -- snapshot /tmp/base.css     # antes de empezar, desde main
# … cambios …
npm run -s css:compare -- compare /tmp/base.css            # mismo CSS salvo comentarios y espacios
npm run -s css:compare -- compare /tmp/base.css --resolve  # mismos valores con los tokens resueltos
```

Compila con `@tailwindcss/postcss` en ~0,2 s, sin `next build`.
