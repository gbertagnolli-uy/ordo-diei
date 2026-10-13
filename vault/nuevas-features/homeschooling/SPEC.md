# Homeschooling — Especificación (producto por fases)

> Amplía [`README.md`](README.md). Es "casi una app nueva": se especifica como **mini‑producto** con fases entregables. Investigación: pacing dinámico, desbloqueo secuencial, doble interfaz, evidencia, portafolio.
> **Regla:** no hostear video propio (Won't‑Have de la investigación): se **enlaza** (YouTube/Vimeo/PDF/libro físico).

## 1. Conceptos
- **Materia** (Matemática, Historia, Catecismo…) por alumno.
- **Recurso**: libro, curso, lista de videos, PDF o texto libre dividido en **unidades** (páginas, capítulos o lecciones).
- **Plan de curso**: reparto de las unidades de un recurso entre los **días lectivos** desde una fecha de inicio hasta una de fin.
- **Lección del día**: la unidad que toca hoy; es lo que ve el niño.
- **Evidencia**: foto/nota del trabajo hecho. **Registro**: horas y resultado.

## 2. Fases

| Fase | Entrega | Dependencias |
|---|---|---|
| **H1 Pacing y lección del día** | Materias, recursos, calendario lectivo, motor de reparto, «Hoy aprendo» del niño | hábitos/XP |
| **H2 Evidencia y registro** | Foto/nota por lección, aprobación del padre, horas | `Archivo`, cámara |
| **H3 Quiz y desbloqueo secuencial** | Preguntas simples por lección, aprobar con ≥ 70 % para avanzar | H1 |
| **H4 Portafolio / reportes** | PDF por período, registro de horas, calificaciones | H2, H3 |
| **H5 Extras** | Pizarra, transcript/GPA, lecciones con video con checkpoints | H3 |

Cada fase es una o más lanes entregables por separado (ver `../lanes/LANES.md`).

## 3. H1 en detalle (lo que se implementa primero)

### 3.1 Modelo
```prisma
model Materia   { id Int @id @default(autoincrement()); alumnoId Int; nombre String; icono String?; color String?; activa Boolean @default(true) }
model Recurso   { id Int @id @default(autoincrement()); materiaId Int; titulo String; tipo String /* libro|curso|pdf|enlaces|libre */;
                  unidadTipo String /* pagina|capitulo|leccion */; totalUnidades Int; url String?; libroId Int? }
model PlanCurso { id Int @id @default(autoincrement()); recursoId Int @unique; inicio DateTime @db.Date; fin DateTime @db.Date;
                  diasSemana Int[] /* 1..7 */; unidadesPorDia Float?; estado String @default("activo") }
model DiaLectivo{ planId Int; fecha DateTime @db.Date; unidadDesde Int; unidadHasta Int; estado String /* pendiente|hecha|omitida|movida */; @@id([planId, fecha]) }
model DiaNoLectivo { fecha DateTime @db.Date; alumnoId Int?; motivo String; @@id([fecha, alumnoId]) } // feriados/enfermedad (null = toda la familia)
```
(El reparto **se materializa** en `DiaLectivo` para que cada día sea editable y recalculable.)

### 3.2 Algoritmo de pacing (función pura `repartir`)
Entrada: `totalUnidades`, `inicio`, `fin`, `diasSemana`, `noLectivos[]`, `hechas`. Salida: lista de `DiaLectivo`.
1. Días disponibles = fechas entre `inicio` y `fin` cuyo día de semana esté en `diasSemana` y no estén en `noLectivos`.
2. Reparto equitativo con resto distribuido (Bresenham): `unidadesPorDia ≈ pendientes / díasRestantes`.
3. **«Snow day»**: al marcar un día no lectivo (enfermedad, feriado) se **recalcula desde hoy** repartiendo lo pendiente en los días restantes **sin mover la fecha de fin**; si ya no cabe, avisa «Con este ritmo faltarían N unidades; opciones: extender hasta el D / sumar un día por semana / aceptar ir más rápido».
4. Atrasos: lo no hecho se **arrastra** a los días siguientes (no se pierde).
5. Totalmente determinista y con tests (casos: feriados, 0 días, más unidades que días, recalcular a mitad).

### 3.3 UX niño — «Hoy aprendo»
Interfaz **distinta** de la del padre (doble interfaz): tarjetas grandes por materia con pictograma, progreso del curso (barra), botón gigante **«Empezar»** (abre enlace/libro con instrucciones «Lee las páginas 12 a 15») y **«Terminé»**. Al terminar: sonido, XP (como un hábito) y confites. Sin tablas, sin ajustes.
### 3.4 UX padre — «Plan»
Vista semanal/mensual por alumno (grilla de materias × días con la lección asignada), edición manual (mover/omitir una lección), botón **«Hoy no hay clase»** (por alumno o toda la familia) que dispara el recalculo con vista previa del cambio antes de confirmar. Asistente de alta: «Nuevo curso» → materia → recurso (título, cantidad, tipo) → fechas y días → vista previa del reparto → Guardar.

## 4. Integración con lo existente
- Una lección del día puede **generar un hábito/tarea del día** (`Libro`/`HABITO_LIBRO.md` ya hace algo parecido para lectura) para reutilizar XP, aprobación de padres y rachas — **a decidir en H1** si se enlaza (recomendado) o es paralelo.
- Inactividad: lecciones con enlace/video llaman `useMantenerActivo`; el trabajo a medio escribir se guarda como borrador.
- Marketplace: requisito `tareas`/`habito` puede incluir «completó N lecciones».

## 5. H2–H5 (resumen de contrato)
- **H2:** botón de cámara (`<input capture>` + subida existente) → evidencia ligada a `DiaLectivo`; el padre aprueba con swipe (patrón de lane 75).
- **H3:** `Pregunta` (opción múltiple/verdadero‑falso/texto corto) por lección; `Intento`; umbral configurable (70 %); la lección siguiente queda con candado (mismo lenguaje visual que marketplace/cartas).
- **H4:** PDF con `@react-pdf/renderer` o impresión CSS: portada, horas por materia, listado de lecciones, fotos, calificaciones. Plantilla por jurisdicción (primero genérica; Uruguay según lo que el usuario indique).
- **H5:** fuera de plan hasta validar H1–H4.

## 6. Preguntas abiertas
1. ¿Cuántos alumnos y qué edades? (afecta pictogramas y lenguaje).
2. ¿Jurisdicción del reporte?
3. ¿Enlazar la lección con hábitos/XP (recomendado) o sistema aparte?
4. ¿Premio por terminar un curso (carta, vale en marketplace)?

## 7. Criterios de aceptación H1
1. Cargar «Historia, 300 páginas, del 1/3 al 30/11, lun–vie» produce un reparto que suma 300 y salta feriados.
2. Marcar un día no lectivo recalcula manteniendo la fecha de fin y muestra la vista previa.
3. El niño ve solo «Hoy aprendo» con su lección; el padre ve el plan completo.
4. Terminar una lección da XP una sola vez y avanza el progreso.
5. Tests de `repartir` cubren los casos de §3.2.
