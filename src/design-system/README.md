# Design system (CSS)

Estilos globales de Recovery Ritual, con clases `rr-*` y variables `--rr-*`. La fuente visual es el proyecto de Claude Design (`docs/design/claude-design-reference.md`). Spec: `docs/specs/design-system-css-spec.md`.

## Estructura

```
src/app/globals.css          solo @import "tailwindcss", @source (excluye docs/, tasks/ y scripts/) y los @import de abajo, EN ORDEN
styles/
  tokens/                    variables --rr-* y el puente a Tailwind (@theme inline)
  base.css                   html, body, encabezados
  components/                piezas usadas en varias pantallas (tarjetas, botones, sheet, combobox, feedback, skeleton)
  surfaces/                  una por pantalla o flujo (shell, Hoy, Registrar, cierre, Insights, Reporte, Historial, landing, ejercicios, rutinas)
```

## Reglas

- **El orden de los `@import` en `globals.css` es el orden de la cascada.** La carpeta de un archivo no importa; su posición en la lista sí. Para un estilo nuevo, agrégalo al archivo de su pantalla; si una regla debe ganarle a otra de otro archivo, súbele especificidad en vez de reordenar imports.
- Cada archivo empieza con un comentario de una línea que dice qué contiene, y su `@media` de escritorio (`min-width: 64rem`) va en el mismo archivo.
- Colores, sombras y curvas: usa tokens `--rr-*`. Texto pequeño sobre fondo oscuro: `--rr-text-muted` o más claro; `--rr-text-dim` y `--rr-text-faint` solo para glifos decorativos (axe en E2E lo controla).

## Comprobar que un cambio de CSS no altera nada

Para refactors (mover reglas, renombrar archivos, pasar valores a tokens):

```bash
npm run -s css:compare -- snapshot /tmp/base.css     # antes de empezar, desde main
# … cambios …
npm run -s css:compare -- compare /tmp/base.css            # mismo CSS salvo comentarios y espacios
npm run -s css:compare -- compare /tmp/base.css --resolve  # mismos valores con los tokens resueltos
```

Compila con `@tailwindcss/postcss` en ~0,2 s, sin `next build`.
