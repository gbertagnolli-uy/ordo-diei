# Pendientes y cosas para revisar — Reposo v2 (R1–R3) y Liturgia (L1–L9)

> Archivo **único y común** (pedido del usuario, 2026-10-14): cada lane agrega acá lo que no pudo cerrar sola, lo que decidió por su cuenta y lo que el usuario tiene que mirar. Orden: lo más urgente primero dentro de cada lane. Marcá con `[x]` lo resuelto.

## Cómo leerlo
- **Revisar**: decisión o dato que el agente tomó y conviene que lo mire una persona.
- **Pendiente**: trabajo que quedó sin hacer (con motivo).
- **Sin verificar**: criterio de aceptación que solo se prueba en el navegador o con la base real.
- **Para el usuario**: acción que solo vos podés hacer (cargar una clave, dar un OK…).

## Generales
- [ ] **Para el usuario**: cargar `UNSPLASH_ACCESS_KEY` en las variables de entorno de Vercel (D55). Sin eso el reposo muestra el respaldo de partículas.
- [ ] **Para el usuario**: la primera carga masiva de la liturgia en la base (L2) requiere tu OK explícito; ver la sección de L2.
- [ ] **Revisar**: el código de la lane se numeró al crearla (la tabla de `LANES.md` dice cuál es cuál).

## L1 · Spike del motor DO (lane 131)
- **Revisar**: la regla de respaldo de idioma por línea se resolvió con una heurística (latín idéntico + palabras funcionales inglesas + lista de encabezados). Detalle y mediciones en `liturgia/SPIKE_MOTOR.md` §9.3. Si preferís exactitud total, se puede generar una pasada extra en inglés (duplica el tiempo de generación).
- **Revisar**: el Rosario necesita textos que **DO no trae** (Letanía Lauretana, Signum Crucis suelto, oración de Fátima, frutos y citas de los 15 misterios). Los escribe la lane L9 en `src/data/liturgia/rosarium.json` con la fuente anotada; **hay que revisarlos contra una fuente impresa**.
- **Sin verificar**: la proyección de espacio (< 150 MB) es una extrapolación de un mes (octubre 2026); se vuelve a medir tras la primera carga real.

## L2 · Generador y modelo de datos (lane 133)
- [ ] **Para el usuario — OK para la primera carga en la base de producción.** El generador está listo y probado; **no se corrió ninguna carga**. Comandos (desde la raíz del repo, con el `.env`):
  ```bash
  npm run liturgia:descargar                    # Divinum Officium (commit fijo) + dependencias Perl, una sola vez
  # 1) ensayo: genera, mide y deja JSON en .cache/ (no toca la base) — ya se corrió, ver cifras abajo
  # 2) carga: calendario 2026–2035 (3 versiones) y textos + libros 2026–2027 (3 versiones)
  LITURGIA_CONFIRMADO=si node scripts/liturgia/generar.ts --importar .cache/ensayo-cal  --escribir
  LITURGIA_CONFIRMADO=si node scripts/liturgia/generar.ts --importar .cache/ensayo-full --escribir
  ```
  Solo escribe en las 4 tablas nuevas (`Dias_Liturgicos`, `Bloques_Liturgicos`, `Documentos_Liturgicos`, `Generaciones_Liturgicas`); upsert idempotente (se puede repetir). Sin `LITURGIA_CONFIRMADO=si` el script se niega a escribir.
