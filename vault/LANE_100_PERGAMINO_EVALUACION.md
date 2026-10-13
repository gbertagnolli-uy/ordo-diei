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

## Pendiente (UI)
- Paso previo en `ModalSorpresa`: si hay evaluación, pergamino (Hoja medieval, Parisienne marrón oscuro) con botón para continuar; si no, directo al 3D. Falta el diseño de la carpeta `Pergamino`.
