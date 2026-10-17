# Lane 185 — D10: «Esta semana» en el panel de los padres

Catálogo D10 (resumen semanal para los padres). Sin correo ni push (BLOQUEOS B-7): el resumen vive en el panel.

- `servidor/resumenSemana.ts` (solo padres, solo lectura): por cada hijo, de lunes a hoy — clases hechas sobre las programadas, horas de estudio, notas nuevas con su promedio y letra, páginas leídas y libros terminados, oraciones recitadas, trabajos enviados.
- `ResumenSemanal` en el panel, sobre «Hoy»: una tarjeta por hijo con barra de avance, los cinco números y enlaces a «Ver la semana» (hoja imprimible) y «Libreta».
- Los números salen de las mismas tablas que usan el boletín y la libreta; el estado de cada clase se sincroniza con su Tarea (`estadoSincronizado`).
- Tests: permisos y forma del resumen contra la base real (solo lectura).
- Hecho de paso: se verificó que «Nuevo curso / Asignar» (`AsistenteCurso`) **ya permite elegir varios hijos a la vez** (catálogo C8 marcado como HECHO).
