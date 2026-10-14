# Lane H2 — «Hoy aprendo» y reproductor de lecciones

> Lista para implementar. Depende de **H1b** (planes y `DiaLectivo`). Tamaño **L**. Lee ARQ §1 (HD1–HD3), §5, §6.

## Objetivo
Que el niño vea lo que le toca hoy, lo haga y lo marque como terminado, **usando el sistema de tareas y premios que ya existe**.

## Modelo (esta lane agrega)
`LeccionCurso`, `ProgresoLeccion` (ARQ §3). Las relaciones `repasos` y `RepasoLeccion` llegan en H4: en esta lane `LeccionCurso` no declara `repasos`.

## Servidor
- `servidor/hoy.ts`:
  - `asegurarTareasDeHoy(alumnoId)` — ARQ §5 (idempotente; usar `upsert`/chequeo de `tareaId` dentro de transacción para no duplicar con dos pestañas). También se invoca desde `src/app/api/cron/daily/route.ts` para todos los alumnos (solo agregar la llamada; no cambiar el resto del cron).
  - `leccionesDeHoy(alumnoId)` → por `DiaLectivo` de hoy: materia (icono/color), título del recurso, rango («Páginas 22 a 25» / «Lección 7»), `tareaId`, estado sincronizado, `bloqueada` (+ motivo).
- `servidor/progreso.ts`: `sincronizarDia`, `estaBloqueado(dia)` (ARQ §5), `completarLeccion(alumnoId, leccionId)` (marca `ProgresoLeccion.completada`; si era la última del día, indica que se puede completar la Tarea). Si la lección tiene preguntas, `completarLeccion` exige haber aprobado (H4); sin preguntas, basta «Terminé».
- Alta/edición de lecciones (cursos de video/enlaces): `POST /api/homeschooling/recursos/[id]/lecciones` (padre) con `titulo`, `videoPlataforma`/`videoId` o `url`, `instrucciones`. Parseo de enlaces YouTube/Vimeo a `videoId` en una función pura con test.
- API: `GET /api/homeschooling/hoy`, `POST /api/homeschooling/lecciones/[id]/completar`. **No hay endpoint propio para dar premios.**

## UI
- `/dashboard/homeschooling` con rol Hijo/Hija → `HoyAprendo`:
  - Cabecera: saludo, avatar, racha (`streakDays` solo lectura).
  - Grilla de tarjetas grandes táctiles (`Card`, mín. 96 px de alto, 44 px de objetivo táctil) por materia con icono, color, título y rango; barra `Progress` del curso.
  - **«Empezar»** → abre `VisorLeccion` (`Sheet` a pantalla completa): video embebido (`youtube-nocookie.com/embed/<id>?rel=0` o `player.vimeo.com`), instrucciones, navegación anterior/siguiente (`ChevronLeft/Right`) dentro del día, y botón grande **«Terminé»**.
  - Lección bloqueada: tarjeta en escala de grises con candado y texto «Terminá <anterior> primero» (mismo lenguaje que cartas/Tienda).
  - **«Terminé»** en la última lección del día → `POST /api/tasks/[id]/complete` (enviar `elapsedSeconds`) → la Tarea queda en revisión del padre (flujo actual); mostrar el confeti ya usado en completar tareas (`canvas-confetti`, no un efecto nuevo) y un mensaje «¡Listo! Tu mamá/papá lo revisará».
  - Sonido de victoria: **solo si existe** el motor de audio (N2); si no, omitir.
  - Marcar actividad mientras mira el video (hook de inactividad N4 si existe).
- Sidebar/dock: ver H1b.
- Vista del padre: en `/dashboard/homeschooling/plan`, agregar por curso el interruptor **«Navegación libre»** (`navegacionLibre`) y el progreso global por hijo.

## Pruebas
- `node:test` de `estaBloqueado` (día N−1 pendiente/hecha, `navegacionLibre`, lecciones dentro de un día), `parsearEnlaceVideo` (watch, youtu.be, embed, vimeo, basura), y `asegurarTareasDeHoy` con Prisma simulado o BD solo con `PERMITIR_TESTS_DB=1`.
- Manual con usuario temporal (borrarlo al final): crear plan, abrir Hoy aprendo, completar, aprobar como padre y verificar puntos una sola vez; recargar y reintentar completar → rechazado por la ruta existente.

## Aceptación
1. El niño ve solo lo programado para hoy; si no hay nada, estado vacío amable.
2. El candado impide saltar días/lecciones salvo navegación libre.
3. «Terminé» crea/usa la Tarea y no se pueden cobrar puntos dos veces (garantía de la ruta existente).
4. Los puntos aparecen cuando el padre aprueba (flujo actual), sin código de premios nuevo.
5. `npm test`, `tsc`, eslint de archivos nuevos, capturas móvil/tablet/escritorio.
