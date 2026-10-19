# Protocolo de trabajo con Git

Resumen para humanos. **La fuente única y completa para agentes es `AGENTS.md`** (si algo difiere, manda `AGENTS.md`).

## Objetivo
Trabajar en paralelo, varios agentes a la vez, sin sobrescribir cambios de otros y manteniendo `dev` estable.

## Reglas obligatorias

1. **Siempre se trabaja en una rama/lane propia** (`task/lane-NN-descripcion` + worktree en `../ordo-diei-lanes/lane-NN`). Nunca en `main` ni en `dev`, ni siquiera para un cambio chico.
2. **Antes de empezar, `dev` se sincroniza**: el `dev` local y `origin/dev` tienen que ser el mismo commit. Así cada tarea arranca con lo que hizo antes cualquier otro agente.
   - Si `origin/dev` tiene PRs nuevos → se actualiza el local con `git merge --ff-only origin/dev`.
   - Si el `dev` local tiene commits sin publicar → se publican primero con un PR, antes de empezar otra tarea.
3. **A `dev` se entrega por Pull Request** (base `dev`). **No se mergea a `dev` en local y no se hace `push` a `dev`.** El único `push` permitido es el de la rama `task/...` propia.
4. El PR lo integra el usuario en GitHub con **«Create a merge commit»** (no squash ni rebase), para que cada rama quede contenida en `dev`.
5. Antes de abrir el PR, la rama incorpora `origin/dev` y se corren `npm test` y `tsc --noEmit` con todo junto. Los conflictos se resuelven en la rama, conservando el trabajo de ambos lados.
6. Después de que el PR se integró, se limpia la lane y el `dev` local se actualiza.
7. No subir archivos `.env`, credenciales, claves privadas ni otros secretos.
8. Mantener los PR pequeños y limitados a una funcionalidad.
9. Prohibido `prisma db push` / `migrate reset` contra Supabase (ver `AGENTS.md`).

## Flujo de comandos

```bash
# 1. Empezar (desde ordo-diei/): sincroniza dev y crea rama + worktree
bash scripts/nueva-lane.sh 250 descripcion-corta
cd ../ordo-diei-lanes/lane-250 && npm install

# 2. Trabajar y guardar cambios (solo en la rama de la lane)
git add <archivos> && git commit -m "feat(modulo): descripcion (lane 250)"

# 3. Entregar: trae origin/dev, valida, publica la rama y abre el PR a dev
bash scripts/abrir-pr.sh

# 4. Cuando el PR se integró (desde ordo-diei/): actualiza dev local y limpia la lane
bash scripts/limpiar-lane.sh 250
```

Qué hace cada script, paso por paso y a mano, está en `AGENTS.md`.

## Comunicación del equipo

Antes de trabajar en una funcionalidad, informar qué módulo o archivos se modificarán. Si dos tareas necesitan cambiar el mismo archivo, se serializan: acordar las modificaciones antes de integrar los PR.

**Regla final:** cada agente desarrolla en su rama; `dev` recibe únicamente cambios integrados mediante PR.
