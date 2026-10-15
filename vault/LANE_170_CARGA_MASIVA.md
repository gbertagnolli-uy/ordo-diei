# Lane 170 — M3: carga masiva, duplicar y paquetes de curso

Pedido: «La carga de contenidos tambien debe ser algo fluido y sin fricción para los padres». Catálogo A4, A5, A6, A8 (parcial).

- **Agregar varias lecciones** (`AgregarVarias`): se pega una lista —un enlace por línea, «Título | enlace», `[título](enlace)`, «título enlace» o solo título— y la app detecta cada enlace, trae los títulos (oEmbed/`<title>`, 5 consultas a la vez, tope de 40), se revisa y se editan o quitan filas, y se crean todas en una transacción con un solo recálculo de planes. Hasta 100 por vez. El texto queda como borrador (`useBorrador`).
- **Duplicar curso**: copia lecciones, preguntas y material (no planes ni avances) en la misma materia, titulado «Copia de …».
- **Exportar / importar** como archivo `.ordo-curso.json` (`lib/homeschooling/paquete.ts`, formato `ordo-curso` v1): validado con zod antes de tocar la base; solo contenido, sin ids ni datos de la familia. Base de las plantillas y de los planes católicos precargados (L3).
- Rutas: `POST/PUT /api/homeschooling/lecciones/lote`, `POST /cursos/[id]/duplicar`, `GET /cursos/[id]/exportar`, `POST /materias/[id]/importar`.
- Pendiente: autoguardado también en «Agregar material» (A8 parcial); importar desde una lista de reproducción de YouTube (BLOQUEOS B-6).
- Tests: `listaLecciones.test.ts` (4) y `paquete.test.ts` (4). Las rutas contra la base no se corrieron (`PERMITIR_TESTS_DB`).
