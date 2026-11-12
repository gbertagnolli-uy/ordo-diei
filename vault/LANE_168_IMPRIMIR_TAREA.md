# Lane 168 — P1: Imprimir la tarea con tope

Pedido del usuario: «que el niño pueda imprimir su tarea desde la app … enviarlo a impresión haciendo click en un botón (que no pueda imprimir más de una vez o dos para no gastar de gusto)».

## Qué quedó
- **Tabla** `Homeschool_Impresiones` (`ImpresionMaterial`): una fila `uso` por cada vez que el alumno abre la vista de impresión; `extra` cuando un padre da una más; `padre` cuando imprime un padre (sin tope). Esquema aditivo (sin `DROP`).
- **Tope**: permitidas = `limiteImpresiones` del material (0–10, por defecto 2, lo fija el padre al cargar o después) + extras. `registrarImpresion` corre en transacción serializable; superado el tope responde 409 («Ya usaste todas las impresiones… Pedile una más a mamá o a papá»).
- **Qué se imprime**: texto y markdown → hoja propia `/dashboard/homeschooling/imprimir/[token]` (A4, blanco y negro, título, alumno, fecha, materia, renglones «En tu cuaderno»); Google Docs/Slides/Hojas → su exportación a PDF; PDF por enlace → el enlace; videos y webs no se imprimen.
- **Hoja con token**: vale 15 minutos y solo para quien la pidió (o un padre); reimprimirla en ese lapso no gasta otra (por si la impresora falla).
- **Botón** `BotonImprimir` en la barra del visor del alumno: confirma mostrando cuántas le quedan, abre la pestaña dentro del clic (sin bloqueo de ventanas) y se apaga al llegar a 0.
- **Padre**: en cada material, «Ver impresiones» (cuánto imprimió cada hijo, cuándo) y «+1 más».
- `leccionesDeHoy`, la lista del alumno y el material suelto traen `restantes`.

## Límites (BLOQUEOS B-2/B-3)
Una web no sabe si salió papel: se cuenta abrir la impresión. Un PDF de Drive se imprime desde su propio visor. Los tests con base (`impresiones.test.ts`) no se corrieron: requieren `PERMITIR_TESTS_DB=1`.
