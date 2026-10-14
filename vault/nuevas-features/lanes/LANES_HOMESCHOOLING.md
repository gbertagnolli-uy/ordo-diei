# Plan de lanes — Homeschooling (v3.1, sobre Roost)

> 2026-10-14. Documento de entrada: [`../homeschooling/PLAN_INTEGRACION_ROOST.md`](../homeschooling/PLAN_INTEGRACION_ROOST.md). Esquema y reglas: [`../homeschooling/ARQUITECTURA_DETALLADA.md`](../homeschooling/ARQUITECTURA_DETALLADA.md).
> **Números de lane:** se asignan al crear cada una (el siguiente libre: `git worktree list`, `git branch -a`, `ls vault/LANE_*`). Ya hubo choques entre agentes.

## Orden y dependencias

```
HS0 base Roost ──────────┐
H1a modelo + pacing ─────┼─► H1b padre ─► H2 hoy aprendo ─┬─► H3 evidencia
HS-SEG completar asignado┘   (H2 exige HS-SEG)            ├─► H4 quizzes + repaso
                                                           ├─► H5 horas + reportes (usa H3 si existe)
                                                           └─► H6 neurodivergencia
```
HS0, H1a y HS-SEG pueden ir en paralelo. H3–H6 son independientes entre sí; las que tocan `schema.prisma` se integran de a una.

| Código | Tamaño | Spec | Nota clave |
|---|---|---|---|
| HS0 | M | [`LANE_HS0_BASE_ROOST.md`](../homeschooling/LANE_HS0_BASE_ROOST.md) | Shims, tipos, video, `CalendarView`, test de guarda. Sin base ni pantallas |
| H1a | M | [`LANE_H1A_MODELO_Y_PACING.md`](../homeschooling/LANE_H1A_MODELO_Y_PACING.md) | Esquema base + `repartir()` |
| HS-SEG | S | [`LANE_HSEG_COMPLETAR_SOLO_ASIGNADO.md`](../homeschooling/LANE_HSEG_COMPLETAR_SOLO_ASIGNADO.md) | `complete` solo asignado o padre |
| H1b | L | [`LANE_H1B_ALTA_Y_PLAN_PADRE.md`](../homeschooling/LANE_H1B_ALTA_Y_PLAN_PADRE.md) | LMS de Roost (vista padre) + calendario con arrastre |
| H2 | L | [`LANE_H2_HOY_APRENDO.md`](../homeschooling/LANE_H2_HOY_APRENDO.md) | Día = `Tarea`, a tiempo hasta las 18:00, guardia en `complete` |
| H3 | M | [`LANE_H3_EVIDENCIA_Y_PORTAFOLIO.md`](../homeschooling/LANE_H3_EVIDENCIA_Y_PORTAFOLIO.md) | Showcase de Roost; swipe izq. aprueba |
| H4 | L | [`LANE_H4_QUIZZES_Y_REPASO.md`](../homeschooling/LANE_H4_QUIZZES_Y_REPASO.md) | Corrección en servidor; react-player; ts-fsrs |
| H5 | M | [`LANE_H5_HORAS_Y_REPORTES.md`](../homeschooling/LANE_H5_HORAS_Y_REPORTES.md) | Events de Roost; sin datos legales |
| H6 | M | [`LANE_H6_NEURODIVERGENCIA.md`](../homeschooling/LANE_H6_NEURODIVERGENCIA.md) | Sin Kiosk/Curfew |

## Integración con las otras features (todas opcionales)
- **N2 audio / N3 música:** H2 reproduce el sonido de victoria si existe; H6 los silencia en modo relajado.
- **N4–N6 inactividad/borradores:** H2 marca actividad al ver video; H3 guarda la nota a medias como borrador.
- **N13 temporizador visual:** H5 («Cronometrar») y H6 (Primero/Después) lo usan si existe.
- **Tienda:** el premio por terminar un curso es un producto/vale que crea el padre.

## Protocolo de cada lane (AGENTS.md)
1. `git worktree add -b task/lane-NN-… ../ordo-diei-lanes/lane-NN dev` y `npm install`. Nunca trabajar en `ordo-diei/`.
2. Antes de tocar `prisma/schema.prisma`: `git merge dev`, `npx prisma validate`, SQL con `prisma migrate diff … --script`, **sin `DROP`**, `db execute`, `generate`. **Nunca `db push`.**
3. UI: lo portado de Roost con la tabla de estilos del plan §2.3 y los componentes de `src/components/ui`; sin duplicar ni cambiar comportamientos existentes.
4. `npm test` + `npx tsc --noEmit` + eslint de los archivos nuevos; probar con la base real solo con un usuario temporal que se borra al terminar.
5. Registrar la lane en `vault/LANE_NN_*.md` (con el pedido textual), integrar con `scripts/integrar.sh`, limpiar worktree y rama (`-d`).
