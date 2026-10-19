# Lane 237: Badge del nivel y regalo de 200 puntos al subir de nivel

Rama `task/lane-237-nivel-badge-puntos` · worktree `../ordo-diei-lanes/lane-237` · base `dev`.

## 1. Pedido del usuario (textual)

> /goal Cuando se sube de nivel, en vez de decir "Nivel 4" se debe mostrar la imagen del badge en el modal y se debe regalar puntos también, 200 puntos

## 2. Qué se hizo

- **Constantes y badge por nivel (`src/lib/niveles.ts`)**:
  - Se definieron `NIVELES_CON_BADGE = 12`, `PUNTOS_SUBIR_NIVEL = 200` y `badgeDeNivel(level)` que devuelve `/niveles/<1..12>.webp` (los niveles mayores a 12 muestran el último badge disponible, `12.webp`).
  - `PerfilResumen.tsx` reutiliza ahora `badgeDeNivel`.
- **Reclamo atómico e idempotente de puntos por subir de nivel (`src/lib/nivelesServidor.ts` y `POST /api/users/subir-nivel`)**:
  - `reclamarSubidaNivel(usuarioId, nivelPrevioCliente?)` toma un lock transaccional por usuario (`pg_advisory_xact_lock`), compara el nivel actual (`nivelDe(xpTotal(usuario)).level`) contra el último nivel visto/premiado en `Companero.nivelVisto` (o el nivel previo enviado por el cliente la primera vez si aún no tenía fila en `Companero`), y acredita **200 puntos por cada nivel nuevo subido** en `availablePoints` (sin tocar `puntosAcumulados` para no inflar la XP ni provocar otra subida en cadena).
  - Guarda `nivelVisto = nivelActual` en `Companero`, evitando que se cobren los puntos dos veces si se abren varias pestañas o se recarga la página.
  - Se integró también en `festejarNivel` (`src/lib/engagement/companeroServidor.ts`) y en la aprobación de tareas (`src/app/api/tasks/[id]/approve/route.ts`).
- **Modal de subida de nivel (`src/components/dashboard/ModalManager.tsx` y `src/components/app/NavUser.tsx`)**:
  - Al detectar que el usuario subió de nivel, `NavUser` abre el modal `LEVEL_UP` y llama a `POST /api/users/subir-nivel` para acreditar los 200 puntos y refrescar los datos.
  - En el modal `LEVEL_UP`, en lugar del texto `¡Nivel X!` y el SVG genérico, se muestra la imagen del badge del nivel alcanzado (`/niveles/<nivel>.webp`), el nuevo rango y el cartel destacado `+200 Puntos — Regalo por subir de nivel`.
  - Se limpió en `ParentReviewPanel.tsx` el guardado obsoleto en `sessionStorage` que estaba pensado para otro flujo.

## 3. Verificación

- `node --test src/lib/niveles.test.ts` (4/4 pass).
- `npx tsc --noEmit` limpio.
- Integración a `dev` mediante `scripts/integrar.sh`.
