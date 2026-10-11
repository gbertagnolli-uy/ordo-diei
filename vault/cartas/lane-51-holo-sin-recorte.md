# Lane 51 — Holo sin recorte en el resto de las vistas

## Pedido (textual)

> tambien en las otras vistas que tienen el efecto holo, alguien agrego un recorte. sacalo.

## Revisión de vistas con `modo="holo"`

- `ModalAperturaSobre.tsx`: ya corregido en lane 49.
- `DetalleCartaView.tsx` (detalle de carta): **tenía recorte**. La carta iba en
  `aspect-[63/88] rounded-2xl overflow-hidden shadow-2xl` (desde lane 34), que cortaba el tilt 3D y el halo de la Gloriosa.
- `AdminVistaPreviaEnVivo.tsx` (vista previa del formulario admin): sin recorte (contenedor `relative flex`, sin overflow en los padres).
- `BordeReclamable` / `ElectricBorder`: `overflow-visible`, no recorta.

## Cambio

- `DetalleCartaView.tsx`: si la carta está desbloqueada (holo) el contenedor es `flex w-full max-w-[340px] justify-center`, sin recorte;
  la bloqueada conserva la caja 63:88 que necesita para llenarla. Se pasa `mostrarTitulo={false}` porque el título de
  CartaVista quedaba oculto por el recorte y el detalle ya muestra el nombre en el `h1` y el grado en su insignia.
