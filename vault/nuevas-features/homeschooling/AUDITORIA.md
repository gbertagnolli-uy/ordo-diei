# Auditoría de la documentación de Homeschooling (escrita por agy)

> 2026-10-13. Verificado contra el código de `dev` (schema Prisma, `src/`, `package.json`) y contra el repo Roost clonado en `/home/x7/Downloads/dev/roost`.
> Severidad: 🔴 bloquea o rompe datos/seguridad · 🟠 error que hay que corregir antes de implementar · 🟡 imprecisión o limpieza.
> «Corregido» = ya se cambió en esta lane. «Para la lane» = queda como condición obligatoria al implementar (ver cada `LANE_H*`).

## Lo que SÍ está bien (verificado)
- Roost existe, es MIT según su README, y los archivos citados existen (`LessonPlayer`, `LearnSidebar`, `ProgressBar`, `CalendarView`, `ShowcaseSubmit`, `ShowcaseCard`, `services/module.ts`).
- Versiones: `react-big-calendar ^1.19.4`, `date-fns` (Ordo `^4.4.0`, Roost `^4.1.0`), `@types/react-big-calendar` están en Ordo; React 19.2.4 / Next 16.2.1 / Prisma 7 / Tailwind 4 coinciden.
- Existen en Ordo: `HoloCard.tsx`, `SwipeRow.tsx` (lane 75), `SloshGauge.tsx`, `canvas-confetti`, `romcal`, `zustand`, `RolFamiliar {Padre, Madre, Hijo, Hija}`, `Usuario.incienso/streakDays/lastTaskCompletedDate/experienciaHabitos`, `Archivo`.
- El esquema es en esencia aditivo (todo tablas nuevas).

## A. Hallazgos sobre Roost (la «cantera»)
| # | Sev. | Hallazgo | Acción |
|---|---|---|---|
| A1 | 🟠 | **Roost no tiene archivo `LICENSE`**; «MIT» es solo una línea del README. MIT exige conservar el aviso de copyright. Lo razonable es tratarlo como MIT, pero hay que conservar la atribución. | Al copiar código, agregar cabecera «Adaptado de msrbuilds/roost (MIT)» y un `THIRD_PARTY_NOTICES.md`. Si el uso va a ser comercial/SaaS, abrir un issue en Roost pidiendo el LICENSE. |
| A2 | 🟠 | **Roost es otra cosa**: SPA Vite + React Router 7 + **Tailwind 3** + cliente Supabase en el navegador, y una plataforma de *comunidades* (grupos, módulos, grabaciones, suscripciones). Sus tipos son `modules/recordings/lesson_completions`, no materias/lecciones. | No «extraer»: **reescribir con Roost de referencia visual**. LessonPlayer son 152 líneas, LearnSidebar 175, ProgressBar 30: copiar es poco ahorro. La estimación «reutilizamos el LMS» está inflada. |
| A3 | 🟠 | Roost usa clases propias (`dark:text-surface-*`) y `react-dropzone`, que **no está en Ordo**. | Usar los tokens/`ui/` de Ordo; no agregar `react-dropzone` (basta `<input type=file>`). |
| A4 | 🟡 | Números de línea del MAPEO inexactos: `getEmbedUrl` está en L30 (no 30-37 exacto), `handleToggleComplete` L39 (ok), `ProgressBar` tiene 30 líneas pero se cita «L1-35». `useDropzone` L13 (ok), borrador L33 (ok). | No confiar en rangos; buscar por nombre de función. |
| A5 | 🟠 | **Ya hay calendario en Ordo** (`MissionCalendar.tsx` con `react-big-calendar`). | El «LiquidCalendar» debe **reutilizar/extender `MissionCalendar`**, no copiar `CalendarView` de Roost. |
| A6 | 🟠 | Roost permite *marcar y desmarcar* lección: en Ordo eso permitiría **cobrar XP repetidamente**. | Ver C3. |

