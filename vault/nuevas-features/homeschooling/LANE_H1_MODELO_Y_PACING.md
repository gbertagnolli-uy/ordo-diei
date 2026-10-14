# Lane H1 — Modelo de Datos, Motor de Pacing y "Snow Day Logic"

> ⚠️ **Auditado el 2026-10-13**: ver [`AUDITORIA.md`](AUDITORIA.md). Donde este documento contradiga a la auditoría, **manda la auditoría**. Condiciones obligatorias de esta lane en el recuadro «Correcciones de auditoría».

> ### Correcciones de auditoría (obligatorias)
> 1. **Se parte en H1a** (modelo + `repartir()` puro + tests, sin UI) **y H1b** (asistente de alta + vista del padre).
> 2. Esquema: tomar `ARQUITECTURA_DETALLADA.md` §2 **con las correcciones B2, B4, B5, B8** (índice único parcial para feriados de familia, back-relations en `Usuario`/`Libro`, `@@unique([planId, fecha])`, sin `unidadesPorDia`).
> 3. **Fuente de verdad del progreso = `DiaLectivo`** (B3): `unidadesHechas` sale de los días `completada`.
> 4. Días de semana ISO con `getISODay` (**no `getDay()`**, D1). Fechas como `YYYY-MM-DD` en `APP_TZ`; la función pura no llama a `Date.now()` (D2).
> 5. Reparto uniforme `floor((i+1)·U/D) − floor(i·U/D)` (no «Bresenham» concentrado, D3); sin días vacíos (D4).
> 6. Feriados: los carga el padre a mano en v1 (D5). Mover un día ≠ recalcular todo (D6).
> 7. Tests con `node:test` y **fechas fijas** (D7). Umbral de sobrecarga configurable por tipo de unidad: 4 lecciones / 30 páginas (C8).
> 8. Para el SQL: aplicar el diff **sin `db push`** y agregar a mano el índice parcial de B2.

> **Estado:** Lista para ejecución cuando se asigne número de lane libre.  
> **Dependencias:** Ninguna (Fase base).  
> **Tamaño:** M (Backend y lógica matemática pura con tests exhaustivos).

---

## 1. Objetivo de la Lane

Implementar los cimientos de base de datos relacional para el ecosistema de Homeschooling en Prisma 7 y crear la biblioteca determinista pura de **Pacing Curricular Inteligente** con recálculo dinámico ante imprevistos (Snow Day / Días de enfermedad), garantizando que las lecciones se repartan equitativamente sin desfasar la fecha final de curso.

---

## 2. Cambios en Base de Datos (`prisma/schema.prisma`)

Agregar los modelos de la Fase 1 especificados en `ARQUITECTURA_DETALLADA.md`:
- `Materia`: Materia asociada a un alumno (`alumnoId`), con nombre, categoría, icono, color y meta de horas.
- `Recurso`: Libro, curso de videos o material, con `totalUnidades`, `unidadTipo` ("leccion", "pagina", "capitulo"), `modoLibrePadres`.
- `PlanCurso`: Rango de fechas (`fechaInicio`, `fechaFin`), días lectivos (`diasSemana: [1..5]`), estado.
- `DiaLectivo`: Materialización de las lecciones diarias (`fecha`, `unidadDesde`, `unidadHasta`, `estado`).
- `DiaNoLectivo`: Registro de feriados, ausencias o días por enfermedad por alumno o para toda la familia.

*Recordatorio de Base de Datos:*
- Generar el diff con `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > /tmp/h1_cambio.sql`.
- Comprobar que no contenga `DROP`.
- Aplicar con `npx prisma db execute --file /tmp/h1_cambio.sql` y `npx prisma generate`.

---

## 3. Lógica Algorítmica (`src/lib/homeschooling/pacing.ts`)

