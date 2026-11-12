# Lane 117 — Homeschooling: respuestas del usuario y contradicciones resueltas

- Rama: `task/lane-117-hs-resolver-contradicciones` (desde `dev` 6e42941). Solo documentación: no toca `src/`, `prisma/` ni `vendor/roost/`; no se tocó la base.
- Entrada para implementar: [`nuevas-features/homeschooling/PLAN_INTEGRACION_ROOST.md`](nuevas-features/homeschooling/PLAN_INTEGRACION_ROOST.md) (v3.1).

## Pedido del usuario (textual)

> De las preguntas, la unica que quiero modificar es "¿Hasta qué hora una lección cuenta «a tiempo» y paga puntos completos?" debe ser hasta las 18:00.
>
> Resuelve las contradicciones encontradas, para que funcione todo correctamente y no hayan errores.
>
> Luego de eso, simplemente decime donde esta el plan para pasarle al otro agente.

## Qué se hizo
- Respuestas P1–P5 registradas (DECISIONES D29–D31; plan §11). «A tiempo» hasta las 18:00: `horaEjecucion = 18:00 − tiempo estimado`, porque `complete` suma el estimado (L49-55).
- Contradicciones X1–X10 del plan v3 resueltas y nuevas X11–X19 encontradas y resueltas (plan §9): estado `No_Realizada` del cron, atrasos que trababan el curso, Tarea del día completable desde el tablero sin lecciones (guardia en `complete`), enlace duplicado en el dock, confeti de `ModalManager`, «Omitir» sin definir, `@@unique` vs reordenar, choque de número de lane (la 116 la tomó otro agente) y enums de Prisma inválidos.
- Reescritos: `ARQUITECTURA_DETALLADA.md` (v3, esquema validado), `SPEC.md`, `MAPEO_COMPONENTES_ROOST.md`, `LANE_H1A…H6`, `lanes/LANES_HOMESCHOOLING.md`. Nuevos: `LANE_HS0_BASE_ROOST.md`, `LANE_HSEG_COMPLETAR_SOLO_ASIGNADO.md`. Notas en `AUDITORIA.md` y `README.md`.
- Lanes por código (HS0, H1a, HS-SEG, H1b, H2–H6); número al crearlas.
- Verificación: `prisma validate` del esquema completo de ARQ §3 y del subconjunto de H1a sobre una copia del `schema.prisma` de `dev`: válidos.
