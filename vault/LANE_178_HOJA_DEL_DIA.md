# Lane 178 — P3: «Imprimir mi hoja» del día

Pedido: «que el niño pueda imprimir su tarea desde la app … que no pueda imprimir más de una vez o dos». P1 cubre el material; esta lane cubre la **tarea del día** completa.

- **Tabla** `Homeschool_Impresiones_Dia` (`ImpresionDia`; aditiva): `uso`, `extra` (lo da un padre) y `padre` (imprime un padre, sin tope). Permitidas = **2** + extras por día y alumno (`IMPRESIONES_HOJA_DIA`). Transacción serializable; superado el tope: 409 («Pedile una más a mamá o a papá»).
- **Hoja** `/imprimir/dia/[token]`: materia, curso, fecha, rango del día y minutos; cada lección con casilla, sus instrucciones y el texto/markdown que dejó el padre; el material de enlaces se nombra («en la app»); renglones «En tu cuaderno» y «Hecho ☐ / Revisó». A4, blanco y negro. El token vale 15 minutos y es del alumno (o un padre): reimprimir en ese lapso no gasta otra.
- **Hijo**: botón «Imprimir mi hoja» en la tarjeta de «Hoy» (con confirmación que dice cuántas quedan y se apaga al agotarse). `DiaHoy.hojaRestantes`.
- **Padre**: en el día del calendario del plan, «Imprimir hoja del día» (sin tope) y «El alumno imprimió la hoja N de M · +1 más».
- Rutas: `POST/GET/PUT /api/homeschooling/dias/[id]/hoja`.
- Tests: sin base (permisos, 404, restantes por defecto) y con base (flujo del tope, no corrido: `PERMITIR_TESTS_DB=1`).
