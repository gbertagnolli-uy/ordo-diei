# Lane 160 — Pendientes de verificación de Homeschooling (P-44)

Pedido (hook `/goal`): la lane 158 dejó tres cosas sin comprobar —arrastre en el calendario, video real y cámara de la tablet— y no basta con pedir al usuario que las pruebe a mano.

## Hecho
- **Arrastre del calendario:** verificado con gesto real de mouse (mover a 2026-10-28 → `PATCH` 200, cambio en la base). Causa de lo observado: evento bajo el dock y destino ocupado; además `CalendarView` ahora usa `selectable={!!onSelectSlot || !!onEventDrop}`.
- **Video real:** YouTube/Vimeo no reproducen en Chromium automatizado. Se añadió soporte de **archivo de video directo** (`src/lib/homeschooling/video.ts` → `esArchivoVideo`, con test) en `VisorLeccion`, `VistaLeccion`, `LeccionForm` y `CursoDetalle`. `scripts/e2e-homeschooling/fase_e.ts`: 14/14.
- **Cámara:** `scripts/e2e-homeschooling/fase_f.ts` (Pixel 7 emulado): 12/12. No automatizable: la app de cámara nativa del SO.
- Documentado en `HALLAZGOS_PENDIENTES.md` (P-44) y el README del e2e; `verificar_invariantes.sh` reconoce `*hs-pendientes*` como FIX.

## Pendiente (honesto)
El arrastre del calendario se comprobó con un script de depuración ya eliminado; no está como fase permanente.