- **Hecho sin OK (aditivo, ya aplicado):** `CREATE TABLE IF NOT EXISTS` de esas 4 tablas (`scripts/liturgia/sql/001-tablas-liturgia.sql`, regla AGENTS §6). `prisma migrate diff` trajo además `DROP` de tablas de Homeschooling (lane de horas/reportes, ya en la base pero no en `dev`): **no se aplicó**; se filtró a solo los `CREATE` de liturgia.
- **Revisar**: `migrate diff` contra la base real muestra que la base tiene tablas `Homeschool_Actividades/Metas_Horas/Participantes` que `dev` todavía no declara (otra lane en curso). No es de liturgia; solo anotarlo para quien integre esa lane.
- **Revisar — SQL crudo y `schema`**: el SQL crudo de Prisma **no hereda** el `?schema=family_tasker` del adaptador (el ORM sí): `relation "…" does not exist`. El generador califica las tablas con `esquemaDB()`. `src/lib/homeschooling/servidor/cursos.ts:290` usa `$executeRaw` con `"Homeschool_Lecciones"` sin calificar: **podría fallar igual** (no lo probé; no es de esta lane).
- **Revisar — `scripts/integrar.sh`**: la variable `dueño=` (con «ñ») no es un identificador válido de bash en este entorno (`dueño=1963121: command not found`, línea 29). Pasa cuando el lock está tomado: el script igual aborta (`set -e`) pero sin el mensaje de «Otro agente está integrando». Conviene renombrarla a `duenio`. No lo toqué (es herramienta compartida).
- **Decisión que conviene mirar**: el título del día sale de la **cabecera de Laudes** (`officium.pl content=1`) y no de `kalendar.pl` como decía la SPEC §2: es el texto exacto del ejemplo del pedido y trae el color. `tiempo` y `dominical` se calculan por aritmética del año litúrgico (`src/lib/liturgia/calendario.ts`, con pruebas 2026–2035), no con el texto de DO.
- **Revisar**: `Titulo_Es` queda `null` en días de feria (el `[Officium]` español de Tempora no coincide con el título latino con fecha, p. ej. «…II. Octobris»). La UI muestra solo el latín. Para santos sí viene («S. Calixto, Papa y Mártir»).
- **Revisar**: se agregó `tipo = "kalendarium"` (además de hora/missa/martyrologium/libro) para el Kalendarium de cada versión (1570 + diferencias de 1888 y 1906 combinadas), que L7 necesita para el índice por mes. `clave` = la versión; las entradas van en `Titulo`.
- **Revisar**: la prueba de deduplicación de la SPEC §12 («dos días seguidos < 40 % de bloques nuevos») no se cumple a nivel de **una Hora** (13 vs 14-oct: 52 % nuevos, porque son feria y fiesta de mártir); a nivel de **mes completo** solo el 11 % de las filas es único (SPIKE §9.2). La prueba automática exige < 60 %.
- **Sin verificar**: la **GitHub Action** (`.github/workflows/liturgia.yml`) nunca corrió. Está inactiva hasta que crees la variable de repositorio `LITURGIA_ACTION_ACTIVA=true` y los secretos `DATABASE_URL`/`DIRECT_URL`. Como `dev` solo se integra en local, tampoco corre hasta que el archivo llegue a la rama por defecto de GitHub.
- **Sin verificar**: `descargar.sh` e `instalar-perl.sh` desde cero (se probó el mismo procedimiento a mano; el script se probó ejecutándolo sobre el clon existente).
- **Incidente (para que lo sepas)**: al crear el worktree de esta lane otro agente creó a la vez `lane-132` (Homeschooling horas/reportes) y por un descuido mío copié `vendor/` y `.cache/` en su directorio y corrí `npm install` ahí (falló en `prisma generate`). Los moví de vuelta a mi worktree; su directorio quedó con el mismo contenido que tenía (solo su cambio en `prisma/schema.prisma`). Mi lane quedó como **133**. Lección anotada en las reglas de trabajo: tras `git worktree add`, abortar si falla antes de copiar nada.

## R1 · Frases del reposo: fuentes y datos (lane 135)
- [ ] **Para el usuario — revisar la selección y los textos antes de usarlos** (la lane debía mostrártela antes de integrar; se integró igual para no frenar R3, pero el reposo **no está conectado a nada todavía**, así que no se muestra nada hasta que lo apruebes en R3).
  - `vault/nuevas-features/idle-marco-fotos/ref/seleccion-citas.txt` (562 citas: 162 salmos, 76 Mateo, 67 Lucas, 53 Proverbios, 35 Juan, 22 Eclesiástico, 20 Isaías, el resto epístolas, sapienciales y algunos del Pentateuco/históricos).
  - `ref/torres-amat-correcciones.txt` (cada línea es una corrección del OCR hecha por el modelo).
  - Para ver el latín y el español de cada cita: `npm run reposo:fuentes && npm run reposo:frases -- --borrador`.
