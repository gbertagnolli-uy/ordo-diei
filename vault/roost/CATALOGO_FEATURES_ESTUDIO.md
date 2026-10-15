# Estudio — catálogo de features para igualar a las mejores apps de homeschooling

> Lane 165 (complemento de la lane 163), 2026-10-16. Fuente: [`ref/Features_Homeschool_Apps_Ranking.md`](ref/Features_Homeschool_Apps_Ranking.md) (12 apps, ~770 features, copiado tal cual del archivo del usuario). Estado de Roost: [`GUIA_EVALUAR_ROOST.md`](GUIA_EVALUAR_ROOST.md). Bloqueos comunes a todas las lanes: [`../nuevas-features/homeschooling/BLOQUEOS.md`](../nuevas-features/homeschooling/BLOQUEOS.md). Orden de ejecución: [`ROADMAP_ESTUDIO.md`](ROADMAP_ESTUDIO.md).

## 0. Pedido del usuario (textual, `/goal` del 2026-10-16)

> "Necesito que complementes la lane 163 con mas features para dejar la seccion estudio digna de compararse con cualquier de las apps mencionadas en Features_Homeschool_Apps_Ranking.md.
>
> Luego de hacer eso, comienza a implementar feature por feature. Obviamente trabaja en lanes y worktrees y no limpies nada. Si hay algo que te impida avanzar, documentalo en un documento en común a todas las lanes y seguí implementando. Intentá tomar decisiones con este criterio "la sección de estudio debe ser igual de completa que la mejor de las apps de Homeschooling, pero enfocada en homescholling católico, sin necesidad de compliance legal, sin necesidad de features para autistas/dislexicos/capacidades diferentes, con la intención de facilitar la programación de estudios, automatizar el delivery de tareas, facilitar la correción de trabajo teniendo en cuenta que al menos uno de los padres estará presente en el hogar (no debe ser una app para interactuar remoto, debe ser una app para los que educan presencialmente en casa), no debe ser una app pensada en que el niño/a estudie en la pantalla exclusivamente, aunque puede pasar que tenga que usar para algo la pantalla, la idea es una educación con las menos pantallas posibles, lectura real, lapiz y cuaderno. Lo que es almacenamiento, como supabase tiene limites, mejor priorizar almacenamiento externo como Google Drive, Youtube. La parte de "Social LMS" debe estar enfocada en interactuar entre el nucleo familiar, no con otras familias. El UX del consumo de videos/lecciones/quizzes/tareas/ejercicios/etc debe ser world-class. La carga de contenidos tambien debe ser algo fluido y sin fricción para los padres. Una feature que me gustaría tener es que el niño pueda imprimir su tarea desde la app, que el padre pueda cargar contenido de cada dia en el formato que sea (texto, PDF, Google Docs, ePub, markdown) y que el niño verlo y enviarlo pueda enviarlo a impresión haciendo click en un botón (que no pueda imprimir más de una vez o dos para no gastar de gusto)" Ten cuidado de trabajar bien la UI, con la barra superior con breadcumbs y boton de sidebar, botones de navegacion y buscador en las paginas que lo requieran."

Decisión previa del mismo día (Estudio): **es de una sola familia**; la comunidad es entre los integrantes de esa familia.

## 1. Criterio de decisión (resumen aplicable a cada fila)

| Se prioriza | Se descarta |
|---|---|
| Programar estudios y repartir el trabajo solo | Compliance legal: leyes por estado, NOI, umbrella, ID card, ESA, transcripts oficiales, GPA ponderado AP/IB |
| Automatizar el delivery diario (lo que toca hoy llega solo) | Features para autismo, dislexia, TDAH, TTS, "untimed", modo baja estimulación (lo ya hecho en `neuro/` queda, no se amplía) |
| Facilitar corregir: con un padre presente | Interacción remota: clases en vivo, tutores, mensajería con profesores, check-in por video |
| Pantalla mínima: lectura real, lápiz y cuaderno, **imprimir** | Juegos, RPG, mascotas, mundos virtuales, tiendas de avatares (la economía de Ordo ya cubre la motivación) |
| Almacenamiento **externo** (Drive, YouTube, enlaces) | Subir PDF/videos pesados a Postgres |
| Familia como comunidad (comentarios, logros, avisos) | Otras familias: marketplace, clubes, directorio, co-ops, foros |
| Católico: liturgia, catecismo, oración, santos, memorización | Pagos, planes, trials, apps nativas de tienda, COPPA |

Para el contenido propio no se compite (regla del propio ranking: "no intentes competir en contenido LMS completo"): **el padre trae el currículo**, la app lo programa, entrega, imprime y corrige.

