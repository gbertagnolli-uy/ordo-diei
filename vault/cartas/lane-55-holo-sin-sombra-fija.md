# Lane 55 — Detalle de carta: sin rectángulo fijo al inclinar la holo

## Pedido (textual)

> igue el problema, en la vista de carta en mi coleccion, en dashboard/cartas/<carta> hay un recorte que al hacer hover y mover en 3D

## Diagnóstico

`CartaVista` (modo holo) le pasaba `className="shadow-2xl"` a la `HoloCard`. Esa sombra se dibuja en el elemento raíz
`.holo-card`, que **no rota**: lo que rota es `.holo-card__rotor`. Al inclinar la carta en 3D, la carta se movía y el
rectángulo de la sombra quedaba quieto y asomaba por los bordes (abajo a la derecha y a la izquierda), así que parecía
que la carta estaba recortada. Ningún ancestro tenía `overflow` que recorte.

## Cambio

- `CartaVista.tsx`: sin `shadow-2xl` en la `HoloCard`. Queda la sombra propia del componente (`.holo-card__shadow`),
  que acompaña la inclinación. Afecta a todas las vistas holo: detalle, modal del sobre y vista previa del admin.

## Verificación

Capturas con Chromium headless (puppeteer-core, escala 2×) de `/dashboard/cartas/maternitatis-beat-mari-virginis`,
con el puntero en las esquinas y en el borde, a 1400×900 y 400×850. Antes se veía el rectángulo, ahora no.
