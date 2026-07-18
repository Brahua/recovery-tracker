# Todo: CI/CD → Vercel (Supabase staging)

Ref: `tasks/plan-ci-cd-vercel.md`

## Prerrequisitos manuales (usuario — fuera del repo)

- [ ] Task 0: Provisionar Vercel + secrets
  - Acceptance: proyecto Vercel creado y vinculado; 5 GitHub Secrets cargados
    (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SUPABASE_ACCESS_TOKEN`,
    `SUPABASE_DB_PASSWORD`); 3 env vars públicas de Supabase staging configuradas
    en el proyecto Vercel.
  - Verify: `vercel env ls` muestra las 3 vars; GitHub → Settings → Secrets lista los 5.
  - Files: ninguno (config externa).

## Implementación (repo)

- [x] Task 1: Crear el workflow de gates + deploy
  - Acceptance: `.github/workflows/ci-cd.yml` con jobs `quality`, `e2e`, `deploy`;
    `deploy` con `needs: [quality, e2e]` e `if` restringido a push a `main`.
  - Verify: parse del YAML sin errores; los tres jobs aparecen en la pestaña Actions.
  - Files: `.github/workflows/ci-cd.yml`

- [x] Task 2: Job `quality` (lint + typecheck + unit)
  - Acceptance: corre `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` en Node 20.
  - Verify: job verde en un push de prueba.
  - Files: `.github/workflows/ci-cd.yml`

- [x] Task 3: Job `e2e` con Supabase local
  - Acceptance: `npx supabase start` aplica migraciones; `.env.local` generado con
    `supabase:env:local`; chromium instalado; `e2e:critical` pasa; traces subidos en fallo.
  - Verify: job verde; artifact de traces disponible si un test falla.
  - Files: `.github/workflows/ci-cd.yml`

- [x] Task 4: Job `deploy` (migración staging + Vercel)
  - Acceptance: `supabase db push --linked` aplica migraciones a staging **antes**
    de `vercel deploy --prebuilt --prod`; solo en push a `main`.
  - Verify: merge de prueba → migración aplicada en dashboard Supabase + URL Vercel viva.
  - Files: `.github/workflows/ci-cd.yml`

- [x] Task 5: Documentar el pipeline (docs/deployment.md)
  - Acceptance: README (o `docs/`) describe secrets requeridos, trigger y que apunta
    solo a staging.
  - Verify: la sección existe y lista los 5 secrets + 3 env vars.
  - Files: `README.md` (o `docs/deployment.md`)

## Gate final

- [ ] PR de prueba: `quality` + `e2e` verdes, sin deploy.
- [ ] Merge a `main`: deploy completo verificado (migración + URL staging).
