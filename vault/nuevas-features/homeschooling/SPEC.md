# Homeschooling — Especificación (Ecosistema Completo por Lanes H1..H6)

> ⚠️ **2026-10-14 (lane 115): el supuesto «Roost = solo referencia visual» y «extender `MissionCalendar`» fue REVOCADO por el usuario.** Manda [`PLAN_INTEGRACION_ROOST.md`](PLAN_INTEGRACION_ROOST.md) (porte de código de `vendor/roost/`, modelo y lanes 116–123). Lo que sigue vale solo donde ese plan no lo cambie.

> Estado: **lista para implementar** (2026-10-13). Fuente de verdad: [`ARQUITECTURA_DETALLADA.md`](ARQUITECTURA_DETALLADA.md). Roost es solo referencia visual: [`MAPEO_COMPONENTES_ROOST.md`](MAPEO_COMPONENTES_ROOST.md).

## 1. Conceptos
- **Materia** (Matemática, Historia, Catecismo…) por alumno.
- **Recurso**: libro, curso, lista de videos, PDF o texto libre dividido en **unidades** (páginas, capítulos o lecciones).
- **Plan de curso**: reparto de las unidades de un recurso entre los **días lectivos** desde una fecha de inicio hasta una de fin.
- **Lección del día**: la unidad que toca hoy; es lo que ve el niño.
- **Evidencia**: foto/nota del trabajo hecho. **Registro**: horas y resultado.

## 2. Lanes (definitivas)

| Lane | Entrega | Depende de | Spec |
|---|---|---|---|
| **H1a** | Modelo + motor `repartir()` + tests (sin UI) | — | [`LANE_H1A`](LANE_H1A_MODELO_Y_PACING.md) |
| **H1b** | Alta de cursos y «Plan» del padre (calendario, «Hoy no hay clase») | H1a | [`LANE_H1B`](LANE_H1B_ALTA_Y_PLAN_PADRE.md) |
| **H2** | «Hoy aprendo», reproductor, candados; premios vía Tareas existentes | H1b | [`LANE_H2`](LANE_H2_HOY_APRENDO.md) |
| **H3** | Evidencia con foto, revisión con swipe, portafolio | H2 | [`LANE_H3`](LANE_H3_EVIDENCIA_Y_PORTAFOLIO.md) |
| **H4** | Quizzes, checkpoints de video, repaso espaciado | H2 | [`LANE_H4`](LANE_H4_QUIZZES_Y_REPASO.md) |
| **H5** | Horas y reportes imprimibles | H2 (+H3) | [`LANE_H5`](LANE_H5_HORAS_Y_REPORTES.md) |
| **H6** | Neurodivergencia: modo relajado, Primero/Después, historias sociales | H2 | [`LANE_H6`](LANE_H6_NEURODIVERGENCIA.md) |

Arquitectura, esquema y decisiones: [`ARQUITECTURA_DETALLADA.md`](ARQUITECTURA_DETALLADA.md). Auditoría y su resolución: [`AUDITORIA.md`](AUDITORIA.md). Plan global: [`../lanes/LANES_HOMESCHOOLING.md`](../lanes/LANES_HOMESCHOOLING.md).
**Regla:** no se hostea video propio; se enlaza (YouTube/Vimeo/PDF/libro físico).
