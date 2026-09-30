# ADR-004: Convertir staging en producción y desplegar con trunk-based

## Estado

Aceptada el 2026-09-30.

## Contexto

Desde julio de 2026 solo existía un entorno hospedado, llamado `staging` (Supabase `pevrupenrzueyzidfeah` y https://recovery-tracker-brahua-lab.vercel.app). Producción estaba pospuesta a propósito, pero en la práctica `staging` ya guardaba los datos reales del único usuario y era la app que se usaba a diario. Mantener un segundo proyecto de producción vacío no aportaba nada y el nombre confundía.

`brahua-os` ya usa un flujo más simple: un solo entorno de producción en un subdominio de `brahua.com`, deploy desde GitHub Actions solo con todos los checks en verde, y tests siempre contra una base desechable.

## Decisión

- El proyecto de Supabase `pevrupenrzueyzidfeah` pasa a ser **producción**. No se crea otro proyecto.
- La app se publica en **https://recovery-tracker.brahua.com** (CNAME en el DNS de `brahua.com` hacia Vercel). La URL `*.vercel.app` sigue funcionando.
- Flujo trunk-based, igual que `brahua-os`:
  - ramas cortas y PR contra `main`, solo con CI;
  - cada push a `main` corre los checks y, solo si pasan, aplica las migraciones y despliega a producción;
  - los runs de `main` nunca se cancelan y los deploys van de uno en uno;
  - el auto-deploy de Vercel por Git está apagado, sin previews.
- Los tests (unitarios y E2E) nunca usan producción: CI levanta Supabase local y en local se usa `npm run supabase:start`.
- El login anónimo, que solo servía para los E2E, se apaga en producción.
- Las migraciones son aditivas; algo destructivo necesita el OK del owner y un backup.
- Node 24 (`.nvmrc`) en CI, igual que en Vercel y en `brahua-os`.

## Consecuencias

- Un entorno menos que mantener y un solo lugar con datos reales.
- No hay un entorno intermedio para probar migraciones con datos reales: la red de seguridad es CI (migraciones sobre un Supabase limpio + E2E) y que las migraciones sean aditivas.
- El desarrollo local contra el proyecto hospedado escribe datos reales. Para experimentar se usa Supabase local.
- Documentos de antes de esta fecha (specs, handoffs, `tasks/`) dicen "staging"; se dejan como registro histórico.

## Evidencia

- `.github/workflows/ci-cd.yml`, `vercel.json`, `.nvmrc`
- `docs/deployment.md`