## 2. Catálogo

Estado: **HECHO** (ya en `dev`) · **PARCIAL** · **NUEVO**. `Lane` = identificador en [`ROADMAP_ESTUDIO.md`](ROADMAP_ESTUDIO.md). «Apps» = dónde lo tiene la competencia (nº del ranking).

### A. Material y carga de contenido sin fricción (pedido explícito)

| ID | Feature | Apps | Estado | Lane |
|---|---|---|---|---|
| A1 | **Material del día**: el padre adjunta a un día (o a una lección) texto, markdown, PDF, Google Doc, ePub, enlace o video, en el formato que sea | HSPlanet 6, Homeschooler.app 5, Time4Learning 4, Seesaw | HECHO (lane 166) | M1 |
| A2 | **Caja única «Pegá lo que tengas»**: pega un enlace o texto y la app detecta el tipo (YouTube, Vimeo, Drive, Docs, PDF, ePub, markdown, web) | — (diferenciador) | HECHO (lane 166) | M1 |
| A3 | Visor integrado por tipo: markdown renderizado, PDF y Google Docs/Drive en visor embebido, video con checkpoints, ePub por enlace, web como tarjeta | Power 13, Reading Eggs 4 | HECHO (lane 167) | M2 |
| A4 | Carga masiva: pegar N enlaces (o una lista) y crear N lecciones de una vez | HSPlanet 5, Homeschooler.app 8 | HECHO (lane 170) | M3 |
| A5 | Duplicar curso/lección; reutilizar para otro hijo | Homeschooler.app 7, 40 | HECHO (lane 170) | M3 |
| A6 | Exportar/importar un curso como paquete JSON (plantillas que se guardan, se comparten por archivo o vienen precargadas) | HSPlanet 45-49 | HECHO (lane 170) | M3 |
| A7 | Adjuntar enlaces, notas y archivos a cada asignación | HSPlanet 6 | HECHO (lane 166) | M1 |
| A8 | Autoguardado de borradores en formularios del padre | Homeschooler.app 49 | PARCIAL (lane 170: solo «Agregar varias») | M3 |
| A9 | Subida de archivos pequeños a la base (solo como último recurso) | — | DESCARTADO | Se prioriza externo (ver BLOQUEOS B-1) |

### B. Imprimir (pedido explícito)

| ID | Feature | Apps | Estado | Lane |
|---|---|---|---|---|
| B1 | **Botón «Imprimir mi tarea»** del hijo en el visor del día, con vista de impresión limpia (A4/Letter, sin menús) | Time4Learning 4, Miacademy 10, ABCmouse 46 | HECHO (lanes 168 y 178) | P1 |
| B2 | **Límite de impresiones** por material (por defecto 2), contador visible («Te queda 1 impresión»), bloqueo en servidor, el padre puede dar una más | — (pedido) | HECHO (lanes 168 y 178) | P1 |
| B3 | Registro de impresiones (quién, qué, cuándo) | — | HECHO (lane 168) | P1 |
| B4 | Hoja imprimible con el detalle del día: título, lecciones, instrucciones, espacio para cuaderno, casilla «hecho» | Homeschooler.app 33 | HECHO (lane 178) | P1 |
| B5 | Checklist semanal imprimible por hijo, en color por materia | HSPlanet 56, 58 | HECHO (lane 173) | P2 |
| B6 | Clave de respuestas del padre (solo padres, no se imprime al hijo) | — | NUEVO | C2 |

### C. Programar (planificación)

| ID | Feature | Apps | Estado | Lane |
|---|---|---|---|---|
| C1 | Plan por curso repartido en días lectivos entre dos fechas | HSPlanet 3, Homeschooler.app 8 | HECHO | — |
| C2 | Días sin clase que se saltan y desplazan el resto | HSPlanet 8, Homeschooler.app 77 | HECHO | — |
| C3 | Mover / omitir un día; recalcular | HSPlanet 9 | HECHO | — |
| C4 | **Reprogramar en 1 clic**: arrastra lo pendiente atrasado a los próximos días (opción «solo esta materia», «no mover compromisos fijos») | HSPlanet 9-15, Homeschooler.app 4 | HECHO (lane 171) | R1 |
| C5 | Calendario drag-and-drop de días | Homeschooler.app 3 | PARCIAL (`PlanCalendario`) | R2 |
| C6 | Vista día / semana / mes con color por hijo y materia | HSPlanet 1, 36 | PARCIAL | R2 |
| C7 | Tareas sueltas del día (ejercicio, lectura, cuaderno) sin curso, recurrentes | Homeschool Hall 2, HSPlanet 5 | HECHO (lane 166) | M1 (se crean como material del día) |
| C8 | Plan para varios hijos a la vez / trabajo compartido por hermanos | Homeschool Hall 40, HSPlanet 35 | NUEVO | R3 |
| C9 | Asistente de configuración del año (hijos, materias, vacaciones, períodos) | HSPlanet 2-4, Homeschooler.app 5 | NUEVO | R3 |
| C10 | Feed `.ics` para Google/Apple Calendar | HSPlanet 40-41 | HECHO (lane 179) | R4 |
| C11 | Horarios por franja y rutina (ya existe `horarios`/`rutina`) | HSPlanet 8 | HECHO (módulo propio) | — |
| C12 | Buscar en todo el planner | HSPlanet 18 | NUEVO | S1 |

