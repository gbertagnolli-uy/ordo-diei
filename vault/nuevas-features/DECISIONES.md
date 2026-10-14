# Decisiones del usuario — ronda 2 (2026-10-13)

## 1. Pedido textual (nada omitido)

> El idle debe conectarse a Google Fotos. Debe haber una pantalla que tenga el salvapantallas con el logo de Ordo Diei El nombre de la app y un botón de diga "Entrar".
>
> Al hacer click en entrar debe aparecer la pantalla actual de login, que tiene a todos los usuarios con sus fotos.
> Si pasan 15 segundos en la pantalla de login y nadie ingresa ni interactua, se debe activar el salvapantallas. Si un usuario inició sesión y no interactua por 1 minuto, se debe activar el salvapantallas y cerrarle la sesión. Si habian cambios sin guardar, deberian guardarse, si todavía no estaba finalizado lo que el usuario dejó sin guardar, deberia guardarse como borrador.
> Modo Kiosko lo dejamos para cuando hagamos la APP.
> puedo darte una carpeta con canciones para que se reproduzcan.
> EL marketplace deberia permitir comprar todo lo que es posible comprar en la app (los padres debemos tener una nueva pantalla en el panel de administración para ingresar productos al marketplace).
>
> Pero algunos productos deben ser escasos o caros, por eso deberiamos permitir todas las monedas, el filtro se hará por producto.
>
> Si el usuario quiere comprar un sobre de cartas, puede, si quiere comprar un producto del markeplace también, la limitación debe estar en el precio. Algunos productos puede requerir niveles o acciones especificas para desbloquearse, no todo el marketplace debe estar desbloqueado aun que (al igual que con las cartas) deben estar listados con un candado y en escala de grises.
>
> Quiero que documentes todo esto, y que trabajes como arquitecto de software y gerente de producto para definir todas las features, las especificaciones, el UX/UI, para dejar todo pronto para implementar.

## 2. Decisiones firmes (derivadas del pedido)

| # | Decisión | Fuente |
|---|---|---|
| D1 | La pantalla de reposo (salvapantallas) es la **entrada de la app** (`/`): fondo de **Google Fotos**, logo, nombre «Ordo Diei» y botón **«Entrar»**. | pedido |
| D2 | «Entrar» muestra el **login actual** (todos los usuarios con foto → PIN). No se rediseña el login. | pedido |
| D3 | **Login sin actividad 15 s → reposo.** (Incluye la pantalla del PIN.) | pedido |
| D4 | **Sesión iniciada sin actividad 60 s → reposo + cierre de sesión.** | pedido |
| D5 | Al cerrar por inactividad: lo **pendiente de guardar se guarda**; si **no está finalizado**, se guarda como **borrador**. | pedido |
| D6 | **Modo kiosko / app pinning se pospone** hasta la APP nativa. Queda fuera de este ciclo. | pedido |
| D7 | **Música de fondo**: el usuario aporta una **carpeta de canciones** para reproducir. | pedido |
| D8 | **Marketplace** = tienda única de **todo lo comprable** en la app (incluye sobres de cartas). | pedido |
| D9 | Los padres tienen una **pantalla nueva en Administración** para dar de alta productos. | pedido |
| D10 | **Todas las monedas** son válidas; **cada producto elige** con cuáles se paga. La escasez y lo caro se resuelven **por producto**. | pedido |
| D11 | La **única limitación general es el precio**; además, un producto puede exigir **nivel o acciones específicas** para desbloquearse. | pedido |
| D12 | Lo bloqueado **se lista igual**, con **candado y escala de grises** (como las cartas, lane 45). | pedido |

## 3. Supuestos del arquitecto (a confirmar; no bloquean el diseño)

| # | Supuesto | Alternativa |
|---|---|---|
| S1 | Google Fotos entra por la **Picker API** (único acceso permitido a fotos que la app no subió desde 2025-03-31). Un padre elige fotos/álbum con su cuenta; la pantalla de reposo las muestra. Ver `idle-marco-fotos/SPEC.md` §4. | Subir fotos propias (sin Google) como respaldo. |
| S2 | Las acciones **con efectos** (dar premios, comprar, completar tareas) **nunca se auto-ejecutan** al cerrar por inactividad; solo se conservan como borrador. | Auto-enviar todo lo completo (riesgo: premios o tareas no queridos). |
| S3 | La sesión se renueva por **latido** y vence a los pocos minutos sin actividad, para que el cierre sea real también en el servidor. | Solo cierre del lado cliente. |
| S4 | Los sobres y fragmentos de cartas aparecen en el Marketplace como **productos del sistema** (precio y reglas siguen en `economia.ts`); la Tienda de cartas actual **no cambia**. | Migrarlos y retirar la tienda de cartas (más adelante). |
| ~~S5~~ | ~~Sorpresas como moneda~~ → **resuelto en D13**. | — |
| S6 | La música vive en `public/musica/` o en almacenamiento propio (no Spotify). | Spotify/radio. |

