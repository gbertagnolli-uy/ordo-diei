# Lane 187 — S1b: buscador en las listas largas

Pedido: «botones de navegacion y buscador en las paginas que lo requieran». El buscador global (⌘K, lane 169) busca en todo Estudio; esta lane agrega el **campo de búsqueda propio** de cada lista larga.

- `lib/homeschooling/buscarTexto.ts` (puro, 3 tests): sin acentos ni mayúsculas, todas las palabras en cualquier campo y orden (`fracc leo` encuentra «Fracciones» de «Leo»).
- `CampoBusqueda` (ícono, botón de borrar, Escape vacía, «n resultados» en vivo) en **Portafolio**, **Revisión de evidencias**, **Actividades**, **Lectura** (si hay más de 3 libros) y **Memoria** (si hay más de 5 textos). Filtra en el momento, en el cliente, sobre lo que la página ya trajo.
- Pendiente: lista de notas de la libreta y de materiales del plan.
