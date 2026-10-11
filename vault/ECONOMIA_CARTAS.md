# Economía de las cartas: reclamos, regalo de bienvenida y dificultad por rareza

> Pedido (2026-10-10), registrado **completo y textual** en §1. Decisiones del usuario en §2, hallazgos en §3, reglas nuevas en §4 y tabla de dificultad en §5.
> Amplía y en partes reemplaza las decisiones D2, D5 y D6 de [`CARTAS_CATOLICAS.md`](CARTAS_CATOLICAS.md). Referencia del componente en [`cartas/ref/electric-border.md`](cartas/ref/electric-border.md).

Rama: `task/lane-47-economia-reclamos` · Worktree `../ordo-diei-lanes/lane-47` · base `dev`. La implementa el orquestador (Claude).

---

## 1. Pedido del usuario (textual, nada omitido)

> trabajemos la economia de las cartas.
>
> El dia en que se celebre la ocasión de la carta, se debe regalar la carta.
>
> Pero el usuario debe ingresar y debe reclamarla, si no la reclama, no la gana.
>
> Las cartas que se pueden reclamar ya sea por el dia o porque se completaron los fragmentos, debe aparecer con este component:
>
> *(código de `ElectricBorder` de React Bits, copiado textual en [`cartas/ref/electric-border.md`](cartas/ref/electric-border.md): `color="#ffaa00" speed={0.4} chaos={0.03} thickness={2} style={{ borderRadius: 16 }}`)*
>
> Además, cada usuario debe poder reclamar 3 cartas de regalo al inicio, contando como inicio ahora. Esas 3 cartas seran comunes y aleatorias.
>
> Ayudame a definir el resto de la economia de las cartas, para evaluar la dificultad de obtener una carta segun su nivel.

## 2. Preguntas que hice y respuestas del usuario (textual)

| Pregunta | Respuesta elegida |
|---|---|
| El día de la fiesta, si el usuario YA tiene esa carta desbloqueada, ¿qué recibe al reclamar? | **+100 % (otra carta entera)** |
| La fiesta ahora regala la carta entera, y eso ya era el premio de cumpleaños. ¿Qué pasa con el cumpleaños? | **Elegir una carta**: ese día el usuario elige cualquier carta bloqueada (hasta Perfecta) y la recibe entera |
| ¿El borde eléctrico y el botón "reclamar" son solo para desbloquear, o también para cada Grado (II, III, IV)? | **También en cada grado** |
| ¿Qué tan difícil querés que sean las cartas raras fuera de su fiesta? | **Abaratar raras**: Común 2 días, Buena 7, Perfecta ~25, Celestial ~90 (a ~20 pts/día) |

## 3. Hallazgos (datos reales, 2026-10-10)

- **Catálogo:** 79 cartas activas. **57 tienen fecha de fiesta**, repartidas en 52 días del año (06-29, 05-03, 10-28 y 09-29 tienen dos).

  | Rareza | Cartas | Con fecha | Sin fecha |
  |---|---|---|---|
  | Común | 29 | 11 | 18 (15 misterios del Rosario, coros de Tronos, Dominaciones y Potestades) |
  | Buena | 33 | 31 | 2 (Serafines, Querubines) |
  | Perfecta | 7 | 7 | 0 |
  | Celestial | 10 | 8 | 2 (Sagrada Eucaristía, Sagrado Corazón: fiestas móviles) |

- ~~La base tenía 63 cartas activas~~ → sembrado el 2026-10-10 (ver §7): 79 del catálogo + 1 manual.
- **Ritmo de puntos real** (base de producción, solo lectura): en abril, el mes de uso activo, los hijos ganaron 575–900 pts (~20–30 pts/día), ~20 pts por tarea. Los padres, ~100 pts. Nadie tiene cartas desbloqueadas todavía ni Incienso.
- **Consecuencia de regalar la carta entera en su fiesta:** quien entra todos los días recibe gratis ~57 cartas por año, incluidas las 7 Perfectas y 8 de las 10 Celestiales. La rareza deja de medir la dificultad para las cartas con fecha; lo difícil pasa a ser:
  1. las **22 cartas sin fecha** (solo tienda, sobres, cumpleaños o bienvenida);
  2. una fiesta **que te perdiste** (hay que esperar un año o comprarla);
  3. los **Grados II–IV**.
- Antes de esta lane, el Sobre de Revelación devolvía en valor ~0,7 de lo que costaba comparado con comprar directo; con los precios nuevos hay que recalibrar los sobres (§4.6).

## 4. Reglas nuevas (reemplazan D2 precios, D5, D6; agregan D20–D23)

