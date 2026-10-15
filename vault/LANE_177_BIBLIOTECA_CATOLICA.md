# Lane 177 — L3: biblioteca de cursos católicos

Catálogo E6 (sustituye al «marketplace de planes» de Homeschool Planet). Se apoya en los paquetes de curso de M3.

- `lib/homeschooling/paquetes/catolicos.ts`: seis cursos listos, generados como paquetes `ordo-curso` y validados por test contra el mismo esquema que la importación: **Oraciones del cristiano** (11), **Los diez mandamientos** (10), **Los siete sacramentos** (7), **El Rosario en familia** (4), **El año litúrgico** (5) y **Las obras de misericordia** (14). Cada lección trae lectura en markdown (imprimible 2 veces), tarea para el cuaderno y preguntas para conversar en familia. Las oraciones usan los textos del catálogo de Memoria.
- Botón «Biblioteca católica» en la grilla de cursos de una materia: elegir y «Agregar» crea el curso con todo; después se asigna a un hijo como cualquier curso.
- Rutas: `GET /api/homeschooling/biblioteca`, `POST /api/homeschooling/materias/[id]/biblioteca`.
- Contenido de uso común en la catequesis, sin textos con derechos ni traducciones propias de la Escritura; formulaciones breves que un padre puede revisar y editar en la app después de agregar el curso.
- Pendiente: más cursos (vidas de santos, historia de la Iglesia, Biblia por periodos), videos enlazados de YouTube elegidos por la familia.
