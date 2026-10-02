# ADR-005: Acceso por invitación con un hook de Supabase Auth

## Estado

Aceptada el 2026-10-01. Spec: `docs/specs/access-onboarding-personalization-spec.md`.

## Contexto

La app entra solo con Google (ADR-002), pero cualquier cuenta de Google puede crear una cuenta. Al principio el owner la compartirá con pocas personas; más adelante quiere abrirla a cualquiera con Google sin rehacer nada.

Supabase Auth no tiene una lista de correos permitidos. Las opciones eran filtrar en la app (después del login), apagar los registros y crear las cuentas a mano, o usar el hook `before_user_created`, que corre en la base antes de crear cada usuario.

## Decisión

- **Hook `before_user_created` en Postgres** (`public.before_user_created_hook`). Corre solo al crear un usuario, nunca al iniciar sesión con uno existente.
- **Modo de acceso** en `public.app_access_settings` (una fila): `invite_only` exige que el correo esté en `public.access_allowlist`; `open` deja pasar cualquier cuenta. Si falta la fila, se comporta como `invite_only`.
- El rechazo devuelve 403 con el mensaje `not_invited`. Supabase redirige a `/auth/callback?error=access_denied&error_description=not_invited`, y la app muestra `/auth/auth-code-error?reason=not_invited` con "Intentar con otra cuenta" (selector de cuentas de Google).
- Los usuarios anónimos pasan: producción los tiene apagados y los E2E los usan.
- Las tablas tienen RLS sin políticas y sin privilegios para `anon`/`authenticated`. Solo el hook y, en el PR 2, funciones de admin (`security definer`, rol en `app_metadata.role = "admin"`) las tocan.

## Alternativas

- **Filtrar en la app después del login:** la cuenta igual se crea y la API de Supabase (con la publishable key, que es pública) quedaría abierta. Rechazada.
- **Apagar los registros y crear cuentas a mano:** obliga al owner a usar el panel para cada persona y no permite abrir el acceso con un interruptor. Rechazada.

## Consecuencias

- El hook se activa en `supabase/config.toml` (local) y en el proyecto de producción por la Management API, **después** de que la migración exista allí; activado sin la función, todo registro nuevo falla. Pasos en `docs/deployment.md` → "Acceso por invitación".
- Quitar un correo de la lista no expulsa a quien ya tiene cuenta: para eso, "Ban user" en el panel de Supabase.
- Abrir el acceso es cambiar `mode` a `open`, sin desplegar.
- Pruebas pgTAP en `supabase/tests/` corren en CI (`npx supabase test db`).
