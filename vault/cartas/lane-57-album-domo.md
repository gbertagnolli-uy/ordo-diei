# Lane 57 — Álbum en 3D (domo de cartas) con carta que se voltea

## Pedido (textual)

> Quiero crear una pantalla nueva para el album de cartas.
>
> Quiero usar este componente: [React Bits DomeGallery]
> `<DomeGallery minRadius={350} maxVerticalRotationDeg={20} dragDampening={3.6} grayscale={false} />` dentro de un `div` de `100vw × 100vh`.
>
> Pero adaptado para el formato y tamaño de las cartas.
>
> Al hacer click en la imagen de una carta (la cual puede estar bloqueada o no y deberia ser consistente con la vista actual según su estado), el componente muestra un modal con la imagen clickeada. Lo que busco es que se abra la vista de tarjeta actual, la que tiene 3D o holo, pero además de eso, quiero que al presionar la tarjeta (click o tap) se haga flip y se muestra la parte de atrás de la tarjeta, con un botón para ir a la página de la tarjeta con el texto "Abrir carta".
>
> El componente que pretendo que uses y adaptes es este: [React Bits FlipCard]
> `<FlipCard front={…} back={…} axis="y" flipOnClick draggable dragDistance={0} tilt tiltMax={12} glare glareOpacity={0.22} hoverScale={1.03} perspective={1100} stiffness={170} damping={20} width={300} height={400} radius={22} background="#27272a" color="#f5f5f5" shadow shadowColor="#000000" shadowOpacity={0.45} onFlipChange={flipped => console.log(flipped)} />`
>
> Pero en vez de reemplazar el holo card component, quiero que veas el codigo del flip card component y te bases en el para enriquecer el componente de holo card, para que tenga esa feature de voltear la carta.

Nota: el usuario pegó solo el uso de `FlipCard`, no su código (no está en el repo). Se tomó su API (`back` como contenido,
`flipOnClick`, `onFlipChange`) y se apoyó en el volteo que `HoloCard` ya traía (resorte `turn`, `backImage`).

## Cambio

- **`HoloCard`** (enriquecido, no reemplazado): nuevas props `back` (ReactNode), `flipOnClick` (default `true`), `flipped`
  (controlado, opcional) y `onFlipChange`. Con `back` o `backImage` la carta se voltea con click o tap, manteniendo el
  tilt y el holo del frente. Los `a`/`button`/`[data-no-flip]` del dorso no voltean la carta; el dorso es `inert` y
  `aria-hidden` mientras la carta está de frente. El CSS de `img` pasa a `.holo-card__face > img` para no afectar
  imágenes dentro del dorso.
- **`CartaVista`** (modo holo): prop `reverso`; la pasa como `back` y oculta candado e insignias cuando está de espaldas.
- **`DomeGallery`** (`src/components/DomeGallery.tsx` + `.css`): adaptación de React Bits DomeGallery a TypeScript. Las
  celdas siguen siendo cuadradas, pero muestran la carta 63:88 centrada y a todo el alto; las bloqueadas van en B/N con
  candado. Se quitó el overlay de «agrandar imagen»: un toque/click llama a `onSelect(item)`.
- **`ReversoCarta`**: dorso con nombre, subtítulo, rareza, grado, progreso (solo bloqueadas) y el botón **Abrir carta**
  (enlace a `/dashboard/cartas/<clave>`). Solo usa datos ya visibles para el usuario.
- **`AlbumDomoView` + `/dashboard/cartas/album`**: pantalla nueva con todas las cartas del catálogo. Al tocar una se abre
  un modal con la carta: desbloqueada → holo; bloqueada → holo en B/N con candado (el mismo `blancoYNegro` de «sin
  consagrar»). Un click o tap la voltea.
- **`ColeccionView`**: botón «Explorar en 3D» en la pestaña Álbum (único punto de entrada; no cambia nada más).

## Librerías

| Lib | Versión | Licencia | Rol |
|---|---|---|---|
| `@use-gesture/react` | ^10.3.1 | MIT | arrastre e inercia del domo (la usa DomeGallery de React Bits) |
| React Bits DomeGallery | main (2026-10) | MIT | base del domo |

## Decisiones

- Con 8 o 175 cartas, el domo tiene 175 celdas: las cartas se repiten en orden, sin dos iguales seguidas (como el original).
- Los toques: mouse y teclado por `click`/`Enter`; táctil por `onDragEnd` buscando la carta con `elementFromPoint`
  (use-gesture captura el puntero en el contenedor). Un guard de 400 ms evita abrir dos veces.
- La bloqueada del modal es holo en B/N y no la tarjeta plana del detalle, porque la plana no tiene volteo.

## Verificación

Chromium headless (puppeteer-core) sobre una página temporal con cartas de prueba (ya borrada), 1300×900 y 390×800 táctil:
el domo gira y tiene inercia; tap/click abre el modal; click voltea y se ve el dorso; «Abrir carta» navega sin voltear de
nuevo; bloqueada y desbloqueada. `tsc --noEmit` y eslint sin errores.

## Seguimiento (lane 60): arrastrar para girar

El usuario pegó después el código real de `FlipCard` (`ref/FlipCard-resumen.md`). Lo que mi primera versión no tenía y
se agregó a `HoloCard`: `draggable` y `dragDistance`. Se arrastra horizontalmente para girar la carta; al soltar encaja
en frente o dorso (con inercia), el click posterior a un arrastre no voltea, y el puntero solo se captura al empezar a
arrastrar para que los enlaces del dorso sigan funcionando. El destino del giro es ahora un múltiplo de 180°
(`turnTargetRef`), igual que en FlipCard. No se portó `axis="x"`: el holo gira solo en Y.

Verificado con Chromium headless: click voltea y desvuelve, arrastre de 30 px vuelve, de 200 px voltea una sola vez, el
enlace del dorso no voltea.