Implementar la función pura `calcularPacingCurricular(params: ParametrosPacing): ResultadoPacing`:
1. **Días lectivos disponibles:**
   - Itera día por día desde `fechaInicio` hasta `fechaFin`.
   - Incluye el día si su día de la semana ISO (`getISODay`, 1=lunes…7=domingo) pertenece a `diasSemanaLectivos` Y su fecha (`YYYY-MM-DD`) no está presente en el conjunto de `diasNoLectivos`.
2. **Reparto uniforme:**
   - $U = \text{totalUnidades} - \text{unidadesHechas}$.
   - Si $U \le 0$, retorna plan completado sin días pendientes.
   - Si $D = \text{diasDisponibles.length} \le 0$, lanza advertencia estructurada: *"Sin días disponibles para completar el temario"*.
   - El día $i$ recibe $\lfloor (i+1)U/D \rfloor - \lfloor iU/D \rfloor$ unidades (suma exacta $U$, resto repartido parejo).
3. **Manejo de "Snow Day" (Día no lectivo imprevisto):**
   - Función auxiliar `recalcularPorDiaNoLectivo({ planId, fecha, motivo, alumnoId })`.
   - Agrega la fecha a `DiaNoLectivo`.
   - Lee las unidades ya completadas hasta ayer.
   - Vuelve a ejecutar `calcularPacingCurricular` desde hoy hasta `fechaFin`.
   - Actualiza en transacción Prisma los `DiaLectivo` futuros.
   - Si el promedio de unidades resultante supera el límite ergonómico (configurable; inicial 30 págs / 4 lecciones por día), genera una alerta en el resultado con opciones sugeridas (extender fecha fin, habilitar sábados).

---

## 4. Tests Unitarios Obligatorios (`src/lib/homeschooling/pacing.test.ts`)

Escribir suite completa con `node:test` (no hay Vitest en el proyecto), con fechas fijas:
- **Caso 1 (Reparto perfecto):** 100 lecciones, 100 días lectivos $\rightarrow$ exactamente 1 lección por día.
- **Caso 2 (Reparto con resto):** 10 lecciones, 3 días lectivos $\rightarrow$ días con 4, 3, 3 lecciones (suma = 10).
- **Caso 3 (Salto de feriados):** Un feriado en medio de la semana no recibe unidades y las unidades se redistribuyen en los días restantes.
- **Caso 4 (Snow Day a mitad de curso):** Tras completar 40 lecciones de 100, se declara un día de enfermedad. El recálculo preserva las 40 hechas y redistribuye las 60 restantes en los días disponibles sin mover la fecha de fin.
- **Caso 6 (ISO):** un plan lun–vie no asigna sábado/domingo (regresión de `getDay()`).
- **Caso 7 (menos unidades que días):** 3 unidades en 10 días → 3 días con 1 unidad, sin días vacíos.
- **Caso 5 (Sin días hábiles suficientes):** Si las unidades superan por mucho los días disponibles, detecta sobrecarga y devuelve `alertaSobrecarga`.

---

## 5. Server Actions y API (`src/lib/homeschooling/server/actions.ts`)

- `crearPlanCursoAction(data)`: Crea `Recurso`, `PlanCurso` y materializa los `DiaLectivo` usando `calcularPacingCurricular`.
- `marcarDiaNoLectivoAction(data)`: Registra `DiaNoLectivo` y actualiza el plan en transacción.
- `obtenerPlanAlumnoAction(alumnoId, fecha)`: Retorna la lección asignada para el día.

---

## 6. Criterios de Aceptación

1. `npx tsc --noEmit` compila sin errores.
2. `npm test` ejecuta todos los tests de `pacing.test.ts` con 100% de éxito.
3. Cargar un curso de 300 páginas del 2026-03-02 al 2026-11-30 (lun–vie, sin feriados) produce un plan donde la suma de unidades coincide exactamente con 300.
4. Anular un día por enfermedad recalcula automáticamente el calendario sin alterar la fecha final.
5. El diff de base de datos se aplicó limpiamente sin tocar tablas existentes.
