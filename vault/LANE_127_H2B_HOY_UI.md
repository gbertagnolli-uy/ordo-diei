# Lane 127 — H2b: «Hoy aprendo» (interfaz del niño)

Pedido: "continua implementando hasta terminar" (meta del 2026-10-14). Segunda mitad de H2 (`LANE_H2_HOY_APRENDO.md`, §UI).

## Portado de `vendor/roost` (cabecera «Portado de …»)
`ModuleCard`→`hoy/TarjetaHoy` (variante grande, candado + motivo), `LessonPlayer`→`hoy/VisorLeccion` (Sheet a pantalla completa, un solo «Terminé», embed `youtube-nocookie`, última lección → `POST /api/tasks/[id]/complete` + `TASK_SUCCESS`), `LearnSidebar`→`hoy/LeccionesDelDia`.
Propio de Ordo: `hoy/HoyAprendo` (cabecera con saludo, avatar y racha; estado vacío), `cursos/IconoMateria`.

## Padre
Interruptor «Navegación libre» por curso en `CursoDetalle`; progreso global por hijo en `PanelHomeschooling` (`progresoPorAlumno`).

## Servidor / API
`tareaDelDiaAlumno` + `POST /api/homeschooling/dias/[id]/tarea` (Tarea de un día adelantado sin lecciones). La página `/dashboard/homeschooling` bifurca por rol: Hijo/Hija llama `asegurarTareasDeHoy` y `leccionesDeHoy` antes de dibujar.

## Verificación
`tsc`, `eslint`, `npm test` y `next build` en verde. Sin capturas ni prueba manual (P-8, P-17). Hallazgos P-17 y P-18 en `HALLAZGOS_PENDIENTES.md`.
