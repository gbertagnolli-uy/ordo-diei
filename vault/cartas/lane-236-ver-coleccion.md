# Lane 236 — "Ver mi colección" del modal de sobre

Pedido: "Cuando se desbloquea una carta o fragmento, al final en el resumen aparece un botón que dice 'Ir a mi colección' o 'Ver mi colección' pero no lleva a /dashboard/cartas".

Causa: `ModalAperturaSobre` solo navegaba si recibía `onVerColeccion`; únicamente TiendaView lo pasaba (`useReclamoCarta` y `MisPremios` no).
Fix: sin callback, el botón hace `router.push("/dashboard/cartas")`.
(Primero se commiteó como lane 235, pero otro agente usó ese número y escribió en el mismo worktree; se pasó por cherry-pick a la lane 236.)
