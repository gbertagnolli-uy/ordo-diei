# Lane 93 — Premios instantáneos y fragmentos con el modal de sobres

**Pedidos (textuales):**
> Revisa para que los premios aparezcan de forma instantanea, registre un comportamiento y no le aparece a Ana
> Si pero ya recargamos con Ctrl + Shift + R y no aparece
> Ademas de eso, cuando la persona gana fragmentos de carta, debe aparecer el componente usado para cuando se abren sobres

## Diagnóstico
- El banner, las insignias y «Mis premios» se calculaban en el servidor solo al navegar: nada los volvía a pedir.
- Con Ctrl+Shift+R tampoco aparecía: en la base, los comportamientos de Ana (ids 7 y 10) se guardaron con `Premios: []`. Sin premios es solo una anotación de bitácora (no se crea recompensa), y el cofre de hoy ya lo había abierto (máximo uno por día).

## Hecho
- `ActualizarPremios` (en el layout del dashboard): `router.refresh()` cada 15 s y al volver a la pestaña/ventana. `MisPremios` re-sincroniza su lista con lo que trae el servidor, sin pisar un premio que se está abriendo.
- `abrirPremioSorpresa` devuelve `cartasAfectadas` y `totalInciensoGanado`; al cerrar el modal del premio, si hubo fragmentos se abre `ModalAperturaSobre` (el mismo de sobres y regalos).