## B. Modelo de datos (`ARQUITECTURA_DETALLADA.md`)
| # | Sev. | Hallazgo | Estado |
|---|---|---|---|
| B1 | 🔴 | **Dos esquemas incompatibles**: `SPEC.md` §3.1 (viejo, con `@@id([planId, fecha])`, sin enums) y `ARQUITECTURA` §2 (nuevo). El viejo tiene además `@@id` con columna opcional (`alumnoId Int?`), inválido en Prisma. | Corregido: SPEC §3 y §5 marcados **reemplazados**; la fuente de verdad es ARQUITECTURA §2. |
| B2 | 🔴 | `DiaNoLectivo @@unique([fecha, alumnoId])` con `alumnoId` NULL: **Postgres permite duplicados** con NULL, así que el «feriado para toda la familia» se puede insertar N veces. | Corregido: `alumnoId` obligatorio **o** índice único parcial `WHERE Alumno_ID IS NULL` (SQL manual) — se documentó el índice parcial. |
| B3 | 🔴 | **Desconexión central**: el reparto es por `DiaLectivo` (rango `unidadDesde..Hasta`) pero el progreso es por `LeccionContenido`/`ProgresoLeccion`. Para un libro de páginas no existen `LeccionContenido`. «Terminé» crea `ProgresoLeccion` y nadie actualiza `DiaLectivo.estado`; el pacing necesita `unidadesHechas` y no se dice de dónde sale. | Para la lane: **una sola fuente de verdad** = `DiaLectivo` (estado + unidades hechas). `ProgresoLeccion` solo para recursos con lecciones discretas (video/curso) y siempre actualiza el `DiaLectivo`. Definir en H1 antes de H2. |
| B4 | 🟠 | `ProgresoLeccion` tiene defaults `completada=true`, `calificacion=100`, `intentosQuiz=1`: una fila creada sin quiz ya cuenta como aprobada con 100. | Corregido: defaults a `false` / `null` / `0`. |
| B5 | 🟠 | Faltan **back-relations** en `Usuario` (`MateriasAlumno`, `DiasNoLectivosAlumno`, `ProgresoLeccionesUsuario`, `EvidenciasAlumno`, `EvidenciasAprobadas`, `ActividadesOfflineAlumno`, `RepasosAlumno`) y en `Libro`; sin ellas `prisma validate` falla. | Para H1 (ya anotado en la lane). |
| B6 | 🟠 | Sin **modelo de quiz/intentos**: H4 habla de `PreguntaQuiz` (no existe) y de «reprobar 2 veces seguidas» (no hay historial; solo `intentosQuiz`). `VideoCheckpoint` (pausa en un segundo) se mezcla con quiz final. | Para H4: agregar `PreguntaLeccion` e `IntentoLeccion` (respuestas, nota, fecha). |
| B7 | 🟠 | `ARQUITECTURA` dice que **«reutiliza `ProductoTienda` y `Carta`»**, pero el esquema no los referencia. No hay vínculo con la Tienda (D18) ni premio por terminar un curso. | Para H2/H4: recompensas por la vía existente (ver C2); «premio de curso» = producto/vale de la Tienda o carta, decisión abierta. |
| B8 | 🟡 | `PlanCurso.unidadesPorDia` es redundante (se deriva del reparto) y puede contradecirlo. `DiaLectivo @@unique([planId, fecha, unidadDesde])` permite dos filas el mismo día. | Quitar `unidadesPorDia` o tratarlo solo como «tope»; `@@unique([planId, fecha])`. |
| B9 | 🟡 | Nombres genéricos en el espacio global de Prisma (`Recurso`, `Materia`). No chocan hoy, pero `Recurso` se confunde con `Recompensa`. | Opcional: prefijo (`RecursoCurso`). Decidirlo en H1 antes de generar el cliente. |
| B10 | 🟡 | `EvidenciaAprendizaje.archivoClave` es un string sin FK: al borrar un alumno/evidencia quedan blobs huérfanos en `Archivo`. | Para H3: limpieza al borrar. |
| B11 | 🟡 | Tablas `Homeschool_*`: convención distinta de las existentes (`Productos_Tienda`, `Reclamos_Carta`). Aceptable; mantenerla consistente. | — |

