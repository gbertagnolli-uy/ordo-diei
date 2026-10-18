# Lane 240 — Instructivo Rápido de Git y Base de Datos Local (`GUIA_GIT_RAPIDA.md`)

## Resumen
Se agregó `GUIA_GIT_RAPIDA.md` en la raíz del repositorio con la guía rápida y pragmática de comandos para:
1. Descargar cambios de `origin/dev` en el repositorio local (`git fetch`, `git pull --ff-only`, `npx prisma generate`).
2. Publicar `dev` local hacia GitHub (`git push origin dev`).
3. Clonar estructura y datos actuales de Supabase (`schema=family_tasker`) en solo lectura hacia un PostgreSQL local en Docker (`ordo-pg-local`) y correr `npm run dev` contra esa copia sin modificar producción ni `.env`.
4. Ciclo de vida completo de lanes con `git worktree` y `scripts/integrar.sh`.
5. Aplicación segura de diffs SQL de Prisma sin `db push` y exclusión de `dump_*.sql` / `cambio.sql` en `.gitignore`.
