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
PR (cualquier rama) ─┬─ quality  (lint · design:check · typecheck · vitest)
                     └─ e2e      (Supabase local en Docker · Playwright e2e:critical)

push a main ─────────┬─ quality
                     ├─ e2e
                     └─ deploy   (solo si los dos anteriores pasan)
                          1. revisa que existan los secrets
                          2. npm run supabase:push:linked (ALLOW_PROD_DB=1) → migraciones en producción
                          3. vercel pull / build / deploy --prebuilt --prod
```

- Los runs de PR se cancelan si llega un commit nuevo; los de `main` nunca, porque pueden estar desplegando.
- Solo corre un deploy a la vez (`concurrency: deploy-production`), en el orden de los merges.
- Si la migración falla, el job falla y la app no se despliega con un esquema viejo.
- La CLI de Vercel está fijada a `vercel@61.1.0` y las acciones de GitHub (`checkout`, `setup-node`, `upload-artifact`) en `@v7`, igual que en `brahua-os`.
- `e2e:critical` incluye `tests/e2e/accessibility.spec.ts` (axe, WCAG 2.1 A/AA).

## Cambios con migraciones

1. Rama corta + PR. CI aplica todas las migraciones a su propio Supabase y corre los E2E, sin desplegar.
2. Las migraciones deben ser **aditivas**. Algo destructivo (borrar columnas, tablas o datos) necesita el OK del owner y un backup antes.
3. Opcional antes del merge: `npm run supabase:push:dry` (enlazado a producción) debe listar solo la migración nueva.
   `npm run supabase:push` y `supabase:push:linked` se niegan a escribir en un proyecto hospedado sin `ALLOW_PROD_DB=1` (`scripts/check-db-target.mjs`); solo el job `deploy` lo define.
4. Merge con CI en verde. El job `deploy` aplica la migración y luego despliega la app.

Nunca editar una migración ya aplicada en producción; agregar una nueva.

### Chequeo de drift del esquema

`.github/workflows/schema-drift.yml` corre los lunes a las 08:00 (Lima), y también a mano desde Actions → "Schema drift" → Run workflow. Compara el esquema `public` de producción con `supabase/migrations/` (`supabase db diff --linked`, solo lectura) y falla si difieren: algo se cambió fuera de una migración, por ejemplo desde el dashboard. El resumen del run muestra el SQL de la diferencia; hay que convertirlo en una migración nueva o revertir el cambio en producción. Usa los mismos secrets de Supabase que el deploy.

## Secrets de GitHub

Repo → Settings → Secrets and variables → Actions. El job `deploy` falla al inicio si falta alguno.

| Secret | Para qué |
|---|---|
| `VERCEL_TOKEN` | Autenticación de la CLI de Vercel (https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Scope de Vercel (`team_…`) |
| `VERCEL_PROJECT_ID` | Proyecto de Vercel (`prj_…`) |
| `SUPABASE_ACCESS_TOKEN` | `supabase link` / `db push` / chequeo de drift. Token de **proyecto** (solo `recovery-tracker-staging`), nombre `github-actions-recovery-tracker`, **vence en un año** (ver "Vencimientos") |
| `SUPABASE_DB_PASSWORD` | Contraseña de la base de producción para `db push` |

Los secrets se cargan desde la web de GitHub, una terminal normal o, si los configura Claude, por `stdin` sin imprimirlos: `gh secret set` desde el `!` de la sesión de Claude los guarda vacíos.

GitHub nunca muestra el valor de un secret, solo su fecha de actualización (`gh secret list`). Para comprobar que funcionan sin desplegar: rama temporal con un workflow `on: push` solo para esa rama que haga un `GET https://api.supabase.com/v1/projects/<ref>` con el token y `supabase link` + `supabase db push --linked --dry-run`; luego borrar la rama. Así se verificó el 2026-10-01.

## Variables de entorno en Vercel

Project → Settings → Environment Variables. Deben ser de tipo **config** (antes "encrypted"), **no** *sensitive/secret*: las variables `NEXT_PUBLIC_*` se leen en el build y con *sensitive* el build sale sin ellas y la app da 500.

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pevrupenrzueyzidfeah.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key del proyecto (`sb_publishable_…`) |
| `NEXT_PUBLIC_SITE_URL` | `https://recovery-tracker.brahua.com` |

Como `NEXT_PUBLIC_*` se incrusta en el build, cambiar una de estas variables requiere un deploy nuevo.

### Notificaciones push (recordatorios)

| Variable | Entornos | Tipo | Valor |
|---|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Production (y Preview/Development si se quiere) | config | Clave pública VAPID |
| `VAPID_PRIVATE_KEY` | Production | **sensitive** | Clave privada VAPID |
| `VAPID_SUBJECT` | Production | config | `mailto:` del owner |

