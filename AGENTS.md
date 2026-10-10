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
4. **Integrar a `dev` es con merge local, no con push**: `git merge --no-ff task/lane-NN-...` hacia `dev`. Nunca `git push origin <rama>:dev`, nunca push forzado a `dev`, nunca PR a `main`.
   - El merge a `dev` lo hace el orquestador, salvo que el prompt de la lane diga otra cosa.
   - Antes de mergear: `git -C ordo-diei status` tiene que estar limpio. Si otro agente tiene cambios sin commitear ahí, **esperá**.
5. **Antes de empezar o de integrar**, traé lo último de `dev` a tu rama (`git merge dev` dentro de tu worktree), sobre todo antes de tocar `prisma/schema.prisma`.
6. **Base de datos compartida:** nunca `prisma db push` desde una rama a la que le falten modelos de otras lanes, porque borraría sus tablas. Primero `git merge dev`. Revisá con `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` que no haya `DROP`. Si los hay, aplicá solo el SQL aditivo con `prisma db execute`.
7. Al terminar: registrá la lane en el vault (`vault/`) y dejá el worktree para que el orquestador lo limpie.
<!-- END:git-workflow-rules -->
