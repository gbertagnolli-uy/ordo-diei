# Lane 245 — Rosarium: imágenes de cartas en una columna, pantallas de rezo (día y 15 misterios) y modo Fullscreen

## Resumen
1. **Imágenes de cartas y una sola columna en `/dashboard/liturgia/rosarium`:**
   - Cada uno de los 15 misterios en `src/lib/liturgia/rosario.ts` (`MISTERIOS_GAUDIOSA`, `MISTERIOS_DOLOROSA`, `MISTERIOS_GLORIOSA`) incorpora `claveCarta`, `imagen` (`/cartas/misterio-<slug>/1.webp`) e `imagenUrl` (`/api/cartas/arte?ruta=...`), sincronizados con `src/lib/cartas/catalogo/misterios.json`.
   - En `/api/cartas/arte` se permite servir el arte de grado 1 (`1.webp` / `carta.imagenUrl`) a cualquier usuario autenticado.
   - En `RosariumVista.tsx`, tanto la sección de «Misterios del día» como «Las Tres Coronas del Santo Rosario» pasan a mostrarse en **una sola columna** (`flex flex-col gap-4`) con la imagen de la carta de cada misterio junto al título bilingüe, fruto y pasaje de la Vulgata.
2. **Cards y pantallas específicas para rezar el Santo Rosario:**
   - Se agregan dos cards de acceso en `/dashboard/liturgia/rosarium`:
     - **Rezar el Santo Rosario (Misterios del día)** → `/dashboard/liturgia/rosarium/rezar` (`5 misterios`).
     - **Rezar el Rosario Completo (Los 15 Misterios)** → `/dashboard/liturgia/rosarium/rezar-completo` (`15 misterios`: Gozosos, Dolorosos y Gloriosos).
   - `RosariumRezarVista.tsx` muestra en orden:
     1. **Oraciones iniciales** (*Signum Crucis*, *Symbolum Apostolorum*, *Pater Noster*, 3× *Ave Maria*, *Gloria Patri*).
     2. **Misterios en orden con imágenes de las cartas** (5 del día o 15 completos en una sola columna), lectura de la Vulgata, oraciones de la decena en orden y contador interactivo de las 10 Avemarías.
     3. **Oraciones finales** (*Salve Regina*, *Oremus*, Letanías Lauretanas desplegables y *Signum Crucis*).
3. **Modo Fullscreen contemplativo (estilo salvapantallas):**
   - Botón **Modo Fullscreen** en el encabezado de la pantalla de rezo y en cada misterio.
   - `RosariumFullscreen.tsx` abre una vista a pantalla completa inspirada en el salvapantallas (`ReposoPantalla`), con la imagen de la carta del misterio (fondo difuminado + retrato central), el **título del misterio en latín** y debajo el **pasaje y cita de la Vulgata en texto más chico**, junto con el botón **Siguiente misterio** (y soporte de teclado `→` / `Espacio` / `Esc`).

## Archivos creados / modificados
- `src/lib/liturgia/rosario.ts`
- `src/lib/liturgia/rosario.test.ts`
- `src/app/api/cartas/arte/route.ts`
- `src/components/liturgia/useImagenesMisterios.ts`
- `src/components/liturgia/RosariumFullscreen.tsx`
- `src/components/liturgia/RosariumRezarVista.tsx`
- `src/components/liturgia/RosariumVista.tsx`
- `src/app/dashboard/liturgia/rosarium/rezar/page.tsx`
- `src/app/dashboard/liturgia/rosarium/rezar-completo/page.tsx`
