# Base local de verificación (NO es producción)

PostgreSQL 18 embebido (`embedded-postgres`), puerto **55432**, base `ordo`, usuario `postgres` / clave `local`. Datos en `datos/`.

- Arrancar: `node iniciar.mjs` (queda corriendo; Ctrl+C la para).
- Esquema desde cero (del `schema.prisma` de una rama): `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > X.sql` (en el worktree) y `node aplicar-sql.mjs X.sql` (la URL local está fija en el script; nunca toca Supabase). Para una base vacía, borrar `datos/` antes.
- Al recrear: `rm -rf datos` → `node iniciar.mjs` (UTF8) → `for f in sql/*.sql; do node aplicar-sql.mjs $f; done` (00 = esquema de dev, 10-laneNN = SQL aditivo de cada lane) → sembrar → `tareas.sql`, `checklist.sql`. Cartas: `seed-cartas.ts` desde un worktree con `DATABASE_URL` local.
- Familia de prueba: `node sembrar.sql.mjs && node aplicar-sql.mjs sembrar.sql` → ids 1 Papá, 2 Mamá, 3 Juan (500 puntos), 4 Ana (300 puntos); PIN `1234` para todos. Borra los usuarios existentes (TRUNCATE … CASCADE).
- Levantar una lane contra esta base: desde el worktree,
  `DATABASE_URL=postgresql://postgres:local@localhost:55432/ordo DIRECT_URL=postgresql://postgres:local@localhost:55432/ordo npx next dev -p 31NN`
  (las variables del proceso le ganan a `.env.local`). Confirmar en la consola que no aparece el host de Supabase.