## C. Reglas de negocio y economía
| # | Sev. | Hallazgo | Acción |
|---|---|---|---|
| C1 | 🟠 | H2 incrementa **`puntosAcumulados` «+20 XP»**. Pero el XP/nivel es **`experienciaHabitos`**; `puntosAcumulados` son puntos (moneda). Se estaría dando moneda en vez de XP. | Para H2: otorgar vía las funciones existentes de recompensa (`lib/comportamiento`, `lib/habitos`), no con `increment` a mano. |
| C2 | 🔴 | Otorgar premios con un `prisma.usuario.update` suelto **se salta** el historial, los límites, la racha diaria, los cofres y las reglas de aprobación que ya existen. Además `streakDays: {increment: 1}` en cada lección rompe la racha (sube por lección, no por día). | Para H2: una lección debe **pasar por el mismo pipeline** que un hábito/tarea (D4 de SPEC: «generar tarea/hábito del día»). Recomendado y ahora obligatorio. |
| C3 | 🔴 | **Sin idempotencia ni tope**: «Terminé» sin verificación + desmarcar/volver a marcar = XP infinito, y esas monedas ahora se **gastan en la Tienda**. Un niño puede inflar la economía. | Para H2: premio **una sola vez por lección** (clave única), tope diario, y por defecto **aprobación del padre** para el premio (patrón de `APROBACION_HABITOS`). |
| C4 | 🔴 | Quiz/checkpoint **evaluado en el cliente**: `VideoCheckpoint.respuestaCorrecta` viajaría al navegador y el niño puede leerla o llamar la API con 100. | Para H4: corregir **en el servidor**; el cliente nunca recibe la respuesta correcta antes de responder. |
| C5 | 🟠 | «No puede saltar ni adelantar el video» **no se puede garantizar** en el navegador (teclado, consola, `controls:0` no impide seek por API). Y `Math.floor(currentTime) === segundoPausa` falla si el sondeo de 500 ms salta el segundo o hay seek. | Para H4: comparar con `>=` y marcar checkpoints pasados; el desbloqueo real depende del servidor (C4), no del reproductor. Usar `youtube-nocookie.com`. |
| C6 | 🟠 | H3: estrellas/XP por aprobar evidencias = otra fuente de monedas sin tope. Y **deslizar a la derecha = aprobar** está **invertido**: en Ordo (lane 75) es *izquierda = aprobar (verde), derecha = rechazar*. | Para H3: respetar la dirección existente; bonus con tope. |
| C7 | 🟠 | `SM-2` sin «calidad de respuesta» (0–5) no es SM-2: el esquema solo tiene fallos e intervalo. | Para H4: guardar calidad por repaso o llamarlo «repaso espaciado simple» (intervalos 1-3-7-14). |
| C8 | 🟡 | Umbrales de sobrecarga **inconsistentes**: ARQUITECTURA (>4 lecciones o >30 págs) vs H1 (>3 videos o >35 págs). | Corregido: un solo valor configurable por `unidadTipo` (ver H1). |

