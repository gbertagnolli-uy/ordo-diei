# Aprobación de hábitos (lane 59)

> Pedido (2026-10-11), textual:
> - "Necesito que al igual que las tareas se deben aprobar, la creación de un nuevo habito deba aprobarse. A su vez, el usuario que marca un habito como completo, debe recibir aprobación."
> - "La idea principal es que los niños no puedan crear habitos indiscriminadamente y generar puntos de experiencia o puntos completando habitos solo para comprar sobres de cartas."
> - "Pero a su vez no quiero cargar a los administradores con cientos de aprobaciones."
> - "Necesito que al aprobar una tarea no se recargue la pagina, para que sea fluido y sin demoras."
> - "Ademas de eso, que los usuarios que no son administradores, no puedan empezar demasiados habitos a la vez. Para ello para adoptar un nuevo habito, tambien debera aprobarse."

## Decisiones

- **Administrador = padre o madre.** Todo lo que hacen ellos (para sí o para otros) se aprueba solo. Los hijos piden.
- **Tres solicitudes**, todas con una columna `Aprobado` (default `true`, así lo existente no cambia):
  1. *Crear un hábito* (`Habitos.Aprobado`): hasta aprobarse solo lo ve su creador; los demás no lo pueden adoptar. Se aprueba junto con el hecho de que el creador lo empiece (una sola aprobación). Máximo 1 pendiente por hijo.
  2. *Empezar un hábito* (`Habitos_Usuario.Aprobado`): no se puede marcar hasta aprobarse. Retomar uno que se había dejado también pide aprobación.
  3. *Marcar "hecho"* (`Registros_Habito.Aprobado`): el día queda marcado (la racha y el calendario se ven), pero **puntos y XP se acreditan recién al aprobar**. Omitir ("justificado") o "no" no dan nada, así que no piden aprobación. Las páginas de "Leer un libro" no cuentan para terminar el libro hasta aprobarse.
- **Para no cargar a los padres:** el panel *Hábitos por aprobar* (Agenda master) agrupa por hijo y tiene "Aprobar todo" por hijo y para toda la familia: una revisión diaria es un toque. Tope de hábitos a la vez para hijos (`LIMITES_HIJOS`: 5 activos contando los pendientes) para que no se acumulen solicitudes.
- El bono de ascenso/completar se calcula al aprobar, y solo si el "hecho" se registró el mismo día que corresponde (igual que antes).
- Rechazar borra la solicitud (hábito, adopción o registro).
- **Sin recargar:** aprobar/rechazar tareas (`ParentReviewPanel`) y hábitos es optimista: la fila desaparece al instante, la petición va por detrás y `router.refresh()` sincroniza; si falla, la fila vuelve.

## Código
- `src/lib/habitos/server.ts` (crear/adoptar/registrar con `esPadre`), `src/lib/habitos/aprobaciones.ts`, `POST/GET /api/habitos/aprobaciones`, `src/components/habitos/SolicitudesHabitos.tsx`.
- SQL aplicado a la base (solo `ADD COLUMN`): `Aprobado BOOLEAN NOT NULL DEFAULT true` en `Habitos`, `Habitos_Usuario` y `Registros_Habito`.
