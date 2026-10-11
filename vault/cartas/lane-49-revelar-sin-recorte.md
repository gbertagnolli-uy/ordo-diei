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
