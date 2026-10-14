# Homeschooling — Especificación (sobre Roost)

> Estado: **lista para implementar** (2026-10-14, v3.1). Documento de entrada: [`PLAN_INTEGRACION_ROOST.md`](PLAN_INTEGRACION_ROOST.md). Esquema, pacing y puente con Tareas: [`ARQUITECTURA_DETALLADA.md`](ARQUITECTURA_DETALLADA.md). Roost (`vendor/roost/`) se **porta** a `src/`.

## 1. Conceptos
- **Materia** (Matemática, Historia, Catecismo…): de la familia (← `groups` de Roost).
- **Recurso / curso**: libro, curso de videos, PDF, enlaces o texto libre dividido en **unidades** (← `modules`). Un curso de videos tiene **lecciones** (← `recordings`).
- **Plan de curso**: reparto de las unidades de un recurso entre los **días lectivos** de **un alumno**, entre una fecha de inicio y una de fin.
- **Día lectivo**: lo que toca un día; es una **`Tarea`** real (puntos completos si se termina antes de las **18:00**).
- **Evidencia**: fotos del trabajo hecho (← `showcases`). **Actividad**: horas fuera de pantalla con uno o varios hijos (← `events`).

## 2. Lanes

| Código | Entrega | Depende de | Spec |
|---|---|---|---|
| **HS0** | Base de Roost: shims, tipos, video, calendario, estrellas, KPI, test de guarda | — | [`LANE_HS0`](LANE_HS0_BASE_ROOST.md) |
| **H1a** | Modelo + `repartir()` + planes (sin UI) | — | [`LANE_H1A`](LANE_H1A_MODELO_Y_PACING.md) |
| **HS-SEG** | `complete` solo para el asignado o un padre | — | [`LANE_HSEG`](LANE_HSEG_COMPLETAR_SOLO_ASIGNADO.md) |
| **H1b** | Materias, cursos, lecciones y plan del padre (LMS de Roost + calendario) | HS0, H1a | [`LANE_H1B`](LANE_H1B_ALTA_Y_PLAN_PADRE.md) |
| **H2** | «Hoy aprendo», visor de lecciones, Tareas del día, guardia en `complete` | H1b, HS-SEG | [`LANE_H2`](LANE_H2_HOY_APRENDO.md) |
| **H3** | Evidencia con foto, revisión con swipe, portafolio (Showcase de Roost) | H2 | [`LANE_H3`](LANE_H3_EVIDENCIA_Y_PORTAFOLIO.md) |
| **H4** | Quizzes, checkpoints de video, repaso con ts-fsrs | H2 | [`LANE_H4`](LANE_H4_QUIZZES_Y_REPASO.md) |
| **H5** | Actividades (Events de Roost), horas y reportes imprimibles | H2 (+H3) | [`LANE_H5`](LANE_H5_HORAS_Y_REPORTES.md) |
| **H6** | Neurodivergencia: modo relajado, Primero/Después, historias sociales | H2 | [`LANE_H6`](LANE_H6_NEURODIVERGENCIA.md) |

El número de cada lane se asigna al crearla (el siguiente libre). **Regla:** no se hostea video propio; se enlaza (YouTube/Vimeo/PDF/libro físico).