### D. Corregir y llevar el registro (un padre presente)

| ID | Feature | Apps | Estado | Lane |
|---|---|---|---|---|
| D1 | Cola de revisión con swipe de lo que el hijo terminó | Seesaw, Power 23 | HECHO (`revision/`) | — |
| D2 | **Corrección con nota** (0–100 o letra) y comentario del padre sobre el trabajo del cuaderno (foto) | Homeschooler.app 11, Miacademy 16 | HECHO (lane 172) | K1 |
| D3 | Libreta de calificaciones por hijo y materia con promedio | Homeschooler.app 15, HSPlanet 27 | HECHO (lane 172) | K1 |
| D4 | Boletín (report card) imprimible por período | HSPlanet 27, 54 | NUEVO | K2 |
| D5 | Períodos de calificación (trimestres) configurables | HSPlanet 2 | NUEVO | K2 |
| D6 | Asistencia y horas por materia, imprimibles | Miacademy 17, Homeschool Hall 7-11 | PARCIAL (`horas/`, `reportes/`) | K2 |
| D7 | Quiz automático con umbral, repaso espaciado | Time4Learning 12, Reading Eggs 17 | HECHO | — |
| D8 | Revisión rápida en lote («aprobar todo lo de hoy») | Homeschooler.app 11 | NUEVO | K1 |
| D9 | Portafolio de trabajos con foto y exportación imprimible | Seesaw 5-9, Homeschooler.app 27-29 | PARCIAL (`portafolio/`) | K3 |
| D10 | Resumen semanal para los padres | HSPlanet 44 | NUEVO | K3 |

### E. Lectura real y vida católica

| ID | Feature | Apps | Estado | Lane |
|---|---|---|---|---|
| E1 | Libro físico por páginas con rango diario | Power 13 | HECHO | — |
| E2 | **Registro de lectura**: libros leídos, páginas, fecha, calificación y narración oral anotada por el padre | Reading Eggs 4, ABCmouse 7 | HECHO (lane 175) | L1 |
| E3 | **Lista de lectura** por hijo (por leer / leyendo / leído) con portada | Reading Eggs 4 | HECHO (lane 175) | L1 |
| E4 | Liturgia del día, santo, oración (existe `liturgia`/`oracion`) | — | HECHO | — |
| E5 | **Memorización** (oraciones, versículos, preguntas del catecismo) con repaso espaciado | Power 12 | HECHO (lane 176) | L2 |
| E6 | Biblioteca de planes católicos precargados de dominio público (Catecismo de Baltimore, lectura de la Biblia, vida de santos) como paquetes importables | HSPlanet 45-50 | HECHO (lane 177) | L3 |
| E7 | Año litúrgico en el calendario del plan (festividades; existe `festividades-tridentinas`) | — | PARCIAL | L3 |
| E8 | Examen de conciencia / agradecimiento semanal del hijo (impreso o en pantalla) | — | NUEVO | L2 |

### F. Experiencia de uso (world-class)

| ID | Feature | Apps | Estado | Lane |
|---|---|---|---|---|
| F1 | **Barra superior unificada**: botón de sidebar, migas, atrás/adelante, buscador, acciones de la página | — | HECHO (lane 169) | S1 |
| F2 | Buscador global de Estudio (materias, cursos, lecciones, materiales, evidencias) con ⌘K | HSPlanet 18 | HECHO (lane 169) | S1 |
| F3 | Visor de lección en modo foco: teclado (←/→/espacio), progreso, transiciones, estado de carga, reanudar donde quedó | Power 26 | PARCIAL (`VisorLeccion`) | V1 |
| F4 | Quiz y ejercicios con feedback inmediato y animación sobria | Time4Learning 27 | PARCIAL | V2 |
| F5 | «Hoy» del hijo: pocas decisiones, grandes botones, siguiente paso claro, sin scroll innecesario | Khan Kids 19-20 | PARCIAL | V1 |
| F6 | Estados vacíos, esqueletos de carga y errores útiles en todas las pantallas | — | PARCIAL | V3 |
| F7 | Accesible por teclado y legible en tablet (≥44 px de toque) | HSPlanet 62 | PARCIAL | V3 |
| F8 | Colores por materia/hijo consistentes | HSPlanet 36 | PARCIAL | R2 |

