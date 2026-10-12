<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:git-workflow-rules -->
# Reglas de trabajo con git (OBLIGATORIAS para todo agente: Claude, agy u otro)

Varios agentes trabajan en paralelo sobre este repo. Para no pisar el trabajo de nadie:

1. **Nunca trabajes en el directorio principal** (`ordo-diei/`) ni hagas `git checkout`/`git switch` ahí. Ese directorio queda en `dev` y puede haber otro agente o el `next dev` del usuario usándolo.
2. **Cada tarea es una lane con su propia rama y su propio worktree**, creados desde `dev`:
   ```bash
   git worktree add -b task/lane-NN-descripcion ../ordo-diei-lanes/lane-NN dev
   cd ../ordo-diei-lanes/lane-NN && npm install
   ```
   Esto vale para todo cambio, también los chicos (docs, una línea) y también para quien orquesta.
3. **Commits solo en la rama `task/...`**, nunca directo en `dev` ni en `main`.
4. **Integrar a `dev` es con merge local, no con push, y SIEMPRE con `scripts/integrar.sh`** (desde tu worktree, con todo commiteado). Nunca `git merge` a mano en `ordo-diei/`, nunca `git push origin <rama>:dev`, nunca push forzado a `dev`, nunca PR a `main`.
   - El script hace, en este orden: toma un **lock** (solo un integrador a la vez, así que **no importa el orden de las lanes** ni hace falta coordinar a mano) → trae `dev` a tu rama (`git merge dev`; los conflictos se resuelven en tu lane, **conservando el trabajo de ambos lados**) → corre `lint`, `test` y `tsc` con `dev` ya incluido → comprueba que `dev` no se movió → `merge --no-ff` a `dev` → verifica que el árbol de `dev` quedó idéntico al de tu rama.
   - Como tu rama ya contiene todo `dev` al momento del merge, integrar **no puede pisar ni revertir** trabajo ajeno. Por eso solo se integra por el script.
   - Si el script falla, **no lo esquives ni mergees a mano**: arreglá lo que dice (conflicto, test roto, `dev` avanzó, otro agente integrando, `ordo-diei/` sucio) y reintentalo. Si el lock figura de otro agente, esperá; no borres `.git/integrar.lock` salvo que el proceso dueño ya no exista (el script ya lo detecta solo).
   - Cualquier agente puede integrar su propia lane (no hace falta esperar al orquestador), salvo que el prompt de la lane diga otra cosa.
   - **Si resolviste un conflicto, no descartes líneas del otro lado "para que compile"**: mirá `git log dev -p -- <archivo>` y mantené sus cambios. Ante la duda, no integres y avisá al usuario.
   - Prohibido en `dev`: `git reset`, `git rebase`, `git commit --amend`, `git revert` de merges ajenos, `git checkout <rama> -- <archivo>` y cualquier reescritura de historia. Si algo salió mal en `dev`, avisá al usuario.
5. **Antes de empezar**, y sobre todo antes de tocar `prisma/schema.prisma`, traé lo último de `dev` a tu rama (`git merge dev` dentro de tu worktree). Al integrar el script lo vuelve a hacer.
6. **Base de datos: PROHIBIDO `npx prisma db push`.** La base de Supabase es la de producción y la comparten todas las lanes. `db push` sincroniza el esquema de *tu* rama: si a tu rama le falta un modelo de otra lane, **borra sus tablas y sus datos** sin preguntar (ya pasó: un push desde una rama de cartas habría borrado `Libros` y `Recompensas`, y uno desde `dev` habría borrado las cartas). Tampoco `prisma migrate reset` ni `--accept-data-loss`.
   - Para cambiar el esquema: editá `prisma/schema.prisma` en tu rama, hacé `git merge dev`, y generá **solo el SQL que falta**:
     ```bash
     npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > /tmp/cambio.sql
     ```
   - Revisá `/tmp/cambio.sql`: **si tiene `DROP`, no lo apliques**. Significa que a tu rama le falta trabajo de otros; volvé a hacer `git merge dev` o dejalo pendiente para el orquestador.
   - Si solo agrega (`CREATE`, `ADD COLUMN`), aplicalo con `npx prisma db execute --file /tmp/cambio.sql` y después `npx prisma generate`.
   - Si no estás seguro, **no toques la base**: dejá anotado en el vault qué SQL falta y avisá al orquestador.
   - Los tests que escriben en la base real se saltean salvo `PERMITIR_TESTS_DB=1`; no lo actives sin que lo pida el usuario.
7. Al terminar: registrá la lane en el vault (`vault/`).
8. **Después de cada merge exitoso a `dev`, limpiá el worktree** (lo hace quien integró): desde `ordo-diei/`, `git worktree remove ../ordo-diei-lanes/lane-NN` y `git branch -d task/lane-NN-...`. Usá `-d`, no `-D`: si git dice que la rama no está mergeada, no la borres. Si el worktree tiene cambios sin commitear, no lo fuerces: avisá.
<!-- END:git-workflow-rules -->
