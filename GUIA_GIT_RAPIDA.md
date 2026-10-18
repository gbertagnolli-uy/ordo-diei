# Guía Rápida de Git, Worktrees y Base de Datos Local (`dev`)

Instructivo práctico para sincronizar `dev`, trabajar con múltiples agentes en paralelo y clonar los datos actuales de Supabase a local sin tocar producción.

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
git fetch origin dev
git pull --ff-only origin dev
git push origin dev
```

---

## 3. Traer datos actuales de Supabase a local (Sin tocar producción)

Para probar la app con todos los datos reales actuales pero en una base **100% local y aislada** (donde podés crear, editar o borrar sin afectar Supabase):

### Paso A — Levantar un PostgreSQL local con Docker (una sola vez)
```powershell
docker run -d --name ordo-pg-local `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=postgres `
  -p 5432:5432 `
  postgres:16
```

### Paso B — Copiar estructura + datos actuales de Supabase a tu Postgres local
Este comando lee de `DIRECT_URL` en tu `.env` (**solo lectura**, `pg_dump` jamás modifica el origen) y lo restaura en tu contenedor `ordo-pg-local`:

```powershell
# 1. Leer DIRECT_URL de tu .env quitándole ?schema=... (pg_dump no acepta ese query param)
$directUrl = (Get-Content .env | Where-Object { $_ -match '^DIRECT_URL=' } | Select-Object -First 1) -replace '^DIRECT_URL=["'']?|["'']?$','' -replace '\?.*$',''

# 2. Volcar el schema family_tasker desde Supabase a un archivo local (100% lectura)
docker exec -i ordo-pg-local pg_dump "$directUrl" --schema=family_tasker --clean --if-exists --no-owner --no-acl > dump_local.sql

# 3. Restaurar el volcado dentro del Postgres local
Get-Content dump_local.sql | docker exec -i ordo-pg-local psql -U postgres -d postgres
```
*(Cada vez que quieras refrescar tu base local con los últimos datos de producción, solo volvés a correr el **Paso B**).*

### Paso C — Correr `next dev` apuntando a tu base local (sin modificar `.env`)
Ejecutá `npm run dev` inyectando la variable en la sesión de PowerShell para que ignore la URL de Supabase de `.env`:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=family_tasker"
$env:DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=family_tasker"
npm run dev
```
> Cuando cierres esa terminal (o hagas `Remove-Item Env:DATABASE_URL, Env:DIRECT_URL`), todo vuelve al `.env` normal sin haber tocado ningún archivo versionado.

---

## 4. Ciclo completo de una tarea (Lane con Worktree)

Nunca se edita directo en `ordo-diei/`. Cada tarea vive en su propio worktree:

```powershell
# 1. Crear worktree desde dev actualizado (ejecutar en ordo-diei/)
git worktree add -b task/lane-NN-nombre ../ordo-diei-lanes/lane-NN dev

# 2. Trabajar y commitear dentro del worktree (../ordo-diei-lanes/lane-NN)
git add -A
git commit -m "feat(modulo): descripcion breve (lane NN)"

# 3. Integrar la lane a dev de forma segura (corre merge dev + tests + tsc + merge --no-ff)
& "C:\Program Files\Git\bin\bash.exe" ./scripts/integrar.sh

# 4. Limpiar el worktree tras integrar (ejecutar en ordo-diei/)
git worktree remove ../ordo-diei-lanes/lane-NN
git branch -d task/lane-NN-nombre
```

---

## 5. Cambios de esquema en Supabase (Sin borrar tablas ajenas)

**Prohibido `npx prisma db push` o `migrate reset`** contra Supabase.

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

## 6. Comandos de diagnóstico rápido

```powershell
git status -sb                   # Ver en qué rama estás y si estás ahead/behind origin/dev
git log -n 5 --oneline           # Ver los últimos 5 commits locales
git worktree list                # Ver qué lanes están abiertas en disco
git diff dev...origin/dev --stat # Ver qué cambió en GitHub antes de hacer pull
```
