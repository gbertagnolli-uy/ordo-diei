# Lane 153 — Estudio: navegación, panel y cabeceras de origen

Pedido del usuario: "Revisa si todavia es necesario ese arreglo. Además, revisa la integración de roost, porque me parece muy basico el panel de estudio, además no tiene controles de navegación, por lo que si entrás a un curso no tenés como volver para trás a la materia."

## Diagnóstico
- Las páginas de Estudio no usaban ninguna cabecera: sin botón del menú lateral (móvil), sin migas, sin forma de pasar de una sección a otra más que el menú principal. Dentro de la materia el único «volver» era un ícono sin texto, y desde una lección solo existía «Volver a los cursos» en la barra lateral (oculta en pantallas chicas).
- El panel era solo una grilla de materias y botones.
- El arreglo de `verificar_invariantes.sh` (ver P-42): solo hacía falta lo de las cabeceras de origen; las firmas son una decisión de diseño.

## Hecho
- `app/dashboard/homeschooling/layout.tsx` + `nav/CabeceraEstudio`: cabecera sticky con menú lateral, migas y pestañas por rol (padre: Panel, Plan, Revisión con contador, Portafolio, Actividades, Reportes, Apoyos, Días sin clase; hijo: Hoy, Portafolio, Actividades, Reportes). Se oculta al imprimir.
- `cursos/Migas` en `MateriaLayout`: Estudio › Materia › Curso › Lección, cada nivel un enlace. «Volver a <materia>» en el curso y «Volver a <curso>» en la lección. La barra lateral de la materia se acomoda bajo la cabecera.
- `servidor/panel.ts` (`resumenPanel`) y `PanelHomeschooling` nuevo: resumen con `StatsCard` de Roost (clases de hoy, para revisar, atrasadas, avisos), tarjeta «Hoy» por hijo con sus clases y avance, y materias con sus cursos y porcentaje (cada curso enlaza directo a su pantalla).
- Cabeceras «Portado de vendor/roost/… @492af47» en `servidor/{cursos,evidencia,actividades,progreso}.ts`.

## Verificación
`tsc`, `eslint`, `npm test` (350) y `next build` en verde; el script de invariantes bajó de 31 a 25 FALLA. No se probó en un navegador. Hallazgos P-42 y P-43.
