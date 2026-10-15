# Lane 198 — pruebas con base de datos local y correcciones de la pasada visual

Se resolvió el bloqueo B-11 (tests con base sin correr) **sin tocar la base de producción**: un PostgreSQL 18 local (paquete `embedded-postgres`, sin Docker ni root, en `dev/_verif/`, puerto 55432) con el esquema completo (`prisma migrate diff --from-empty`, 60 tablas). Con `DATABASE_URL`/`DIRECT_URL` apuntando ahí y `PERMITIR_TESTS_DB=1`, corren los 227 tests de Estudio **sin ninguno saltado**: 226 pasan; el único que falla es el de las fiestas litúrgicas, que necesita los datos de `Dias_Liturgicos` que solo tiene la base real (y pasa contra ella).

Errores reales que aparecieron al correr los flujos con base y se corrigieron:
- **Avisos de comentario**: si un destinatario se borraba justo antes de crear los avisos, fallaba el `createMany` entero y nadie recibía el aviso → ahora se crea uno por destinatario con `Promise.allSettled` (también en el aviso del muro).
- **`impresiones.test.ts`**: el cierre no borraba los materiales del padre de prueba y el borrado del usuario chocaba con la clave foránea (RESTRICT).
- Los tests de Estudio comparten base y se pisan si corren en paralelo: contra una base de pruebas conviene `node --test --test-concurrency=1`.

Pasada visual (con datos de prueba en esa base local): corregidos el desborde horizontal del diálogo «Agregar material» (los `Textarea` de `ui/` usan `field-sizing: content` y se ensanchan con un enlace largo → `field-sizing-fixed` en «Agregar material», «Agregar varias» y «Cargar la semana») y los títulos en latín de las fiestas (diccionario `tituloEnEspanol` para las de 1.ª y 2.ª clase sin título en español; se excluyen las vigilias de las sugerencias del asistente del año).

## Segunda pasada visual, con datos (base local sembrada: 4 personas, 3 materias, 2 cursos con plan, material, notas, libros, memoria, muro, mensajes)

Recorrido en Chromium (teléfono 390 px y tablet 820 px) por las pantallas del hijo y de los padres, con capturas y axe-core, más los flujos interactivos del hijo (abrir una lección, el visor de material, «Imprimir» con su confirmación y la hoja que se abre en otra pestaña, y el quiz). Hallazgos corregidos:
- **Quiz dentro del visor**: «Hacer el quiz» lo mostraba al final, debajo del video, el material y los comentarios, fuera de la pantalla en el teléfono → ahora, con el quiz en marcha, el visor muestra **solo el quiz**.
- **Visor de material**: el botón de cerrar (X) quedaba tapado por la barra fija → `z-20`.
- **Hoja impresa**: «Jueves, 15 De Octubre» (cada palabra en mayúscula) → solo la primera letra.
- **«Hoy»**: «Para hoy» (tareas sueltas) aparecía antes que «Lo que sigue» → ahora el protagonista es siempre la tarjeta principal; las tareas sueltas van después.
- **Resumen de Lectura y Memoria**: tres tarjetas apiladas ocupaban media pantalla en el teléfono → `ResumenCompacto`: una sola tarjeta con los tres números en una fila.
- **axe-core**: barras de progreso sin nombre accesible (`aria-progressbar-name`) en «Hoy», lecturas, tarjetas y cursos; `aria-label` en elementos sin rol en Memoria (→ `role="img"`).
