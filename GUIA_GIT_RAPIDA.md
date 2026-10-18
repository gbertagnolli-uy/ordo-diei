# Guía Rápida de Git y Worktrees (`dev`)

Instructivo práctico para sincronizar `dev`, trabajar con múltiples agentes en paralelo y manejar cambios de base de datos sin pisar trabajo.

---

## 1. Descargar lo último de `dev` desde GitHub (en `ordo-diei/`)

El directorio principal (`ordo-diei/`) **siempre queda parado en la rama `dev`**. Cuando otros agentes o PRs suben cambios a GitHub:

```powershell
# 1. Traer referencias remotas y limpiar ramas borradas
git fetch origin --prune

# 2. Bajar los commits nuevos a tu dev local (solo fast-forward)
git pull --ff-only origin dev

# 3. Si cambió prisma/schema.prisma, actualizar el cliente local
npx prisma generate
```

---

## 2. Subir tu `dev` local a GitHub

Después de que una lane se integró localmente a `dev`:

```powershell
# Primero traé posibles cambios remotos para no chocar
git fetch origin dev
git pull --ff-only origin dev

# Publicá dev en GitHub
git push origin dev
```

---

## 3. Ciclo completo de una tarea (Lane con Worktree)

Nunca se edita directo en `ordo-diei/`. Cada tarea vive en su propio worktree:

```powershell
# 1. Crear worktree desde dev actualizado (ejecutar en ordo-diei/)
git worktree add -b task/lane-NN-nombre ../ordo-diei-lanes/lane-NN dev

# 2. Trabajar y commitear dentro del worktree (../ordo-diei-lanes/lane-NN)
git add -A
git commit -m "feat(modulo): descripcion breve (lane NN)"

# 3. Si dev avanzó mientras trabajabas, traerlo a tu lane
git merge dev

# 4. Integrar la lane a dev de forma segura (corre tests + tsc + merge --no-ff)
bash scripts/integrar.sh

# 5. Limpiar el worktree tras integrar (ejecutar en ordo-diei/)
git worktree remove ../ordo-diei-lanes/lane-NN
git branch -d task/lane-NN-nombre
```

---

## 4. Cambios en Prisma / Supabase (Sin borrar tablas ajenas)

**Prohibido `npx prisma db push` o `migrate reset`** (la base es compartida).

```powershell
# 1. Generar solo el diff SQL contra la base actual
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > cambio.sql

# 2. Revisar cambio.sql: si contiene DROP, NO aplicar (falta git merge dev)
Get-Content cambio.sql

# 3. Si solo tiene CREATE / ALTER ADD COLUMN, ejecutarlo y regenerar cliente
npx prisma db execute --file cambio.sql
npx prisma generate
```

---

## 5. Comandos de diagnóstico rápido

```powershell
git status -sb                  # Ver en qué rama estás y si estás ahead/behind origin/dev
git log -n 5 --oneline          # Ver los últimos 5 commits locales
git worktree list               # Ver qué lanes están abiertas en disco
git diff dev...origin/dev --stat # Ver qué cambió en GitHub antes de hacer pull
```
