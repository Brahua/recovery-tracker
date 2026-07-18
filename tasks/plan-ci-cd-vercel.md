# Plan: CI/CD → Vercel (Supabase staging)

Ref: `tasks/spec-ci-cd-vercel.md`

## Arquitectura del pipeline (`.github/workflows/ci-cd.yml`)

```
push a main  ─┬─► job: quality  (lint + typecheck + unit)     ┐
              └─► job: e2e      (supabase local + playwright)  ┴─► job: deploy
PR           ─┴─► quality + e2e  (SIN deploy)                       (solo main)
```

### Job 1 — `quality`
1. checkout → setup-node 20 (cache npm) → `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`

### Job 2 — `e2e`
1. checkout → setup-node 20 → `npm ci`
2. `npx supabase start` (Docker en el runner; aplica migraciones + seed)
3. `npm run supabase:env:local` (genera `.env.local` apuntando a local)
4. `npx playwright install --with-deps chromium`
5. `npm run e2e:critical`
6. subir traces de Playwright como artifact si falla

### Job 3 — `deploy` (`needs: [quality, e2e]`, solo `push` a `main`)
1. checkout → setup-node 20 → `npm ci`
2. **Migraciones staging**: `npx supabase link` + `npx supabase db push --linked`
   (env: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`; ref `pevrupenrzueyzidfeah`)
3. **Vercel**:
   - `npx vercel pull --yes --environment=production --token=$VERCEL_TOKEN`
   - `npx vercel build --prod --token=$VERCEL_TOKEN`
   - `npx vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN`
   (`VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` los consume `vercel pull`)

## Orden de implementación

1. **Prerrequisitos manuales (usuario)** — crear proyecto Vercel, cargar 5 secrets,
   configurar las 3 env vars públicas de Supabase staging en Vercel. *Bloquea el
   primer deploy real, no la escritura del workflow.*
2. **Workflow YAML** — se escribe y commitea sin los secrets; los gates corren
   igual; solo el job `deploy` falla hasta que existan.
3. **Verificación** — parse del YAML, PR de prueba (gates verdes, sin deploy),
   merge para observar migración + URL viva.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `supabase start` lento/flaky en CI | timeout explícito; subset `e2e:critical` |
| E2E flaky (dev server) | `reuseExistingServer`, traces en fallo como artifact |
| `db push` rompe staging | gate previo obligatorio; staging es desechable |
| Secrets faltantes al primer run | checklist en el spec; deploy falla claro |
| Deploy antes de migrar | migración corre **antes** que `vercel deploy` en el mismo job |

## Paralelizable vs secuencial

- `quality` y `e2e` corren en **paralelo**.
- `deploy` es **secuencial** tras ambos; dentro de deploy: migración → build → deploy es estricto.

## Checkpoints de verificación

- [ ] Parse del YAML sin errores (`actionlint` o similar).
- [ ] PR de prueba: gates verdes, sin deploy.
- [ ] Merge a main: migración aplicada + URL de Vercel viva apuntando a staging.
