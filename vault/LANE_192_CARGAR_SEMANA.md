# Lane 192 — Cargar la semana de una vez

Pedido: «la carga de contenidos tambien debe ser algo fluido y sin fricción para los padres».

- **«Cargar la semana»** (botón en el Plan): el padre ve lunes a viernes (y sábado/domingo si quiere), escribe en cada día **un material por línea** —un enlace de YouTube, Drive, Docs, PDF… o una tarea corta— y con **un clic** queda cargada toda la semana. Se navega de semana en semana; lo escrito queda como borrador si se cierra el diálogo.
- Cada línea se detecta sola (tipo, proveedor, título de la página con 5 consultas a la vez) y se crea como **material suelto** del hijo en esa fecha: aparece en «Para hoy» el día que toca, con su «Terminé», y en la hoja semanal imprimible. Hasta 20 materiales por día y 60 por carga, en una transacción.
- `cargarSemana` en `servidor/materiales.ts`; ruta `POST /api/homeschooling/materiales/semana` (solo padres).
- Tests: permisos y validaciones sin base; el flujo con base queda escrito (`PERMITIR_TESTS_DB=1`).