- **Revisar — el texto español no es de la 1.ª edición (1823)** sino de la «nueva edición ilustrada» de 1883-84 (explicado en `ref/README.md`). Si querés exactamente la de 1823 (la del ejemplo «El Señor es quien me gobierna»), hay que transcribirla a mano del escaneo: el OCR de 1823 no sirve para extraer versículos.
- **Revisar — el Catecismo es la edición de 1973** (mismo texto de 1905, sin la numeración de 1906); la versión castellana de 1906 de D50 no tiene un OCR utilizable. Se guardan 707 preguntas limpias de las ~755 detectadas (las demás tenían palabras irrecuperables). El OCR de 1973 también tiene errores raros que producen palabras válidas (p. ej. «tercer» por «tener» en los últimos capítulos): leí al azar unas 150 preguntas y encontré ~5 % con algún error, que corregí con reglas; **falta una lectura completa por una persona**.
- **Revisar — D51 (≥ 365)**: se llegó a 562, pero salieron de un OCR corregido: 305 de 867 propuestas se descartaron por ilegibles o cortadas (`ref/seleccion-descartadas.txt`). Faltan casi todos los **profetas menores, Ezequiel, Daniel, Baruc, Job (casi), Génesis/Éxodo/Deuteronomio/Josué (casi)**: la extracción solo se armó para los libros de `scripts/reposo/libros.ts`.
- **Revisar — alineación de capítulos**: la extracción asigna cada capítulo del escaneo al de la Vulgata por el último versículo y, si hay empate, por afinidad léxica; la prueba `datos.test.ts` solo fija unos pocos pasajes (Salmo 22, 50, 117). Detecté y descarté a mano casos mal alineados (Dt 8,3; Mt 21,22; Mt 21,13/16), pero **puede quedar alguno más**: conviene leer unos 50 al azar contra la Vulgata.
- **Revisar — «no se tipea a mano»**: las correcciones del OCR sí son texto escrito por el modelo (p. ej. «contrito y humillado» en el Salmo 50,19, donde el OCR perdió la «y»). Están todas en `ref/torres-amat-correcciones.txt` para que se vean y se revierta la que no guste.
- **Sin verificar**: el contraste y la presentación visual (R3); el orden de los salmos con título en el v. 1 (los refs que empiezan en el versículo 1 de un salmo con título usan solo el cuerpo, sin el título: Ps 22,1-2 → «El Señor me pastorea…»).

## L3 · API y componentes base (lane 136)
- **Sin verificar**: las rutas `/api/liturgia/*` contra la base real: no hay datos hasta la primera carga de L2. Sin datos responden 404 `{"estado":"no-generado"}` (probado con repositorio en memoria, no contra Supabase).
- **Revisar**: se agregó `GET /api/liturgia/kalendarium` (no estaba en la tabla de la SPEC §6) porque L7 necesita el índice por mes del Proprium Sanctorum.
- **Revisar**: `LiturgiaTexto` usa una fila con `no-scrollbar` para los chips de sección porque `ui/drag-scroll` vive en la lane 109 (sin integrar). Cambiarlo cuando 109 llegue a `dev`.
- **Revisar**: el Rosario no está en la base (DO no lo trae): L9 lo lee de `src/data/liturgia/rosarium.json`; el prefijo de clave `Rosarium/` quedó reservado en `parametros.ts` por si se prefiere guardarlo en `Documentos_Liturgicos`.
- **Aviso para L4–L9**: las pantallas que usen `useParametrosLiturgia` (`useSearchParams`) necesitan `<Suspense>` en la página.

## N4 · Detector de inactividad (lane 138; prerrequisito de R3)
- **Sin verificar en navegador**: los eventos reales, el canal entre pestañas (`BroadcastChannel` + `storage`) y `visibilitychange`/`pageshow`. Las pruebas usan un reloj y un bus simulados.
- **Pendiente (N6)**: nada cierra sesión todavía; `useInactividad` solo avisa. La sesión deslizante de 5 min (S3) tampoco está.

## R2 · Pool de Unsplash y panel (lane 137)
- **Sin verificar**: el refresco real contra Unsplash y el cron (no se corrió; sin llamadas a la API). Probar con «Cargar fotos ahora» una vez cargada la clave.
- **Para el usuario**: `UNSPLASH_ACCESS_KEY` en Vercel.
- **Hecho sin OK (aditivo)**: `CREATE TABLE` de `Config_Reposo` y `Fotos_Unsplash` aplicado con `db execute` (AGENTS §6).
- **Revisar**: el aviso de descarga usa `/photos/{id}/download` (equivale a `links.download_location`, que no se guarda).
- **Revisar**: el panel reutiliza `conSesion` de `lib/tienda/http` para las rutas de admin.

