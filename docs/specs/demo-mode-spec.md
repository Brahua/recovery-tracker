# Spec: modo demo

> Estado: implementada; cuentas demo creadas en producción el 2026-10-03. Falta que el owner la pruebe tras el despliegue.

## Objetivo

Que cualquiera pueda **ver la app con datos reales de una rehabilitación** sin iniciar sesión con Google ni pedir invitación, y que el owner pueda ver cómo se comporta la interfaz con mucha información.

## Qué hace

- La landing tiene un botón **Modo demo** que abre un modal con tres pacientes:

| Perfil | Lesión | Historia que cuenta |
|---|---|---|
| Camila | Rodilla izquierda, operada (artroscopia) hace 8 semanas | Fisio martes y jueves, fuerza de cuádriceps, bicicleta, caminatas; una recaída leve tras caminar de más |
| Diego | Tobillo derecho, esguince grado III hace 6 semanas | Salió de la bota; movilidad, banda y equilibrio; piscina; una torcedura a mitad del proceso |
| Lucía | Hombro derecho, manguito rotador hace 11 semanas | Tratamiento conservador; banda, movilidad y respiración; las noches mejoran más lento |

- Entrar es iniciar sesión como esa cuenta: Hoy, Registrar, Historial, Ejercicios, Insights y Reporte funcionan igual que en una cuenta real, con ~30 a 75 sesiones, ~35 a 70 cierres, catálogo de ejercicios, 2 rutinas y metas (algunas cumplidas) por paciente. Las fechas son **relativas a hoy**, así que la demo nunca se ve vieja; hoy queda libre para probar el registro.
- Un aviso arriba ("Modo demo · …", botón **Salir de la demo**) indica que la cuenta es de ejemplo. Ajustes oculta Recordatorios (no tiene sentido enviar push a una cuenta compartida).
- Cualquiera puede modificar los datos. **`npm run demo:reset` deja todo como el original.**

## Cómo funciona

- Son **tres cuentas reales de Supabase** en producción (único entorno hospedado), con emails en `demo.recovery-tracker.brahua.com`, un subdominio sin servidor de correo: nadie puede recibir correo ni entrar con Google con esas direcciones. No tienen contraseña.
- `enterDemoAction` (`src/features/demo/actions.ts`) valida el id contra los tres perfiles, pide un enlace mágico con la `service_role` (`auth.admin.generateLink`) y lo canjea en el acto (`verifyOtp`), así la cookie de sesión queda puesta sin enviar ningún correo. Exige que la cuenta exista y tenga `app_metadata.demo_profile`: `generateLink` crearía un usuario si faltara, y eso no debe pasar.
- La marca de demo vive en **`app_metadata.demo_profile`**, que el usuario no puede editar (a diferencia de `user_metadata`).
- No hay migración. La lista de perfiles está en `src/lib/demo/profiles.ts` (sin imports: el script la carga con `node`).

## Reiniciar la demo

```bash
npm run demo:reset                    # los tres perfiles
npm run demo:reset -- --only knee     # uno (knee, ankle o shoulder)
npm run demo:reset -- --dry-run       # arma los datos y muestra los conteos, no escribe
```

- Necesita `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (shell o `.env.local`). Sin guardar la clave en un archivo: `SUPABASE_SERVICE_ROLE_KEY="$(npx supabase projects api-keys --project-ref pevrupenrzueyzidfeah -o json | python3 -c 'import sys,json; print(next(k["api_key"] for k in json.load(sys.stdin) if k["name"]=="service_role"))')" npm run demo:reset`.
- Por perfil: crea la cuenta si falta (agrega su email a `access_allowlist` solo mientras la crea, por el hook de invitaciones), borra todo lo que tenga `user_id` de esa cuenta (sesiones con sus ejercicios, series y tratamientos, cierres, rutinas, metas, catálogo, suscripciones push y recordatorios), restablece nombre, lesión, apariencia y onboarding, y vuelve a cargar los datos (`scripts/demo/seed-data.mjs`).
- **Solo toca las tres cuentas demo** (se buscan por email); nunca otro usuario. Es idempotente y determinista: los datos son los mismos cada vez, solo se corren las fechas.
- Los datos pasan por un test que revisa cada fila contra las restricciones de la base (`scripts/demo/seed-data.test.mjs`).

## Límites conocidos

- La cuenta es compartida: dos visitantes a la vez ven los cambios del otro.
- Cualquiera puede escribir en la base de producción **dentro de esas tres cuentas** (RLS las aísla del resto). No hay límite de uso: si hubiera abuso, mirar el firewall de Vercel o programar el reinicio.
- El reinicio es manual. Programarlo (GitHub Actions con `schedule` y el secret `SUPABASE_SERVICE_ROLE_KEY`) queda como mejora.
- `ENABLE_DEMO_MODE` y la sesión anónima siguen siendo solo para desarrollo y E2E ("Sesión de prueba anónima" en la landing); no tienen relación con el modo demo.