### 4.1 D20 · Reclamar para ganar (desbloqueo y cada grado)
- Los fragmentos se siguen sumando como siempre (sobres, compras, Incienso), pero **ni el desbloqueo ni los grados se aplican solos**. `CartaUsuario.gradoReclamado` (0–4) guarda el grado que el usuario ya reclamó.
- `gradoDisponible = gradoDe(fragmentos)`. Si `gradoDisponible > gradoReclamado`, la carta está **lista para reclamar**: aparece con el borde eléctrico (D23) y un botón "Reclamar".
- Al reclamar se sube `gradoReclamado` a `gradoDisponible` (si saltó varios grados, se reclaman juntos), se registra `desbloqueadaEn` la primera vez y corre la animación de apertura.
- Mientras no la reclame, la carta se ve con el grado reclamado: una carta al 100 % sin reclamar sigue en blanco y negro y sin historia (el contenido se revela como si tuviera 99 %). Los fragmentos y el porcentaje se muestran reales.
- Reclamar un grado **no vence**: los fragmentos ya son del usuario. Lo que vence es el regalo del día (D21).

### 4.2 D21 · Fiesta de la carta: se regala la carta entera (reemplaza D5)
- El día `MM-DD` de `celebracion` (en `APP_TZ`) el usuario que entra y **reclama** recibe `fragmentosRequeridos` fragmentos (+100 %), tenga o no la carta. **Si no la reclama ese día, no la gana.**
- El reclamo de fiesta es en sí el acto de reclamar: la carta queda desbloqueada (o sube de grado) en el momento. Con una carta al tope, lo que sobra se convierte en Incienso (D15).
- Año 1 → Grado I, año 2 → 200 % (Grado III), año 3 → 300 % (Grado IV), año 4 en adelante → Incienso (`requeridos × valor`).
- Una vez por `(usuario, carta, año)`, como antes. El bono ×1,5 de la tienda en el día de la fiesta (D17) se mantiene.

### 4.3 D22 · Cumpleaños: elegir una carta (reemplaza D6)
- El día del cumpleaños (29-feb → 28-feb en años no bisiestos) el usuario **elige** cualquier carta que no tenga desbloqueada, de rareza Común, Buena o Perfecta, y la recibe entera (los fragmentos que le faltan para el 100 %), ya reclamada.
- Es la única forma gratuita de conseguir una carta sin fecha que no sea Común.
- Si no le queda ninguna carta elegible, recibe un **Sobre de Revelación** gratis.
- La fiesta del día se reclama aparte (D21). Una vez por año.

### 4.4 D23 · Regalo de bienvenida
- Cada usuario (los existentes y los que se creen después) puede reclamar **una sola vez** 3 cartas **Comunes distintas al azar**, que recibe enteras y ya reclamadas. Reclamo `Bienvenida`, período `inicio`.
- Se muestra como un regalo con borde eléctrico en el banner de eventos hasta que lo reclama.

### 4.5 Borde eléctrico (React Bits `ElectricBorder`)
- Envuelve **toda carta reclamable**: fiestas del día sin reclamar, cartas con grado pendiente (colección, álbum y detalle) y el regalo de bienvenida.
- Props del pedido: `color="#ffaa00" speed={0.4} chaos={0.03} thickness={2}` y `borderRadius` igual al de la carta.

### 4.6 Precios y sobres (reemplaza D2 en precios)
Precio por fragmento en puntos según rareza (antes: valor × 4 = 4/8/16/40):

| Rareza | Pts por fragmento | Incienso por fragmento (sin cambio) |
|---|---|---|
| Común | 4 | 1 |
| Buena | 6 | 2 |
| Perfecta | 8 | 4 |
| Celestial | 12 | 10 |

- Tope de 10 fragmentos por carta y día pagando con puntos: se mantiene.
- **Sobre de Meditación:** 40 pts → **8** fragmentos (antes 5) en 1–3 cartas Común/Buena. Vale ~37 pts a precio directo.
- **Sobre de Revelación:** **100 pts** (antes 160) → **12** fragmentos (antes 8), **6** garantizados de una Perfecta o Celestial (antes 4). Vale ~83 pts a precio directo. El sobre vale un poco menos que comprar directo porque no tiene tope diario y trae sorpresa.
- El Incienso conserva su valor (1/2/4/10): sigue sin haber arbitraje entre rarezas.

## 5. Dificultad de obtener una carta según su rareza

A **20 pts/día** (un hijo activo), comprando fragmentos directos fuera de la fiesta. Entre paréntesis, a 10 pts/día.

| Rareza | Fragmentos (100 %) | Pts para desbloquear | Días | Mín. por tope diario | Pts hasta Grado IV (300 %) | Días hasta Grado IV |
|---|---|---|---|---|---|---|
| Común | 10 | 40 | **2** (4) | 1 | 120 | 6 (12) |
| Buena | 25 | 150 | **7,5** (15) | 3 | 450 | 22,5 (45) |
| Perfecta | 60 | 480 | **24** (48) | 6 | 1.440 | 72 (144) |
| Celestial | 150 | 1.800 | **90** (180) | 15 | 5.400 | 270 (540) |

