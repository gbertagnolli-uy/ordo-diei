# Lane 181 — V1: «Hoy» del hijo y visor de lecciones

Pedido: «El UX del consumo de videos/lecciones/quizzes/tareas/ejercicios/etc debe ser world-class» y «educación con las menos pantallas posibles».

- **Pantalla «Hoy»** rediseñada: saludo según la hora de la casa («Buenos días, Leo»), mensaje de ánimo según el avance («Ya casi: te falta una»), barra y contador del día, y una sola decisión por vez: la tarjeta **«Lo que sigue»** (título, materia, rango, minutos) con **Empezar** grande, **Imprimir mi hoja** y **Foto de mi trabajo**. Lo demás va en «Después» y lo hecho queda plegado en «Hecho hoy». Cuatro atajos en cuadrícula —Mi lectura (libro en curso y %), Mi memoria (cuántas toca recitar hoy), Mis actividades, Mi portafolio— reemplazan la pila de botones. El modo calmo pasó al final. Las variantes de apoyo (Primero/Después, historias) no se tocan.
- **Visor de lección**: «lección i de n» y barra segmentada del día (hecha / actual / pendiente), y flechas ← → para pasar de lección (la siguiente solo si no tiene candado).
- `lib/homeschooling/saludo.ts` (puro, 3 tests): saludo, mensaje, avance y duración. Datos extra en el servidor: `contarMemoriaHoy`, `lecturaEnCurso`.
- Pendiente (V2/V3): quiz con retroalimentación animada, estados de carga/vacío y revisión de accesibilidad de todas las pantallas.
