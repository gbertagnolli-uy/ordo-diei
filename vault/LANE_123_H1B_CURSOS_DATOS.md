# Lane 123 — H1b-1: cursos, lecciones y API (datos de H1b)

Pedido: "continua implementando hasta terminar" (meta del 2026-10-14). H1b se partió en dos lanes: esta (datos y API) y H1b-2 (interfaz). Spec: `vault/nuevas-features/homeschooling/LANE_H1B_ALTA_Y_PLAN_PADRE.md` §«Datos».

## Hecho
- `servidor/cursos.ts` (Prisma): listar/obtener/crear/editar/borrar materia; `cursosDeMateria` (cursos con lecciones y progreso en **una** consulta); crear/editar/borrar/reordenar curso; `leccionesDeCurso`, `leccionPorId` (con anterior/siguiente); crear/editar/borrar/reordenar lección (renumeración en dos fases por el `@@unique`, `totalUnidades` sincronizado y planes activos recalculados, 409 si la lección está cubierta por un día cumplido).
- `roost/dto.ts` (de `mapModule`/`mapRecording` del adaptador mongodb de Roost), `roost/permisos.ts` (`hasPermission`, `rolDeGrupo`), `roost/tipos.ts` ampliado (`Group`, campos de pacing en `Module`).
- Services de cliente con la firma de Roost: `roost/services/{module,group,http}.ts`; se agregó `getModulesWithRecordings`.
- API `/api/homeschooling/{materias,cursos,lecciones}/…`.
- Tests: `dto.test.ts` (6), `cursos.test.ts` (permisos de Hijo sin base: pasan; 3 con base real saltados sin `PERMITIR_TESTS_DB=1`).
- `recalcularEn` de `planes.ts` exportado.

## Hallazgos
Ver `vault/nuevas-features/homeschooling/HALLAZGOS_PENDIENTES.md` (P-6, P-7).
