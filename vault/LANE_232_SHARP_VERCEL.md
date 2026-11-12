# Lane 232 — sharp en Vercel (500 en /dashboard y /api/archivos)

## Pedido
"en producción en vercel, la app solo funciona hasta la pantalla de login, al hacer login da error 500"
y luego los logs de Vercel con `ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.7: cannot open shared object file`.

## Causa
`sharp` (usado en `src/lib/archivos.ts` y las rutas de cartas) se carga como módulo externo. El trazado de
archivos de Next/Turbopack no copiaba la librería nativa de `@img/sharp-libvips-linux-x64` al bundle de la
función, así que en Vercel fallaba cada ruta que importa `sharp` (incluido `/dashboard`).
`npm install` y `prisma generate` ya corrían bien (`postinstall`); el lockfile ya traía los binarios linux-x64.

## Cambio
`next.config.mjs`: `outputFileTracingIncludes["/*"]` incluye `@img/sharp-linux-x64` y `@img/sharp-libvips-linux-x64`.
Verificado con `next build`: ambos aparecen en los `.nft.json` de `/dashboard` y `/api/archivos/[clave]`.

## Pendiente
Redeploy en Vercel tras integrar a `dev` y confirmar que el login ya no da 500.
