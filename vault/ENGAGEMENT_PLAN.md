# Plan de engagement (lanes 201–204)

> Pedido del usuario (2026-10-16), registrado **completo y textual** en [`LANE_200_SANCION_Y_ENGAGEMENT.md`](LANE_200_SANCION_Y_ENGAGEMENT.md) §1 (parte 1: «mejorar el engagement con la APP, con las cartas no fue suficiente…»).
> La parte 2 de ese pedido (día con sanción) se hizo en la lane 200.

## 1. Diagnóstico (lo que dijo el usuario)

- **Estudio para padres:** falta motivación para cargar las tareas y usarlo.
- **Horario:** no le gustó a nadie, se sienten presionados y no lo usan → **nada de lo nuevo puede presionar**: sin castigos por faltar, sin cuenta regresiva, sin porcentajes de «cumplimiento».
- **Liturgia:** tampoco se usa, pero «va a llevar tiempo»: fuera de alcance.
- **Prioridad:** que los **adultos ingresen todos los días** y que los **niños** tengan más motivación. «Ya se pasó la novedad de las cartas.»
- Hoy no existe ningún registro de ingresos diarios (solo `streakDays`, que cuenta tareas completadas), ni PWA, ni push, ni mail.

## 2. Respuestas del usuario a las preguntas de diseño (textual)

| Pregunta | Respuesta |
|---|---|
| Motor para que los **adultos** entren todos los días | **«Tu parte de hoy»**: 3 mini-misiones según lo que falta (registrar el comportamiento de cada hijo —de eso depende el cofre—, cargar algo en Estudio, aprobar pendientes). Cada una suma una recompensa chica y alimenta una racha de «días en la app». Sin castigo por faltar. |
| Motivación nueva para los **niños** (se podían elegir varias) | **Meta semanal en familia** (objetivo compartido con premio familiar elegido por los padres) y **Compañero que evoluciona** (crece con los días de uso; la racha rota no lo mata, lo deja «descansando»). |
| Recompensa de los **adultos** | **Fragmentos de cartas + puntos** (la economía que ya existe). |
| Recordatorios **fuera** de la app | **Push en el celular (PWA)**. |

## 3. Lanes

| Lane | Qué | Tamaño | Depende de |
|---|---|---|---|
| **201** | Ingreso diario (`ActividadDia`), **racha de días en la app con comodín semanal** (sin castigo), hitos de racha y **«Tu parte de hoy»** para padres con premio. | M | — |
| **202** | **Meta semanal en familia**: los padres fijan objetivo + premio; avance compartido; al cumplirse todos reciben el premio. | M | 201 (ingreso) |
| **203** | **Compañero que evoluciona** de cada hijo: etapas según los días en la app; «descansando» si se corta la racha. | M | 201 |
| **204** | **PWA + push**: manifest, service worker, suscripciones y avisos (18:00 «tu cofre», resumen a los padres). Requiere claves VAPID en las variables de entorno. | M–L | 201 (datos del aviso) |

## 4. Reglas de diseño que valen para las cuatro

1. **Sin presión:** faltar un día no quita nada; la racha tiene un **comodín** (se perdona un solo día perdido por cada 7).
2. **Premiar lo útil, no solo abrir la app:** las misiones de los padres miden acciones reales (registrar comportamiento, cargar Estudio, aprobar), no el ingreso.
3. **Todo se calcula en el momento** (como el cofre y la sanción): idempotente, sin cron para lo que se puede evaluar al entrar.
4. **El día con sanción** (lane 200) sigue mandando para los niños: las recompensas que se les otorguen pasan por las mismas reglas (la mitad, sin cartas).
5. Solo componentes existentes (`Card`, `Progress`, `Item`, `Badge`, `Empty`, `Alert`…); sin duplicar información de otras pantallas.

## 5. Estado

### Lane 201 — hecha (2026-10-16)

