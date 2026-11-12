# Lane 169 — S1: barra superior y buscador de Estudio

Pedido del usuario: «Ten cuidado de trabajar bien la UI, con la barra superior con breadcumbs y boton de sidebar, botones de navegacion y buscador en las paginas que lo requieran».

- `CabeceraEstudio`: botón del sidebar + migas + **botones Atrás/Adelante** + **buscador** (todas las páginas de Estudio).
- `BuscadorEstudio`: paleta con ⌘K / Ctrl+K o «/»; espera 250 ms, descarta respuestas viejas, navega con ↑ ↓ Enter, Esc cierra; resultados agrupados por tipo.
- `servidor/buscar.ts` + `GET /api/homeschooling/buscar?q=`: materias, cursos, lecciones, material, evidencias y actividades (5 por tipo). El padre busca en todo; un hijo solo en lo que tiene un plan suyo, su material, sus evidencias y sus actividades.
- Pendiente (S1b): buscadores propios en las listas largas (portafolio, actividades, revisión).
- Test de solo lectura contra la base (padre e hijo); no escribe.
