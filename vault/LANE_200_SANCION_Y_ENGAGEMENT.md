# Lane 200 — Día con sanción (y plan de engagement)

Rama `task/lane-200-sancion-y-engagement` · worktree `../ordo-diei-lanes/lane-200` · base `dev`. Pedido del usuario (2026-10-16).

## 1. Pedido (textual, nada omitido)

> Quiero hacer dos cosas, mejorar el engagement con la APP, con las cartas no fue suficiente.
>
> La parte de estudio para los padres necesita motivación de cargar las tareas y usarla.
> La parte de horario no le gustó a nadie, se sienten presionados y no la usan.
>
> La parte de liturgia tampoco la usan, pero bueno, va a llevar tiempo.
>
> Lo principal ahora es motivar el uso de la app y que ingresen todos los días los adultos. y que los niños tengan más motivación por usarla también. Ya se pasó la novedad de las cartas.
>
> La segunda cosa es que si un niño un dia tiene un comportamiento que necesitó de una sanción, pierda todos los beneficios de ese día, que no gane carta si es el día de una carta, que no gane cofre sorpresa y que de todo lo que haga, valga la mitad en puntos, XP y cualquier moneda. Además de eso que tenga inhabilitada la tienda y las cartas con un mensaje de que están deshabilitadas por 1 día por mal comportamiento. En el cofre lo mismo, hoy te perdiste el cofre por mal comportamiento, volvé mañana.

## 2. Parte 2 — Día con sanción (hecha en esta lane)

### 2.1 Decisiones (las tomé yo; el usuario puede corregirlas)

| Tema | Decisión |
|---|---|
| ¿Qué es una «sanción»? | Cualquier **comportamiento Negativo** registrado por un padre en la bitácora (con o sin penitencia o puntos). |
| ¿Cuánto dura? | El **día de la familia** (`APP_TZ`, de 00:00 a 00:00) en que se registró. Se evalúa al momento, sin guardar nada: si un padre **elimina** el registro, todo vuelve al instante. |
| «Vale la mitad» | `Math.floor(n / 2)`: hacia abajo. Puntos, XP, estrellas e incienso. Un 1 pasa a 0. |
| Momento que cuenta | El del **hecho del niño**, no el de la aprobación: tarea → cuando la completa; hábito pendiente de aprobación → cuando lo marcó (`createdAt`); premio sorpresa → cuando lo abre. Lo ganado *antes* de la sanción no se toca (no hay clawback). |
| Cofre | Con sanción **no llega** (`otorgarCofreDelDia` devuelve false, aunque haya más positivos que negativos) y el cofre de hoy **sin abrir se retira** al registrar la sanción. Un cofre de días anteriores no se pierde: no se puede abrir hoy y queda para mañana. Mensaje: «Hoy te perdiste el cofre por mal comportamiento. Volvé mañana.» |
| Cartas | Deshabilitadas **todas**: fiesta, cumpleaños, bienvenida, grados, sobres y fragmentos (el servidor rechaza con el mensaje). `/dashboard/cartas` y el detalle muestran el aviso en lugar del contenido; `eventosDeHoy` devuelve `bloqueado: true` y sin pendientes (sin borde eléctrico ni banner). |
| Tienda | Deshabilitada: `comprarProducto` rechaza y `/dashboard/tienda` muestra el aviso. |
| Premios de los padres con cartas | No se abren ese día (se avisa «abrilo mañana»): no se pierden, se postergan. Los demás premios sorpresa se abren con puntos/XP/incienso a la mitad y se guarda en el premio lo realmente acreditado. |
| «Mis premios» | Aviso «Hoy tenés una sanción…», sin banner de cartas y el cofre en «Perdido por hoy». |

### 2.2 Dónde está

- `src/lib/comportamiento/sancion.ts` (puro: `mitad`, textos, `premioConSancion`) y `sancionServer.ts` (`haySancion`, `exigirSinSancion`, `retirarCofreDeHoy`, `origenCofreDelDia`).
- Tareas: `api/tasks/[id]/complete` (puntos y estrellas a la mitad al completar). Hábitos: `calcularRecompensa(..., conSancion)` en `registrar` y en `aprobarRegistro`.
- Cartas: `exigirSinSancion` al inicio de `comprarSobre`, `comprarFragmentosDirectos`, `reclamarFiesta`, `reclamarCumpleanos`, `reclamarBienvenida`, `reclamarGrado`. Tienda: `comprarProducto`.
- UI (solo componentes ya existentes `Empty`/`Alert`): `components/comportamiento/BloqueoPorSancion.tsx`, `CofreDelDia` (prop `sancionado`), `mis-premios`.

### 2.3 Pruebas

- Unitarias: `sancion.test.ts`, caso nuevo en `habitos/engine.test.ts`.
- Integración con base (`PERMITIR_TESTS_DB=1`, **solo base local**): `sancion_integracion.test.ts` recorre registrar sanción → cofre retirado y no otorgado → apertura bloqueada/a la mitad → cartas y tienda rechazadas → eliminar la sanción.
- Para correrla: levantar el PostgreSQL local de la lane 198 (`dev/_verif/pgdata`, puerto 55432) y apuntar `DATABASE_URL`/`DIRECT_URL` ahí.

### 2.4 Límites conocidos

- Los puntos de los **cofres y premios** que el niño ya tenía sin abrir no se descuentan retroactivamente: solo cambia lo que se abre durante la sanción.
- Un padre que se registra una sanción a sí mismo también queda alcanzado (la regla no mira el rol).
- No hay migración de base de datos.

## 3. Parte 1 — Engagement (pendiente de diseño)

Ver el plan y las preguntas abiertas en la sección siguiente cuando se defina (lane 201).
