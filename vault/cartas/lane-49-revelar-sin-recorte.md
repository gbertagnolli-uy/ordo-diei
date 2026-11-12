# Lane 49 — Carta revelada sin recorte

## Pedido (textual)

> En el modal de revelar una carta, al revelarse la carta, tiene un recorte que no permite apreciar el efecto holo card.
>
> Quiero que la carta no tenga rectangulo de recorte para que se vea bien el efecto 3D al hacer hover y no sea cortado por el recorte

## Causa

En `ModalAperturaSobre.tsx` (etapa revelación) la carta estaba envuelta en un `motion.div` con
`aspect-[63/88] rounded-xl overflow-hidden shadow-2xl`, y el `DialogContent` también tenía `overflow-hidden`.
El tilt 3D de `HoloCard` (y el halo de la Gloriosa) quedaban cortados por esos rectángulos.

## Cambio

- `ModalAperturaSobre.tsx`: el contenedor de la carta ya no recorta (`relative flex w-full max-w-[240px] justify-center`)
  y se quitó `overflow-hidden` del `DialogContent`.
- `CartaVista.tsx`: nueva prop `mostrarTitulo` (default `true`, solo modo holo). El modal pasa `false`, porque antes
  el título de la carta quedaba oculto por el recorte y el modal ya muestra el nombre debajo; así no aparece duplicado.
- Sin cambios de comportamiento ni en otras vistas (el default mantiene el título).

## Pedido 2 (textual)

> además quiero que las cartas comunes tengan el preset "Gold". Las que tienen el preset "Cosmos" lo quiero cambiar por "Bursts". Todas las cartas debe tener el efecto holo configurado con intensidad 0.5 y glare en 0.5.

## Cambio 2

- `CartaVista.tsx`: Común pasa a `gold`; Celestial (era `cosmos`) pasa a `bursts`. Buena (`glitter`) y Perfecta (`gold`) siguen igual.
- Holo con `intensity` 0.5 y `glare` 0.5 para todas las cartas (constantes `INTENSIDAD_HOLO` y `GLARE_HOLO`).
  Se quitó la intensidad por rareza y el multiplicador por grado (reemplaza D1 "Común sin holo" y el refuerzo por grado de D14).
- `economia.ts`: `CONFIG_RAREZAS.holoPreset` y `holoIntensidad` alineados con lo anterior (hoy no los lee ninguna vista).