- **Tabla nueva `Actividad_Diaria`** (`ActividadDia`: persona + día + misiones premiadas). Aplicada a la base con SQL **solo aditivo** (`CREATE TABLE`, sin `DROP`), según la regla 6 de `AGENTS.md`. Las otras lanes necesitan `git merge dev` para tener el modelo.
- **Racha de días en la app** (`src/lib/engagement/racha.ts`): cuenta días de ingreso; **un día perdido por semana se perdona** y nunca resta. `registrarIngreso` se llama desde el layout del dashboard (una lectura por visita repetida).
- **Hitos** 3 · 7 · 14 · 30 · 60 · 100 · 200 · 365 días (`hitos.ts`): dejan un premio sorpresa en «Mis premios» (puntos + XP + fragmentos de una carta al azar), una sola vez por racha. Valen para todos, niños y adultos; al abrirse pasan por las reglas de la sanción.
- **«Tu parte de hoy»** (solo padres, en el inicio): tres misiones por prioridad entre *registrar el comportamiento de cada hijo* (nombra a quién falta: de eso depende el cofre), *cargar algo en Estudio* (material, comentario o nota), *aprobar lo pendiente* y *escribirle algo a un hijo* (mensaje o muro). Cada una da **5 puntos**; las tres juntas, un premio sorpresa con un fragmento. Lo ya premiado no se deshace. Sin castigo por faltar.
- Pruebas: 14 unitarias + 2 de integración con base (`PERMITIR_TESTS_DB=1`, base local). Verificada en Chromium (teléfono y escritorio) con la base local.

Pendiente para las lanes siguientes: **202** meta semanal en familia, **203** compañero, **204** PWA + push.

### Lane 202 — hecha (2026-10-16)

- **Tabla nueva `Metas_Semanales`** (`MetaSemanal`: lunes de la semana, objetivo, premio, `cumplidaEn`). SQL **solo aditivo**, aplicado a la base.
- **Colectiva, no individual**: es distinta del «Premio familiar» que ya existía (ese lo gana cada hijo por separado según tareas requeridas). Acá el avance es la suma de **tareas aprobadas + hábitos hechos y aprobados de todos los hijos** de lunes a domingo (`logrosDeLaSemana`).
- Los padres la fijan o corrigen desde el inicio (`FijarMeta`, con un objetivo sugerido ≈ +10 % de la semana pasada). Una vez cumplida ya no se cambia.
- Al llegar al objetivo, **cada hijo recibe un vale** («Vale por …») en «Mis premios», una sola vez (reclamo atómico sobre `cumplidaEn`), evaluado al entrar, sin cron. Los padres no reciben vale.
- La ven todos en el inicio; los chicos no ven nada hasta que exista una meta. Sin castigo si no se llega.
- «Tu parte de hoy» se **compacta en una sola fila** cuando está completa, para no empujar el trabajo del día.
- `GET/POST /api/meta-semanal`. Pruebas: 4 unitarias + 1 de integración con base local.

### Lane 203 — hecha (2026-10-16)

- **Tabla nueva `Companeros`** (`Companero`: nombre elegido + última etapa festejada). SQL **solo aditivo**, aplicado a la base.
- **Evoluciona con los días de uso, no con la racha**: cada día distinto en que el niño entra (`ActividadDia`) suma. Etapas por días: **Huevito 0 · Pichón 3 · Palomita 10 · Angelito 30 · Ángel guardián 100**. Faltar no lo achica ni lo «mata».
- **Regreso sin culpa**: si el niño vuelve tras faltar, el compañero «se despertó contento» (el mensaje no cuenta los días perdidos).
- Al llegar a una etapa nueva, un aviso con «¡Genial!» (festejo con confeti) que se muestra hasta que el niño lo confirma; el nombre lo elige el niño y se estrena con él (nada que festejar antes de ponerle nombre).
- **Arte con emoji** (🥚 🐣 🕊️ 👼 😇): no hay ilustraciones propias de mascotas (solo los escudos de nivel) y el emoji ya es parte de la voz de la app. Si más adelante se encarga arte propio, solo cambia `ETAPAS[].emoji` por una imagen.
- Solo para los **hijos** en el inicio (los padres tienen «Tu parte de hoy»). `POST /api/companero` (`nombrar` | `festejar`). Pruebas: 6 unitarias + 1 de integración con base local; verificado en Chromium (teléfono).
- Sin economía: el compañero no da puntos ni cartas, para no inflar lo que ya se gana con las tareas.

### Lane 204 — hecha (2026-10-16): PWA + avisos push

- **App instalable**: `src/app/manifest.ts` (`/manifest.webmanifest`), íconos en `public/icons/` (generados con `scripts/generar-iconos.mjs`: «OD» crema sobre marrón; uno `maskable`), `apple-touch-icon` y `theme-color` en el layout raíz.
- **Service worker** `public/sw.js`: solo recibe y muestra avisos y abre la app al tocarlos. **No guarda nada en caché** a propósito (nunca queda una versión vieja). Lo registra `RegistrarServiceWorker` en el layout del dashboard.
- **Tabla nueva `Suscripciones_Push`** (un dispositivo por fila; `ultimoAvisoEn`). SQL **solo aditivo**, aplicado a la base. La tablet compartida puede pasar de una persona a otra: la suscripción cambia de dueño.
- **Librería**: `web-push` (npm) para firmar y enviar; las claves son **VAPID**.
- **Avisos** (siempre **máximo uno por dispositivo por día**; los de prueba no cuentan):
  1. **Al chico, «¡Te ganaste el cofre del día!»**: apenas un padre registra su buen comportamiento después de las 18:00 (`registrarComportamiento` entrega el cofre en el momento y avisa), y a las 18:00 por el cron para los que ya estaban registrados.
  2. **A los padres, «Falta registrar el día de …»**: a las 18:00, nombrando a quién falta (de eso depende el cofre de cada uno).