## D. Algoritmo de pacing (H1)
| # | Sev. | Hallazgo | Estado |
|---|---|---|---|
| D1 | 🔴 | Días de semana: el esquema usa **1=lunes…7=domingo**, el algoritmo dice `getDay()` (**0=domingo…6**). Con eso el domingo=0 nunca coincide y el sábado cae en el día 6: un error de un día/ la semana corrida. | Corregido en H1: convertir con `getDay() || 7` (o `date-fns getISODay`). Test explícito. |
| D2 | 🔴 | **Zonas horarias**: fechas `@db.Date` + `new Date()` en servidor Vercel (UTC) vs usuarios en Uruguay (UTC-3). «Hoy» se corre de día a partir de las 21:00. El código ya usa `APP_TZ` en `lib/comportamiento`. | Para H1: trabajar con strings `YYYY-MM-DD` calculados con `APP_TZ`; la función pura no usa `Date.now()`. |
| D3 | 🟠 | «Bresenham» es incorrecto como nombre: el reparto descrito (primeros R días con +1) **concentra la carga al inicio**. Bresenham reparte el resto uniformemente. | Corregido en H1: usar reparto uniforme (`floor((i+1)*U/D) - floor(i*U/D)`). |
| D4 | 🟠 | Si `U < D` (menos unidades que días) hay días con 0 unidades (`desde>hasta`). El texto no dice si se crean. | Corregido en H1: no se crean días vacíos. |
| D5 | 🟠 | **Feriados**: no se dice de dónde salen. `romcal` da el calendario *litúrgico*, no feriados civiles de Uruguay. | Para H1: v1 los carga el padre a mano; opcional lista de feriados por país configurable. No inventar. |
| D6 | 🟠 | Atrasos: la lógica «recalcula desde hoy» no dice qué pasa con días **pasados no hechos** (se arrastran, SPEC §3.2.4) ni con días `movida`. Y arrastrar una lección en el calendario «dispara el recálculo» sin definir si es un movimiento puntual o global. | Para H1/H2: separar *mover un día* (solo ese) de *recalcular* (todo el resto). |
| D7 | 🟡 | Test «Caso 4» y el criterio 3 (300 págs. 1/3–30/11) no fijan año ni feriados: no son reproducibles. | Corregido: usar fechas fijas en los tests. |

## E. UX / infraestructura (H3, H5, H6)
| # | Sev. | Hallazgo | Acción |
|---|---|---|---|
| E1 | 🔴 | **`/api/archivos/<uuid>` es público** (sin sesión, a propósito para las fotos de perfil). Las **fotos de los trabajos de los niños** y sus **audios** quedarían accesibles a cualquiera con la URL. | Para H3: servir evidencias con **sesión y permiso** (padres + el propio alumno), ruta distinta o flag privado en `Archivo`. |
| E2 | 🔴 | **`Archivo` solo admite imágenes** (`sharp`, lista de MIME de imagen, 4 MB). El **audio de 10 s no entra**; no hay endpoint ni tipo. Además MediaRecorder en iOS/Safari produce `audio/mp4`, no `webm`. | Para H3: ampliar `Archivo` a audio (MIME `audio/webm`/`audio/mp4`, tope ~200 KB) o dejar la nota de voz fuera de v1. |
| E3 | 🟠 | Fotos y audios **dentro de Postgres** (`Bytes`): un año de evidencias de varios niños puede llenar el plan de Supabase y encarece los backups. | Para H3: medir tamaño (~150 KB/foto), definir tope por alumno/mes y plan B (Supabase Storage). |
| E4 | 🔴 | **H6 contradice la decisión D6** (Kiosk/app pinning se posterga a la APP nativa) y duplica N7/N6 (pantalla de reposo e inactividad). | Corregido: H6 se divide: *Neurodivergencia* (First/Then, historias sociales, baja estimulación) sigue; *Kiosk/Curfew* se **mueve a la APP** (o a `kiosk-mode`). |
| E5 | 🟠 | Afirmaciones técnicas falsas en H6: (a) el navegador **no puede bloquear los bordes** táctiles ni apagar el backlight; (b) negro `#000` ahorra energía **solo en OLED**, no en IPS/LCD; (c) la Fullscreen API exige gesto del usuario cada vez y no existe en iPhone; (d) «limitar la carga al 80 %» (inv. 1) **no es posible desde una web**. | Documentado; el curfew web es un *salvapantallas negro*, no apagado real. Apagar de verdad = APP nativa. |
| E6 | 🟠 | H5 `JURISDICCIONES` tiene **cifras inventadas** (p. ej. UY 800 h; NY «portafolio» cuando exige informes trimestrales + evaluación anual; FL sin horas mínimas pero 180 días). Datos legales falsos en un «seguro legal» son un riesgo real. En Uruguay la educación en casa no tiene un régimen claro. | Corregido en H5: **ninguna cifra legal en el código**; la jurisdicción es un perfil que **el padre completa** (horas, días, materias) con aviso «no es asesoramiento legal». |
| E7 | 🟠 | H5: el «Crédito Carnegie» es una unidad de **secundaria de EE.UU.** (no «universitario»); `calcularCreditos` ignora el caso de laboratorio (150 h) que el texto menciona, y el GPA no define notas <70 (D/F). | Corregido en H5. |
| E8 | 🟠 | H5 usa «el cronómetro integrado de Ordo Diei» y H6 «tonos suaves»/«audio manager»: **no existen todavía** (N13 temporizadores, N2 audio). | Dependencias explícitas en el plan (ver §G). |
| E9 | 🟠 | Rutas inconsistentes: ARQUITECTURA `/dashboard/homeschooling/alumno` y `/admin`; H2 usa `/dashboard/homeschooling` (según el rol). | Corregido: una sola ruta `/dashboard/homeschooling` que bifurca por rol, más subrutas del padre. |
| E10 | 🟡 | La cabecera de ARQUITECTURA dice **«aprobada (2026-10-13)»**: el usuario no aprobó nada; pidió documentar. | Corregido: «borrador». |
| E11 | 🟡 | Pilares con **funciones inventadas**: «Marketplace de clases en vivo», «xAPI/LTI», «Co-piloto IA», que no están en ninguna lane ni fueron pedidos. | Corregido: marcadas como *fuera de alcance*. |
| E12 | 🟡 | Menciones de tonos «ASMR»/«campana tibetana» sin sonido real: los sonidos los entrega el usuario (D15). | El modo de baja estimulación solo **atenúa/silencia**; no crea audio. |

