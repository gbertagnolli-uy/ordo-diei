# Lane 45: Carta bloqueada en blanco y negro, solo con candado

> Pedido (2026-10-10): "en dashboard/cartas las cartas bloqueadas muestran una imagen cortada. Esta: [Image #11]. Mi idea es que aparezca la imagen de la carta, pero en blanco y negro, con solamente el icono del candado, sin ningun otro borde negro o texto."
>
> Referencia (captura): la carta de San Pedro Apóstol se veía recortada, con marco oscuro, el rótulo "BLOQUEADA", la insignia de rareza, nombre, subtítulo y "0 / 60" dentro de la carta.

## Causa
El modo `bloqueada` de `CartaVista` dibujaba una tarjeta completa (marco, padding, nombre, subtítulo y barra de progreso) con `width` fijo en px, y las vistas la meten en un contenedor `aspect-[63/88]` más angosto con `overflow-hidden`: se cortaba.

## Cambios
- `src/components/cartas/CartaVista.tsx`, modo `bloqueada`: ahora es solo el arte de la carta en escala de grises (`grayscale`) llenando el contenedor 63:88, con un candado centrado. Sin marco, sin rótulo, sin rareza, sin nombre ni progreso (cada vista ya los muestra afuera: grilla de colección, detalle y vista previa admin).
- Se quitaron imports y variables que solo usaba el modo viejo (`Progress`, `CONFIG_RAREZAS`, `req`). La prop `fragmentos` sigue en la interfaz para no tocar a los llamadores.

## Verificación
- `tsc --noEmit` y `eslint` sobre el archivo: sin errores.
- No se verificó visualmente en el navegador.
