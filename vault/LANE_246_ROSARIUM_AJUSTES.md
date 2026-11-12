# Lane 246 — Rosarium: Credo Constantinopolitano, ocultar Dock en Fullscreen y separación en 4 cards por misterio con imagen destacada 63:88

## Resumen
1. **Credo Niceno-Constantinopolitano (`src/data/liturgia/rosarium.json`):**
   - Se actualiza la oración `credo` en `rosarium.json` al *Symbolum Nicæno-Constantinopolitanum* (bilingüe latín/español).
2. **Ocultar el Dock en Pantalla Completa (`src/components/liturgia/RosariumFullscreen.tsx`):**
   - `RosariumFullscreen` se monta mediante `createPortal(..., document.body)` con `z-[9999]` (por encima del `MainDock` que tiene `z-50` al final de `DashboardLayout`) y solicita Fullscreen nativo sobre su propio contenedor (`contenedorRef.current.requestFullscreen()`), evitando que el Dock aparezca en pantalla completa.
3. **Separación de cada misterio en 4 cards e imagen destacada 63:88 sin fondo oscuro ni recortes (`RosariumRezarVista.tsx` y `RosariumVista.tsx`):**
   - En `RosariumRezarVista.tsx`, cada misterio se presenta en 4 cards independientes:
     1. **Card de imagen y datos del misterio** (`Mysterium I`, `Mysteria Gaudiosa`, `#1 / 15`, cita bíblica, título en latín, título en castellano, fruto espiritual y botón de pantalla completa).
     2. **Card con `Lectio Vulgatæ`** en un acordeón `<details>` colapsado sin expandir por defecto.
     3. **Card con las cuentas** de las 10 Avemarías.
     4. **Card con las oraciones de la decena** en un acordeón `<details>` colapsado.
   - Todas las imágenes de los misterios usan `<Card className="py-0 gap-0 ...">` y contenedor en proporción exacta de carta (`aspect-[63/88]`, coincidente con `630×880`), ocupando todo su espacio sin fondo oscuro, sin recortes y sin espacio libre.
