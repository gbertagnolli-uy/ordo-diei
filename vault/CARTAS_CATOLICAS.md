# Cartas católicas coleccionables

> Pedido (2026-10-10), registrado **completo y textual** en §1. Evaluación de las dos vías propuestas en §2, decisiones en §3 y lanes en §6.
> Material de referencia en [`cartas/ref/`](cartas/ref/) (registro de React Bits de HoloCard, variantes JS+CSS y TS+CSS) y prompts de cada lane en [`cartas/`](cartas/).

Rama base: `dev` · Una rama `task/lane-N-*` por lane, worktree propio en `../ordo-diei-lanes/`, sin PR a `main`. Las lanes las implementa **agy**; el merge a `dev` y la limpieza los hace el orquestador.

---

## 1. Pedido del usuario (textual, nada omitido)

**Feature:** sistema de cartas basado en el repo `ashishbarthwal/creator-gacha-card-game`. Clonarlo en local y reescribir el JavaScript en Next.js si hace falta.

**Lo que NO se necesita**
- Integración con Google ni YouTube.
- Batallas de cartas.
- Puntajes de ataque y defensa.

**Qué se busca**
1. Sistema de cartas **católico tradicional**: santos, ángeles, misterios de la vida de Jesús, y personas o temas importantes.
2. **Dashboard de las cartas coleccionadas.**
3. **Dashboard de todas las cartas**, con las que el usuario todavía no ganó **en blanco y negro**.
4. **Animación de nueva carta desbloqueada**, con el modal de cuando se abre una carta.
5. **Tienda para comprar cartas con puntos.**
6. Las cartas **no se compran/desbloquean de una**: se juntan con **fragmentos**.
7. Rarezas: **comunes, buenas, perfectas y celestiales**.
8. **Panel para agregar una carta nueva** que no existe.
9. **Cada carta tiene su propia pantalla**: historia del personaje, una oración o rezo, una frase y un **datasheet** (fechas en que se celebra, año de nacimiento, principal virtud, etc.).
10. **El día en que se celebra o recuerda la carta**, se regala el **50 % de los fragmentos de esa carta** a todos los usuarios que ingresen a la app y **reclamen el premio**.
11. **El día del cumpleaños del usuario**, se le regalan **todos los fragmentos del santo del día** (o de lo que se celebre/recuerde).

