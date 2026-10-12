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