### G. Familia como comunidad

| ID | Feature | Apps | Estado | Lane |
|---|---|---|---|---|
| G1 | **Comentarios** por lección, material y evidencia entre padres e hijos | Seesaw 14, Roost `CommentSection` | HECHO (lane 174) | Q1 |
| G2 | Reacciones simples (👍 ❤️ 🙏) a trabajos | Seesaw 13, Roost reacciones | HECHO (lane 174) | Q1 |
| G3 | **Muro de logros familiar**: lecciones completadas, rachas, destacados, santo del día | Seesaw 7, Roost feed | NUEVO | Q2 |
| G4 | Avisos de la familia (de los padres a los hijos) | Roost `AnnouncementBanner` | NUEVO | Q2 |
| G5 | Notificaciones in-app («Leo terminó Matemática», «Hay nueva tarea») | Roost `notifications` | HECHO (lane 174) | Q3 |
| G6 | Ranking y puntos | Roost leaderboard | HECHO (economía de Ordo) | — |
| G7 | Mensajes directos | Roost DM | NUEVO (sobre Q1, baja prioridad) | Q4 |

### H. Descartado a propósito (con motivo)

| Feature | Apps | Motivo |
|---|---|---|
| Catálogo de cursos propios (470, 1.000 lecciones, 140.000 clases) | Power, T4L, Outschool | El padre trae el currículo |
| Aprendizaje adaptativo, Vectored Instruction, stealth assessment, placement tests | Power, Prodigy, Reading Eggs | Con un padre presente se corrige a mano |
| Juegos, RPG, mascotas, mundos, marketplace de avatares | Miacademy, Prodigy, ABCmouse | Pantalla mínima; la economía de Ordo ya motiva |
| Clases en vivo, tutorías, Zoom, mensajería con profesores | Outschool | No es remoto |
| Leyes por estado, NOI, umbrella, ID card, ESA, transcripts universitarios, GPA ponderado, diploma | Homeschool Hall, Homeschooler.app, HSPlanet | Sin compliance legal |
| TTS, untimed, dislexia, TDAH, First/Then, baja estimulación | Miacademy, Reading Eggs, T4L | Fuera de alcance (lo ya construido en `neuro/` no se amplía) |
| COPPA, FERPA, GDPR, SSO, Clever, ClassLink, rostering | Seesaw, Prodigy | Una sola familia |
| Planes, precios, trials, referidos, afiliados, soporte telefónico | Todas | No es producto comercial |
| Apps nativas iOS/Android | Varias | PWA basta; ver BLOQUEOS B-6 |
| Directorio local, clubes, co-ops, foros, comunidad externa | Homeschool Hall, Outschool | Solo la familia |
| IA (asistente de redacción, generación de planes) | Power, Seesaw, Outschool | Posible más adelante; no necesaria |
| Marketplace de planes de editoriales | HSPlanet | Sustituido por paquetes JSON (A6) y biblioteca católica (E6) |

## 3. Cobertura del ranking

Las 12 apps quedan cubiertas así: **planificación** (Homeschool Planet, Homeschooler.app, Time4Learning) → C; **registro y reportes** (Homeschool Hall, Miacademy) → D; **portafolios** (Seesaw, Homeschooler.app) → D9; **lectura** (Reading Eggs, ABCmouse, Khan Kids) → E; **contenido** (Power, Miacademy, Time4Learning) → A, F con el contenido del padre; **comunidad** (Miacademy, Seesaw, Outschool) → G acotada a la familia; **gamificación** (Miacademy, Prodigy, ABCmouse) → economía de Ordo ya existente. Lo que ninguna tiene y esta app sí: **imprimir con límite**, **material del día en cualquier formato**, **liturgia y vida católica**, **tareas que son tareas del hogar con puntos**.

_Estados al 2026-10-16 (lane 180). Sin hacer todavía: C5, C6, C8, C9, C12 (búsqueda ya cubierta por F2), D4–D6, D8–D10, E7, E8, F3–F8, G3, G4, G7._
