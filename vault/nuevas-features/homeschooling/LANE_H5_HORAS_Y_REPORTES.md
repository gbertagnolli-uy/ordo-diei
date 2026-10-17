# Lane H5 — Horas y reportes imprimibles (portado de Events de Roost)

> Lista para implementar. Depende de **H2** (usa H3 si está integrada). Tamaño **M**. Sin datos legales (HD7).
> Número: el siguiente libre al crearla. Rama sugerida `task/lane-NN-hs-horas-reportes`. Sin dependencias nuevas (`recharts` y `ui/chart.tsx` ya están).

## Objetivo
Registrar actividades fuera de pantalla (una salida puede sumar horas a varios hijos), saber cuántas horas y lecciones lleva cada alumno por materia e imprimir un resumen.

## Modelo (esta lane agrega)
`ActividadOffline`, `ParticipanteActividad`, `MetaHoras` y sus relaciones inversas (ARQ §3.2).

## Servidor
- Cliente `src/lib/homeschooling/roost/services/event.ts` con las funciones de `vendor/roost/src/services/event.ts` (mismos nombres): `getEventsInRange`, `createEvent`, `updateEvent`, `deleteEvent`, `getEventAttendees`. `createEvent`/`updateEvent` reciben además `materiaId` y `alumnoIds`.
- Servidor `src/lib/homeschooling/servidor/actividades.ts` + `mapEvent` traducido en `dto.ts` (de `vendor/roost/src/db/adapters/mongodb/index.ts:311`). zod: `fin > inicio` (era un `CHECK` en Roost). Solo Padre/Madre crean/editan/borran.
- `servidor/horas.ts`:
  - `sumarHoras(entrada)` — **pura**: por materia, minutos de lecciones (cada `DiaLectivo` `hecha`: `Tarea.tiempoRealEjecucionSeg` si existe y > 0, si no `unidades · minutosPorUnidad · 60`) + minutos de actividades (`fin − inicio` por cada participante), lecciones hechas / planificadas, promedio de notas de `IntentoQuiz` aprobados (si H4 existe).
  - `resumenHoras({ alumnoId, desde, hasta })` arma la entrada con Prisma (una consulta por tipo, con `include`).
  - `MetaHoras`: la fija el padre por alumno y materia; barra «horas hechas / meta».
- API: `GET|POST /api/homeschooling/actividades`, `PATCH|DELETE /api/homeschooling/actividades/[id]`, `GET /api/homeschooling/reportes/resumen?alumnoId&desde&hasta`, `PUT /api/homeschooling/metas`.

## UI (origen → destino)
| Roost | Ordo | Cambios |
|---|---|---|
| `components/events/EventForm.tsx` | `horas/ActividadForm.tsx` | Título, descripción, inicio/fin, lugar + materia y alumnos participantes; sin virtual, meeting URL ni grupo; `Dialog`, `Input`, `Label` de `ui/` |
| `EventCard.tsx` + `EventDetails.tsx` | `horas/ActividadCard.tsx` + `ActividadDetalle.tsx` | Sin RSVP; muestra duración y participantes |
| `AttendeeList.tsx` | `horas/ParticipantesList.tsx` | Avatares de los hijos que participaron |
| `components/admin/StatsCard.tsx` (HS0) | KPI del reporte | — |

- `/dashboard/homeschooling/horas`: lista del mes + «Nueva actividad». Si existe el temporizador visual (N13), botón «Cronometrar»; si no, solo carga manual. Las actividades también se muestran en `PlanCalendario` (H1b) con otro color.
- `/dashboard/homeschooling/reportes`: alumno y período (año escolar, trimestre, mes) → portada, `StatsCard` (horas, lecciones, actividades), gráfico por materia con `ui/chart.tsx`, cursos con avance y, si H3 está integrada, **evidencias destacadas** en un anexo. Botón «Imprimir / Guardar PDF» (`window.print()`).
- `@media print`: A4, márgenes 2 cm, saltos de página entre secciones. Agregar `print:hidden` al `AppSidebar`, `MainDock` y barras del layout de `/dashboard` (solo esa clase, sin otros cambios).

## Tests
`sumarHoras`: solo lecciones, solo actividades, mezcla, recorte por período, una actividad con 3 participantes suma a cada uno, días `pendiente`/`movida` no cuentan.

## Aceptación
1. Una salida de 90 min con dos hijos suma 1,5 h a esa materia a cada uno.
2. El reporte imprime sin elementos de la interfaz.
3. Las evidencias destacadas aparecen en el anexo (si H3 está integrada).