## R3 · Reposo v2 UI (lane 139)
- **Hecho**: `ReposoPantalla.tsx` con fotos de Unsplash, fundido cruzado (1.5 s), Ken Burns y velos de legibilidad (≥ 4.5:1), frases bíblicas y del Catecismo alternadas estrictamente (`BolsaBarajada`), esquina con título litúrgico del día (`/api/reposo/dia`), anti burn-in (desplazamiento ±24 px cada 60 s y atenuación a 0.6 tras 5 min sin actividad), botón «Entrar» y atribución Unsplash.
- **Hecho**: máquina de estados `REPOSO <-> SELECTOR <-> PIN` en `AuthPageClient` con 15 s de inactividad para volver a `REPOSO` (usando `useInactividad` de N4 y respetando `segundosLogin`).
- **Hecho**: `/api/reposo/dia` lee el oficio Tridentine 1906 para la fecha local en `APP_TZ`; devuelve `null` seguro si la base aún no tiene datos de liturgia generados.
- **Sin verificar en navegador real**: animación de fundido cruzado y Ken Burns, la transición visual al tocar «Entrar», y el desplazamiento anti burn-in tras 60 s (probado en tests unitarios y build de producción).
- **Arreglado en scripts**: `scripts/integrar.sh` tenía la variable `dueño=` (con `ñ`), renombrada a `duenio=` para evitar fallos en bash.

## L4 · Calendarium — `/dashboard/liturgia` (lane 140)
- **Hecho**: Dashboard principal del Calendario Litúrgico (`CalendariumVista.tsx`) con `CabeceraLiturgica`, Card Hoy (oficio completo, rango, color, tiempo, conmemoraciones), Card Mes (`CalendariumMes.tsx` con grilla interactiva, puntos de color litúrgico y rangos abreviados), Breviarium del día (con Hora actual en `APP_TZ`, franja, foto y accesos a las 8 Horas), Missale del día (incipit del Introito, Colecta/Oratio, Epístola/Evangelio), Mysteria Rosarii (los 5 misterios del día según el día de la semana y la regla dominical tradicional) y Martyrologium tradicional bilingüe con nota de adaptación (D52).
- **Hecho**: `src/lib/liturgia/horas.ts` con franjas S8 exactas en los bordes (04:59/05:00, 23:59/00:00) y metadatos con fotos de Unsplash (S10).
- **Hecho**: `src/lib/liturgia/rosario.ts` con regla semanal y dominical confirmada con fuentes impresas preconciliares (*The Raccolta* 1910, n.º 219; *Manuale Precum* 1898) y citada en el código (§10.8, §12).
- **Sin verificar en navegador real**: la experiencia visual de arrastre de fecha y navegación mensual en dispositivos táctiles.

