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
