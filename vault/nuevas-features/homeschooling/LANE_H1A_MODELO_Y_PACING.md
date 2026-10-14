# Lane H1a — Modelo base y motor de pacing (sin UI)

> Lista para implementar. Sin dependencias. Tamaño **M**. Lee primero [`ARQUITECTURA_DETALLADA.md`](ARQUITECTURA_DETALLADA.md) §1, §3, §4.
> Nombre sugerido: `task/lane-NN-hs-modelo-pacing`.

## Objetivo
Dejar la base de datos y la función de reparto con tests, para que H1b solo agregue pantallas.

## Entregables
1. **Schema** (`prisma/schema.prisma`): enums `TipoRecurso`, `UnidadContenido`, `EstadoPlan`, `EstadoDiaLectivo`; modelos `Materia`, `RecursoCurso`, `PlanCurso`, `DiaLectivo`, `DiaNoLectivo`; relaciones inversas en `Usuario`, `Libro`, `Tarea` (ver ARQ §3). Procedimiento de AGENTS.md §6: `git merge dev`, `migrate diff` → revisar que **no tenga `DROP`** → `db execute` → `generate`. **Prohibido `db push`.**
2. `src/lib/homeschooling/config.ts`: `MAX_POR_DIA = { leccion: 4, pagina: 30, capitulo: 1, unidad: 3 }`, `UMBRAL_APROBACION = 70`, `INTERVALOS_REPASO = [1,3,7,14,30]`.
3. `src/lib/homeschooling/pacing.ts`: `repartir(entrada): SalidaPacing` exactamente como ARQ §4 (tipos incluidos). Puro; sin `Date.now()`; sin Prisma.
4. `src/lib/homeschooling/servidor/planes.ts` (usa Prisma, transacciones):
   - `crearPlan({ actorId, alumnoId, materiaId | materiaNueva, recurso, inicio, fin, diasSemana })` → crea `RecursoCurso`, `PlanCurso` y materializa `DiaLectivo` con `repartir` (excluyendo `DiaNoLectivo` del alumno).
   - `vistaPrevia(...)`: llama a `repartir` sin guardar.
   - `marcarNoLectivo({ actorId, alumnoIds, fecha, motivo })` (una fila por alumno) + `recalcular` de todos sus planes activos.
   - `recalcular(planId, hoy)` según ARQ §4 regla 5. `hoy` entra como parámetro.
   - `moverDia(diaId, nuevaFecha)` (regla 6).
   - Permisos: solo Padre/Madre (patrón de `lib/habitos/permisos.ts`).
5. **API** (`src/app/api/homeschooling/`, finas, con `conSesion`): `POST plan`, `POST plan/vista-previa`, `POST no-lectivo`, `PATCH dias/[id]` (mover). Validar entrada con zod 4.

## Tests (`node:test`, fechas fijas)
En `pacing.test.ts`:
1. 100 unidades / 100 días → 1 por día.
2. 10 unidades / 3 días → suma 10, reparto parejo (`4,3,3` en algún orden uniforme; verificar suma y diferencia ≤ 1).
3. Un feriado en `noLectivos` no recibe unidades y la suma se mantiene.
4. 100 unidades, 40 hechas, un día no lectivo a mitad: conserva 1..40, reparte 41..100, no pasa de `hasta`.
5. Más unidades que días → `aviso.sobrecarga` con 3 opciones.
6. Sin días disponibles → `aviso.sin_dias`.
7. **ISO:** plan lun–vie nunca asigna sábado ni domingo; plan `[7]` solo domingos.
8. 3 unidades / 10 días → 3 días de 1 unidad, ninguno vacío.
9. 300 páginas, 2026-03-02 → 2026-11-30, lun–vie: suma exacta 300, ningún día fuera de lun–vie, primer día empieza en la unidad 1 y el último termina en 300.
10. Determinismo: misma entrada → misma salida.
Tests de `planes.ts` con la base real **solo si `PERMITIR_TESTS_DB=1`** (AGENTS.md §6); si no, `skip`.

## Aceptación
- `npm test` y `npx tsc --noEmit` en verde.
- SQL aplicado sin `DROP` y registrado en `vault/`.
- El plan de 300 páginas materializa 300 unidades exactas; marcar un día no lectivo recalcula sin mover `fin`.