Vías gratuitas por año para quien entra todos los días:

| Vía | Qué da | Por año |
|---|---|---|
| Fiesta (D21) | La carta entera, o +100 % si ya la tiene | hasta 57 cartas (11 Comunes, 31 Buenas, 7 Perfectas, 8 Celestiales) |
| Cumpleaños (D22) | Una carta bloqueada a elección (hasta Perfecta) | 1 |
| Bienvenida (D23) | 3 Comunes al azar | 3, una sola vez |

Lectura: una Celestial con fecha se consigue gratis en su fiesta, pero si se pierde el día cuesta ~3 meses de puntos; Eucaristía y Sagrado Corazón (sin fecha) solo salen comprando o en sobres. La meta a largo plazo son los grados: llevar una Celestial a Gloriosa sin fiestas lleva ~9 meses.

## 6. Cambios de código (lane 47)

- `prisma/schema.prisma`: `CartaUsuario.gradoReclamado Int @default(0)`; `TipoReclamo.Bienvenida`; `TipoMovFragmento.Bienvenida` y `Reclamo`. SQL solo aditivo (ver registro).
- `economia.ts`: `PRECIO_PUNTOS_FRAGMENTO`, sobres nuevos. `eventos.ts`: `regaloFiesta = requeridos`, rarezas elegibles de cumpleaños. `sorteo.ts`: `sortearBienvenida`. `revelado.ts`: `contenidoVisible(carta, fragmentos, gradoReclamado)` con `gradoDisponible` y `reclamable`. `simulacion.ts` al día.
- `server.ts`: un solo `otorgarFragmentos` para todas las vías; `reclamarGrado`, `reclamarBienvenida`, `reclamarCumpleanos(cartaId)`; `eventosDeHoy` con bienvenida, cumpleaños elegible y pendientes.
- `/api/cartas/reclamar`: tipos `grado`, `bienvenida`, `fiesta`, `cumple`. Ruta de imagen y arte: grado = el reclamado.
- UI: `ElectricBorder` (shadcn `@react-bits/ElectricBorder-TS-TW`) en banner, colección, álbum y detalle; selector de carta de cumpleaños; reclamo con `ModalAperturaSobre`.

## 7. Registro

| Fecha | Qué | Notas |
|---|---|---|
| 2026-10-10 | Plan y decisiones | Este documento |
| 2026-10-10 | Lane 47 implementada (`task/lane-47-economia-reclamos`) | **Base:** SQL aditivo aplicado con `prisma db execute` (enums `Bienvenida`, columna `Cartas_Usuario.Grado_Reclamado` con las desbloqueadas existentes llevadas a su grado; había 0). **Código:** todo lo de §6; `otorgarFragmentos` reemplaza 5 copias del upsert. De paso: el modal de apertura pedía el arte por `/cartas/<clave>/<grado>.webp` y el control de la lane 39 lo rechazaba (salía gris) → el servidor manda `imagenUrl` del grado visible; el modal mostraba a color cartas todavía bloqueadas → `bloqueada`; la compra directa mostraba "+undefined fragmentos" (`data.cantidad`) → `cantidadFinal`; "Ver mi colección" no reiniciaba la animación del modal. **Verificación:** `npm test` 59 + 3 saltados (los de base no se corrieron: necesitan `PERMITIR_TESTS_DB=1`; se actualizaron a las reglas nuevas), `tsc`, eslint de lo tocado y `next build` OK. E2E con `next start` en :3147 y un usuario temporal (borrado, 0 filas): bienvenida (3 Comunes distintas), cumpleaños con selector (53 elegibles → carta elegida), compra de 10 fragmentos que deja la carta al 100 % **sin** desbloquear, reclamo desde la grilla (Grado III) y desde el detalle (desbloqueo), borde eléctrico en banner, grilla y detalle (1440 y 390). **No probado en navegador:** el reclamo de fiesta (hoy, 10-10, no hay ninguna carta con fiesta; lo cubre `eventos_integracion.test.ts`). |
| 2026-10-10 | Seed del catálogo (pedido: "corré el seed del catálogo y mergeá a dev") | `npx tsx scripts/seed-cartas.ts` desde el worktree de la lane 47: 79 procesadas, 40 insertadas, 36 actualizadas, 23 desactivadas (ninguna tenía dueños), 3 omitidas por `editadaManual` (san-jose, san-pedro-apostol, sagrada-eucaristia: conservan la edición del admin). Quedan **80 activas**: las 79 del catálogo + "Maternitatis Beatæ Mariæ Virginis" (creada a mano por un admin, no se toca). El Santo Rosario ya tiene la frase de San Pío V. |
