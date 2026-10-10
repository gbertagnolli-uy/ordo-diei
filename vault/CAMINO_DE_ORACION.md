# Camino de oración — motor adaptativo de hábitos de oración

> Pedido (2026-10-09): de las features de la investigación de apps de hábitos (Streaks, Habitica, Fabulous, Habitify) y del informe sobre motores adaptativos de micro-hábitos (Loop, XState, B=MAP de Fogg, Modelo Transteórico), implementar **un sistema que se adapte a cada usuario** con un objetivo concreto: **la vida de oración**.

Rama base: `dev` · Una rama `task/lane-N-*` por feature, worktree propio, merge `--no-ff` a `dev`, sin PR a `main`.

---

## 1. Objetivo

Que cada miembro de la familia forme, a su ritmo, el hábito de las tres oraciones del día:

| Orden | Oración | Por qué ese orden | Ancla (Fogg: "después de X, haré Y") |
|---|---|---|---|
| 1 | **Completorium** (noche) | Ya se reza en familia; llevamos 4–5 días sin fallar | Antes de dormir, en familia |
| 1 | **Santo Rosario** | El más difícil: arranca junto con la noche, pero con solo **3 avemarías** | Elegida por el usuario |
| 2 | **Matutinum** (mañana) | Todos se levantan para comer: ancla natural | Antes del desayuno |

El hábito queda **completo** cuando el usuario reza el Rosario entero (5 misterios) a diario, de forma sostenida.

## 2. Qué tomamos de la investigación (y qué no)

| Idea | Fuente | Cómo se usa |
|---|---|---|
| Micro-hábitos ridículamente pequeños, escalado progresivo | Fogg / Fabulous | Escalera del Rosario (§3) |
| Fuerza del hábito con decaimiento exponencial, **nunca a cero** | Loop Habit Tracker | "Constancia" (0–100 %) y gráfico de trayectoria |
| Etapas del usuario | Modelo Transteórico / informe §3.1 | Inicio → Construcción → Consolidación → Hábito firme, y Retomando |
| Protocolo de recaída compasivo | Informe §4 | Bajar un paso sin culpa, mensaje amable, celebrar el regreso |
| Onboarding progresivo (1–2 hábitos) | Fabulous / Habitify | Se empieza con noche + 3 avemarías; la mañana se habilita sola |
| Registrar en < 3 s | Streaks | Un toque por oración |
| Feedback inmediato | Streaks / Habitica | Confeti al subir de paso |
| Responsabilidad social de "cuidado", no punitiva | Finch | Completorium marcado en familia por un padre |
| **No** se usa: HP/castigos, rankings de oración, recomendaciones colaborativas (LightFM), wearables | — | Contrarios al espíritu o sin datos suficientes |

### 2.1 Reutilizar open source antes que programar

| Pieza | Librería (licencia) | Uso |
|---|---|---|
| Máquina de etapas | **XState 5.33.2** (MIT) | `setup().createMachine` con guards; el historial se reproduce con `transition()` (función pura) |
| Fechas y zona horaria | **date-fns 4** (ya instalado) + **@date-fns/tz 1.5.0** (MIT) | "Hoy" en `APP_TZ`, recorrido día por día |
| Fuerza del hábito | Fórmula de **Loop Habit Tracker** | Reimplementada (≈ 5 líneas): su código es Kotlin/GPLv3 y no se puede importar |
| Trayectoria | **shadcn chart** sobre **Recharts 3.10.1** (MIT) | Gráfico de área de la constancia |
| Mapa de calor | **react-activity-calendar 3.2.1** (MIT) | Días rezados / justificados, estilo Habitify |
| Feedback | MagicUI Confetti (ya instalado) | Al subir de paso o al volver tras una recaída |
| Alertas y controles | shadcn `alert`, `card`, `progress`, `dropdown-menu`, `toggle-group`, `checkbox`, `tabs` | Toda la UI |
| Tests | `node:test` (Node 26, TS nativo) | Sin dependencias nuevas |

Lógica propia, solo lo que no existe en ningún proyecto: la **escalera del Rosario** y las **reglas de recaída** (§3), que van como datos y guards de la máquina de XState.

## 3. Reglas de progresión

### 3.1 Santo Rosario — escalera de 15 pasos

Por cada misterio (1 → 5): **3 avemarías → 6 avemarías → 10 avemarías meditando el misterio**.

| Paso actual | Para subir |
|---|---|
| 3 avemarías | 7 días seguidos cumplidos |
| 6 avemarías | 7 días seguidos cumplidos |
| 10 avemarías + misterio | 14 días seguidos cumplidos (2 semanas) |

