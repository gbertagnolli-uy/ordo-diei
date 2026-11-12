# Estudio frente a las 12 apps del ranking

> Lane 199, 2026-10-16. Fuente: [`ref/Features_Homeschool_Apps_Ranking.md`](ref/Features_Homeschool_Apps_Ranking.md) (12 apps, ~770 features). Catálogo función por función: [`CATALOGO_FEATURES_ESTUDIO.md`](CATALOGO_FEATURES_ESTUDIO.md) (59 de 60 hechas). Criterio del usuario: igual de completa que la mejor, pero **católica, presencial, con poca pantalla, sin compliance legal, sin apoyos para discapacidad, de una sola familia**.
> Las estrellas son mías y honestas: 5 = al nivel de la mejor app del ranking en lo que esta app se propone; «—» = no es el propósito (descartado por el criterio). No mido contra funciones que el criterio excluye.

## 1. Por categoría del ranking (Parte 2 del documento)

| Categoría | La mejor del ranking | Estudio | Qué hay | Qué no hay y por qué |
|---|---|---|---|---|
| Contenido | Power Homeschool / Time4Learning (catálogos propios) | ★★★★ | El padre trae el currículo: lecciones con video (YouTube/Vimeo con checkpoints y quiz), PDF, ePub, Docs, markdown y texto; carga masiva y de la semana; 7 cursos católicos listos; paquetes importables | Sin catálogo propio de miles de lecciones (el propio ranking dice «no compitas ahí») |
| Planificación | Homeschool Planet / Homeschooler.app | ★★★★★ | Plan por curso y por hijo, días sin clase, «Ponerse al día» con fin sugerido, mover/omitir, calendario con arrastre, vista «Todos» con color por hijo, «Configurar el año» (vacaciones y fiestas), `.ics` a Google/Apple, hoja semanal imprimible, año litúrgico | Sin planes de editoriales (se sustituye por paquetes JSON y la biblioteca católica) |
| Tracking | Power Homeschool | ★★★★ | Horas, asistencia, lecciones, quizzes con repaso espaciado, resumen semanal, libreta | Sin tutor adaptativo (Vectored/Prism): con un padre presente se corrige a mano |
| Compliance | Homeschool Hall | — (★★★ útil) | Boletín por período, libreta, asistencia y horas imprimibles, portafolio imprimible | Leyes por estado, NOI, transcripts universitarios, GPA ponderado, ID card: **descartado** por criterio |
| Portafolios | Seesaw / Homeschooler.app | ★★★★★ | Evidencia con foto, revisión con swipe, nota, destacadas, comentarios y reacciones, portafolio por rango para imprimir | — |
| Social | Miacademy / Outschool | ★★★★ (familiar) | Comentarios y reacciones, muro, avisos, campana, mensajes 1 a 1 | Marketplace, clubes, otras familias: **descartado** (solo la familia) |
| Gamificación | Miacademy / Prodigy | ★★★ | Puntos y economía de Ordo (cartas, tienda, premios), racha, logros en el muro, memoria con dominio | Juegos, RPG, avatares, mascotas: **descartado** (poca pantalla) |
| Mobile | Power / Outschool (apps nativas) | ★★★ | Web responsive probada a 390 px y 820 px, `.ics` al calendario del teléfono | Apps nativas: fuera de alcance (BLOQUEOS) |
| Accesibilidad | Miacademy / Reading Eggs | ★★★★ (WCAG) | axe-core WCAG A/AA limpio en padres e hijos; teclado en visor y quiz | TTS, dislexia, TDAH: **descartado** por criterio |
| Multi-hijo | Homeschool Planet / Khan Kids | ★★★★★ | Hijos ilimitados, asignar un curso a varios a la vez, «Todos» con color, configurar el año para todos, mensajes y muro de toda la familia | — |

## 2. Por app: su «ventaja injusta» y cómo queda cubierta

| App | Ventaja diferencial (del ranking) | Estudio |
|---|---|---|
| Power Homeschool | Vectored Instruction, Writing Tutor con IA, 470 cursos, desbloqueo secuencial estricto | Desbloqueo secuencial **sí** (candados por lección y por día); el resto, descartado (adaptativo/IA/catálogo) |
| Miacademy | Economía Gold, marketplace, comunidad moderada, lifetime | Economía propia de Ordo (puntos, cartas, tienda); comunidad **familiar** moderada por los padres |
| Time4Learning | Precio/flexibilidad, plantillas de transcript y diploma, 30 % por hijo | Sin precio; hijos ilimitados; diploma/transcript descartados |
| Homeschool Planet | Reprogramación en un clic, sync con Google/Apple, 4.000 planes | **Sí**: «Ponerse al día», `.ics`, y paquetes + biblioteca católica en lugar del marketplace |
| Outschool | 140.000 clases en vivo, check-in visual | Descartado (remoto); las actividades fuera de pantalla con horas sí están |
| Reading Eggs | Fast Phonics, 5 sub-programas, 4.000 e-books | Lista y registro de lectura **de papel**, ePub dentro de la app, memoria de textos |
| Homeschool Hall | Stat widgets por estado, Transcript Builder, directorio local | Descartado (legal); boletín y reportes de la casa **sí** |
| ABCmouse | 13.000 actividades, 6 mundos | Descartado (juego en pantalla); printables y hoja del día **sí** |
| Homeschooler.app | Estudiantes ilimitados, lifetime, generadores gratis | Hijos ilimitados; boletín, libreta y reportes **sí** |
| Prodigy Math | Stealth assessment en un RPG | Descartado |
| Seesaw | Multipage, apps Class/Family, integraciones escolares | Portafolio con varias fotos, comentarios y reacciones **sí**; integraciones descartadas |
| Khan Academy Kids | 100 % gratis, personajes guía, printables | Sin costo, sin anuncios; printables **sí** (con tope) |

## 3. Lo que ninguna de las 12 tiene y Estudio sí

1. **Imprimir con tope**: el hijo imprime su material y su hoja del día (2 veces, más las que dé un padre), con registro.
2. **Material del día en cualquier formato y sin fricción**: «Pegá lo que tengas», «Cargar la semana», ePub y PDF dentro de la app, todo enlazado (Drive/YouTube) sin gastar almacenamiento.
3. **Vida católica en el centro**: memoria de oraciones con repetición espaciada y recitado frente a un padre, hoja para copiar a mano, siete cursos católicos, domingos y fiestas con su color en el plan, «Hoy en la Iglesia», fiestas de primera clase como días sin clase.
4. **La tarea es una tarea del hogar**: cada día lectivo es una `Tarea` con puntos; el delivery se automatiza solo.
5. **Corrección con un padre al lado**: clave de respuestas solo para padres, nota al aprobar, aprobación en lote, recitado calificado.

## 4. Verificación y límites (honestos)

- `tsc`, `eslint`, **227 tests de Estudio con base de datos local** (226 pasan; el que falla necesita datos litúrgicos de la base real), `next build`, y **dos pasadas visuales en Chromium** (390 px y 820 px) con capturas, errores de consola, desbordes y axe-core WCAG A/AA, incluidos los flujos interactivos del hijo.
- **No** se probó en un dispositivo real (tablet o teléfono físicos) ni la impresión en papel; el diálogo de impresión del navegador se abre, pero no se imprimió.
- **No** hay tiempo real (mensajes y avisos consultan cada 8–60 s), ni correo ni push (BLOQUEOS B-7).
- Abiertos de bajo impacto: rotación del enlace `.ics` (B-12), fallo intermitente ocasional de `integrar.sh` (B-14).
