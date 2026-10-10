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

---

## 3. Decisiones de diseño (defaults míos; el usuario puede cambiarlas)

**D1 · Rarezas y pesos del sorteo** (constantes en `src/lib/cartas/economia.ts`, una sola fuente):

| Rareza | Peso de banda | Fragmentos para desbloquear | Precio por fragmento suelto | Halo/Preset HoloCard |
|---|---|---|---|---|
| Común | 60 | 10 | 4 pts | sin holo (imagen plana) |
| Buena | 28 | 25 | 8 pts | `glitter`, intensidad baja |
| Perfecta | 10 | 60 | 16 pts | `gold` |
| Celestial | 2 | 150 | 40 pts | `cosmos` (o `swirl`) |

Los números son un punto de partida: la lane 30 incluye una **simulación** (días para la primera Común, para una Celestial, según los ~10–20 puntos/día que hoy da la app) para ajustar con datos.

**D2 · Tienda** (gasta `availablePoints`, nunca dinero real; sin cajas con pago real ni presión de compra, porque la usan chicos):
- **Sobre de fragmentos** (aleatorio): 40 pts → 5 fragmentos repartidos en 1–3 cartas, rareza por sorteo en dos etapas.
- **Sobre devoto** (mejor): 120 pts → garantiza al menos una Buena o superior.
- **Fragmentos de una carta elegida**: precio por fragmento de D1, máx. 10 por carta por día (para que elegir no reemplace al azar).
- Gasto atómico en transacción: descuenta puntos, suma fragmentos, registra movimiento. El servidor resuelve el resultado **antes** de la animación; la animación es solo presentación.

**D3 · Sin duplicados frustrantes:** un sobre solo sortea cartas **aún no desbloqueadas**. Si una banda se agotó, el sorteo renormaliza entre las bandas con cartas pendientes. Si el usuario tiene todo, el sobre no se vende ("Colección completa").

**D4 · Fragmentos y desbloqueo:** `fragmentos ≥ requeridos` ⇒ desbloquea (una sola vez, con registro `desbloqueadaEn`). Lo que sobra al desbloquear se descarta (el servidor nunca otorga más de lo que falta).

**D5 · Fiesta de la carta (50 %):** el día `MM-DD` de `celebracion` (en `APP_TZ`), todo usuario que entra ve el aviso y puede **reclamar**. Regalo = `ceil(requeridos × 0,5)` limitado a lo que falta. Una vez por `(usuario, carta, año)`. Si ya la tiene desbloqueada, el aviso lo dice y no hay reclamo. Varias cartas el mismo día ⇒ un reclamo por carta.

**D6 · Cumpleaños:** el día de `fechaNacimiento` (29-feb → 28-feb en años no bisiestos), el usuario reclama **todos los fragmentos que le faltan** de cada carta cuya `celebracion` sea ese día ⇒ se desbloquean. Una vez por `(usuario, año)` por carta. **Si ese día no hay ninguna carta** (o ya las tiene todas): regalo alternativo = un sobre devoto gratis. Regla de fallback propuesta; confirmar con el usuario.

**D7 · Contenido de cartas bloqueadas:** la imagen va en blanco y negro (`grayscale`) con candado y la barra de fragmentos. El texto (historia, oración, frase) **se muestra igual**: es una app devocional familiar y no conviene esconder oraciones tras puntos. Una constante `OCULTAR_TEXTO_BLOQUEADA` (por defecto `false`) permite difuminarlo si el usuario lo prefiere.

**D8 · Rendimiento de HoloCard:** `HoloCard` solo en (a) la pantalla de detalle, (b) el modal de apertura y (c) la vista previa del admin. Las **grillas** (colección y álbum) usan la imagen plana de la carta con un tilt CSS liviano. Si no hay WebGL2, HoloCard ya cae a la imagen.

**D9 · Imagen de la carta:** `GET /api/cartas/[clave]/imagen` (o ruta de imagen de Next) compone con `next/og` el arte (dominio público, p. ej. Wikimedia Commons), el marco de la rareza y el nombre; se cachea. HoloCard recibe esa URL (mismo origen ⇒ sin problemas de CORS) y `frame` coincide con el ancho del marco. Las **fuentes y licencias del arte** se registran en `src/lib/cartas/catalogo/CREDITOS.md`.

