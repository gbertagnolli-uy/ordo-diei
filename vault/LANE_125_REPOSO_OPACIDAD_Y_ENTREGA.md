# Lane 125 — Opacidad del velo, credenciales de Unsplash y entrega de R1–R3 / L1–L9

Pedido (2026-10-14): «Usa mas opacidad en vez de elegir las fotos con parte de abajo oscura» + credenciales de Unsplash a guardar en `.env` + «No implementes, solo documenta y deja marcado el trabajo para que lo implemente otro agente». Texto completo (con las claves omitidas) en `vault/nuevas-features/DECISIONES.md` §11. Solo documentación.

## Hecho
- D54–D56 en `DECISIONES.md` §11; D45 anotada como modificada.
- `liturgia/SPEC.md` §10.2, §13 y §14: overlay `from-black/70 via-black/30 to-transparent`; la legibilidad se resuelve subiendo la opacidad, no eligiendo fotos.
- `idle-marco-fotos/SPEC.md` §4.2 y §5: mismo criterio; variables de entorno, tema Nature `6sMVjTLSkeQ`, cabeceras, límite demo verificado; `ConfigReposo.unsplashTema`.
- `lanes/LANES.md`: tabla de estado (todas «⏳ lista para implementar»), R2 sin el paso de crear la app.
- `lanes/PROMPT_REPOSO_LITURGIA.md`: prompt de entrega para el agente que implemente.
- `.env` del directorio principal (fuera de git): `UNSPLASH_APP_ID`, `UNSPLASH_ACCESS_KEY`, `UNSPLASH_SECRET_KEY`. Copia previa del `.env` en el scratchpad de la sesión.

## Verificado
- `GET https://api.unsplash.com/topics/nature` con la Access Key: HTTP 200, `x-ratelimit-limit: 50` (modo demo), tema `6sMVjTLSkeQ` con 34 659 fotos.
- `.env*` está en `.gitignore`; las claves no aparecen en ningún archivo versionado.

## Pendiente
- Cargar `UNSPLASH_ACCESS_KEY` en las variables de entorno de Vercel (lo hace el usuario).
- N4 (detector de inactividad) no está implementado y es requisito de R3.
