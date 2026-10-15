# Bloqueos y límites — documento común a todas las lanes de Estudio

> Creado en la lane 165 (2026-10-16). **Toda lane que se tope con algo que le impide avanzar lo anota acá** (ID, fecha, lane, qué pasó, qué se hizo en su lugar) y sigue con lo demás. No se borran entradas: se marcan «RESUELTO».

## Límites conocidos desde el inicio

| ID | Tema | Qué pasa | Decisión tomada |
|---|---|---|---|
| B-1 | Almacenamiento | Supabase/Postgres tiene límites y `Archivo` guarda imágenes en la base | El material se **enlaza**: YouTube, Google Drive/Docs, enlaces. Solo texto y markdown se guardan en la base. No se suben PDF ni videos |
| B-2 | Imprimir | Una web no puede mandar a la impresora ni saber si salió papel. `window.print()` abre el diálogo del navegador | El «límite de impresión» cuenta las veces que el hijo **abre la vista de impresión** (el servidor registra y bloquea al pasar el tope). El padre puede dar una más. Impresión directa por correo a la impresora (HP ePrint) queda como opción futura: pide SMTP |
| B-3 | PDF de Drive | Un PDF de Drive es de otro origen: no se puede leer ni imprimir desde nuestro HTML | Se muestra con el visor de Drive en `iframe` (`/preview`) y se imprime abriendo la exportación `export?format=pdf` en pestaña propia. Requiere que el archivo esté compartido «cualquiera con el enlace» |
| B-4 | Google Docs privados | Sin OAuth no se puede leer un Doc privado | Se pide «cualquiera con el enlace puede ver». OAuth de Google queda fuera |
| B-5 | ePub | Un ePub no se puede incrustar desde otro origen sin descargarlo (CORS) | **RESUELTO en la lane 189**: la app baja el archivo desde el servidor (`/api/homeschooling/materiales/[id]/archivo`, con validación de host público, DNS, tope de 30 MB y de tiempo) y lo muestra con un lector propio (epub.js). Requiere que el archivo sea público («cualquiera con el enlace») |
| B-6 | Playlists de YouTube | Listar una lista requiere clave de la API de YouTube | Se pegan los enlaces de los videos (carga masiva por pegado). Sin clave no hay importación de listas |
| B-7 | Notificaciones push/correo | No hay servicio de envío configurado | Centro de notificaciones dentro de la app; sin correo ni push |
| B-8 | Base de datos | Está prohibido `db push`; el SQL aditivo se aplica a mano contra la base compartida | Cada lane genera `migrate diff`, revisa que no tenga `DROP` y lo aplica con `db execute` |
| B-9 | Entorno de worktrees | Los worktrees no traen `.env` (git lo ignora); sin él, los tests de `integrar.sh` fallan con error de Prisma | Se copia `.env` desde `ordo-diei/` al worktree antes de integrar |

## Bloqueos que aparezcan durante la implementación

| ID | Fecha | Lane | Qué pasó | Qué se hizo | Estado |
|---|---|---|---|---|---|
| B-10 | 2026-10-16 | 189 | La cuota de `/tmp` (tmpfs de 3,8 GB) se llenó: `node-compile-cache` llegó a 1,8 GB por tantos builds y tests en paralelo, y la herramienta de Bash dejó de devolver salida | Se borró `/tmp/node-compile-cache` (regenerable) y, por prudencia, `node_modules` y `.next` de los worktrees de las lanes 166 a 173 (los worktrees y las ramas **no** se tocaron; se recrean con `npm install` o copiando `node_modules` de otra lane). En adelante se corre con `NODE_DISABLE_COMPILE_CACHE=1` | RESUELTO |
| B-11 | 2026-10-16 | 166–199 | Los tests que escriben en la base (`{ skip: sinBase }`) no podían correrse contra producción (AGENTS.md §6) | **RESUELTO en la lane 198**: PostgreSQL local (`embedded-postgres`, puerto 55432) con el esquema completo; con `DATABASE_URL`/`DIRECT_URL` apuntando ahí y `PERMITIR_TESTS_DB=1` corren los 227 tests de Estudio sin saltar ninguno (`--test-concurrency=1`); solo falla el de fiestas litúrgicas, que necesita los datos de la base real | RESUELTO |
| B-12 | 2026-10-16 | 179 | El enlace del calendario `.ics` no puede rotarse por hijo sin una tabla de tokens; la firma depende de `SESSION_SECRET` | Se aceptó para uso doméstico: cambiar `SESSION_SECRET` invalida todos los enlaces (y cierra todas las sesiones) | ABIERTO (bajo) |
| B-13 | 2026-10-16 | 181 | No hay forma de ver la interfaz en un navegador desde este entorno | Cada pantalla se verificó con `tsc`, `eslint`, tests de la lógica pura, `next build` y un **recorrido con sesión simulada contra la app compilada** (todas las páginas de padres e hijos responden 200 y las rutas respetan los permisos: 403 al hijo en lo de padres, 404 con firma mala en el `.ics`). **No** se hizo una pasada visual. Pendiente: recorrer a mano las pantallas nuevas en tablet y en el teléfono | ABIERTO |
| B-14 | 2026-10-16 | 193 | `scripts/integrar.sh` falló una vez en los tests (pasó al reintentar sin cambios): los tests que leen la base real en paralelo pueden tardar o chocar por la latencia de Supabase | Se reintentó; los tests nuevos de solo lectura son pocos y rápidos | ABIERTO (bajo) |
