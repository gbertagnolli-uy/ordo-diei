# Lane 240 / 241 — Instructivo Rápido de Git, NPM, Prisma y Base de Datos Local (`GUIA_GIT_RAPIDA.md`)

## Resumen
Se agregó y amplió `GUIA_GIT_RAPIDA.md` en la raíz del repositorio con la guía rápida y pragmática de comandos para:
1. Descargar cambios de `origin/dev` en el repositorio local (`git fetch`, `git pull --ff-only`, `npx prisma generate`) y publicar `dev` a GitHub (`git push origin dev`).
2. Reproducir la base de datos de Supabase en local para ver exactamente lo mismo que los usuarios en producción:
   - **Modo A**: conexión directa de lectura a Supabase con el `.env` actual.
   - **Modo B**: clonado completo de estructura y datos actuales (`schema=family_tasker`) en solo lectura (`pg_dump`) hacia un PostgreSQL local en Docker (`ordo-pg-local`) y ejecución de `npm run dev` contra esa copia sin modificar producción ni `.env`.
3. Tabla de comandos útiles de Prisma (`generate`, `studio`, `validate`, `format`, `db pull --print`, `migrate diff` + `db execute`).
4. Tabla de comandos útiles de NPM (`dev`, `test`, `tsc --noEmit`, `lint`, `build`, `start`, `imagenes`, `companeros`, `heroes`, `liturgia:generar`, `reposo:frases`).
5. Ciclo de vida completo de lanes con `git worktree` y `scripts/integrar.sh`.
