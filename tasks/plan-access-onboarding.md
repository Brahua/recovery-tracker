# Plan: acceso por invitación, onboarding y apariencia

Spec: `docs/specs/access-onboarding-personalization-spec.md`.

## Fases (un PR cada una, en orden)

```
PR 1 — Acceso por invitación (base)          (migración aditiva; activar el hook en producción tras el deploy)
  A1 migración tablas + hook → A2 pruebas SQL en CI → A3 pantalla "no invitado" → A4 ADR-005 + docs → A5 activar en producción + rol admin
PR 2 — Acceso en Ajustes (admin)             (migración aditiva: funciones de admin)
  B1 funciones de admin → B2 validación + actions → B3 sección "Acceso" → B4 E2E + docs
PR 3 — Apariencia en tema oscuro             (necesita los 3 colores de Claude Design)
  C1 tokens de acento con rgb(var()) sin cambio visual → C2 lógica de apariencia + cookie → C3 <html data-*> + 3 acentos → C4 sección "Apariencia" → C5 E2E + docs
PR 4 — Tema claro                            (paleta propuesta por el agente, revisada por el owner antes del PR)
  D1 propuesta de paleta + chequeo de contraste → D2 tokens claros + "Sistema" → D3 revisión de superficies → D4 themeColor → D5 axe en los dos temas + docs
PR 5 — Onboarding
  E1 decisión de redirigir (pura) + layout → E2 recorrido → E3 configuración rápida + action → E4 "Ver el recorrido otra vez" → E5 E2E + docs
```

Cada PR deja la app funcionando: el PR 1 ya cierra el registro (el owner sigue entrando); el PR 2 permite invitar; el PR 3 cambia el color; el PR 4 suma el tema claro; el PR 5 recibe a las cuentas nuevas.

PR 1–2 no dependen de los colores y pueden empezar ya. PR 3 espera los hex. PR 4 depende de los tokens del PR 3. PR 5 usa el selector de apariencia del PR 3–4 en la configuración rápida.

## Decisiones técnicas

- **Hook `before_user_created` en Postgres** (`public.before_user_created_hook(event jsonb) returns jsonb`): lee `event->'user'->>'email'` e `is_anonymous`; en `invite_only` sin coincidencia devuelve `{"error": {"http_code": 403, "message": "not_invited"}}`. `security definer`, `search_path = ''`, `grant execute` solo a `supabase_auth_admin`, `revoke` de `public`/`anon`/`authenticated`. Antes de escribir se revisa en la documentación de Supabase la forma exacta del evento y de la respuesta.
- **Cómo llega el rechazo a la app:** Supabase redirige al `redirectTo` con `error`/`error_description`. El callback ya registra `providerError`; se agrega `not_invited` a `src/lib/auth-callback-error.ts` cuando la descripción lo contiene. Se confirma en CI (E2E no puede hacer OAuth real): la prueba del mapeo es unitaria.
- **Activar el hook en producción:** Management API (`PATCH /v1/projects/{ref}/config/auth` con `hook_before_user_created_enabled` y `_uri`) desde la terminal, sin imprimir el token. Va **después** del deploy que crea la función; si se activa antes, todo login nuevo falla.
- **Rol admin:** `app_metadata.role = "admin"` (lo escribe solo `service_role`/SQL). Las funciones de admin leen `auth.jwt() -> 'app_metadata' ->> 'role'`. El JWT se renueva solo; tras asignar el rol, el owner cierra y abre sesión una vez.
- **"Ya entró"** en la lista: `admin_list_access()` hace un `left join` con `auth.users` por email (función `security definer`, solo devuelve email y booleano).
- **Compartir invitación:** `navigator.share` con texto y URL de `NEXT_PUBLIC_SITE_URL`; si no existe o falla, `navigator.clipboard.writeText` + toast "Invitación copiada".
- **Pruebas SQL:** `supabase/tests/*.sql` con pgTAP y un paso `npx supabase test db` en el job de E2E de CI (ya levanta Supabase local). **Cambia el CI: se pide el OK del owner en el PR 1.** Alternativa sin tocar CI: probarlo desde un E2E con el cliente local, menos directo.
- **Apariencia:** tokens por atributo (`[data-theme]`, `[data-accent]`) en `tokens/colors.css`; cookie `rr-appearance` (`theme.accent`, `SameSite=Lax`, `Secure`, 1 año, no `HttpOnly` porque no es sensible y el cliente puede aplicar la vista previa). La cuenta manda: el callback de login reescribe la cookie desde `user_metadata.preferences`.
- **Root layout dinámico:** leer `cookies()` en `src/app/layout.tsx` vuelve dinámicas todas las rutas; ya lo son por la sesión, pero `/offline` y la landing también. Se revisa en la doc de Next 16 si conviene leerla solo en `(app)/layout.tsx` y aplicar los atributos con un wrapper; decisión al implementar C3, documentada en el PR.
- **Onboarding:** `user_metadata.onboarding_completed_at`. La redirección vive en `(app)/layout.tsx`, que ya carga el usuario; `/bienvenida` queda dentro de `(app)` pero el layout no pinta el shell para esa ruta (se pasa por un segmento propio `(app)/(onboarding)/bienvenida` con su layout, a confirmar con la doc de route groups).

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Activar el hook antes de que exista la función bloquea todo login nuevo | Orden fijo: deploy → verificar la función en producción (MCP de Supabase, solo lectura) → activar → probar con un correo no invitado |
| El owner queda fuera | Las cuentas existentes no pasan por el hook (solo creación); el hook se puede apagar con la misma API |
| El tema claro rompe contraste en superficies con fondos fijos (noche, éxito) | D1 chequea contraste por token; D3 revisa cada superficie; axe en E2E en los dos temas |
| Cambio de tokens altera el tema oscuro sin querer | C1 se prueba con `css:compare --resolve` (CSS compilado sin cambios) |
| Parpadeo de tema en la PWA | El servidor pinta los atributos; sin JS para el tema inicial |

## Checkpoints

- **PR 1:** owner aprueba el paso de CI → CI verde → deploy → se activa el hook y se marca admin → un correo no invitado no crea cuenta; el owner entra.
- **PR 2:** CI verde → deploy → el owner invita un correo, lo comparte por WhatsApp y esa persona entra.
- **PR 3:** colores recibidos → CI verde (y `css:compare` sin cambios en C1) → deploy → el owner cambia de color en el iPhone y en la PC.
- **PR 4:** el owner aprueba la paleta clara (vista previa) → CI verde con axe en los dos temas → deploy → revisión en el iPhone.
- **PR 5:** CI verde → deploy → el owner pasa por el onboarding una vez.
