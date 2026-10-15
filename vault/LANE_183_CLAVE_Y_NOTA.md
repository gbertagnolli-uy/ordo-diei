# Lane 183 — K1b: clave de respuestas solo para padres y nota al aprobar

Catálogo B6 y D2/D8 (corregir con un padre presente).

- **Clave de respuestas**: un material puede marcarse «Solo para padres». El hijo no lo ve (ni en su lista, ni en «Hoy», ni en el visor, ni en su búsqueda), no lo imprime y no sale en la hoja del día ni en la hoja semanal. Un padre lo ve con una insignia en la lista. Columna aditiva `Solo_Padres` en `Homeschool_Materiales`; entra y sale en los paquetes de curso (export/import). Al marcar, el límite de impresión pasa a 0.
- **Nota al aprobar** (Revisión): al aprobar una evidencia ligada a un día, un campo opcional de nota con los toques 100/90/80… la guarda en la libreta (`PUT /dias/[id]/nota`) en el mismo gesto. Las evidencias sueltas, sin día, siguen aprobándose solo con estrellas.
- Pendiente: aprobación en lote («todo lo de hoy»), corrección de quizzes de papel con la clave en pantalla.
