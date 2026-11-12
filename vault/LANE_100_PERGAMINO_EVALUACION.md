# Lane 100 — Pergamino con la evaluación antes del premio sorpresa

**Pedido (textual):**
> En los premios sorpresa no se está mostrando el texto de la evaluación.
> La idea es que antes de mostrar el premio se lea la evaluación, a no ser que no haya evaluación, ahí si debería pasar directo a la animación de 3D.
> La intención es destacar el motivo del premio y darle un toque sentimental.
> Para ello quiero usar un pergamino para mostrar el texto de la evaluación como este: https://github.com/adooone/paper-ui
> Quiero usar una Hoja medieval — Papel con bordes irregulares, sin rodillos cilíndricos.
> Tipografía: Parisienne (Google Fonts), `font-family: "Parisienne", cursive; font-weight: 400`, color marrón oscuro.
> Carpeta de diseño en la PC LOQ3050: `C:\Users\evoxu\Downloads\Agencia\Dev\18_OrdoDiei\Pergamino`

## Hecho (datos)
- `Recompensas.Evaluacion` (columna nueva, solo `ADD COLUMN`, aplicada con `db execute`): copia la evaluación del comportamiento en el premio, el vale y el reconocimiento. Los premios ya creados leen la de `Comportamiento` por la relación.
- `RecompensaVista.evaluacion`: solo viaja mientras el premio está sin abrir.

## Hecho (UI)
- Asset: `public/premios/hoja-medieval.webp`, sacado de `Pergamino/realistic-rolled-parchment-paper-isolated.zip` (`11468962.png`): se recortó la hoja central **sin los rodillos** y se rasgaron los bordes superior e inferior (los laterales ya eran irregulares) con ImageMagick. Los íconos `parchment*.png`, `letter*.png`, `map.png` de esa carpeta no se usaron (son íconos de juego, no hojas para texto).
- Fuente: Parisienne vía `next/font/google` (`--font-parisienne`, en `layout.tsx`), color `#4a2c12`.
- `ModalSorpresa`: prop `evaluacion`; si hay, primero se muestra `PergaminoEvaluacion` (con el título como motivo en los regalos) y el botón «Continuar» pasa a la animación 3D; si no hay, va directo. El reconocimiento espera a que se lea antes de lanzar los confites.
- `MisPremios` pasa `r.evaluacion` al abrir.
- Nota: el premio se acredita en el servidor al tocar «abrir», antes de leer el pergamino (no se cambió el comportamiento de la API).
