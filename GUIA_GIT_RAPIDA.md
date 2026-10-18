# Guía Rápida: Git, NPM, Prisma y Base de Datos Local (`dev`)

Instructivo práctico de consulta rápida para sincronizar `dev`, correr comandos de `npm` y `prisma`, y reproducir la base de datos de Supabase en local para ver exactamente lo mismo que en producción.

---

## 1. Git: Descargar y subir `dev` (en `ordo-diei/`)

El directorio principal (`ordo-diei/`) **siempre queda en la rama `dev`**.

### Bajar cambios nuevos de otros agentes desde GitHub
```powershell
git fetch origin --prune
git pull --ff-only origin dev
npx prisma generate
```

### Subir tu `dev` local a GitHub
```powershell
git fetch origin dev
git pull --ff-only origin dev
git push origin dev
```

### Diagnóstico rápido de Git
```powershell
git status -sb                   # Ver rama actual y si estás ahead/behind origin/dev
git log -n 5 --oneline           # Últimos 5 commits
git worktree list                # Ver lanes activas en disco
git diff dev...origin/dev --stat # Ver qué cambió en GitHub antes de hacer pull
```

---

## 2. Reproducir la Base de Datos de Supabase en Local

Tenés dos formas de ver los datos reales de producción en `http://localhost:3000`:

### Modo A — Lectura directa de Supabase (ya configurado en `.env`)
Tu `.env` apunta por defecto a Supabase (`?schema=family_tasker`). Si solo querés **mirar** lo mismo que ven los usuarios en producción sin configurar nada extra:
```powershell
npx prisma generate
npm run dev
```
> ⚠️ **Cuidado:** cualquier cambio que hagas en la interfaz en este modo escribe en la base real de producción.

---

### Modo B — Clon exacto de Supabase en Postgres Local (100% aislado y seguro)
Copia toda la estructura y los datos actuales de producción (usuarios, tareas, puntos, rachas, cartas, tienda) a tu máquina usando `pg_dump` (que es **100% solo lectura** sobre Supabase). Podés probar, crear, editar o borrar sin tocar producción:

#### 1) Levantar contenedor PostgreSQL local (una sola vez)
```powershell
docker run -d --name ordo-pg-local `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=postgres `
  -p 5432:5432 `
  postgres:16
```
*(Si ya lo habías creado y está detenido: `docker start ordo-pg-local`).*

#### 2) Clonar/refrescar todos los datos actuales de Supabase a local
Corré este bloque cada vez que quieras traer la foto actual de producción:
```powershell
# Toma DIRECT_URL de .env sin ?schema=... (pg_dump no admite ese query param)
$directUrl = (Get-Content .env | Where-Object { $_ -match '^DIRECT_URL=' } | Select-Object -First 1) -replace '^DIRECT_URL=["'']?|["'']?$','' -replace '\?.*$',''

# Descarga esquema + datos reales de Supabase a dump_local.sql (solo lectura)
docker exec -i ordo-pg-local pg_dump "$directUrl" --schema=family_tasker --clean --if-exists --no-owner --no-acl > dump_local.sql

# Restaura el volcado en tu Postgres local (localhost:5432)
Get-Content dump_local.sql | docker exec -i ordo-pg-local psql -U postgres -d postgres
```

#### 3) Levantar la app apuntando al clon local (sin tocar `.env`)
```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=family_tasker"
$env:DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=family_tasker"
npm run dev
```

#### 4) Volver a apuntar a Supabase en esa terminal
```powershell
Remove-Item Env:DATABASE_URL, Env:DIRECT_URL -ErrorAction SilentlyContinue
```

---

## 3. Comandos útiles de Prisma

> 🚫 **Nunca correr `npx prisma db push` ni `prisma migrate reset` contra Supabase** (borra tablas de otras lanes).

| Comando | Para qué sirve |
| :--- | :--- |
| `npx prisma generate` | Regenera los tipos de `@prisma/client` después de cambios en `prisma/schema.prisma`. |
| `npx prisma studio` | Abre un panel web (`http://localhost:5555`) para ver y filtrar todas las tablas y filas. |
| `npx prisma validate` | Verifica que `prisma/schema.prisma` sea válido y sin relaciones rotas. |
| `npx prisma format` | Formatea y alinea `prisma/schema.prisma`. |
| `npx prisma db pull --print` | Muestra en consola el esquema actual de la base sin pisar tu `schema.prisma`. |

### Aplicar un cambio nuevo de `schema.prisma` en Supabase de forma segura
```powershell
# 1. Generar el SQL diferencial entre la base y tu schema.prisma
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > cambio.sql

# 2. Revisar cambio.sql (si tiene DROP, NO aplicar: te falta git merge dev)
Get-Content cambio.sql

# 3. Si solo tiene CREATE / ALTER ADD COLUMN, ejecutarlo y regenerar cliente
npx prisma db execute --file cambio.sql
npx prisma generate
```

---

## 4. Comandos útiles de NPM (`package.json`)

| Comando | Para qué sirve |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo Next.js en `http://localhost:3000`. |
| `npm test` | Ejecuta todos los tests unitarios (`src/**/*.test.ts` y `scripts/**/*.test.ts`). |
| `npx tsc --noEmit` | Chequea errores de TypeScript en todo el proyecto sin compilar archivos. |
| `npm run lint` | Ejecuta ESLint sobre el proyecto. |
| `npm run build` | Compila la aplicación para producción (valida rutas, SSR y tipos). |
| `npm run start` | Corre localmente el build generado por `npm run build`. |
| `npm run imagenes` | Convierte imágenes fuente de hábitos a `.avif` optimizados. |
| `npm run companeros` | Prepara y procesa los assets de compañeros (`scripts/preparar-companeros.ts`). |
| `npm run heroes` | Importa catálogo de héroes/santos (`scripts/importar-heroes.ts`). |
| `npm run liturgia:generar` | Genera el kalendario y textos litúrgicos (`scripts/liturgia/generar.ts`). |
| `npm run reposo:frases` | Genera el mazo de frases para el modo Reposo (`scripts/reposo/generar-frases.ts`). |

---

## 5. Flujo de trabajo en Lanes (`git worktree`)

Nunca se commitea directo en `ordo-diei/`. Cada cambio va en una lane:

```powershell
# 1. Crear worktree desde dev (en ordo-diei/)
git worktree add -b task/lane-NN-nombre ../ordo-diei-lanes/lane-NN dev

# 2. Commitear cambios dentro del worktree (../ordo-diei-lanes/lane-NN)
git add -A
git commit -m "feat(modulo): descripcion breve (lane NN)"

# 3. Integrar a dev (corre merge dev + tests + tsc + merge --no-ff)
& "C:\Program Files\Git\bin\bash.exe" ./scripts/integrar.sh

# 4. Limpiar worktree y rama (en ordo-diei/)
git worktree remove ../ordo-diei-lanes/lane-NN
git branch -d task/lane-NN-nombre
```