## 4. Ronda 3 (2026-10-13) — respuestas del usuario

> «4: Los cofres dan premios, no son una moneda en si. Pero si dan puntos, XP, o lo que sea, debería poder usarse.»
>
> «Los sonidos te los proporcionaré en una carpeta.»

| # | Decisión |
|---|---|
| D13 | Los **cofres/sorpresas no son una moneda**. Las monedas son **puntos, estrellas e incienso** (registro extensible). `Usuario.surprises` sigue siendo solo un contador. |
| D14 | **Lo que dé un cofre (o cualquier premio) debe poder usarse en el Marketplace.** Verificado en el código (`abrirPremioSorpresa`, `lib/comportamiento/server.ts`): los **puntos** suman a `availablePoints` (gastable) y a `puntosAcumulados`; el **incienso** suma a `incienso` (gastable); el **XP** suma a `experienciaHabitos` (cuenta para nivel y para requisitos, **no se gasta**). Los premios "de cartas" y "vales" llegan como cartas/fragmentos y `Recompensa`. Ver regla en `marketplace/SPEC.md` §2. |
| D15 | Los **sonidos los entrega el usuario en una carpeta** (como la música). Se importan con un script y se asignan a eventos. |

## 5. Ronda 4 (2026-10-13) — Homeschooling: base de código

Conclusión de la evaluación de bases open source, pegada por el usuario (textual):

> **6. Conclusión y Recomendación Final.** Para llevar a Ordo Diei a la vanguardia del software de Homeschooling y Centro de Comando Familiar, el camino técnico más fluido, robusto y profesional es:
> 1. Descartar OpenCircle como base de código debido a su licencia AGPL v3, su falta de implementación en la UI de cursos y su arquitectura Python/Hono dividida.
> 2. Utilizar Roost como cantera de componentes de referencia (MIT), extrayendo directamente su subsistema LMS (LessonPlayer, ModuleDetail, ProgressBar), su arquitectura de portafolio (Showcase) y su integración con react-big-calendar.
> 3. Consolidar todo dentro de Ordo Diei, apalancando su motor de gamificación existente (Cartas coleccionables, tienda de recompensas, roles familiares Padre/Hijo y base de datos Supabase en Prisma 7).

| # | Decisión |
|---|---|
| D16 | **OpenCircle descartado** (AGPL v3, sin UI de cursos, Python/Hono). **Roost (MIT) es cantera de componentes**, no base: se copia/adapta lo necesario a Ordo Diei (Next + Prisma 7). Detalle en `homeschooling/MAPEO_COMPONENTES_ROOST.md`. |
| D17 | Homeschooling se divide en **6 lanes H1..H6** (ver `lanes/LANES_HOMESCHOOLING.md`) y **no se implementa todavía**: solo documentación. Se arranca cuando el usuario lo ordene. |
| D18 | Homeschooling **reutiliza la Tienda** (lane 103) para sus recompensas y el motor de cartas para premios de repaso; no crea otra economía. |

| D19 | La documentación de Homeschooling escrita por agy fue **auditada** (`homeschooling/AUDITORIA.md`). Donde la auditoría contradiga a un `LANE_H*`, manda la auditoría. |
| D20 | **Kiosk/Curfew sale de H6** (sigue D6: APP nativa). H6 queda en neurodivergencia. |
| D21 | **Ninguna cifra legal en el código**: la jurisdicción la completa el padre. |
| D22 | Las recompensas de Homeschooling pasan por el **pipeline existente** de hábitos/tareas, una sola vez por lección, con tope y (por defecto) aprobación del padre. |

## 6. Ronda 5 (2026-10-13) — Homeschooling cerrado para implementar

> «No te preocupes por las licencias, tengo permiso para usar roost y además este proyecto solo se está usando en casa en local. Corrige todo en la documentación para que esté pronto para implementar»

