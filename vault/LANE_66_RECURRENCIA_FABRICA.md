# Lane 66 — Recurrencia como fábrica de tareas

Pedido: "La recurrencia diaria sigue frágil. Cada tarea vieja deja de ser recurrente al generar la de hoy, así que la serie se corta cuando se agotan esas tareas viejas. Me gustaría que al crearse una tarea recurrente, sea la misma siempre o que el sistema de recurrencia sea más potente." (+ ensayo de principios: regla vs instancias, ancla que solo mueve el usuario, generación perezosa, política de perdidas, RRULE.)

## Causa
El cron ponía `tipoRecurrencia = "Unica"` en la plantilla al generar la instancia, y las instancias nacían `Unica`: la serie moría con cada plantilla. Además generaba todos los días sin respetar Semanal/Mensual y `take: 20` dejaba plantillas afuera.

## Cambio
- `src/lib/generarRecurrentes.ts`: un solo generador (cron HTTP y `scripts/run-cron.ts`). La plantilla es la **regla** y conserva su tipo; las instancias son `Unica` con `parentTaskId`. Idempotente.
- `ocurreEn()` en `recurrenceUtils.ts`: Diaria, Semanal, Mensual_Fecha (día 31 → último día del mes), Mensual_Ordinal (N-ésimo / último). Con tests.
- Se copian `ordinalSemana` y `diaDeLaSemana` a la instancia.

## Pendiente (no hecho)
Anclaje al completado, política de perdidas configurable, "omitir" como acción, watermark `generado_hasta`, RRULE: requieren columnas nuevas en `Tarea` (migración manual, ver AGENTS.md).

## Lane 69 — cadencia y ancla (segunda etapa)
Pedido del usuario: seguir con la segunda etapa, "sin que se pierda trabajo ni datos de usuarios; hay varios agentes y usuarios usando dev".
- Esquema (solo aditivo, aplicado con `migrate diff` + `db execute`, sin DROP): `Tareas.Intervalo INT DEFAULT 1`, `Ancla_Completado BOOL DEFAULT false`, `Ancla_Fecha TIMESTAMP NULL`. Filas existentes quedan con el comportamiento anterior.
- `intervalo`: cada N días/semanas/meses desde `anclaFecha` (fija; editar no la corre).
- `anclaCompletado`: la siguiente toca N unidades después de la última vez que se completó; una sola abierta a la vez; completar mueve `anclaFecha` de la regla (`complete/route.ts`). Mes corto → último día, sin deriva.
- TaskForm: "Repetir cada" y "Contar desde".
- Sigue pendiente: "omitir" como estado propio (requiere valor nuevo en `EstadoTarea`), política de perdidas, RRULE.
SQL aplicado:
    ALTER TABLE "Tareas" ADD COLUMN "Ancla_Completado" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "Ancla_Fecha" TIMESTAMP(3), ADD COLUMN "Intervalo" INTEGER NOT NULL DEFAULT 1;
