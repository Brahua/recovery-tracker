# Spec: CI/CD automático → Vercel (Supabase staging)

## Objective

Añadir un pipeline de CI/CD que, en cada push a `main`, valide la calidad del
código y despliegue la app a **Vercel** apuntando **exclusivamente a Supabase
staging** (proyecto vinculado `pevrupenrzueyzidfeah`).

- **Usuario**: el equipo de desarrollo (deploy sin pasos manuales).
- **Éxito**: un merge a `main` que pase los gates queda publicado en Vercel con
  las migraciones de staging aplicadas, sin intervención humana.

### Success Criteria (testables)

1. Push a `main` dispara un workflow de GitHub Actions.
2. El deploy **solo** ocurre si pasan: `lint`, `typecheck`, unit tests (vitest),
   E2E (Playwright) y `next build`.
3. Los E2E corren contra **Supabase local (Docker)** en CI — nunca contra staging.
4. Las migraciones de `supabase/migrations/` se aplican a **staging** como parte
   del deploy (`supabase db push --linked`).
5. La app desplegada usa las env vars de Supabase **staging** (no local, no prod).
6. Ningún secreto queda en el repo; todo vive en GitHub Secrets / Vercel env.
7. Un PR (sin merge) corre los gates pero **no** despliega.

## Tech Stack

- Next.js `16.2.10` (App Router) + React `19.2.4`
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — proyecto staging ya vinculado
- Tests: `vitest ^4`, `@playwright/test ^1.61`
- CI: GitHub Actions (`ubuntu-latest`, Node 20)
- CD: Vercel CLI (`vercel pull` / `vercel build` / `vercel deploy --prebuilt`)

## Commands

```
Lint:       npm run lint
Typecheck:  npm run typecheck
Unit tests: npm test
E2E:        npm run e2e:critical
Build:      npm run build
DB (local): npx supabase start && npx supabase db reset
DB (staging): npx supabase db push --linked
```

## Project Structure

```
.github/workflows/ci-cd.yml   → pipeline CI + deploy (NUEVO)
supabase/migrations/          → migraciones aplicadas a staging
supabase/config.toml          → config Supabase local
scripts/sync-supabase-local-env.mjs → genera .env.local desde supabase local
tests/e2e/                    → specs Playwright (modo demo, sin OAuth real)
tasks/                        → spec, plan y todo (este directorio)
```

## Code Style

YAML de GitHub Actions: jobs con nombres explícitos, `needs:` para dependencias,
sin `run` multilínea innecesario. Ejemplo de gate:

```yaml
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
```

## Testing Strategy

- **Unit (vitest)**: gate rápido, sin Supabase. `npm test`.
- **E2E (Playwright)**: levanta Supabase local con Docker en el runner
  (`npx supabase start` aplica migraciones + seed), genera `.env.local` con
  `supabase:env:local`, instala browser chromium, corre `e2e:critical`. Los
  tests usan **modo demo** (`Explorar en modo demo`), así que no requieren OAuth.
- El deploy depende (`needs`) de que **ambos** jobs pasen.

## Boundaries

- **Always**: correr todos los gates antes del deploy; mantener secretos fuera
  del repo; E2E solo contra Supabase local.
- **Ask first**: cambiar el trigger a previews/prod; añadir dependencias; tocar
  `supabase/config.toml`; cambiar qué migraciones se aplican.
- **Never**: correr E2E o `db reset` contra staging; commitear tokens/passwords;
  desplegar si un gate falla.

## Secrets requeridos (GitHub repo → Settings → Secrets)

| Secret | Uso |
|---|---|
| `VERCEL_TOKEN` | auth de Vercel CLI |
| `VERCEL_ORG_ID` | scope del proyecto Vercel |
| `VERCEL_PROJECT_ID` | proyecto Vercel destino (staging) |
| `SUPABASE_ACCESS_TOKEN` | auth de `supabase db push --linked` |
| `SUPABASE_DB_PASSWORD` | password DB staging para `db push` |

> Las env vars públicas (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
> `NEXT_PUBLIC_SITE_URL`) se configuran en el **proyecto Vercel** (staging) y se
> obtienen con `vercel pull` en el build. El `project ref` de staging
> (`pevrupenrzueyzidfeah`) puede ir hardcodeado o como secret.

## Open Questions

1. ¿El `project ref` de staging va como secret o hardcodeado en el YAML? (asumo hardcodeado — no es secreto).
2. ¿Vercel debe usar alias de producción del proyecto (`--prod`) o dejar cada deploy como URL única? (asumo `--prod` para tener una URL estable de staging).
3. ¿Quién crea el proyecto en Vercel y carga los secrets? (asumo: tú, manualmente, antes del primer run).
