# Lane H2 — «Hoy aprendo» y visor de lecciones (portado de Roost)

> Lista para implementar. Depende de **H1b** y de **HS-SEG** (integrada antes). Tamaño **L**. Leer antes: [`ARQUITECTURA_DETALLADA.md`](ARQUITECTURA_DETALLADA.md) §1 (HD1–HD4), §5, §6.
> Número: el siguiente libre al crearla. Rama sugerida `task/lane-NN-hs-hoy-aprendo`.

## Objetivo
Que el niño vea lo que le toca hoy, lo haga y lo marque como terminado, **usando las Tareas y premios que ya existen**.

## Modelo (esta lane agrega)
`ProgresoLeccion` y sus relaciones inversas (ARQ §3.2).

## Servidor
- `servidor/hoy.ts`:
  - `vencimientoLeccion(fecha: string, horaLimite: string, estimadoSeg: number): Date` — **pura**: 18:00 de `fecha` en `APP_TZ` (con `TZDate` de `@date-fns/tz`) menos `estimadoSeg`, nunca antes de las 00:00 de ese día.
  - `asegurarTareasDeHoy(alumnoId, hoy)` — ARQ §5.1 y §5.2 al pie de la letra (recalcula atrasos, crea Tareas sin carreras, `horaEjecucion = vencimientoLeccion(hoy, HORA_LIMITE_LECCION, estimado)`, `fechaVencimiento` = inicio del día en `APP_TZ`).
  - En `src/app/api/cron/daily/route.ts`: **agregar** después del bloque «B) GENERAR TAREAS PARA HOY» un bucle por los alumnos con planes activos que llame `asegurarTareasDeHoy(alumnoId, hoyEnFamilia())`. No cambiar nada más del cron.
  - `leccionesDeHoy(alumnoId, hoy)` → por `DiaLectivo` de hoy: materia (ícono/color), recurso, rango («Páginas 22 a 25» / «Lección 7»), `tareaId`, estado sincronizado, lecciones del rango con `is_completed`, `bloqueada` + motivo.
- `servidor/progreso.ts`: `sincronizarDia` (ARQ §5.3), `estaBloqueado` (ARQ §5.4), `completarLeccion(alumnoId, leccionId)` — portado de `markLessonComplete` (`vendor/roost/src/services/module.ts`) con el *upsert* idempotente de `completelesson` (`vendor/roost/src/db/adapters/mongodb/index.ts:2528`): verifica que la lección pertenezca a un día de hoy (o adelantable) del alumno y que no esté bloqueada; devuelve `{ ultimaDelDia: boolean, tareaId }`. Si la lección tiene preguntas (cuando exista H4), exige el quiz aprobado.
- `markLessonIncomplete` solo para Padre/Madre (borra el `ProgresoLeccion`; si el día estaba `hecha` no cambia la Tarea).
- `servidor/guardia.ts`: `motivoBloqueoTarea(tareaId)` (ARQ §5.5). **Agregar una sola llamada** en `src/app/api/tasks/[id]/complete/route.ts`, después del chequeo de estado (L30-33): si devuelve texto → `400 { error: texto }`. Nada más cambia en la ruta.
- API: `GET /api/homeschooling/hoy`, `POST /api/homeschooling/lecciones/[id]/completar`. **No hay endpoint propio de premios.**

## UI (origen → destino)
| Roost | Ordo | Cambios |
|---|---|---|
| `groups/learn/ModuleCard.tsx` | `hoy/TarjetaHoy.tsx` | Variante grande (≥ 96 px de alto, objetivo táctil ≥ 44 px): ícono y color de la materia, título, rango, `Progress` del curso, botón «Empezar». Bloqueada: gris + `Lock` + «Terminá <anterior> primero» (como cartas/Tienda) |
| `groups/learn/LessonPlayer.tsx` | `hoy/VisorLeccion.tsx` (`Sheet` a pantalla completa) | Iframe con `urlEmbed` (HS0); sin `commentSection`; **un solo botón «Terminé»** (sin desmarcar, se borra la rama de `markLessonIncomplete` L43); anterior/siguiente dentro del día; para libros/PDF muestra el rango, el enlace y «Terminé» |
| `groups/learn/LearnSidebar.tsx` | `hoy/LeccionesDelDia.tsx` | Lista de lecciones del día con check, candado en las bloqueadas; el cajón móvil (overlay propio) → `Sheet` |
| `groups/learn/LearnGroupLayout.tsx` | `MateriaLayout` (de H1b) en modo hijo | Vista «hoy»: grilla de `TarjetaHoy` |

- **«Terminé» en la última lección del día** (o en un día sin lecciones): `POST /api/tasks/[id]/complete` con `{ elapsedSeconds }` (segundos con el visor abierto) y, si responde `ok`, `useModalStore().openModal("TASK_SUCCESS", data)` (`src/store/modalStore`), igual que `useTaskActions.finishTask` (`src/components/tasks/useTaskActions.ts:60-80`): el confeti y el mensaje son los existentes. Texto extra: «¡Listo! Tu mamá o tu papá lo va a revisar».
- Cabecera: saludo, avatar y racha (`streakDays`, solo lectura). Estado vacío amable si hoy no hay nada.
- Sonido de victoria solo si existe el motor de audio (N2); marcar actividad con el hook de inactividad (N4) solo si existe.
- `src/app/dashboard/homeschooling/page.tsx`: Hijo/Hija → «Hoy aprendo» (llama `asegurarTareasDeHoy` en el servidor antes de renderizar).
- Padre: interruptor «Navegación libre» por curso en `CursoDetalle` y progreso global por hijo.

## Tests
- `vencimientoLeccion("2026-10-14", "18:00", 1800)` = 17:30 de Montevideo; con la fórmula de `complete` (`horaEjecucion + estimado`), completar a las 10:00 es «a tiempo» y a las 18:01 no; estimado de 20 h → 00:00 del día.
- `estaBloqueado`: hoy siempre libre; futuro bloqueado; futuro con `navegacionLibre` y anterior hecho → libre; con anterior pendiente → bloqueado; lección k sin k−1 → bloqueada.
- `motivoBloqueoTarea`: Tarea común → `null`; día `movida` → texto; faltan lecciones → texto; todas hechas → `null`.
- `asegurarTareasDeHoy` con `PERMITIR_TESTS_DB=1`: dos llamadas simultáneas crean una sola Tarea; `creadorId` = creador del recurso; un día pasado pendiente se reprograma.

## Aceptación
1. El niño ve solo lo de hoy (y lo adelantable con navegación libre).
2. Completar la Tarea de una lección desde el tablero de Tareas sin haber hecho las lecciones → error 400 con el motivo.
3. Completada antes de las 18:00 → puntos completos al aprobar; entre 18:00 y 22:00 → 50 % (regla existente).
4. No se pueden cobrar puntos dos veces (garantía de `complete`).
5. Un hermano no puede completar la lección del otro (HS-SEG + chequeo propio en `completarLeccion`).
6. `npm test`, `tsc`, eslint en verde; capturas móvil/tablet/escritorio.