**D10 · Catálogo inicial** (lane 33): ~60 cartas en JSON validado con zod, estimado:
- 20 misterios (gozosos, luminosos, dolorosos, gloriosos), sin fecha.
- 9 ángeles/arcángeles (Miguel, Gabriel, Rafael, Ángel de la Guarda, coros…).
- ~25 santos y beatos de gran devoción (María, José, Juan Bautista, Francisco, Teresita, Juan Pablo II, Pío de Pietrelcina, Don Bosco, Carlos Acutis, Nicolás de Bari…) con **fecha litúrgica verificada con romcal**.
- ~6 temas/personas (Eucaristía, Sagrado Corazón, Papas, Concilios…).
Rarezas asignadas por criterio fijo (p. ej. Celestial: María, José, los tres arcángeles, Cristo en la Eucaristía). Las fechas y datos de cada carta deben ser verificables; ante duda, `celebracion` queda `null`.

**D11 · Permisos:** ver el catálogo, comprar y reclamar: cualquier usuario sobre **su** colección. Crear/editar cartas: **Padre o Madre** (mismo criterio que `/dashboard/admin`). El seed del catálogo no pisa cartas editadas a mano (`origen: SISTEMA | MANUAL`, `editadaManual`).

**D12 · Perfil/logros:** al final (lane 37) se agrega un logro simple ("Primera carta", "Coleccionista de 10", "Primera Celestial") reutilizando `logros.ts`; el catálogo de cartas no toca la XP.

---

## 4. Modelo de datos (lo hace solo la lane 31)

```prisma
enum RarezaCarta   { Comun Buena Perfecta Celestial }
enum CategoriaCarta { Santo Angel Misterio Tema Persona }
enum OrigenCarta   { Sistema Manual }
enum TipoMovFragmento { Sobre Compra Fiesta Cumpleanos Ajuste }
enum TipoReclamo   { Fiesta Cumpleanos }

model Carta {                 // @@map("Cartas")
  id Int @id @default(autoincrement())
  clave String @unique        // slug estable: "san-francisco-de-asis"
  nombre, subtitulo?, categoria CategoriaCarta, rareza RarezaCarta
  celebracion String?         // "MM-DD" (null = sin fecha fija)
  anioNacimiento Int?, anioMuerte Int?
  virtud String, historia String @db.Text, oracion String @db.Text, frase String, fraseAutor String?
  datos Json?                 // datasheet extra: patronazgo, lugar, símbolo, etc.
  imagenUrl String, creditoImagen String?
  fragmentosRequeridos Int    // por defecto el de la rareza (D1), editable
  origen OrigenCarta @default(Sistema), editadaManual Boolean @default(false)
  activa Boolean @default(true), creadorId Int?, createdAt, updatedAt
}
model CartaUsuario {          // @@map("Cartas_Usuario") — progreso
  id, usuarioId, cartaId, fragmentos Int @default(0), desbloqueadaEn DateTime?, createdAt, updatedAt
  @@unique([usuarioId, cartaId])
}
model MovimientoFragmento {   // @@map("Movimientos_Fragmento") — libro mayor, auditoría
  id, usuarioId, cartaId, tipo TipoMovFragmento, cantidad Int, puntosGastados Int @default(0), detalle String?, createdAt
}
model ReclamoCarta {          // @@map("Reclamos_Carta") — idempotencia de eventos
  id, usuarioId, cartaId Int?, tipo TipoReclamo, periodo String /* "2026" o "2026-10-10" */, createdAt
  @@unique([usuarioId, tipo, cartaId, periodo])   // ojo: con cartaId nulo usar un valor centinela 0 (Postgres trata NULL como distinto)
}
```
Todo aditivo (`db push` sin `--accept-data-loss`). Tras `prisma generate`, **reiniciar `next dev`** (ver nota del vault de hábitos).

---

## 5. Contrato del catálogo JSON (lanes 31 y 33)

`src/lib/cartas/catalogo/<categoria>.json`, arreglo de objetos con exactamente los campos de `Carta` salvo ids/fechas: `clave, nombre, subtitulo?, categoria, rareza, celebracion|null, anioNacimiento|null, anioMuerte|null, virtud, historia, oracion, frase, fraseAutor?, datos?, imagen (archivo en public/cartas/<clave>.webp), creditoImagen`. El esquema zod vive en `src/lib/cartas/esquema.ts` (lane 30) y lo usan el seed (31), el admin (36) y la validación del catálogo (33).

---

## 6. Lanes

Las lanes forman una **cadena**: cada una, al empezar, hace `git merge <rama anterior>` (rama local, mismo repo). Así agy las hace de corrido y yo las integro después en orden con `--no-ff` a `dev`. Las lanes 32 y 33 no dependen del motor y pueden ir en cualquier punto de la cadena, pero se dejan en este orden por simplicidad.

