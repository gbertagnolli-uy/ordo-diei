# Lane H1a — Modelo base y motor de pacing (sin UI)

> Lista para implementar. Sin dependencias (puede ir en paralelo con HS0 y HS-SEG). Tamaño **M**. Leer antes: [`ARQUITECTURA_DETALLADA.md`](ARQUITECTURA_DETALLADA.md) §1, §3, §4.
> Número: el siguiente libre al crearla. Rama sugerida `task/lane-NN-hs-modelo-pacing`.

## Objetivo
Dejar la base de datos y el reparto con tests, para que H1b solo agregue pantallas.

## Entregables
1. **Schema** (`prisma/schema.prisma`): lo que ARQ §3.2 asigna a H1a (enums, `Materia`, `RecursoCurso`, `LeccionCurso`, `PlanCurso`, `DiaLectivo`, `DiaNoLectivo` y sus relaciones inversas), **sin** los campos marcados `// H2…H5`. Procedimiento (AGENTS.md §6): `git merge dev` → `npx prisma validate` → `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > /tmp/cambio.sql` → revisar que **no tenga `DROP`** → `npx prisma db execute --file /tmp/cambio.sql` → `npx prisma generate`. **Prohibido `db push`.** Guardar el SQL aplicado en el registro de la lane.
2. `src/lib/homeschooling/config.ts`: `MAX_POR_DIA = { leccion: 4, pagina: 30, capitulo: 1, unidad: 3 }`, `UMBRAL_APROBACION = 70`, `HORA_LIMITE_LECCION = "18:00"`.
3. `src/lib/homeschooling/pacing.ts`: `repartir(entrada): SalidaPacing` exactamente como ARQ §4 (tipos incluidos, con `unidadesBase`). Puro: sin `Date.now()`, sin Prisma.
4. `src/lib/homeschooling/servidor/planes.ts` (Prisma, transacciones; solo Padre/Madre):
   - `crearPlan({ actorId, alumnoId, recursoId, inicio, fin, diasSemana })` → crea `PlanCurso` y materializa `DiaLectivo` con `repartir` (`unidadesBase = 0`, excluyendo los `DiaNoLectivo` del alumno). Error 409 si ya hay plan para ese recurso y alumno.
   - `vistaPrevia(...)`: `repartir` sin guardar (sirve para alta y para «antes/después» de un día no lectivo).
   - `marcarNoLectivo({ actorId, alumnoIds, fecha, motivo })` (una fila por alumno; `upsert`) + `recalcular` de sus planes activos.
   - `recalcular(planId, hoy)`, `moverDia(diaId, nuevaFecha, hoy)` y `omitirDia(diaId)` según ARQ §4 reglas 5–7. `hoy` entra siempre como parámetro (`hoyEnFamilia()` lo pasa la ruta).
   - Permisos con `esPadre` de `src/lib/habitos/permisos.ts`.
5. **API** (`src/app/api/homeschooling/`, finas, con `conSesion({ soloPadres: true })` y zod 4): `POST planes`, `POST planes/vista-previa`, `POST no-lectivos`, `PATCH dias/[id]` (`{ accion: "mover", fecha }` | `{ accion: "omitir" }`). En Next 16 `params` es una `Promise`: `const { id } = await params`.

## Tests (`node:test`, fechas fijas)
`src/lib/homeschooling/pacing.test.ts`:
1. 100 unidades / 100 días → 1 por día.
2. 10 unidades / 3 días → suma 10, diferencia entre días ≤ 1.
3. Un día en `noLectivos` no recibe unidades y la suma se mantiene.
4. `unidadesBase = 40` de 100, un no lectivo a mitad: reparte 41..100 y no pasa de `hasta`.
5. Más unidades que el máximo por día → `aviso.sobrecarga` con 3 opciones.
6. Sin días disponibles → `aviso.sin_dias`.
7. ISO: plan lun–vie nunca asigna sábado ni domingo; plan `[7]` solo domingos.
8. 3 unidades / 10 días → 3 días de 1 unidad, ninguno vacío.
9. 300 páginas, 2026-03-02 → 2026-11-30, lun–vie: suma exacta 300, primer día desde 1, último hasta 300.
10. Determinismo: misma entrada → misma salida.
11. Dos alumnos con el mismo recurso → dos planes independientes (test de `crearPlan` con `PERMITIR_TESTS_DB=1`; si no, `skip`).
12. `recalcular` (con `PERMITIR_TESTS_DB=1`): día pasado pendiente → `movida` y sus unidades reaparecen desde hoy; un día de hoy con Tarea `En_progreso` se conserva; `fin` no cambia.

## Aceptación
- `npm test`, `npx tsc --noEmit`, eslint de archivos nuevos en verde.
- SQL aplicado sin `DROP` y anotado en el registro de la lane (`vault/LANE_NN_*.md`).
- El plan de 300 páginas materializa 300 unidades exactas; marcar un día no lectivo recalcula sin mover `fin`.
