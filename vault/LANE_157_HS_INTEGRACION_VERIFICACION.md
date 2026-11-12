# Lane 157 — Lo que quedó fuera (análisis) y verificación alineada

Pedido del usuario: "implementa todo lo faltante y lo que no se hizo. Tambien lo que quedó fuera analiza si se debe hacer, en caso que si analiza como hacerlo."

## Hecho
- `vault/nuevas-features/homeschooling/INTEGRACION_CON_OTRAS_LANES.md`: para cada tema fuera de alcance (N4, N13, N2, N3, N5, N6, kiosco/curfew/batería) dice si se debe hacer, por qué y cómo. Lo que se podía hacer ya se hizo (N4, temporizador y cronómetro, señal `video`); lo que depende de lanes inexistentes quedó con su contrato escrito, incluso en las specs de `sonidos-ui` y `musica-fondo`.
- `ReproductorLeccion` registra la exención `video` (`useMantenerActivo("video", reproduciendo)`).
- `verificar_invariantes.sh` y `PLAN_VERIFICACION.md`: desvíos aceptados D-21 a D-26 fijados con su forma exacta. Sobre `dev` pasa de 31 a 0 FALLA.

## No hecho aquí
La prueba en navegador y los tests con base real: lane 158.