Configuradas el 2026-10-01. Para regenerarlas, Claude las genera y carga con comandos que **nunca imprimen los valores** (directo por `stdin` a `vercel env add --type secret`); a mano, en una terminal normal:

```bash
npx web-push generate-vapid-keys
```

y se cargan en Vercel → Project → Settings → Environment Variables, o con `vercel env add <NOMBRE> production` (`--sensitive` para la privada). Sin estas variables `/ajustes` muestra "Las notificaciones todavía no están configuradas en el servidor" y el resto de la app funciona igual. Cambiar las claves invalida las suscripciones existentes: cada dispositivo tiene que volver a activar las notificaciones.

### Envío programado de recordatorios

Cada 5 minutos, `pg_cron` en Supabase ejecuta `public.dispatch_reminders()`, que hace `POST https://recovery-tracker.brahua.com/api/reminders/dispatch` con `Authorization: Bearer <secreto>`. El endpoint (con `service_role`) decide a quién avisar y envía. Sin los secretos de Vault la función no hace nada (así es en local y en CI).

| Dónde | Nombre | Tipo / valor |
|---|---|---|
| Vercel (Production) | `SUPABASE_SERVICE_ROLE_KEY` | **sensitive** · Supabase → Project Settings → API → `service_role` |
| Vercel (Production) | `REMINDERS_DISPATCH_SECRET` | **sensitive** · `openssl rand -base64 32` |
| Supabase Vault | `reminders_dispatch_secret` | el mismo valor que `REMINDERS_DISPATCH_SECRET` |
| Supabase Vault | `reminders_dispatch_url` | `https://recovery-tracker.brahua.com/api/reminders/dispatch` |

Configurado el 2026-10-01. Vault se carga con la API de administración de Supabase o desde el SQL Editor; el valor nunca va al repo ni se muestra en la conversación:

```sql
select vault.create_secret('https://recovery-tracker.brahua.com/api/reminders/dispatch', 'reminders_dispatch_url', 'Reminders endpoint');
select vault.create_secret('<EL_MISMO_SECRETO_DE_VERCEL>', 'reminders_dispatch_secret', 'Bearer secret for the reminders endpoint');

-- Para cambiarlo más adelante (y actualizar Vercel con el mismo valor):
-- select vault.update_secret((select id from vault.secrets where name = 'reminders_dispatch_secret'), '<NUEVO_SECRETO>');
```

Diagnóstico (SQL Editor, solo lectura):

```sql
-- ¿Corre el cron?
select status, return_message, start_time
from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'dispatch-reminders')
order by start_time desc limit 10;

-- ¿Qué respondió el endpoint? (200 con contadores, 401 secreto distinto, 503 falta configurar Vercel)
select status_code, content, created from net._http_response order by created desc limit 10;

-- ¿Qué se envió?
select * from public.reminder_deliveries order by sent_at desc limit 20;
```

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

## Proveedores de Auth en producción

Solo **Google** está activo (verificado el 2026-10-01). Dashboard → Authentication → Sign In / Providers:

| Proveedor | Estado | Por qué |
|---|---|---|
| Google | ✅ activo | Único login de la app (ADR-002) |
| Email | ❌ apagado | La app no lo usa; con la publishable key (pública) cualquiera podría registrarse por la API |
| Anonymous Sign-Ins | ❌ apagado | Solo servía para E2E; ahora usan Supabase local, donde `supabase/config.toml` lo habilita. Activo, cualquiera podría crear usuarios basura con la publishable key |

La app además oculta la entrada de demo si no está `ENABLE_DEMO_MODE`, que nunca se define en Vercel.

## Acceso por invitación

Solo se crean cuentas de correos invitados (ADR-005). Lo aplica el hook `before_user_created` (`public.before_user_created_hook`, migración `20261004000000_access_control.sql`).

- **Modo:** `select mode from public.app_access_settings;` → `invite_only` (por defecto) u `open`. Abrir a cualquier cuenta de Google: `update public.app_access_settings set mode = 'open';` (o desde Ajustes → Acceso).
- **Invitar:** Ajustes → Acceso (solo la cuenta admin). Por SQL: `insert into public.access_allowlist (email) values (lower('persona@gmail.com'));`.
- **Quitar el acceso a alguien que ya entró:** quitarlo de la lista no basta; Dashboard → Authentication → Users → "Ban user".
- **Activar o apagar el hook en producción** (Management API, sin imprimir el token): `PATCH https://api.supabase.com/v1/projects/pevrupenrzueyzidfeah/config/auth` con `hook_before_user_created_enabled` (`true`/`false`) y `hook_before_user_created_uri` = `pg-functions://postgres/public/before_user_created_hook`. También en Dashboard → Authentication → Hooks. **Activarlo solo cuando la función ya existe en producción**; si no, falla todo registro nuevo. Las cuentas existentes no pasan por el hook.
- **Admin:** la cuenta del owner tiene `app_metadata.role = "admin"` (`update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}' where email = …;`). Las funciones de admin (`20261005000000_access_admin.sql`) lo leen de `auth.users`, así que aplica sin volver a iniciar sesión.
- **Probar:** entrar con un correo no invitado muestra "Recovery Ritual está en acceso por invitación" y no aparece en `auth.users`.