Desde el segundo misterio, lo del día es: *misterios ya consolidados completos + el paso actual del nuevo*. Ej.: paso 4 = "1 misterio completo + 6 avemarías". Tras 14 días con los 5 misterios → **Rosario diario: hábito completo**.

Misterios del día según la distribución tradicional: lunes y jueves **Gozosos**, martes y viernes **Dolorosos**, miércoles, sábado y domingo **Gloriosos**.

### 3.2 Completorium y Matutinum

Un solo paso cada uno. Su avance se mide por etapas (§3.4). **Matutinum se habilita** el día siguiente a que Completorium llega a *Consolidación* (constancia ≥ 60 %). Un padre también puede habilitarlo antes.

### 3.3 Adaptación a cada usuario

- Cada usuario tiene su propio plan y su propio historial: nadie avanza al ritmo de otro.
- **Día justificado** (enfermedad, viaje, otro): no suma ni corta los días seguidos, y no baja la constancia.
- **Día no rezado**: reinicia solo la cuenta *hacia el próximo paso*. Nunca baja el nivel por sí solo ni pone la constancia en cero.
- **Recaída**: si en los últimos 7 días (sin contar justificados) hay 4 o más sin rezar → baja **un** paso (p. ej. de 10 a 6 avemarías), etapa *Retomando* y mensaje compasivo. Al rezar de nuevo se celebra el regreso. La ventana se reinicia para no bajar en cascada.

### 3.4 Constancia (Loop) y etapas

`constancia_hoy = constancia_ayer × m + (rezado ? 1 − m : 0)`, con `m = 0,5^(1/13) ≈ 0,948` (fórmula diaria de Loop). Justificado: sin cambio.

| Etapa | Condición |
|---|---|
| Retomando | Hubo recaída y todavía no hay 3 días rezados desde entonces |
| Inicio | Menos de 7 días en el camino |
| Construcción | Por defecto |
| Consolidación | Constancia ≥ 60 % (≈ 18 días seguidos) |
| Hábito firme | Constancia ≥ 80 % (≈ 30 días seguidos) |

## 4. Arquitectura

```
src/lib/oracion/
  engine.ts      catálogo, escalera, misterios, máquina XState y replay(historial) → estado
  engine.test.ts node --test (Node 26 corre TS nativo)
  server.ts      Prisma + zona horaria: getEstadoOracion(usuarioId), registrar(...)
prisma: PlanOracion (1 por usuario), RegistroOracion (usuario, oración, fecha, Hecho|Justificado, motivo, quién registró)
api:    GET/POST /api/oracion · PUT /api/oracion/registro
ui:     /dashboard/oracion (barra lateral → "Vida espiritual" → Oración)
```

El estado **no se guarda**: se recalcula desde el plan y los registros en cada lectura (`replay`). Así no hace falta cron y cualquier corrección del historial se refleja sola. "Hoy" se calcula en `APP_TZ` (por defecto `America/Montevideo`).

## 5. Lanes

- [x] **Lane 17 · `task/lane-17-motor-oracion`** — motor puro (`engine.ts`) + tests.
- [ ] **Lane 18 · `task/lane-18-datos-oracion`** — modelos Prisma, `db push`, `server.ts`, rutas API.
- [ ] **Lane 19 · `task/lane-19-ui-oracion`** — página Oración: inicio del camino, oraciones de hoy (1 toque), escalera del Rosario, trayectoria (shadcn chart), recaída compasiva (shadcn alert), confeti al subir de paso, entrada en la barra lateral.
- [ ] **Lane 20 · `task/lane-20-oracion-familia`** — vista de padres: camino de cada miembro, "Rezamos juntos" (Completorium para varios, hoy o días recientes), iniciar el camino y habilitar la mañana para un miembro.

## 6. Criterios de aceptación

1. Las reglas de §3 pasan los tests del motor.
2. Dos usuarios con historiales distintos ven pasos y etapas distintos.
3. Un día perdido nunca muestra "0" ni reinicia el nivel; solo la cuenta al próximo paso.
4. Registrar una oración: un toque. Sin duplicar elementos de UI existentes; todo con componentes prearmados.
5. `tsc` y `next build` pasan.

## 7. Registro

| Lane | Merge | Notas |
|---|---|---|
| 17 | `810c255` | `src/lib/oracion/engine.ts` (XState 5.33.2 + date-fns) y 14 tests (`npm test`). `tsconfig` excluye `*.test.ts` (importan con extensión `.ts` para Node). Rama y worktree borrados. |