## F. Desconexiones con el resto del plan
1. **Tienda (lane 103, hecha):** ARQUITECTURA nunca la menciona. Los requisitos `tareas`/`habito` de la Tienda podrían incluir «lecciones completadas» → ampliar `Requisito` más adelante. (D18)
2. **Hábitos/Libro:** SPEC §4 deja «a decidir en H1» el enlace con hábitos y `Libro`. Ahora **se decide**: una lección del día **genera/usa el pipeline de tarea-hábito** (C2); `Recurso.libroId` solo para recursos de tipo libro.
3. **Inactividad / borradores (N4–N6):** la nota de la evidencia o el quiz a medias deben guardarse como borrador; H2/H3 deben llamar `useMantenerActivo` (video largo ≠ inactivo).
4. **Audio (N2) y música (N3):** el sonido de victoria y la música ambiental dependen de ellos; el modo de baja estimulación debe apagar ambos.
5. **Temporizadores (N13):** el cronómetro de horas offline (H5) y el temporizador First/Then (H6) deben reutilizar `TemporizadorVisual`.
6. **Pantalla de reposo / kiosk:** H6 duplicaba trabajo (E4).

## G. Cambio de plan resultante (integrado en `LANES_HOMESCHOOLING.md`)
- **Orden recomendado:** `N2 audio` y `N4/N5/N6 inactividad` antes de H2; `N13 temporizadores` antes de H5/H6; H1 puede ir **ya** (no depende de nada).
- **H1** se parte en **H1a** (modelo + `repartir()` puro con tests, sin UI) y **H1b** (asistente de alta + vista del padre) para entregar valor antes.
- **H2** ahora **depende de la decisión C2/C3** (pipeline de recompensas con tope y aprobación); es el riesgo mayor.
- **H3** depende de resolver E1–E3 (archivos privados + audio + almacenamiento).
- **H4** sin cartas hasta definir con el usuario el premio (C6, B7); corrección siempre en servidor.
- **H5** sin datos legales precargados (E6).
- **H6** se reduce a neurodivergencia; kiosk/curfew pasa a la APP.

## H. Preguntas para el usuario (bloquean H2+)
1. ¿Una lección completada debe **pasar por aprobación del padre** antes de dar XP/monedas, o se acredita sola con tope diario?
2. ¿Cuántos alumnos, edades y cuántas horas/día? (afecta topes y lenguaje)
3. ¿Qué jurisdicción necesitás para los reportes (¿Uruguay?) y qué exige realmente? Hay que cargarlo vos; no lo asumimos.
4. ¿Las evidencias se guardan en la base (simple, con tope) o en Supabase Storage (más trabajo, más espacio)?
5. ¿Premio por terminar un curso: carta, vale de la Tienda o nada?