| # | Decisión |
|---|---|
| D23 | **Licencia de Roost: sin trámite** (permiso del usuario). Uso **solo doméstico**: no hay SaaS, premium ni cumplimiento legal. |
| D24 | Las preguntas abiertas de la auditoría se resolvieron como **HD1–HD14** (`homeschooling/ARQUITECTURA_DETALLADA.md` §1). Lo principal: cada día lectivo es una `Tarea` existente (premios y aprobación sin código nuevo); solo fotos como evidencia; sin cartas, jurisdicciones ni Carnegie en v1; Kiosk fuera. |
| D25 | Lanes definitivas: H1a, H1b, H2, H3, H4, H5 (horas y reportes), H6 (neurodivergencia). Ver `lanes/LANES_HOMESCHOOLING.md`. |

## 7. Ronda 6 (2026-10-14) — Roost como base de código (lane 115)

> «Quiero usar Roost como base para la feature Homeschooling (cursos, lecciones, progreso, calendario, evidencia, portafolio, reportes) de Ordo Diei.» · «NO se programa nada de cero que Roost ya tenga. […] Se reutiliza el código existente de `vendor/roost`: se copia/porta a `src/` y se adapta SOLO lo necesario (llamadas a datos, router, auth, estilos). Cada archivo portado debe llevar un comentario con su archivo de origen. `vendor/roost/` no se edita.»

| # | Decisión |
|---|---|
| D26 | **Se revoca D16 en lo que dice «cantera de referencia»**: Roost (clonado en `vendor/roost/`, lane 114) se **porta** a `src/`. Plan, modelo, lanes (HS0…H6, ver D31) y registro de decisiones D-1…D-15 en `homeschooling/PLAN_INTEGRACION_ROOST.md`. |
| D27 | Se mantiene **HD1** (día lectivo = `Tarea`), con `horaEjecucion` obligatoria para que `complete` no la pague como tardía. |
| D28 | ~~Preguntas P1–P5 pendientes~~ → respondidas en la ronda 7 (D29–D31). |

## 8. Ronda 7 (2026-10-14) — Respuestas P1–P5 y contradicciones (lane 117)

> «De las preguntas, la unica que quiero modificar es "¿Hasta qué hora una lección cuenta «a tiempo» y paga puntos completos?" debe ser hasta las 18:00.»
>
> «Resuelve las contradicciones encontradas, para que funcione todo correctamente y no hayan errores.»

| # | Decisión |
|---|---|
| D29 | **Una lección paga puntos completos si se termina antes de las 18:00** (`HORA_LIMITE_LECCION`). Entre las 18:00 y las 22:00, 50 %; después, 0 (regla existente de Tareas). |
| D30 | Se aceptan las demás recomendaciones: **cursos compartidos entre hermanos con un plan por hijo** (P1), **cada hijo ve solo sus evidencias** (P2), **feriados a mano** (P4) y **lane HS-SEG** para que solo el asignado o un padre complete una tarea, antes de H2 (P5). |
| D31 | Contradicciones X1–X18 resueltas (`homeschooling/PLAN_INTEGRACION_ROOST.md` §9). Sobre AUDITORÍA E1: **la URL pública de las fotos queda aceptada** por uso doméstico (excepción a D19). Las lanes de Homeschooling se nombran por código (HS0, H1a, HS-SEG, H1b, H2–H6) y el número se toma al crearlas. |

## 9. Ronda 8 (2026-10-14) — Verificación de la implementación (lane 119)

> «Ahora, documenta el proceso de testing y verificación, para asegurarnos que todo se implementó segun lo planificado. No quiero smoke test ni testing en navegador, eso lo hago yo, quiero verificación de código, features, verificación del cumplimiento del plan.»

| # | Decisión |
|---|---|
| D32 | **Proceso de verificación en tres momentos** (`homeschooling/PLAN_VERIFICACION.md`): autoverificación de cada lane antes de integrar, verificación independiente en `dev` por otra sesión y auditoría final. Es solo de código: script de invariantes de solo lectura (`homeschooling/verificacion/verificar_invariantes.sh`), vectores de referencia calculados aparte, mutaciones y matrices de cumplimiento del plan. Sin smoke tests ni navegador (los hace el usuario; lista en §10). Los tests con base real siguen apagados salvo pedido del usuario. |
| D33 | Contradicciones X20 y X21 resueltas (`PLAN_INTEGRACION_ROOST.md` §9): el modo relajado condiciona `celebrate` entero (no solo `TASK_SUCCESS`), y un checkpoint de video adelantado muestra el **primero** sin responder. |

