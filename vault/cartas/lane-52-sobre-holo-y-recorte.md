# Lane 52 — Modal del sobre: holo en todas las cartas y sin recorte

## Pedido (textual)

> Todavia tengo problemas de visualización de Holo Card, en algunas partes todavia aparece recortado cuando no tiene que aparecer recortado. Además cuando comprás un sobre, las cartas no tiene efecto holo card en el modal de apertura de sobre.

Respuestas del usuario a las preguntas de aclaración:

- Cartas incompletas en el sobre: **"Holo en todas, B/N con candado"** (todas se inclinan y brillan; las incompletas siguen en blanco y negro con candado para no adelantar el arte a color).
- Dónde se ve el recorte: **"Modal del sobre, Al comprar un sobre en el modal de abrir sobre."**

## Diagnóstico

- **Sin holo**: el modal usaba `modo="bloqueada"` (imagen plana B/N) si `gradoDespues < 1`. En una compra el grado
  queda pendiente de reclamar (D20), así que `gradoDespues` es el grado *visible* y una carta recién completada
  también llega con 0: en las compras casi ninguna carta mostraba holo.
- **Recorte**: el modal no tenía alto máximo. En pantallas bajas (ej. 1366×700, celular 390×664) quedaba más alto
  que la ventana y se cortaban arriba y abajo la carta, la cruz de cerrar y el botón.

## Cambio

- `HoloCard.tsx` (React Bits): prop `grayscale`. El shader desatura solo el arte (`uGray`); el foil sigue a color.
- `CartaVista.tsx`: prop `blancoYNegro` del modo holo: arte B/N, candado al centro y sin insignia de grado.
  El contenedor de la HoloCard lleva `max-w-full` para poder achicarse.
- `ModalAperturaSobre.tsx`:
  - siempre `modo="holo"`, con `blancoYNegro={gradoDespues < 1}`;
  - `max-h-[calc(100dvh-2rem)] overflow-y-auto` en el `DialogContent`: si igual no entra, hace scroll en vez de cortarse;
  - la carta mide `min(240px, max(150px, (100dvh − 28rem) × 0.716))`, así entra sin scroll desde ~650 px de alto.
- Sin cambios en servidor ni en la base. La vista previa del admin y el detalle no cambian (la prop es opcional).

## Verificación

Capturas con Chromium headless (puppeteer-core) de una página temporal con datos de prueba, sin compras reales:
1400×900 (carta 240 px), 1366×700 (180 px, sin scroll), 390×664 (155 px, sin scroll), 1280×600 (150 px, scroll de 32 px).
Holo listo (`data-ready`) en las cartas B/N y en las consagradas.