**Componente de vista de carta (obligatorio): `HoloCard` de React Bits** (efecto holográfico).
```jsx
import HoloCard from './HoloCard';
import card from './pikachu.webp';
<HoloCard image={card} alt="Pikachu" preset="bursts" />
```
Props: `image`, `backImage` (click/Enter la da vuelta), `alt`, `preset` (`bursts` | `stars` | `shards` | `cosmos` | `rainbow` | `swirl` | `glitter` | `gold`), `foilColor` (#e2e6ec), `intensity` (0.85), `scale` (1), `edgeSparkle` (0.8), `frame` (4, % del ancho), `glare` (0.5), `tiltMax` (14), `hoverScale` (1.04), `radius` (14), `width` (320), `idle` (true), `shadow` (true), `className`, `style`. Variante pedida: **JavaScript + CSS**. El código fuente completo y su CSS están guardados sin tocar en [`cartas/ref/HoloCard-JS-CSS.registry.json`](cartas/ref/HoloCard-JS-CSS.registry.json) (y la versión TS en `HoloCard-TS-CSS.registry.json`). Se instala con el CLI de shadcn (ver lane 32). Índice de la librería: https://reactbits.dev/llms.txt

**Repo a aprovechar:** https://github.com/ashishbarthwal/creator-gacha-card-game.git

**Pedido de proceso:** documentar todo en el vault; separar cada feature en rama y worktree propios con prompt para agy; avisar al usuario; y entregar **un prompt general** que le diga a agy que vaya rama por rama y lea el prompt de cada tarea ([`cartas/PROMPT_GENERAL_AGY.md`](cartas/PROMPT_GENERAL_AGY.md)).

### 1.1 Ampliación (2ª entrega, 2026-10-10) — textual

> "En vez de mostrar la historia, hagamos así:"
> - **0 % de fragmentos:** todo oculto, menos la fecha en que se celebra y el nombre.
> - **0 a 25 % de fragmentos:** oración desbloqueada.
> - **25 a 50 %:** desbloqueo de la frase y *algunos* datos del datasheet, pero no todos.
> - **50 a 99 %:** datasheet desbloqueado progresivamente según el porcentaje.
> - **100 %:** carta desbloqueada, historia desbloqueada.
>
> "Además quiero sumar otras features al sistema, como **niveles de cartas**, y otras features que detallo acá en este informe:" → informe completo y sin cambios en [`cartas/ref/INFORME_SISTEMAS_CARTAS.md`](cartas/ref/INFORME_SISTEMAS_CARTAS.md) (Pokémon TCG, fragmentos y duplicados en Clash Royale / Asphalt 9 / Summoners War, niveles de personaje, y su aplicación: Testimonios, Grados de Veneración, Sobres de Meditación y Revelación, Granos de Incienso, bono de festividad, campos del admin).

> **3ª entrega (2026-10-10), textual:** "Solo un detalle, quiero que **al evolucionar la carta, se use otra imagen**. Yo proporcionaré imágenes para cada carta, y también quiero proporcionar la imagen para las cartas evolucionadas. Por eso debe haber, como ya pedí, una página para agregar cartas. En esa página se debería poder ingresar todos los datos, historia, oraciones, frases, y **las imágenes de cada nivel de la carta**."
>
> Consecuencia: cada carta tiene **una imagen por grado** (I a IV), las aporta el usuario y se cargan en el panel de alta/edición (lane 36). Ver D9, D14 y D19.

Esta ampliación **reemplaza** la decisión D7 anterior ("el texto de las cartas bloqueadas se muestra siempre") y ajusta D2–D6; ver §3.

---

## 2. ¿Es la mejor vía? Evaluación

### 2.1 El repo de referencia
Clonado y revisado (45 archivos JS vanilla, Cloudflare Pages/Workers, YouTube Data API, ~130 KB de motor de batallas).

- **Licencia: "no está licenciado para reuso. All rights reserved"** (README). Por lo tanto **no se copia ni se "reescribe" su código**; hacerlo sería un derivado sin permiso.
- Lo único útil es una **idea**, no código: el sorteo en **dos etapas** (`engine/gacha.js`, ~20 líneas): primero se elige la banda de rareza por peso fijo y recién después una carta al azar dentro de la banda. Así la probabilidad de cada rareza no depende de cuántas cartas tenga cada banda. Esa idea es de uso libre y se **implementa desde cero** en TypeScript (lane 30).
- El resto (batallas, stats, YouTube, presence, workers, marketing) está fuera de alcance o no sirve para Next.js.
- **Decisión: no se clona dentro del proyecto ni se migra.** Se deja registrado que se estudió y por qué se descarta el código.

### 2.2 El prompt maestro propuesto
Buena estructura, pero **está pensado para un proyecto vacío** y choca con el actual:

| El prompt maestro dice | Lo que ya existe en Ordo Diei | Decisión |
|---|---|---|
| NextAuth.js + `User.email` | Sesión propia con `jose` + PIN, `Usuario` con `rolFamiliar` | Usar la sesión actual (`getSession`). **No** instalar NextAuth |
| Prisma + PostgreSQL nuevo, `User`, `birthDate "MM-DD"` | Prisma 7 + Supabase (schema `family_tasker`), `Usuario.fechaNacimiento DateTime` | Modelos nuevos aditivos con `@@map`, mismo estilo que `Habito*` |
| `User.points` | `availablePoints` / `puntosAcumulados` ya se ganan con tareas y hábitos | La tienda gasta `availablePoints`. Es la primera "tienda de canje" (la lane 24 del plan de hábitos) |
| Zustand para el estado | Zustand ya instalado | Solo para el modal de apertura si hace falta; la fuente de verdad es el servidor |
| Framer Motion | `framer-motion` ya instalado | Se usa |
| Admin con "role-based access" | `/dashboard/admin` ya protege a Padre/Madre | Mismo criterio de permisos |
| Cron / "al iniciar sesión" | `/api/cron/daily` (Vercel) | Los eventos se reclaman a mano (pedido: "reclamen el premio"); no hace falta cron |
| Tailwind + estética propia | shadcn `radix-nova`, tema "The Noble Manuscript", Newsreader para títulos | UI solo con componentes prearmados (regla del usuario) |

**Errores del prompt maestro que NO se heredan**
1. **El 50 % no es un multiplicador ×1,5.** El pedido es *regalar el 50 % de los fragmentos de esa carta* a quien reclame ese día. El prompt maestro lo convirtió en "la recompensa de un sobre se multiplica por 1,5", que es otra cosa. Aquí: regalo = `ceil(fragmentosRequeridos × 0,5)`, reclamable una vez por usuario, carta y año.
2. **Bandera `birthdayRewardClaimed` en `User`**: frágil (hay que resetearla cada año y no cubre varias cartas el mismo día). Se usa una **tabla de reclamos** con clave única `(usuario, tipo, carta, período)`, idempotente y auditable.
3. **`celebrationDate` obligatorio en `MM-DD`**: los misterios de la vida de Jesús (gozosos, dolorosos, etc.) y fiestas móviles (Pascua, Pentecostés, Corpus Christi) no tienen fecha fija. Aquí es **opcional**; sin fecha no hay evento.
4. **Varias cartas el mismo día** (santos que comparten fecha): el prompt maestro asume una. Aquí son todas las cartas de esa fecha.
5. **Cumpleaños 29 de febrero**: se celebra el 28 en años no bisiestos.
6. **Fragmentos por sobre "aleatorios de una carta específica"** sin definir qué pasa con cartas ya desbloqueadas ni con la economía de puntos: se define en §3.
7. **WebGL**: HoloCard abre un contexto WebGL2 por instancia y los navegadores permiten ~16. Usarlo en cada celda de una grilla de 60 cartas lo rompe. Ver §3-D8.

### 2.3 Open source que se reutiliza (regla "reutilizar OSS")

| Pieza | Librería (licencia) | Uso |
|---|---|---|
| Carta holográfica | **React Bits `HoloCard`** (MIT, pedido por el usuario) | Vista de la carta en detalle, apertura y panel admin |
| Calendario litúrgico | **romcal 1.3.0** (MIT) — Calendario Romano general, con locale español | **Validar** las fechas de santos del catálogo y resolver fiestas móviles (Pascua…). No reemplaza el catálogo propio |
| Fechas y zona horaria | `date-fns` + `@date-fns/tz` (ya instalados), `APP_TZ` | "Hoy" y cumpleaños en la zona de la familia |
| Animación | `framer-motion` (ya instalado) | Secuencia de apertura |
| Confeti | MagicUI Confetti (ya instalado) | Carta desbloqueada |
| Imagen de la carta | `next/og` (`ImageResponse`, satori; viene con Next) | Componer arte + marco + nombre en un PNG para HoloCard |
| Validación | **zod** (a instalar si no está) | Formulario admin y catálogo JSON |
| UI | shadcn `radix-nova`: card, dialog, drawer, tabs, badge, progress, select, textarea, field, empty, sheet… | Todo |
| Tests | `node:test` (como hoy) | Sin dependencias nuevas |

Lógica propia, solo lo que no existe: el sorteo por bandas (idea de la referencia), la economía de fragmentos/puntos y los eventos de fiesta y cumpleaños.

### 2.4 Informe de sistemas de cartas: qué se adopta y qué no

| Idea del informe | Decisión |
|---|---|
| Duplicados con valor (Clash Royale, Summoners War) | **Se adopta:** los fragmentos de una carta ya desbloqueada suben sus **Grados de Veneración** (D14). Nunca se descartan |
| Comodines / conversión de excedente | **Se adopta:** lo que excede el último grado se convierte en **Granos de Incienso**, moneda para comprar fragmentos de *cualquier* carta (D15) |
| Doble desbloqueo / estrellas (Asphalt 9) | **Se adopta** como los grados (D14), solo **estéticos y de contenido**; no hay estadísticas |
| Sobres Meditación / Revelación | **Se adopta** (D2) en lugar del "sobre devoto" propuesto antes |
| Bono de festividad en sobres (+50 % de esa carta) | **Se adopta** además del regalo reclamable pedido por el usuario (D5, D17); apagable con una constante |
| Nombrar "Reliquias" o "Testimonios" | **"Reliquias" NO**: en el derecho canónico las reliquias no se venden (simonía) y venderlas por puntos es irreverente. Queda **"fragmentos"** (palabra del usuario). "Testimonios" es una alternativa; el rótulo vive en una constante de textos (D18) |
| Tabla de grados I–IV del informe (Conocimiento 0–49 %, etc.) | **Reemplazada** por los tramos de revelación que pidió el usuario (D13). Del grado "Iluminado" se toma la imagen propia de cada grado (D19) y el halo, pero **no** esconder la oración: el usuario la desbloquea al principio |
| Campos de admin `fragmentos_para_iluminacion`, `contenido_bloqueado…` | Se adaptan al modelo nuevo (§4 y lane 36); el contenido bloqueado es siempre "???" (D13) |
| Graduación tipo PSA, "mano caliente", mercado secundario, utilidad competitiva, Evo Shards por misiones | **No se adopta:** valor financiero, presión de compra y competencia contradicen una app familiar. Idea futura sin lane: sobres como premio de hábitos/racha |

---

## 3. Decisiones de diseño (defaults míos; el usuario puede cambiarlas)

**D1 · Rarezas y pesos del sorteo** (constantes en `src/lib/cartas/economia.ts`, una sola fuente):

| Rareza | Peso de banda | Fragmentos para desbloquear (100 %) | Valor de un fragmento (D15) | Holo (HoloCard) |
|---|---|---|---|---|
| Común | 60 | 10 | 1 | sin holo (imagen plana) |
| Buena | 28 | 25 | 2 | `glitter`, intensidad baja |
| Perfecta | 10 | 60 | 4 | `gold` |
| Celestial | 2 | 150 | 10 | `cosmos` (o `swirl`) |

Números de partida; la lane 30 simula la economía (días hasta la primera Común y la primera Celestial según los ~10–20 puntos/día de la app) y propone ajustes **sin cambiarlos sola**.

**D2 · Tienda** (gasta `availablePoints` o Incienso, nunca dinero real; sin presión de compra porque la usan chicos):
- **Sobre de Meditación** — 40 pts → 5 fragmentos en 1–3 cartas, **solo** bandas Común y Buena (renormalizadas).
- **Sobre de Revelación** — 160 pts → 8 fragmentos; garantiza que al menos 4 sean de **una carta Perfecta o Celestial** (sorteo por bandas 10:2) y el resto sale del sorteo completo.
- **Fragmentos de una carta elegida** — se pagan en **puntos** (precio por fragmento = valor × 4 pts) o en **Incienso** (precio = valor del fragmento). Tope: 10 fragmentos por carta y día pagando con puntos.
- Gasto atómico en transacción; el servidor resuelve el resultado **antes** de animar.

**D3 · Los sobres sortean cualquier carta activa** (anula la regla anterior de "solo no desbloqueadas"): como los duplicados ahora valen (D14, D15), ya no hay frustración. El sorteo es en dos etapas (banda por peso, carta uniforme dentro de la banda).

**D4 · Fragmentos por carta:** el progreso se guarda como `fragmentos` hasta un **tope = fragmentosRequeridos × 3** (grado IV). Porcentaje = `fragmentos / fragmentosRequeridos` (puede superar 100 %). Lo que exceda el tope se convierte en Incienso (D15), nunca se pierde.

**D5 · Fiesta de la carta (50 %):** el día `MM-DD` de `celebracion` (en `APP_TZ`), todo usuario que entra ve el aviso y puede **reclamar**. Regalo = `ceil(requeridos × 0,5)` fragmentos (aplicados con D4, así que sirve aunque ya la tenga). Una vez por `(usuario, carta, año)`. Varias cartas el mismo día ⇒ un reclamo por carta.

**D6 · Cumpleaños:** el día de `fechaNacimiento` (29-feb → 28-feb en años no bisiestos) el usuario reclama **todos los fragmentos que le faltan para el 100 %** de cada carta cuya `celebracion` sea ese día (se desbloquean). Una vez por año y carta. Si ese día no hay ninguna carta, o ya tiene todas al 100 %: regalo alternativo = **un Sobre de Revelación gratis** (confirmar con el usuario).

**D13 · Revelación progresiva del contenido** (reemplaza D7). Sea `p = fragmentos / requeridos`:

| Tramo | Se ve |
|---|---|
| `p = 0` | Solo **nombre** y **fecha en que se celebra** (siempre visibles). Todo lo demás: "???". Imagen en blanco y negro con candado |
| `0 < p < 25 %` | + **Oración** |
| `25 % ≤ p < 50 %` | + **Frase** (con su autor) + **algunos** datos del datasheet |
| `50 % ≤ p < 100 %` | + datasheet **progresivo** según el porcentaje |
| `p ≥ 100 %` | Carta desbloqueada: imagen a color, **historia** y datasheet completo |

- El **datasheet** es una lista ordenada (`datasheet: [{etiqueta, valor}]`; el orden es el de revelación). La fecha de celebración no cuenta (siempre visible). Con `N` datos: `p < 25 %` → 0; `25 % ≤ p < 100 %` → `clamp(ceil(N × (p − 25 %) / 75 %), 1, N − 1)`; `p ≥ 100 %` → `N`. Para que el tramo 25–50 % sea "algunos pero no todos", el catálogo exige **N ≥ 4**.
- Los datos aún bloqueados se muestran con su **etiqueta** y valor "???" y una pista ("se revela al 60 %"). Historia, oración y frase bloqueadas muestran "???" y el porcentaje en que se desbloquean.
- **Seguridad:** el servidor **no envía** el texto oculto. `contenidoVisible(carta, fragmentos)` (pura, lane 30) arma la respuesta de la API; el cliente no recibe lo que no corresponde.
- La imagen sigue en blanco y negro hasta el 100 %.

**D14 · Grados de Veneración** (niveles de carta, solo desbloqueadas; sin estadísticas ni combate). Múltiplos de `fragmentosRequeridos`:

| Grado | Con | Lo que gana la carta (cosmético) |
|---|---|---|
| I · Desbloqueada | 100 % | **Imagen del grado I** a color y marco de su rareza |
| II · Venerada | 150 % | **Imagen del grado II** y marco ornamental dorado |
| III · Iluminada | 200 % | **Imagen del grado III** y holo más intenso |
| IV · Gloriosa | 300 % (tope) | **Imagen del grado IV**, halo animado y título "Gloriosa" |

Al cambiar de grado la carta **cambia de imagen** (D19). Antes de desbloquear (0 a 99 %) se usa la imagen del grado I en blanco y negro.

Los umbrales son constantes en `economia.ts`. El grado se calcula de los fragmentos (no se guarda).

**D19 · Una imagen por grado, aportadas por el usuario.** Cada carta tiene hasta 4 imágenes: `imagenUrl` (grado I, obligatoria), `imagenGrado2Url`, `imagenGrado3Url`, `imagenGrado4Url`. Si falta la de un grado, se usa la del grado anterior más alto cargado. Las imágenes se cargan en el panel de alta/edición (lane 36); el catálogo inicial (lane 33) trae un **arte provisional** por categoría y la convención `public/cartas/<clave>/1.webp … 4.webp` por si el usuario prefiere copiar archivos. **Sin spoilers:** la API y la ruta de imagen solo entregan la imagen del grado actual del usuario (o la del grado I en blanco y negro si está bloqueada); las de grados superiores no se envían. El administrador sí las ve en su vista previa. Formato recomendado: retrato 63:88, `.webp`, ≤ 300 KB, igual encuadre en los 4 grados para que el cambio se note como evolución.

**D15 · Granos de Incienso:** lo que sobra al llegar al tope de una carta se convierte en `fragmentos × valor` de su rareza (tabla D1). El Incienso se gasta en la tienda comprando fragmentos de **cualquier** carta a `valor` Incienso cada uno. Es una conversión justa entre rarezas (sin arbitraje). `Usuario.incienso`.

**D16 · Rarezas y holo** como en D1; el grado modifica la intensidad del holo (D14).

**D17 · Bono de fiesta en la tienda:** el día de la fiesta de una carta, los fragmentos de **esa carta** que salgan de sobres o compras se multiplican ×1,5 (redondeo hacia arriba). Se suma al regalo reclamable (D5). Constante `BONO_FIESTA_TIENDA` (`1.5`; `1` lo apaga).

**D18 · Textos y nombres:** "fragmentos" en la interfaz; todos los rótulos (fragmento, grado, incienso, sobres) viven en `src/lib/cartas/textos.ts` para cambiarlos en un lugar.

**D8 · Rendimiento de HoloCard:** `HoloCard` solo en (a) la pantalla de detalle, (b) el modal de apertura y (c) la vista previa del admin. Las **grillas** usan la imagen plana con un tilt CSS liviano (WebGL permite ~16 contextos). Si no hay WebGL2, HoloCard cae a la imagen.

**D9 · Imagen de la carta:** `GET /api/cartas/[clave]/imagen?grado=N` compone con `next/og` la imagen **de ese grado** (D19), el marco de la rareza (y del grado) y el nombre, con caché. Un usuario común solo puede pedir hasta su grado actual (403 si pide uno superior). Mismo origen para HoloCard; `frame` coincide con el ancho del marco. Fuentes y licencias del arte en `src/lib/cartas/catalogo/CREDITOS.md`.

**D10 · Catálogo inicial** (lane 33): ~60 cartas en JSON validado con zod:
- 20 misterios (gozosos, luminosos, dolorosos, gloriosos), sin fecha.
- 9 ángeles/arcángeles.
- ~25 santos y beatos de gran devoción con **fecha litúrgica verificada con romcal**.
- ~6 temas/personas (Eucaristía, Sagrado Corazón…).
Cada carta con **datasheet de 4 a 8 datos** (D13). Ante duda, `celebracion` queda `null`.

**D11 · Permisos:** ver el catálogo, comprar y reclamar: cualquier usuario sobre **su** colección. Crear/editar cartas: **Padre o Madre**. El seed no pisa cartas editadas a mano (`origen`, `editadaManual`).

**D12 · Perfil/logros:** lane 37 agrega logros ("Primera carta", "Coleccionista de 10", "Primera Celestial", "Primera carta Gloriosa") reutilizando `logros.ts`. Las cartas no tocan la XP.

---

## 4. Modelo de datos (lo hace solo la lane 31)

```prisma
enum RarezaCarta    { Comun Buena Perfecta Celestial }
enum CategoriaCarta { Santo Angel Misterio Tema Persona }
enum OrigenCarta    { Sistema Manual }
enum TipoMovFragmento { Sobre Compra CompraIncienso Fiesta Cumpleanos ConversionIncienso Ajuste }
enum TipoReclamo    { Fiesta Cumpleanos }

model Carta {                 // @@map("Cartas")
  id Int @id @default(autoincrement())
  clave String @unique        // slug estable: "san-francisco-de-asis"
  nombre, subtitulo?, categoria CategoriaCarta, rareza RarezaCarta
  celebracion String?         // "MM-DD" (null = sin fecha fija)
  historia String @db.Text, oracion String @db.Text, frase String, fraseAutor String?
  datasheet Json              // [{ etiqueta, valor }] en orden de revelación, mín. 4 (nacimiento, muerte, virtud, patronazgo…)
  imagenUrl String /* grado I */, imagenGrado2Url String?, imagenGrado3Url String?, imagenGrado4Url String?, creditoImagen String?
  fragmentosRequeridos Int    // por defecto el de la rareza (D1), editable
  origen OrigenCarta @default(Sistema), editadaManual Boolean @default(false)
  activa Boolean @default(true), creadorId Int?, createdAt, updatedAt
}
model CartaUsuario {          // @@map("Cartas_Usuario")
  id, usuarioId, cartaId, fragmentos Int @default(0) /* tope requeridos×3 */, desbloqueadaEn DateTime?, createdAt, updatedAt
  @@unique([usuarioId, cartaId])
}
model MovimientoFragmento {   // @@map("Movimientos_Fragmento") — libro mayor
  id, usuarioId, cartaId Int?, tipo TipoMovFragmento, cantidad Int, puntosGastados Int @default(0), inciensoDelta Int @default(0), detalle String?, createdAt
}
model ReclamoCarta {          // @@map("Reclamos_Carta") — idempotencia de eventos
  id, usuarioId, cartaId Int?, tipo TipoReclamo, periodo String /* "2026" */, createdAt
  @@unique([usuarioId, tipo, cartaId, periodo])   // Postgres trata NULL como distinto: usar centinela 0 si cartaId es nulo
}
Usuario.incienso Int @default(0) @map("Incienso")
```
Todo aditivo (`db push` sin `--accept-data-loss`). Tras `prisma generate`, **reiniciar `next dev`**.

---

## 5. Contrato del catálogo JSON (lanes 31 y 33)

`src/lib/cartas/catalogo/<categoria>.json`, arreglo con: `clave, nombre, subtitulo?, categoria, rareza, celebracion|null, historia, oracion, frase, fraseAutor?, datasheet[{etiqueta,valor}] (4–8, en orden de revelación), imagenes {1: ruta, 2?: ruta, 3?: ruta, 4?: ruta} (por convención public/cartas/<clave>/N.webp), creditoImagen`. El esquema zod vive en `src/lib/cartas/esquema.ts` (lane 30) y lo usan el seed (31), el admin (36) y la validación del catálogo (33).

---

## 6. Lanes

Cadena: cada lane, al empezar, hace `git merge <rama anterior>` (rama local). Yo las integro después en orden con `--no-ff` a `dev`.

| Lane | Rama | Depende de | Qué entrega |
|---|---|---|---|
| 30 | `task/lane-30-cartas-motor` | `dev` | Motor puro y tests: economía (D1/D2), sorteo en dos etapas, fragmentos con tope y conversión a Incienso (D4/D15), **revelación progresiva** (D13), **grados** (D14), fiesta/cumpleaños/bono (D5/D6/D17), fechas en `APP_TZ`, zod, simulación |
| 31 | `task/lane-31-cartas-datos` | 30 | Prisma (§4), seed, servicio y API con **contenido redactado según D13**, compras (puntos e Incienso), reclamos, eventos. Transacciones e idempotencia |
| 32 | `task/lane-32-holocard` | 31 | HoloCard (React Bits) + `CartaVista` con rareza y **grado** (imagen propia de cada grado, marco, halo) + `/api/cartas/[clave]/imagen` |
| 33 | `task/lane-33-cartas-catalogo` | 32 | Catálogo (~60 cartas, datasheet 4–8 datos), arte **provisional** por categoría (el usuario aporta el definitivo), validación zod + romcal |
| 34 | `task/lane-34-cartas-coleccion` | 33 | Colección y álbum (B/N), pantalla de carta con **revelación por tramos**, barra de progreso con hitos 25/50/100 %, grado y entrada en la barra lateral |
| 35 | `task/lane-35-cartas-tienda` | 34 | Tienda (Meditación, Revelación, fragmentos por puntos o Incienso, bono de fiesta) y animación de apertura/desbloqueo/subida de grado |
| 36 | `task/lane-36-cartas-admin` | 35 | Panel crear/editar con **todos los datos y las 4 imágenes por grado**, editor de datasheet ordenable y **vista previa con deslizador de % de fragmentos** |
| 37 | `task/lane-37-cartas-eventos` | 36 | Reclamos de fiesta y cumpleaños, logros, cierre y documentación |

Worktrees en `../ordo-diei-lanes/lane-NN` (copia reflink de `node_modules`). **Cada worktree tiene su propia copia del vault**: el orquestador la actualiza con `git merge dev` cuando cambia el plan. `AGY_PROMPT.md` (fuera de git) es copia de [`cartas/lane-NN-*.md`](cartas/).

### Reglas para todas las lanes
- Leer `AGENTS.md`: Next 16 tiene cambios. Consultar `node_modules/next/dist/docs/` antes de usar una API de Next.
- **UI solo con componentes prearmados** (shadcn `radix-nova`, React Bits, MagicUI, Aceternity), sin duplicar elementos ni cambiar comportamiento ajeno. Si el CLI de shadcn agrega imports desde `"cn"`, corregirlos a `@/lib/utils` y desinstalar el paquete `cn`.
- **Reutilizar open source** antes que programar (§2.3). Sin copiar código del repo de referencia (sin licencia de reuso).
- Base de datos: Supabase, schema `family_tasker`; solo la lane 31 toca `schema.prisma`, con `db push` aditivo. Reiniciar `next dev` tras `generate`.
- Textos en español rioplatense. Sin YouTube, Google, batallas ni ataque/defensa.
- Verificación: `npm test`, `npx tsc --noEmit`, `npx eslint` sobre lo tocado, `npx next build` y prueba en el navegador con capturas (1440, 390, oscuro). Datos de prueba borrados.
- Commits en la rama y una fila en el §8 (si hay conflicto en esa tabla al mergear la rama anterior, conservar ambas filas). **Sin merge a `dev` ni PR.**

## 7. Criterios de aceptación globales
1. Compila (`tsc`, `next build`) y los tests pasan.
2. Ninguna referencia a YouTube, Google, batallas, ataque o defensa.
3. El álbum muestra en blanco y negro lo no desbloqueado.
4. La revelación sigue D13 en cada frontera (0, 1, 24, 25, 49, 50, 99, 100 %) y **el servidor no envía texto oculto** (verificado en la respuesta de la API).
5. Una carta se desbloquea con `fragmentos ≥ requeridos`; los grados con 150/200/300 %; el excedente sobre el tope se convierte en Incienso; la animación corre una sola vez.
6. El 50 % de fiesta y el regalo de cumpleaños se reclaman una sola vez por período, con tests (29-feb, varias cartas el mismo día, carta ya desbloqueada o en el tope).
7. Una carta creada en el admin aparece de inmediato en el álbum.
8. Puntos e Incienso nunca quedan negativos ni se gastan dos veces (doble clic, dos pestañas).

## 8. Registro

| Lane | Merge | Notas |
|---|---|---|
| 30 | `task/lane-30-cartas-motor` | Completada: motor puro (`economia.ts`, `textos.ts`, `esquema.ts` con zod, `sorteo.ts` en 2 etapas, `fragmentos.ts` con tope e Incienso, `revelado.ts` con D13 y seguridad, `eventos.ts` con D5/D6/D17, `simulacion.ts`). 42 tests en verde. Simulación con 15 pts/día: Común en 2.7d, Buena en 13.3d, Grado IV Común en 8d, Celestial en 400d directa (se recomienda aprovechar los eventos del 50% litúrgico o calibrar a 80-100 req). Sin pendientes. |
| 31 | `task/lane-31-cartas-datos` | Completada: persistencia y API (`prisma/schema.prisma` con `Carta`, `CartaUsuario`, `MovimientoFragmento`, `ReclamoCarta`, `Usuario.incienso`; `db push` y `prisma generate`; `server.ts` con transacciones atómicas, D13, D19, compra directa e idempotencia de fiesta/cumpleaños; endpoints `/api/cartas`, `/api/cartas/[clave]`, `/api/cartas/comprar`, `/api/cartas/reclamar`, `/api/cartas/eventos`; seed `scripts/seed-cartas.ts` y 3 cartas demo). 43 tests en verde contra Supabase con datos de prueba creados y limpiados. |
| 32 | `task/lane-32-holocard` | Completada: HoloCard oficial instalado con shadcn CLI (`HoloCard.tsx`, `HoloCard.css`), componente unificado `CartaVista.tsx` (modos holo, plana y bloqueada con grados 0-4, halo glorioso y adaptación D19), endpoint `/api/cartas/[clave]/imagen` con `next/og` (63:88, caché, control de acceso por grado del usuario y admin). Verificado con `npm test`, `tsc`, `eslint` y `next build`. |
| 33 | `task/lane-33-cartas-catalogo` | Completada: Catálogo completo de 62 cartas católicas tradicionales en `src/lib/cartas/catalogo/` (20 misterios del Rosario, 9 ángeles y coros celestiales, 27 santos con fiestas litúrgicas verificadas, 6 temas centrales). Rarezas según D10 (31 Común, 17 Buena, 7 Perfecta, 7 Celestial). Eliminado `_demo.json`. Validador `scripts/validar-catalogo.ts` con Zod y `romcal` (33 con celebración litúrgica verificada, 29 sin fecha fija / móviles / misterios / coros). Placeholders provisionales sobrios WebP 630x880 (63:88) para las 62 cartas en `public/cartas/<clave>/1.webp`. Documentación `LEEME.md` y `CREDITOS.md`. Siembra exitosa de las 62 cartas en Supabase (`scripts/seed-cartas.ts`). Todos los tests (43), `tsc`, `eslint` y `next build` en verde. |
| 34 | `task/lane-34-cartas-coleccion` | Completada: Pantalla `/dashboard/cartas` con pestañas "Mi colección" (con sección "En camino" con %) y "Álbum completo" (con candado y fragmentos); filtros por categoría, rareza y grado, buscador por texto, contadores y empty state. Pantalla de detalle `/dashboard/cartas/[clave]` con `CartaVista` holo/bloqueada, 4 secciones de revelación progresiva D13 (Oración, Frase, Datasheet e Historia), barra con hitos 25/50/100% y 150/200/300%, cálculo de días a la fiesta litúrgica, aviso de incienso por excedente, navegación anterior/siguiente y 404 amable. Entrada "Cartas" en `AppSidebar.tsx`. Verificados estados 0%, 10%, 30%, 60% y 100%. `npm test` (43), `tsc`, `eslint` y `next build` en verde. |
| 35 | `task/lane-35-cartas-tienda` | Completada: Pestaña Tienda en `/dashboard/cartas` con Sobre de Meditación (40 pts) y Sobre de Revelación (160 pts), compra directa de fragmentos con selector, cantidad, moneda (puntos con tope 10/día o Incienso sin tope) y bono ×1,5 en cartas con festividad hoy (D17). Modal de apertura animado (`ModalAperturaSobre.tsx`) con `framer-motion` en 3 etapas (anticipación con temblor y resplandor según mejor rareza, revelación de carta en modo holo con fragmentos ganados y barra de progreso, confirmación con resumen) y confeti al consagrar o subir de grado; respeta prefers-reduced-motion y botón de saltar. Compra atómica por `/api/cartas/comprar` con confirmación previa y saldos sincronizados. Verificados saldos insuficientes, compras y que los puntos bajan una sola vez. Tests (43), `tsc`, `eslint` y `next build` en verde. |
| 36 | `task/lane-36-cartas-admin` | Completada: Panel de administración exclusivo para Padre/Madre (`/dashboard/cartas/admin` y botón de acceso en `/dashboard/cartas`). Control de acceso estricto (403 para otros roles en página y endpoint `/api/cartas/admin`). Listado con tabla shadcn, buscador, filtros por categoría/rareza/origen/estado y toggle de archivar/restaurar. Formulario validado con Zod (`esquemaCartaAdmin`) en cliente y servidor: slug único automático, selector de mes y día para festividad, historia, oración, frase y autor, datasheet ordenable (4 a 8 datos con subir/bajar/quitar/agregar y regla de revelación de arriba hacia abajo), 4 ranuras de imagen por grado I-IV (subida vía `/api/upload`, validación de tipo .webp/.png/.jpg, peso ≤ 300 KB y proporción retrato 63:88 con fallback a grado previo), cálculo dinámico de hitos (25, 50, 100, 150, 200, 300 %). Vista previa en vivo interactiva con `CartaVista` holo y deslizador 0-300 % que cambia imagen dinámicamente y muestra textos revelados (D13). Endpoint CRUD completo con soft delete (archivar). Aparece de inmediato en el álbum de todos en blanco y negro. 44 tests, `tsc`, `eslint` y `next build` en verde. |
| 37 | `task/lane-37-cartas-eventos` | Completada: Eventos temporales, fiestas litúrgicas del día y cumpleaños. Banner festivo (`BannerEventosCartas.tsx`) en el inicio de `/dashboard` y en `/dashboard/cartas` con reclamo interactivo del 50 % (`reclamarFiesta`) y regalo de cumpleaños (`reclamarCumpleanos`: cartas del día o Sobre de Revelación gratis con animación completa de 3 etapas y confeti). Punto de notificación dinámico en "Cartas" en la barra lateral (`AppSidebar.tsx`). Integración de 4 logros de cartas en `src/lib/logros.ts` y pestaña en `PerfilResumen.tsx`: "Primera carta", "Coleccionista de 10", "Primera Celestial" y "Primera carta Gloriosa" (Grado IV). Pruebas de integración exhaustivas (`eventos_integracion.test.ts`) cubriendo 50 %, cumpleaños, idempotencia anual, 29-feb en año bisiesto y común, cartas ya al 100 % y excedente en tope a Incienso. Cierre de proyecto: 46 tests en verde, `tsc`, `eslint` y `next build` en verde, cero términos de videojuegos (0 ataque/defensa/batalla/HP/MP) y cero dependencias de YouTube/Google. |

### Notas de uso del sistema de Cartas Católicas
1. **Sembrado del catálogo oficial (62 cartas):**
   ```bash
   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/seed-cartas.ts
   ```
   Inserta o actualiza las 62 cartas tradicionales (20 misterios del Rosario, 9 ángeles y coros celestiales, 27 santos con fiestas litúrgicas verificadas, 6 temas centrales) sin pisar las cartas que hayan sido editadas manualmente por los padres.
2. **Creación y administración de nuevas cartas:**
   Acceder a `/dashboard/cartas/admin` logueado como Padre o Madre (también disponible mediante el botón "Administrar" en `/dashboard/cartas`). Permite subir arte con recorte 63:88, ordenar datos de revelación, establecer festividades y previsualizar con el deslizador interactivo de 0 a 300 %.
3. **Calibración económica y simulación:**
   Todos los parámetros monetarios y de sorteo están centralizados en `src/lib/cartas/economia.ts`. Para verificar el ritmo de adquisición (10, 15 y 20 pts/día) se puede invocar `ejecutarSimulacionCompleta()` en `src/lib/cartas/simulacion.ts`.
4. **Respeto a los principios sagrados:**
   Vocabulario 100 % piadoso y solemne en español rioplatense. No existen estadísticas de combate ni integraciones externas de entretenimiento. Todas las revelaciones siguen D13 en el servidor, protegiendo los textos sagrados y oraciones hasta su desbloqueo devocional.
