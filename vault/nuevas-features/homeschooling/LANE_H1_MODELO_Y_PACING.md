# Lane H1 — Modelo de Datos, Motor de Pacing y "Snow Day Logic"

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
   - Incluye el día si su día de la semana (`getDay()`) pertenece a `diasSemanaLectivos` Y su fecha (`YYYY-MM-DD`) no está presente en el conjunto de `diasNoLectivos`.
2. **Reparto Equitativo con Resto (Distribución Bresenham):**
   - $U = \text{totalUnidades} - \text{unidadesHechas}$.
   - Si $U \le 0$, retorna plan completado sin días pendientes.
   - Si $D = \text{diasDisponibles.length} \le 0$, lanza advertencia estructurada: *"Sin días disponibles para completar el temario"*.
   - Cuota base: $Q = \lfloor U / D \rfloor$.
   - Resto a distribuir: $R = U \pmod D$.
   - Los primeros $R$ días avanzan $Q + 1$ unidades; los siguientes $D - R$ días avanzan $Q$ unidades.
3. **Manejo de "Snow Day" (Día no lectivo imprevisto):**
   - Función auxiliar `recalcularPorDiaNoLectivo({ planId, fecha, motivo, alumnoId })`.
   - Agrega la fecha a `DiaNoLectivo`.
   - Lee las unidades ya completadas hasta ayer.
   - Vuelve a ejecutar `calcularPacingCurricular` desde hoy hasta `fechaFin`.
   - Actualiza en transacción Prisma los `DiaLectivo` futuros.
   - Si el promedio de unidades resultante supera el límite ergonómico (ej. $> 35$ págs o $> 3$ videos/día), genera una alerta en el resultado con opciones sugeridas (extender fecha fin, habilitar sábados).

---

## 4. Tests Unitarios Obligatorios (`src/lib/homeschooling/pacing.test.ts`)

Escribir suite completa con `node:test` o `vitest`:
- **Caso 1 (Reparto perfecto):** 100 lecciones, 100 días lectivos $\rightarrow$ exactamente 1 lección por día.
- **Caso 2 (Reparto con resto):** 10 lecciones, 3 días lectivos $\rightarrow$ días con 4, 3, 3 lecciones (suma = 10).
- **Caso 3 (Salto de feriados):** Un feriado en medio de la semana no recibe unidades y las unidades se redistribuyen en los días restantes.
- **Caso 4 (Snow Day a mitad de curso):** Tras completar 40 lecciones de 100, se declara un día de enfermedad. El recálculo preserva las 40 hechas y redistribuye las 60 restantes en los días disponibles sin mover la fecha de fin.
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
3. Cargar un curso de 300 páginas del 1 de marzo al 30 de noviembre produce un plan donde la suma de unidades coincide exactamente con 300.
4. Anular un día por enfermedad recalcula automáticamente el calendario sin alterar la fecha final.
5. El diff de base de datos se aplicó limpiamente sin tocar tablas existentes.
