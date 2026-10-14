# Plan de lanes — Homeschooling (definitivo)

> ⚠️ **2026-10-14 (lane 115): el supuesto «Roost = solo referencia visual» y «extender `MissionCalendar`» fue REVOCADO por el usuario.** Manda [`PLAN_INTEGRACION_ROOST.md`](../homeschooling/PLAN_INTEGRACION_ROOST.md) (porte de código de `vendor/roost/`, modelo y lanes 116–123). Lo que sigue vale solo donde ese plan no lo cambie.

> 2026-10-13. Detalle y decisiones: [`../homeschooling/ARQUITECTURA_DETALLADA.md`](../homeschooling/ARQUITECTURA_DETALLADA.md). Hallazgos previos: [`../homeschooling/AUDITORIA.md`](../homeschooling/AUDITORIA.md) (resueltos).
> Los números de lane se asignan al ejecutar: **revisar `git branch -a`, `git worktree list` y `vault/LANE_*` y tomar uno libre** (hubo choques de numeración entre agentes).

## Orden y dependencias

```
H1a (modelo + repartir)  ──►  H1b (alta + plan del padre)  ──►  H2 («Hoy aprendo»)
                                                                    ├──► H3 evidencia + portafolio
                                                                    ├──► H4 quizzes + repaso
                                                                    ├──► H5 horas y reportes (usa H3 si existe)
                                                                    └──► H6 neurodivergencia
```
H3, H4, H5 y H6 son independientes entre sí una vez integrada H2 (pueden ir en paralelo; si tocan `schema.prisma` a la vez, integrar de a una).

| Lane | Tamaño | Spec | Nota clave |
|---|---|---|---|
| H1a | M | [`LANE_H1A_MODELO_Y_PACING.md`](../homeschooling/LANE_H1A_MODELO_Y_PACING.md) | Puede empezar ya. Sin UI. |
| H1b | M | [`LANE_H1B_ALTA_Y_PLAN_PADRE.md`](../homeschooling/LANE_H1B_ALTA_Y_PLAN_PADRE.md) | Extiende `MissionCalendar`. |
| H2 | L | [`LANE_H2_HOY_APRENDO.md`](../homeschooling/LANE_H2_HOY_APRENDO.md) | Cada día = `Tarea`; premios por rutas existentes. |
| H3 | M | [`LANE_H3_EVIDENCIA_Y_PORTAFOLIO.md`](../homeschooling/LANE_H3_EVIDENCIA_Y_PORTAFOLIO.md) | Solo fotos. Swipe: izq. aprueba. |
| H4 | L | [`LANE_H4_QUIZZES_Y_REPASO.md`](../homeschooling/LANE_H4_QUIZZES_Y_REPASO.md) | Corrección en servidor. Sin cartas. |
| H5 | S–M | [`LANE_H5_HORAS_Y_REPORTES.md`](../homeschooling/LANE_H5_HORAS_Y_REPORTES.md) | Sin datos legales. |
| H6 | M | [`LANE_H6_NEURODIVERGENCIA.md`](../homeschooling/LANE_H6_NEURODIVERGENCIA.md) | Sin Kiosk/Curfew (APP nativa). |

## Integración con las otras features (todas opcionales/blandas)
- **N2 audio / N3 música:** H2 reproduce el sonido de victoria si existe; H6 silencia ambos en modo relajado.
- **N4–N6 inactividad/borradores:** H2 marca actividad al ver video; H3 guarda la nota a medias como borrador.
- **N13 temporizador visual:** H5 («Cronometrar») y H6 (Primero/Después) lo usan si existe.
- **Tienda (lane 103):** el premio por terminar un curso es un producto/vale que el padre crea a mano. Un requisito «lecciones completadas» de la Tienda queda como mejora futura.

## Protocolo de cada lane (AGENTS.md)
1. `git worktree add -b task/lane-NN-… ../ordo-diei-lanes/lane-NN dev` y `npm ci` (o enlazar `node_modules`). Nunca trabajar en `ordo-diei/`.
2. Antes de tocar `prisma/schema.prisma`: `git merge dev`. SQL con `prisma migrate diff … --script`, **sin `DROP`**, `db execute`, `generate`. **Nunca `db push`.**
3. UI: solo componentes de `src/components/ui`, sin duplicar ni cambiar comportamientos existentes.
4. `npm test` + `npx tsc --noEmit` + eslint de los archivos nuevos; probar en BD real solo con usuario temporal que se borra al terminar.
5. Registrar la lane en `vault/LANE_NN_*.md` (con el pedido textual), integrar con `scripts/integrar.sh`, limpiar worktree y rama (`-d`).