## 10. Ronda 9 (2026-10-14) — Reposo con Unsplash y frases · motor Divinum Officium (lane 122)

Pedido textual (nada omitido, con la ortografía original):

> 1) planifica y especifica el idle state.
> En vez de screensaver con google fotos, será con imagenes de naturaleza de Unsplash.
>
> Pero además de eso, habrán frases que se mostrarán sobre las imagenes. Por eso el logo y el nombre de la APP debe aparecer en una esquina más pequeño y la jerarquía debe estar enfocada en la frase.
>
> Las frases serán en latín, de la vulgata clementina, debajo con menor jerarquía la traducción al español de la versión en castellano de Torres Amat, preconciliar.
> En menor jerarquía que la versión en castellano, el libro, capitulo y versículo.
>
> Además de esas frases en latín, también aparecerán frases del catecismo de San Pio X, con la pregunta en jerarqía mayor y la respuesta en jerarqía menor.
>
> Deben mostrarse un tipo a la vez, una cita biblica, luego una pregunta del catecismo, luego una cita biblica, y así sucesivamente.
>
> Las imagenes deben ser aleatorias, para que las citas no aparezcan siempre con la misma imagen.
>
> 2) A su vez, debemos clonar el motor de Divinum Officium: https://www.divinumofficium.com/www/horas/Help/technical.html
>
> https://github.com/divinumofficium/divinum-officium
>
> Ese motor de divinum officium, alimentará varias cosas:
>
> - Mostrar el titulo del propio del día (el día que se celebra hoy, el santo, la festividad por ejemplo "S. Callisti Papæ et Martyris ~ Duplex
> Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris") en el screensaver.
> - Alimentar una pantalla de Calendario Liturgico, que debe tener un dashboard para mostrar los misterios del día, el santoral del dia, propio de día del misal, breviarum del día, todo de la liturgia de "Tridentine - 1906" con traducción al español, Calendarium Generale, esa y las versiones de 1888 y 1570 son las unicas versiones que deben descargarse y generarse. Sin embargo la que se usará de forma predeterminada para los usuarios es la de "Tridentine - 1906", habrá un selector en cada pantalla de cada tipo de contenido para modificar la versión.
> - Cada tipo de contenido con su propia pantalla (Breviarium, Missale, Propium Sanctorum, Ordinarium, Psalterium, Propium de Tempore), Misterium Rosarium (o como se diga correctamente en latin).
> - La pantalla de breviarium, debe seleccionar la oración correspondiente según la hora del día. Pero sin obligar, sino que mostrándola como principal, el usuario puede elegir otra card y rezar lo que le plazca. La oración destacada debe tener una imagen destacada, en forma de card con background completo y el texto encima, la imagen ocupando toda la card. En donde se muestra el texto, un pequeño overlay con degradado de negro a transparente, con baja opacidad, 5% mas o menos. La idea es una card muy visual para destacar la oración correspondiente (Laudes, Nona, Sexta, etc.)

Especificaciones: [`idle-marco-fotos/SPEC.md`](idle-marco-fotos/SPEC.md) (reposo v2) y [`liturgia/SPEC.md`](liturgia/SPEC.md) (motor y pantallas). Prueba real del motor: [`liturgia/SPIKE_MOTOR.md`](liturgia/SPIKE_MOTOR.md).

### Decisiones firmes (del pedido)

| # | Decisión | Reemplaza |
|---|---|---|
| D34 | El fondo del reposo son **fotos de naturaleza de Unsplash**. **Google Fotos queda fuera** (lanes N1 y N8 canceladas; sin OAuth, sin Picker, sin fotos subidas). | D1 (fondo), S1 |
| D35 | Sobre las fotos se muestran **frases**; la frase es la **jerarquía principal**. Logo y nombre «Ordo Diei» van **en una esquina, más chicos**. | §3.1 del SPEC v1 |
| D36 | **Cita bíblica** = 3 niveles: **latín de la Vulgata Clementina** (mayor) → **español de Torres Amat** (menor) → **libro, capítulo y versículo** (la menor). | — |
| D37 | **Catecismo de San Pío X** = 2 niveles: **pregunta** (mayor) → **respuesta** (menor). | — |
| D38 | **Alternancia estricta**: cita bíblica, pregunta del catecismo, cita bíblica… Un tipo por vez. | — |
| D39 | **Imagen aleatoria e independiente de la frase**: la misma cita no queda atada a la misma foto. | — |
| D40 | El reposo muestra el **título del oficio del día** que da Divinum Officium (ej. «S. Callisti Papæ et Martyris ~ Duplex» / «Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris»). | §8 del SPEC v1 («santoral fuera de alcance») |
| D41 | Se **clona el motor de Divinum Officium** (MIT) y alimenta: título del día en el reposo, **Calendario litúrgico** (dashboard) y una **pantalla por tipo de contenido**. | — |
| D42 | Versiones: solo **Tridentine - 1570**, **Tridentine - 1888** y **Tridentine - 1906**, **Calendarium Generale**. Son las únicas que se descargan y generan. **Predeterminada: Tridentine - 1906**, con **traducción al español**. | — |
| D43 | **Selector de versión en cada pantalla** de contenido. | — |
| D44 | Pantallas: **Calendarium** (dashboard: misterios del día, santoral, propio de la Misa del día, Breviario del día), **Breviarium**, **Missale**, **Proprium Sanctorum**, **Proprium de Tempore**, **Ordinarium**, **Psalterium** y **Rosarium**. | — |
| D45 | **Breviarium destaca la Hora que corresponde a la hora del día**, sin obligar: las demás Horas son cards elegibles. La destacada es una **card con imagen a sangre**, texto encima y **degradado negro → transparente de ~5 % de opacidad** detrás del texto. **Opacidad modificada por D54.** | — |

### Decisiones del arquitecto (resuelven detalles; el usuario puede cambiarlas)

| # | Decisión | Por qué |
|---|---|---|
| D46 | Ortografía latina correcta en la UI: **Proprium** (no «Propium»), **Breviarium**, **Rosarium** con subtítulo **«Mysteria Rosarii»** («los misterios del Rosario»). | Pedido: «o como se diga correctamente en latín». |
| D47 | El motor **no se reescribe**: se usa el **Perl original** de Divinum Officium (16 000 líneas, verificado en esta máquina) como **generador fuera de línea**. Un script lo descarga (commit fijo), lo ejecuta y guarda el resultado estructurado en la base. La app en Vercel **solo lee** de la base. | Vercel no ejecuta Perl (lane 41: la app corre en Vercel); reescribir la precedencia litúrgica en TS es enorme y propenso a errores (memoria *reuse-open-source*). |
| D48 | Para las pantallas «de libro» (Proprium, Psalterium, Ordinarium) **tampoco se porta código**: un script Perl propio y chico (`scripts/liturgia/do-libro.pl`) llama a la función original `setupstring()` de DO, que ya resuelve secciones `[...]`, `@referencias` y condicionales `(sed rubrica …)` para la versión pedida, y exporta JSON. La precedencia (qué se celebra cada día) sale de `officium.pl`/`missa.pl`. **Todo se pre-genera**; en runtime la app solo lee la base. | Verificado: `setupstring('Espanol', 'Sancti/10-14.txt')` con 1906 devuelve Officium «S. Calixto, Papa y Mártir», Oratio, Secreta, Postcommunio, Rank y Rule (`liturgia/SPIKE_MOTOR.md` §6). |
| D49 | **Misterios del Rosario**: los **15 tradicionales** (sin los luminosos de 2002, coherente con «preconciliar»). Reparto: lunes y jueves gozosos; martes y viernes dolorosos; miércoles y sábado gloriosos; domingos según el tiempo (Adviento a Septuagésima gozosos, Septuagésima/Cuaresma a Pascua dolorosos, Pascua a Adviento gloriosos). **A confirmar con una fuente impresa preconciliar en la lane del Rosarium.** | — |
| D50 | **Catecismo = Catecismo Mayor de San Pío X** (Compendio de 1905; versión castellana de 1906, dominio público, en Wikisource). | Es el único texto castellano de dominio público localizado; el de 1912 queda como alternativa. |
| D51 | **Las citas bíblicas son una selección curada** (≥ 365), no versículos al azar de toda la Biblia (genealogías, leyes rituales y versículos sin sentido aislados). Numeración **de la Vulgata** (la de Torres Amat). | Calidad del reposo. |
| D52 | **El español de la liturgia (DO) no es Torres Amat**: DO trae sus propias traducciones (salmos modernos, Martirologio con notas actuales) y, si falta el archivo español, **cae al inglés**. Regla: **nunca mostrar inglés como si fuera español**; si no hay español se muestra solo el latín con la marca «sin traducción». Torres Amat se usa **solo en las frases del reposo** (lo pedido). | Verificado en el repo de DO (ver `liturgia/SPIKE_MOTOR.md` §4). |
| D53 | En **Missale**, DO **no tiene un Misal de 1888**: «Tridentine - 1888» y «Tridentine - 1906» usan el Misal de 1910. El selector lo indica («1888 → Misal de 1910») en vez de ocultarlo. | Verificado: mismo resultado para 1888, 1906 y 1910. |

### Supuestos (no bloquean; confirmar cuando convenga)

| # | Supuesto | Alternativa |
|---|---|---|
| S7 | El selector de versión **se recuerda por pantalla y por dispositivo** (`?version=` en la URL + preferencia local); cualquier pantalla nueva arranca en 1906. | Preferencia global por usuario en la base. |
| S8 | Franjas de la Hora destacada: Matutinum 00:00–04:59, Laudes 05:00–06:59, Prima 07:00–08:29, Tertia 08:30–10:59, Sexta 11:00–13:29, Nona 13:30–15:59, Vesperæ 16:00–19:29, Completorium 19:30–23:59 (hora de `APP_TZ`). | Calcularlas con la salida/puesta del sol. |
| S9 | Ventana de textos generados: **del 1-ene del año en curso al 31-dic del siguiente**, 3 versiones. El calendario (títulos) se genera 2026–2035. Se regenera con una **GitHub Action** mensual (o a mano con `npm run liturgia:generar`). | Solo a mano desde la PC. |
| S10 | Las imágenes de las 8 Horas son **8 fotos fijas de Unsplash** elegidas por la luz del momento (madrugada, alba, mañana, media mañana, mediodía, tarde, atardecer, noche), con atribución. | Arte sacro de dominio público guardado en el repo. |
| S11 | El reposo usa siempre **1906** para el título del día (no hay usuario con sesión que elija). | — |

## 11. Ronda 10 (2026-10-14) — Opacidad, credenciales de Unsplash y entrega (lane 125)

Pedido textual (las claves se **omiten a propósito**: están solo en el `.env`, que no va a git):

> Usa mas opacidad en vez de elegir las fotos con parte de abajo oscura. Estos son las credenciales de unsplash:
>
> ID de la app: 1102152
> Access Key: [omitida — guardada en `.env` como `UNSPLASH_ACCESS_KEY`]
> Secret Key: [omitida — guardada en `.env` como `UNSPLASH_SECRET_KEY`]
>
> Guardalas en el .env.
>
> No implementes, solo documenta y deja marcado el trabajo para que lo implemente otro agente.

| # | Decisión | Reemplaza |
|---|---|---|
| D54 | **La legibilidad del texto sobre fotos se resuelve con más opacidad, no eligiendo fotos con la parte de abajo oscura.** Card destacada del Breviarium: `bg-gradient-to-t from-black/70 via-black/30 to-transparent` sobre los 3/4 inferiores; si una foto no da 4,5:1, se sube la opacidad (hasta `from-black/85 via-black/40`), nunca se cambia la foto por eso. Igual criterio para el reposo. | El ~5 % de D45 y la «foto curada con zona oscura» de `liturgia/SPEC.md` §10.2 |
| D55 | **Credenciales de Unsplash en el `.env` del directorio principal** (`UNSPLASH_APP_ID`, `UNSPLASH_ACCESS_KEY`, `UNSPLASH_SECRET_KEY`; `.env*` está en `.gitignore`). La app solo usa la Access Key, del lado del servidor. Clave verificada: `GET /topics/nature` → 200, modo demo (50 pedidos/hora). Falta cargarla en Vercel (lo hace el usuario). | «el usuario crea la app» de LANES R2 |
| D56 | **No se implementa en esta ronda.** Las lanes R1–R3 y L1–L9 quedan marcadas **«lista para implementar»** en `lanes/LANES.md`, con el prompt de entrega `lanes/PROMPT_REPOSO_LITURGIA.md` para el agente que las tome. | — |
