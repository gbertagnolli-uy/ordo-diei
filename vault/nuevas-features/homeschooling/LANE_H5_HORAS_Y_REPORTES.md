# Lane H5 — Horas y reportes imprimibles

> Lista para implementar. Depende de **H2** (y usa lo de H3 si existe). Tamaño **S–M**. Antes llevaba compliance legal, Carnegie y GPA: **eso queda fuera** (HD5, uso doméstico). Si algún día se necesita, será una lane aparte.

## Objetivo
Saber cuántas horas y lecciones lleva cada alumno por materia y poder imprimir un resumen del año.

## Modelo (esta lane agrega)
`ActividadOffline`.

## Servidor (`servidor/horas.ts`)
- `registrarActividad({ actorId, alumnoId, materiaId, fecha, titulo, minutos })` (Padre/Madre, o el propio alumno con aprobación implícita del padre al verla; v1: solo Padre/Madre).
- `resumenHoras({ alumnoId, desde, hasta })` → por materia: minutos de lecciones (por cada `DiaLectivo` `hecha`: `Tarea.tiempoRealEjecucionSeg` si existe, o el estimado `unidades·minutosPorUnidad`) + minutos offline, lecciones hechas / planificadas, promedio de notas de quizzes si hay. Función pura `sumarHoras` con test.
- `Materia.metaHoras` opcional (la fija el padre; sin cifras precargadas): barra «horas hechas / meta que vos fijaste».
- API: `POST /api/homeschooling/actividades`, `GET /api/homeschooling/reportes/resumen?alumnoId&desde&hasta`.

## UI
- `/dashboard/homeschooling/horas`: formulario ágil (alumno, materia, título, fecha, duración en horas/minutos) y lista del mes. Si existe el temporizador visual (N13), botón «Cronometrar»; si no, solo entrada manual.
- `/dashboard/homeschooling/reportes`: selector de alumno y período (año escolar, trimestre, mes) → vista previa del reporte: portada con nombre y período, tabla por materia (horas, lecciones, notas), lista de cursos con avance y, si H3 existe, las **evidencias destacadas** en un anexo. Botón **«Imprimir / Guardar PDF»** (`window.print()`).
- Estilos `@media print`: A4, márgenes 2 cm, sin sidebar/dock/botones (clase `print:hidden` en el shell), saltos de página entre secciones.

## Pruebas
`sumarHoras` (solo lecciones, solo offline, mezcla, período que recorta), y que el reporte excluya días `pendiente`.

## Aceptación
1. Registrar 90 min de «Visita al museo» suma 1,5 h a esa materia en el resumen.
2. El reporte imprime sin elementos de la interfaz.
3. Las evidencias destacadas aparecen en el anexo (si H3 está integrada).