## Cabeceras de seguridad

`next.config.ts` aplica a todas las rutas `Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff` y `Permissions-Policy`, y quita `X-Powered-By`. Vercel agrega `Strict-Transport-Security`. Comprobar con `curl -sI https://recovery-tracker.brahua.com/`.

## Vencimientos y renovaciones

| Qué | Vence | Cómo renovar |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` (secret de GitHub) | **~30 sep 2027** (creado el 2026-10-01 con 1 año; la fecha exacta está en Supabase → Account → Access Tokens) | Ver abajo. Renovar **un mes antes** (inicio de septiembre de 2027) |
| Certificado HTTPS del dominio | Cada ~90 días | Automático en Vercel mientras el `CNAME` apunte a Vercel. Si el dominio deja de responder por HTTPS: `vercel certs issue recovery-tracker.brahua.com` |
| Claves VAPID, `SUPABASE_SERVICE_ROLE_KEY`, `REMINDERS_DISPATCH_SECRET` | No vencen | Solo si se filtran: VAPID → regenerar (los dispositivos vuelven a activar notificaciones); `service_role` → rotar en Supabase y actualizar Vercel; secreto del endpoint → `openssl rand -base64 32` en Vercel **y** en Vault (`vault.update_secret`) |
| `VERCEL_TOKEN` (secret de GitHub) | **No vence** (token `recovery-tracker-staging` en https://vercel.com/account/tokens, creado el 2026-07-18) | Solo si se filtra o se revoca: crear uno nuevo, actualizar el secret, revocar el viejo |

Si el token de Supabase vence, el job `deploy` falla en "Apply migrations to production Supabase" con un error de autenticación (HTTP 401) y no se publica nada; la app que ya está en producción sigue funcionando.

### Renovar `SUPABASE_ACCESS_TOKEN`

1. https://supabase.com/dashboard/account/tokens → **Generate token**:
   - Name: `github-actions-recovery-tracker`
   - Expires in: 1 año
   - Resource access: **Project** → la organización → `recovery-tracker-staging` (ref `pevrupenrzueyzidfeah`)
   - Permissions: preset **Read-only** y escritura solo en lo de migraciones dentro de **Database**
2. Copiar el valor (`sbp_…`; se muestra una sola vez).
3. https://github.com/Brahua/recovery-tracker/settings/secrets/actions → `SUPABASE_ACCESS_TOKEN` → pegar → **Update secret** (desde la web, no desde la sesión de Claude).
4. Verificar el secret con la rama temporal descrita en "Secrets de GitHub".
5. Revocar el token viejo en la misma página de Supabase.
6. Actualizar la fecha de vencimiento en esta tabla y en `docs/HANDOFF.md`.

## Protección de `main` (ruleset de GitHub)

Desde el 2026-10-02 el repo es público y `main` tiene el ruleset **"Protect main"** (Settings → Rules → Rulesets), igual al de `brahua-os`:

- No se puede borrar la rama ni hacer force-push.
- Todo cambio entra por PR (sin aprobaciones obligatorias; cualquier método de merge).
- Para mergear deben pasar los checks **"Lint · Typecheck · Unit"** y **"E2E (Supabase local + Playwright)"**. "Deploy to production" no se exige porque en los PRs se omite.
- Nadie puede saltarse las reglas (sin bypass), tampoco el owner: no se puede hacer push directo a `main`.
- La rama del PR se borra sola al mergear.

Si se renombra un job de CI, hay que actualizar el ruleset con el nombre nuevo, o los PRs quedan esperando un check que nunca llega: `gh api repos/Brahua/recovery-tracker/rulesets` para ver el id y `gh api -X PUT repos/Brahua/recovery-tracker/rulesets/<id> --input <json>` para cambiarlo.

## Protección del deploy

Vercel Authentication está desactivada para que la URL sea pública. La seguridad la dan el login de Google y el RLS de Supabase.

## Deploy manual (arranque o depuración)

Replica lo que hace CI, después de aplicar las migraciones:

```bash
npx vercel@61.1.0 pull --yes --environment=production
npx vercel@61.1.0 build --prod
npx vercel@61.1.0 deploy --prebuilt --prod
```