| Lane | Rama | Depende de | Qué entrega |
|---|---|---|---|
| 30 | `task/lane-30-cartas-motor` | `dev` | Motor puro y tests: economía (D1/D2), sorteo en dos etapas sin repetidas, desbloqueo, reglas de fiesta (D5) y cumpleaños (D6), fechas en `APP_TZ`, esquema zod, simulación de economía |
| 31 | `task/lane-31-cartas-datos` | 30 | Prisma (§4), seed idempotente desde JSON, servicio `server.ts` y API: listar/detalle, comprar, reclamar fiesta/cumple, estado de eventos de hoy. Transacciones e idempotencia |
| 32 | `task/lane-32-holocard` | 31 | Instalar HoloCard (React Bits) + `CartaVista` (HoloCard por rareza, versión plana para grillas, bloqueada en B/N) + `/api/cartas/[clave]/imagen` con `next/og` |
| 33 | `task/lane-33-cartas-catalogo` | 32 | Catálogo inicial (~60 cartas, D10), arte de dominio público, `CREDITOS.md`, script de validación con zod y romcal |
| 34 | `task/lane-34-cartas-coleccion` | 33 | `/dashboard/cartas` con pestañas **Mi colección** y **Álbum** (B/N), filtros por categoría y rareza, pantalla de cada carta `/dashboard/cartas/[clave]` (historia, oración, frase, datasheet, fragmentos), entrada en la barra lateral |
| 35 | `task/lane-35-cartas-tienda` | 34 | Tienda de puntos (D2) y animación de apertura/desbloqueo (framer-motion + confeti), accesible, respeta `prefers-reduced-motion` |
| 36 | `task/lane-36-cartas-admin` | 35 | Panel para crear/editar cartas (solo Padre/Madre), formulario zod con vista previa HoloCard en vivo, subida de imagen |
| 37 | `task/lane-37-cartas-eventos` | 36 | Aviso y reclamo de fiesta del día y cumpleaños (D5/D6) con animación, logros de cartas (D12), documentación final |

Worktrees en `../ordo-diei-lanes/lane-NN` (copia reflink de `node_modules`; Turbopack no acepta un `node_modules` simbólico). Cada uno tiene `AGY_PROMPT.md` (fuera de git) copiado de [`cartas/lane-NN-*.md`](cartas/), que **sí** está en git.

### Reglas para todas las lanes
- Leer `AGENTS.md`: Next 16 tiene cambios. Consultar `node_modules/next/dist/docs/` antes de usar una API de Next.
- **UI solo con componentes prearmados** (shadcn `radix-nova`, React Bits, MagicUI, Aceternity), sin duplicar elementos ni cambiar comportamiento ajeno a la lane. Si el CLI de shadcn agrega imports desde `"cn"`, corregirlos a `@/lib/utils` y desinstalar el paquete `cn`.
- **Reutilizar open source** antes que programar (§2.3). Sin copiar código del repo de referencia (sin licencia de reuso).
- Base de datos: Supabase, schema `family_tasker`; solo la lane 31 toca `schema.prisma`, con `npx prisma db push` aditivo. Reiniciar `next dev` tras `generate`.
- Textos en español rioplatense. Sin YouTube, Google, batallas ni ataque/defensa.
- Verificación: `npm test`, `npx tsc --noEmit`, `npx eslint` sobre lo tocado, `npx next build` y prueba en el navegador con capturas (escritorio 1440, móvil 390, modo oscuro). Datos de prueba borrados al terminar.
- Commits en la rama de la lane y una fila en el §8. **Sin merge a `dev` ni PR**: eso lo hace el orquestador.

## 7. Criterios de aceptación globales
1. Compila (`tsc`, `next build`) y los tests pasan.
2. Ninguna referencia a YouTube, Google, batallas, ataque o defensa.
3. El álbum muestra en blanco y negro lo no desbloqueado.
4. Una carta se desbloquea solo cuando `fragmentos ≥ requeridos`, y la animación corre una sola vez (el resultado ya está guardado en el servidor).
5. El 50 % de fiesta y el regalo de cumpleaños se reclaman una sola vez por período, con tests (incluye 29-feb, varias cartas el mismo día y carta ya desbloqueada).
6. Una carta creada en el admin aparece de inmediato en el álbum.
7. Los puntos nunca quedan negativos ni se gastan dos veces (doble clic, dos pestañas).

## 8. Registro

| Lane | Merge | Notas |
|---|---|---|
| 30–37 | — | Planificadas el 2026-10-10; pendientes de implementar por agy |

### Preguntas abiertas para el usuario
1. **D6 (cumpleaños sin carta ese día):** ¿sobre devoto gratis como regalo alternativo? (propuesto)
2. **D7:** ¿texto de cartas bloqueadas siempre visible (propuesto) o difuminado?
3. **D1/D2:** ¿conformes con precios y fragmentos iniciales? Se ajustan con la simulación de la lane 30.
4. ¿Contenido del catálogo (lane 33) puede asignar rarezas con el criterio de D10, o querés revisarlas antes del merge?
