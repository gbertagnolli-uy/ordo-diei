# Lane 49: Eliminar cartas desde el panel de administración

> Pedido (2026-10-11): "Agrega una opción para los administradores, para que puedan eliminar cards"

## Cambios
- `src/lib/cartas/server.ts`: nueva `adminEliminarCarta(id)`, borrado definitivo. `CartaUsuario` se borra en cascada; `MovimientoFragmento.cartaId` queda en null.
- `src/app/api/cartas/admin/route.ts`: `DELETE` ahora elimina de verdad (antes archivaba; la UI archiva por `PATCH`). Solo Padre/Madre.
- `src/components/cartas/AdminCartasView.tsx`: botón de papelera por fila con diálogo de confirmación (`Dialog` existente).

## Notas
- Archivar sigue disponible para ocultar sin perder progreso.
- Si se borra una carta del catálogo (`Origen = Sistema`), `scripts/seed-cartas.ts` la vuelve a crear al correrlo.
- `tsc` y `eslint` sin errores. No se probó en el navegador.
