# Despliegue (CI/CD → Vercel · Supabase producción)

Flujo trunk-based, igual que en `brahua-os`:

- Cada cambio va en una rama corta (`feat/…`, `fix/…`, `chore/…`, `docs/…`) con un PR contra `main`. En el PR solo corre CI.
- Cada push a `main` vuelve a correr todos los checks y, **solo si todos pasan**, migra la base de producción y despliega a producción.
- El auto-deploy de Vercel por Git está apagado (`vercel.json` → `git.deploymentEnabled: false`). GitHub Actions es el único que despliega; no hay previews.
- Durante el MVP se trabaja directo sobre producción. Los tests usan un Supabase desechable (local en Docker o en el runner de CI), **nunca** el de producción.

Decisión: `docs/decisions/ADR-004-promote-staging-to-production.md`.

## Datos del entorno

| Qué | Valor |
|---|---|
| URL pública | https://recovery-tracker.brahua.com |
| URL de Vercel (sigue funcionando) | https://recovery-tracker-brahua-lab.vercel.app |
| Proyecto de Vercel | `brahua-lab/recovery-tracker` |
| Proyecto de Supabase | `pevrupenrzueyzidfeah` (antes `recovery-tracker-staging`; ahora es producción) |
| Workflow | `.github/workflows/ci-cd.yml` |
| Node | 24 (`.nvmrc`) |

## Pipeline

```
PR (cualquier rama) ─┬─ quality  (lint · typecheck · vitest)
                     └─ e2e      (Supabase local en Docker · Playwright e2e:critical)

push a main ─────────┬─ quality
                     ├─ e2e
                     └─ deploy   (solo si los dos anteriores pasan)
                          1. revisa que existan los secrets
                          2. supabase db push  → migraciones en producción
                          3. vercel pull / build / deploy --prebuilt --prod
```

- Los runs de PR se cancelan si llega un commit nuevo; los de `main` nunca, porque pueden estar desplegando.
- Solo corre un deploy a la vez (`concurrency: deploy-production`), en el orden de los merges.
- Si la migración falla, el job falla y la app no se despliega con un esquema viejo.
- La CLI de Vercel está fijada a `vercel@61.1.0`, igual que en `brahua-os`.

## Cambios con migraciones

1. Rama corta + PR. CI aplica todas las migraciones a su propio Supabase y corre los E2E, sin desplegar.
2. Las migraciones deben ser **aditivas**. Algo destructivo (borrar columnas, tablas o datos) necesita el OK del owner y un backup antes.
3. Opcional antes del merge: `npm run supabase:push:dry` (enlazado a producción) debe listar solo la migración nueva.
4. Merge con CI en verde. El job `deploy` aplica la migración y luego despliega la app.

Nunca editar una migración ya aplicada en producción; agregar una nueva.

## Secrets de GitHub

Repo → Settings → Secrets and variables → Actions. El job `deploy` falla al inicio si falta alguno.

| Secret | Para qué |
|---|---|
| `VERCEL_TOKEN` | Autenticación de la CLI de Vercel (https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Scope de Vercel (`team_…`) |
| `VERCEL_PROJECT_ID` | Proyecto de Vercel (`prj_…`) |
| `SUPABASE_ACCESS_TOKEN` | `supabase link` / `db push` |
| `SUPABASE_DB_PASSWORD` | Contraseña de la base de producción para `db push` |

Los secrets se cargan desde una terminal normal o desde la web de GitHub: `gh secret set` desde el `!` de la sesión de Claude los guarda vacíos.

## Variables de entorno en Vercel

Project → Settings → Environment Variables. Deben ser de tipo **config** (antes "encrypted"), **no** *sensitive/secret*: las variables `NEXT_PUBLIC_*` se leen en el build y con *sensitive* el build sale sin ellas y la app da 500.

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pevrupenrzueyzidfeah.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key del proyecto (`sb_publishable_…`) |
| `NEXT_PUBLIC_SITE_URL` | `https://recovery-tracker.brahua.com` |

Como `NEXT_PUBLIC_*` se incrusta en el build, cambiar una de estas variables requiere un deploy nuevo.

## Dominio `recovery-tracker.brahua.com`

- Agregado al proyecto de Vercel con `vercel domains add recovery-tracker.brahua.com recovery-tracker`.
- El DNS de `brahua.com` está en Hostinger (nameservers `dns-parking.com`), no en Vercel. Registro necesario:

  | Tipo | Nombre | Valor |
  |---|---|---|
  | `CNAME` | `recovery-tracker` | `29be00a8d3fe7ba0.vercel-dns-017.com.` |

  El valor exacto lo da `vercel domains verify recovery-tracker.brahua.com`.
- Vercel emite el certificado HTTPS solo cuando el DNS ya apunta a Vercel.

## URLs de Auth en Supabase

Google OAuth vuelve a través de Supabase, que valida la URL de retorno. Si la URL no está en la lista, Supabase usa la **Site URL** del proyecto (antes era `http://localhost:3000` y mandaba a los usuarios a un localhost muerto).

Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://recovery-tracker.brahua.com`
- **Redirect URLs**:
  - `https://recovery-tracker.brahua.com/**`
  - `https://recovery-tracker-brahua-lab.vercel.app/**` (mientras se use la URL de Vercel)
  - `http://localhost:3000/**` (solo si se quiere hacer login local contra producción)

En Google Cloud Console no hay que cambiar nada: el callback de Google es el de Supabase (`https://pevrupenrzueyzidfeah.supabase.co/auth/v1/callback`).

## Login anónimo

El login anónimo existía solo para los E2E. Los E2E ya no tocan este proyecto (usan Supabase local, donde `supabase/config.toml` lo habilita), así que en producción debe estar **apagado**: Dashboard → Authentication → Sign In / Providers → Anonymous Sign-Ins. La app además oculta la entrada de demo si no está `ENABLE_DEMO_MODE`, que nunca se define en Vercel.

## Protección del deploy

Vercel Authentication está desactivada para que la URL sea pública. La seguridad la dan el login de Google y el RLS de Supabase.

## Deploy manual (arranque o depuración)

Replica lo que hace CI, después de aplicar las migraciones:

```bash
npx vercel@61.1.0 pull --yes --environment=production
npx vercel@61.1.0 build --prod
npx vercel@61.1.0 deploy --prebuilt --prod
```
