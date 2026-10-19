# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
# Reglas de trabajo con git (OBLIGATORIAS para todo agente: Claude, agy u otro)

Varios agentes trabajan **a la vez y en paralelo** sobre este repo. Por eso:

- **Siempre se trabaja en una rama/lane propia**, nunca en `dev` ni en `main`.
- **A `dev` se entrega por Pull Request. No se mergea a `dev` en local y no se hace `push` a `dev`.**
- **Antes de empezar cualquier trabajo se sincroniza `dev`** (el local y el de `origin`), para que cada tarea arranque con todo lo que hizo antes cualquier otro agente.

Los tres scripts de `scripts/` hacen cumplir esto: `nueva-lane.sh` (empezar), `abrir-pr.sh` (entregar) y `limpiar-lane.sh` (cerrar). Usalos; si no podés, seguí los pasos manuales de más abajo.

## El ciclo completo

```bash
# 1. EMPEZAR (desde ordo-diei/): sincroniza dev y crea la lane
bash scripts/nueva-lane.sh 250 descripcion-corta
cd ../ordo-diei-lanes/lane-250 && npm install

# 2. TRABAJAR: commits solo en la rama task/lane-250-...
git add <paths> && git commit -m "feat(modulo): descripcion (lane 250)"

# 3. ENTREGAR (desde el worktree, todo commiteado): trae origin/dev, valida, publica y abre el PR a dev
bash scripts/abrir-pr.sh                      # opcional: -t "titulo" -b archivo-con-el-cuerpo.md

# 4. El PR lo integra el usuario en GitHub. Después, CERRAR (desde ordo-diei/):
bash scripts/limpiar-lane.sh 250
```

## Reglas

1. **El directorio principal (`ordo-diei/`) es solo un espejo de `origin/dev`.** Queda siempre en `dev`, sin commits propios y sin cambios sin commitear. Nunca hagas `git checkout`/`git switch` ahí ni trabajes ahí: puede haber otro agente o el `next dev` del usuario usándolo. Lo único que se le hace es traerle lo nuevo: `git fetch origin --prune && git merge --ff-only origin/dev`.
2. **Antes de crear un worktree, `dev` tiene que estar sincronizado**: el `dev` local y `origin/dev` deben ser el mismo commit. `scripts/nueva-lane.sh` lo hace por vos:
   - `origin/dev` tiene commits nuevos (otro agente integró un PR) → se actualiza el local con `--ff-only`.
   - El `dev` local tiene commits que no están en `origin/dev` → **hay trabajo sin publicar**; el script se detiene. Publicalo primero con un PR (ver «Trabajo local sin publicar») y recién después empezá otra tarea.
   - Recién con ambos iguales se crea la rama y el worktree.
3. **Cada tarea es una lane con su propia rama y su propio worktree**, creados desde `dev` ya sincronizado. Esto vale para todo cambio, también los chicos (docs, una línea) y también para quien orquesta. El número de lane es el siguiente libre: mirá `git branch -a --list '*task/lane-*'`, `ls vault/LANE_*` y `gh pr list --base dev` (ya hubo colisiones). Manual:
   ```bash
   git fetch origin --prune && git merge --ff-only origin/dev   # en ordo-diei/
   git worktree add -b task/lane-NN-descripcion ../ordo-diei-lanes/lane-NN dev
   cd ../ordo-diei-lanes/lane-NN && npm install
   ```
