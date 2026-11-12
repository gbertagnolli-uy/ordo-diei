# Lane 188 — E7: el año litúrgico en el calendario del plan

Catálogo E7. Vida católica dentro de la planificación: al programar el año se ven los domingos y las fiestas.

- En el calendario del plan (mes/semana/día) aparecen, como franjas de día completo, **los domingos y las fiestas de primera y segunda clase** del rito de 1906 con el **color litúrgico** de cada día (blanco, rojo, verde, morado, negro, rosa) y el título en español; las de primera clase van en negrita. No se pueden mover ni abrir (solo informan).
- `lib/homeschooling/festividades.ts` (puro, 3 tests) decide qué se marca y los colores; `servidor/festividades.ts` lee `Dias_Liturgicos` (120 días atrás y 400 adelante; hay datos 2026–2035) y no falla si faltan.
- Tests: lib y lectura contra la base (Navidad 2026 es fiesta mayor; ≥ 40 marcas en el año; fuera del rango no hay nada).
- Pendiente: marcar en el plan los días de precepto y de ayuno; sugerir «Sin clase» en las fiestas de primera clase.