- **Cofre al instante**: antes el cofre solo se entregaba cuando el chico entraba a la app; ahora también se entrega al registrar el comportamiento si ya son las 18:00.
- **UI**: `AvisosPush` en dos formas: una franja «Activá los avisos en este dispositivo» en el inicio (hasta que se active o se descarte con «Ahora no», que se recuerda en el navegador) y una tarjeta con interruptor y botón «Probar» en *Mi perfil*. En iPhone avisa que primero hay que agregar la app a la pantalla de inicio.
- **Cron nuevo** `/api/cron/avisos` a las `0 21 * * *` UTC = 18:00 de la familia (`vercel.json`; con el de `daily` son 2 crons diarios). **Exige `CRON_SECRET`** (`Authorization: Bearer`), porque la ruta manda avisos y no puede ser pública.

#### Lo que hay que configurar en Vercel (no está en el repo)

Variables de entorno del proyecto (los **mismos valores** que quedaron en el `.env` local, que no se versiona):
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (un `mailto:` o `https:` de contacto; hoy `mailto:avisos@example.com`, conviene poner uno real) y `CRON_SECRET`. Sin las claves la app funciona igual: la invitación a activar los avisos no aparece y el cron no envía nada. La clave pública se inyecta al compilar: hay que volver a desplegar después de cargarla.

#### Qué se verificó y qué no

- Verificado: manifest, íconos y `sw.js` (200, tipos correctos), el service worker se instala y activa en Chromium, la tarjeta de *Mi perfil* y la invitación del inicio se ven bien, el cron responde 401 sin secreto, y el envío completo (guardar dispositivo → un aviso por día → borrar suscripciones caducadas 404/410 → cambio de dueño) con un enviador falso en la prueba de integración.
- **No se pudo verificar la suscripción real**: el Chromium sin interfaz de este entorno no puede registrarse en el servicio de push de Google (`Registration failed - permission denied`), y por eso nunca se mandó un aviso real. Falta probarlo en un celular o en Chrome de escritorio: activar el interruptor en *Mi perfil* y tocar «Probar».
- Pruebas: 5 unitarias + 1 de integración con base local.

### Lane 206 — «Tu parte de hoy» y meta semanal al panel de administración (2026-10-16)

**Pedido (textual):** «para los padres, el cofre debe estar disponible como premio por haber completado las 3 tareas principales que tienen que hacer. Las notificaciones de los objetivos diarios, "Meta de la semana — Un objetivo entre todos los chicos con un premio para cada uno. A los chicos les encanta tener algo por lo que sumar juntos." y los otros que agregamos deben aparecer en panel de administración, no en historial.»

- «Tu parte de hoy» y «Meta de la semana» salen del inicio de los padres y viven arriba del panel de administración (`/dashboard/admin`).
- El premio de completar las tres misiones es un **cofre** («Cofre de tu parte de hoy») con 3D de cofre y botón «Abrir cofre» en «Mis premios». No espera a las 18:00 (el cofre diario de los chicos sí).
- Los chicos conservan su meta y su compañero, pero solo en la vista principal del inicio, no en Historial ni en las demás secciones.

### Lane 207 — cofre de los padres en «Mis premios» (2026-10-16)

**Pedido (textual):** «A mi no se me desbloquea el cofre (soy administrador) y el mensaje que aparece no corresponde "Hoy todavía no llegó: tus papás aún no registraron tu comportamiento. Si lo hacen, aparece acá."»

- Causa 1: «Mis premios» mostraba a los padres el «Cofre del día» de los chicos (con su mensaje). Ahora los padres ven una tarjeta «Cofre de tu parte de hoy» que explica cómo se desbloquea (las 3 misiones) y enlaza al panel.
- Causa 2: desde la lane 206 las misiones solo se evaluaban al abrir el panel de administración. Ahora se evalúan en el layout del dashboard para los padres, así el cofre llega donde estén.
