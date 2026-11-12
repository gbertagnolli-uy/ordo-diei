# Lane 91 — Premios sorpresa de a uno y verificación de acreditación

**Pedido (textual):**
> Ahora verifica que los premios se acrediten correctamente. Además en vez de mostrar un listado de premios después de que gira el cofre o el 3d de regalo, se debería entregar un tipo de premio a la vez, como se hacen con las cartas, entregar uno a la vez dentro del modal, con un botón de "Siguiente premio". En cada tipo de premios usar varios confites explotando.
> (Luego:) Usa una lane nueva con otro número, uno 2 o 3 unidades por encima, para evitar solapamiento.
> Nota: la lane 88 se pisó con la de otro agente (integró y borró el worktree con mis cambios sin commitear); se rehízo como lane 91.

## Verificación
Se abrió contra la base real un premio de prueba (7 puntos, 11 XP, 3 incienso, 1 fragmento, 1 extra) en el usuario 1 y se restauró todo después: +7 `availablePoints` y `puntosAcumulados`, +11 `experienciaHabitos`, +3 `incienso`, +1 fragmento (con su movimiento); el extra quedó `reclamado` (pendiente de entrega del padre); una segunda apertura se rechaza. Misma regla que la aprobación de hábitos (`aprobaciones.ts`).

## Cambio
`ModalSorpresa`: tras el giro, un premio por paso («Premio 1 de N»), icono según tipo (puntos, XP, incienso, carta, vale), botón «Siguiente premio» → «¡Genial!» en el último, y una lluvia de confites (`lluviaDeConfites`, 7 ráfagas) en cada premio.