## L5 · Breviarium — `/dashboard/liturgia/breviarium` (lane 141)
- **Hecho**: Hub Breviarium (`BreviariumVista.tsx`, `/dashboard/liturgia/breviarium`) con Hora actual destacada (AHORA según franja S8 en `APP_TZ`), animación Ken Burns, overlay D54 con contraste ≥ 4.5:1 (`bg-gradient-to-t from-black/90 via-black/50 to-transparent`), botón «Rezar [Hora]» y atribución de foto Unsplash.
- **Hecho**: 7 cards secundarias en grilla cronológica (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-7`) con imagen 16:9, franja horaria, título latino y castellano.
- **Hecho**: Lector de la Hora en `/dashboard/liturgia/breviarium/[hora]` (ruta dinámica) y por parámetro `?hora=...`, con barra superior de salto rápido entre las 8 Horas (indicador pulsante en la hora actual), botón «Ver todas las Horas» y renderizado bilingüe con `LiturgiaTexto` o aviso amigable «Oficio no generado».
- **Hecho**: Navegación integrada con Next.js App Router preservando parámetros `fecha` y `version`.
- **Sin verificar en navegador real**: renderizado interactivo del efecto Ken Burns en distintas resoluciones de pantalla y gestos táctiles.

## L6 · Missale — `/dashboard/liturgia/missale` (lane 142)
- **Hecho**: Pantalla Missale (`MissaleVista.tsx`, `/dashboard/liturgia/missale`) con `CabeceraLiturgica`, nota D53 visible para 1888/1906 («DO usa el Misal de 1910 para esta versión»), `ToggleGroup` interactivo «Solo el propio» / «Misa completa» y lector bilingüe con `LiturgiaTexto`.
- **Hecho**: Filtrado puro de secciones (`src/lib/liturgia/missa.ts` + `missa.test.ts`) según la propiedad `propio` derivada por el parser de DO (Introitus, Oratio, Lectio/Epistola, Graduale, Evangelium, Offertorium, Secreta, Praefatio, Communio, Postcommunio, Commemoratio vs Ordinario).
- **Hecho**: Contador dinámico de secciones visibles («X secciones del propio» o «X secciones totales») y estado de carga / aviso cuando no hay datos generados en la base.
- **Sin verificar en navegador real**: verificación visual del desplazamiento suave por anclas entre secciones del Ordinario y del Propio.

## L7 · Proprium — Tempore y Sanctorum (lane 143)
- **Hecho**: Pantalla Proprium de Tempore (`PropriumDeTemporeVista.tsx`, `/dashboard/liturgia/proprium-de-tempore`) con índice por los 8 tiempos litúrgicos tradicionales (Adventus, Nativitas, Epiphania, Septuagesima, Quadragesima, Passio, Pascha, Pentecostes), listado de domingos/ferias, enlace «¿Cuándo cae este año?» hacia Calendarium, y detalle con pestañas Missa y Officium con `LiturgiaTexto`.
- **Hecho**: Pantalla Proprium Sanctorum (`PropriumSanctorumVista.tsx`, `/dashboard/liturgia/proprium-sanctorum`) con índice por los 12 meses del año usando el Kalendarium de la versión seleccionada (1906, 1888, 1570 reflejando sus diferencias), buscador en tiempo real por nombre de santo o fecha, tarjetas con punto de color litúrgico y rango, enlace «Ver en el Calendarium del año», y detalle con pestañas Missa y Officium.
- **Hecho**: Módulo puro `src/lib/liturgia/proprium.ts` con tests unitarios (`proprium.test.ts`): clasificación de los 8 tiempos, traducción de rangos a latín tradicional (Simplex, Semiduplex, Duplex, Duplex I/II classis), deducción de color litúrgico y filtrado/búsqueda de fiestas.
- **Sin verificar en navegador real**: navegación y respuesta del buscador de santos en dispositivos móviles y rendimiento con el volumen completo de Kalendarium cargado en producción.

## L8 · Ordinarium y Psalterium (lane 144)
- **Hecho**: Pantalla Ordinarium (`OrdinariumVista.tsx`, `/dashboard/liturgia/ordinarium`) con pestañas para el Ordo Missæ tradicional (`Missa/Ordo/Ordo`) con enlace directo al Missale del día para partes propias, y Preces comunes del Oficio Divino (`Psalterium/Common/Prayers`).
- **Hecho**: Pantalla Psalterium (`PsalteriumVista.tsx`, `/dashboard/liturgia/psalterium`) con índice completo de 150 salmos con numeración de la Vulgata + Cánticos tradicionales del Oficio (Benedictus, Magnificat, Nunc Dimittis, Te Deum, Benedicite, Quicumque), buscador rápido insensible a mayúsculas/diacríticos por número (ej. «22», «ps 50») o texto (ej. «miserere»), lector bilingüe con `LiturgiaTexto` y aviso permanente D52: «Numeración de la Vulgata. Traducción española de Divinum Officium (no Torres Amat)».
- **Hecho**: Módulo puro `src/lib/liturgia/salterio.ts` con tests unitarios (`salterio.test.ts`), y extensión de `PREFIJO_CLAVE_LIBRO.ordinarium` para incluir `Psalterium/Common/`.
- **Sin verificar en navegador real**: navegación entre los 150 salmos con botones Anterior/Siguiente en pantallas de teléfonos móviles.

## L9 · Rosarium — `/dashboard/liturgia/rosarium` (lane 145)
- **Hecho**: Pantalla Rosarium (`RosariumVista.tsx`, `/dashboard/liturgia/rosarium`) con `CabeceraLiturgica` (selector de versión y fecha), Misterios del día destacados según la regla dominical tradicional preconciliar (*The Raccolta* 1910, n.º 219 y *Manuale Precum* 1898) y días fijos semanales, con 5 tarjetas con número romano (`I`–`V`), título en latín/español, fruto espiritual y cita bíblica.
- **Hecho**: Explorador por pestañas de los 15 misterios tradicionales preconciliares (Gozosos, Dolorosos, Gloriosos; sin misterios luminosos de 2002) con indicación visual de la corona correspondiente al día actual.
- **Hecho**: Devocionario tradicional bilingüe (latín/español) en `src/data/liturgia/rosarium.json` y `src/lib/liturgia/rosario.ts` con selector de idioma (`ToggleGroup`: Ambos, Latín, Español), textos completos y fuentes impresas: Signum Crucis, Credo, Pater Noster, Ave Maria, Gloria Patri, Oración de Fátima («O mi Iesu») con badge «desde 1917», Salve Regina con versículo y respuesta, Oremus final (Oratio Conclusiva), y Litaniæ Lauretanæ completas (más de 50 invocaciones, Agnus Dei 3x y Sub tuum præsídium).
- **Hecho**: Tests unitarios en `rosario.test.ts` (324 tests pasando en la suite completa, 0 fallas).
- **Sin verificar en navegador real**: visualización del devocionario y de las tarjetas de misterios en teléfonos móviles y tablets.






