# Lane 255 — Rosarium: imagen destacada a brillo pleno y sin superposiciones en Fullscreen

## Resumen
1. **Imagen destacada y presencia plena en pantalla completa (`RosariumFullscreen.tsx`):**
   - Se eliminaron todos los velos oscuros y gradientes superpuestos (`bg-gradient-to-t from-black/85 via-black/40 to-black/65` y `radial-gradient(ellipse_at...rgba(0,0,0,0.78)...)`) que cubrían la imagen y le restaban brillo y contraste.
   - Se eliminó la reducción de opacidad (`opacity-50`) de la capa difuminada.
   - La carta del misterio se presenta al 100% de opacidad, sin ningún velo o elemento colocado encima, en su proporción exacta de carta (`aspect-[63/88]`) y sin recortes (`object-contain`), con un resplandor cálido ubicado *detrás* de la carta para realzar su silueta en fondos oscuros.
2. **Distribución en dos columnas e interfaz adaptativa:**
   - **En escritorio y pantallas panorámicas**: Layout en dos columnas lado a lado. A un lado, la carta del misterio de gran tamaño (hasta `80vh`–`82vh`); al otro lado, en su propia columna independiente sin invadir la imagen, el título bilingüe (latín y castellano), el fruto espiritual (*Fructus mysterii*), las lecturas de la Vulgata Clementina y la cita bíblica.
   - **En dispositivos móviles y pantallas verticales**: Layout vertical donde la carta se exhibe de forma prominente en la mitad superior (`max-h-[44vh]`), y las lecturas quedan en un panel desplazable debajo, sin superponerse sobre la ilustración.
3. **Modo «Solo arte» para contemplación pura:**
   - Botón en la cabecera (y atajo de teclado tecla `I`) para alternar entre «Solo arte» (la carta se maximiza en el centro sin texto alrededor) y «Con lecturas».
   - Controles de navegación consistentes: flechas del teclado (`←` / `→`), barra espaciadora, `Esc` y botones táctiles.
4. **Verificación automatizada (`rosario.test.ts`):**
   - Test que asegura la ausencia de velos oscuros, degradés sobre la imagen o reducciones de opacidad, y verifica el respeto de la proporción `63:88` y `object-contain`.

## Archivos modificados / creados
- `src/components/liturgia/RosariumFullscreen.tsx`
- `src/lib/liturgia/rosario.test.ts`
- `vault/LANE_255_ROSARIUM_FULLSCREEN_IMAGEN.md`
