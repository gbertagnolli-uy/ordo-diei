# Lane 50 — Mi colección sin recorte y sin rebote en "nueva carta consagrada"

## Pedido (textual)

> En ese mismo modal, quiero quitar la animación de nueva carta consagrada.
>
> Además, asi como se corrigió la vista previa de carta en Album, igual se debe corregir en Mi Coleccion, para que no se vea cortada la imagen de la carta.

("ese mismo modal" = el modal de revelar carta al abrir un sobre, lane 49.)

## Causa

En las grillas de `ColeccionView.tsx` cada carta va en una caja `aspect-[63/88] overflow-hidden`. Las bloqueadas
(modo `bloqueada`, lane 45) llenan esa caja; las consagradas usaban modo `plana`, que tenía ancho fijo en px
(240), marco con padding, pie con nombre y un `translate-y` al hover, así que la caja las recortaba
(abajo y a la derecha).

## Cambio

- `CartaVista.tsx`, modo `plana`: llena el contenedor como la bloqueada (arte + sello de grado + rareza, borde por
  rareza y ring de grado hacia adentro). Se quitó el pie con el nombre (la grilla ya lo muestra debajo) y el halo/
  desplazamiento que quedaban recortados. `plana` solo se usa en `ColeccionView`.
- `ColeccionView.tsx`: se quitó el `scale-[1.02]` al hover que también se recortaba (el arte sigue haciendo zoom adentro).
- `ModalAperturaSobre.tsx`: el aviso "¡Nueva carta consagrada!" ya no rebota (`animate-bounce` fuera); el texto y el
  confeti quedan.