4. **Commits solo en la rama `task/...`**, nunca directo en `dev` ni en `main`. Agregá solo los archivos de tu lane (`git add <paths>`), nunca `git add -A` a ciegas.
5. **Entregar = Pull Request con base `dev`**, siempre con `scripts/abrir-pr.sh` (desde tu worktree, con todo commiteado). El script, en este orden: trae `origin/dev` a tu rama (`git merge origin/dev`; los conflictos se resuelven en tu lane, **conservando el trabajo de ambos lados**) → corre `npm test` y `tsc --noEmit` con `dev` ya incluido → `git push -u origin <tu-rama>` → `gh pr create --base dev`. Si el PR ya existe, solo actualiza la rama.
   - **Prohibido**: merge local a `dev`, `git push origin dev`, `git push origin <rama>:dev`, push forzado, PR a `main`, y en `dev`: `git reset`, `git rebase`, `git commit --amend`, `git revert` de merges ajenos, `git checkout <rama> -- <archivo>` o cualquier reescritura de historia. El único `push` permitido es el de tu rama `task/...`.
   - **El agente no mergea su propio PR** salvo que el usuario se lo pida. Lo integra el usuario (o quien él indique) en GitHub con **«Create a merge commit»** (no squash, no rebase), para que la rama quede como ancestro de `dev` y la limpieza y las sincronizaciones sean exactas.
   - Si el script falla, **no lo esquives**: arreglá lo que dice (conflicto, test roto) y reintentalo.
   - **Si resolviste un conflicto, no descartes líneas del otro lado "para que compile"**: mirá `git log origin/dev -p -- <archivo>` y mantené sus cambios. Ante la duda, no abras el PR y avisá al usuario.
6. **Mientras tu lane está abierta**, si otro PR entra a `origin/dev`, traelo a tu rama cuando te toque tocar lo mismo (`git fetch origin && git merge origin/dev`); `abrir-pr.sh` lo vuelve a hacer siempre antes de publicar.
7. **Base de datos: PROHIBIDO `npx prisma db push`.** La base de Supabase es la de producción y la comparten todas las lanes. `db push` sincroniza el esquema de *tu* rama: si a tu rama le falta un modelo de otra lane, **borra sus tablas y sus datos** sin preguntar (ya pasó: un push desde una rama de cartas habría borrado `Libros` y `Recompensas`, y uno desde `dev` habría borrado las cartas). Tampoco `prisma migrate reset` ni `--accept-data-loss`.
   - Para cambiar el esquema: editá `prisma/schema.prisma` en tu rama, hacé `git merge origin/dev`, y generá **solo el SQL que falta**:
     ```bash
     npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > /tmp/cambio.sql
     ```
   - Revisá `/tmp/cambio.sql`: **si tiene `DROP`, no lo apliques**. Significa que a tu rama le falta trabajo de otros; volvé a hacer `git merge origin/dev` o dejalo pendiente para el orquestador.
   - Si solo agrega (`CREATE`, `ADD COLUMN`), aplicalo con `npx prisma db execute --file /tmp/cambio.sql` y después `npx prisma generate`.
   - Si no estás seguro, **no toques la base**: dejá anotado en el vault qué SQL falta y avisá al orquestador.
   - Los tests que escriben en la base real se saltean salvo `PERMITIR_TESTS_DB=1`; no lo actives sin que lo pida el usuario.
8. Al terminar, registrá la lane en el vault (`vault/LANE_NN_*.md`, dentro de la misma rama para que viaje con el PR).
9. **Después de que el PR se integró**, limpiá (lo hace quien lo abrió, desde `ordo-diei/`): `bash scripts/limpiar-lane.sh NN`. Verifica que tu rama ya está en `origin/dev`, actualiza el `dev` local con `--ff-only`, quita el worktree y borra la rama con `-d` (no `-D`: si git dice que no está mergeada, no la borres). Si el worktree tiene cambios sin commitear, no lo fuerces: avisá.

## Trabajo local sin publicar (caso excepcional)

Si encontrás commits en el `dev` local que no están en `origin/dev` (herencia del flujo anterior, que mergeaba en local), **no hagas `git push origin dev`**. Se publican por PR igual que todo lo demás:

```bash
git worktree add -b task/lane-NN-sync-dev-local ../ordo-diei-lanes/lane-NN dev   # la rama nace con esos commits
cd ../ordo-diei-lanes/lane-NN && bash scripts/abrir-pr.sh
```

Cuando el PR se integra con «Create a merge commit», el `dev` local queda contenido en `origin/dev` y se actualiza con `git merge --ff-only origin/dev`. Si el `dev` local y `origin/dev` divergieron (cada uno con commits que el otro no tiene), no los mezcles a mano: avisá al usuario.
