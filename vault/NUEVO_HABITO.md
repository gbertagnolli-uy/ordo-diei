# Nuevo hábito en 2 pasos + auditoría del motor de micro-hábitos

> Pedido (2026-10-10): revisar si el Camino de oración cumple **todas** las especificaciones del informe "Motores Open Source para Formación Adaptativa de Micro-Hábitos", y diseñar una pantalla **muy práctica, de solo 2 pasos**, para crear un hábito nuevo, definiendo **dónde se muestran** los hábitos a practicar.

Estado: **diseño**. La auditoría (§1) sigue vigente; el plan de lanes (§3) quedó **reemplazado** por [HABITOS_Y_NIVELES.md](HABITOS_Y_NIVELES.md) (2026-10-10).

---

## 1. Auditoría contra el informe

Revisado contra el código (`src/lib/oracion/*`, `src/components/oracion/*`, `prisma/schema.prisma`).

### 1.1 Lo que está implementado

| Spec del informe | Dónde | Nota |
|---|---|---|
| Etapas con máquina de estados (§1.3, §3.1) | `engine.ts` · `crearMaquina` (XState 5) | Inicio → Construcción → Consolidación → Hábito firme, y Retomando. Sintaxis v5 (`guard`); el informe usa la v4 (`cond`). |
| Score de Loop con decaimiento, nunca a cero (§1.2, §3.3) | `siguienteConstancia` | Fórmula real de Loop (`m = 0,5^(1/13) ≈ 0,948`); la del informe (0,95) es una simplificación. |
| Umbrales 0,6 y 0,8 (§3.1) | `UMBRAL` | Con histéresis para bajar (0,5 y 0,7). |
| Escalado progresivo / micro-pasos (§2, §3.2) | `ESCALERAS.rosario` (15 pasos) | Solo para el Rosario, con las reglas pedidas por el usuario (7/7/14 días). |
| Recaída: no castigar (§4.1) | Recaída baja un paso, constancia nunca a 0 | Sin HP, sin rachas a cero. |
| Recaída: re-escalar hacia abajo (§4.3) | `aplicarDia` | Baja **1** paso; el informe sugiere 2 (`reduceMicroStepByTwo`). Se eligió 1 porque cada paso del Rosario ya es chico (3 avemarías). |
| Recaída: mensaje compasivo y celebrar el retorno (§4.5) | Alert "retomamos con calma" + evento `regreso` con confeti | Se celebra el primer día rezado, no la simple apertura de la app. |
| Ancla "después de X, haré Y" (§3.1 Construcción) | `HABITOS[].ancla` en la tarjeta | Fija por oración; el usuario no la puede elegir. |
| Detección automática de etapa (§2) | `reproducir` | Recalculada desde el historial en cada lectura. |

### 1.2 Lo que falta o quedó parcial

| # | Spec del informe | Estado | Impacto | Propuesta |
|---|---|---|---|---|
| G1 | **Recordatorios adaptativos con fading** (`promptsPerDay` 3→2→1→0, §3.1; `increasePromptsToTwo` en recaída, §4; OneSignal/Novu, §3.4) | ❌ No hay ninguna notificación | Alto: es la "P" de B=MAP; sin recordatorio el hábito depende de la memoria | Lane 23: Web Push con `web-push` (MIT) + service worker; cantidad según etapa |
| G2 | **Descomposición de hábitos en micro-pasos** (§3.2, "el core") | ⚠️ Solo el Rosario, escrito a mano | Alto: no se puede crear otro hábito | Lanes 21–22: plantillas con escalera + pantalla de 2 pasos (§2) |
| G3 | **Re-anclar** en la recaída (§4.4) | ⚠️ La alerta no recuerda el ancla | Bajo | Agregar "Recordá: {ancla}" a la alerta (lane 22) |
| G4 | **Diagnosticar** la recaída (§4.2: enfermedad, viaje, estrés, motivación) | ⚠️ Solo "No pude" con motivo antes del día; al recaer no se pregunta nada y el motivo no se usa | Medio | Al entrar en *Retomando*, una pregunta de un toque; "estrés/motivación" baja el paso, "enfermedad/viaje" marca los días como justificados retroactivamente (lane 24) |
| G5 | **Riesgo de recaída temprano** (`detect_relapse_risk`: score < 0,3 o caída > 0,15 en 7 días, §3.3) | ❌ Solo se detecta la recaída consumada (4 faltas en 7) | Medio: se puede acompañar antes de caer | Señal `enRiesgo` en `EstadoHabito` + aviso suave en la tarjeta (lane 24) |
| G6 | **Facilidad auto-reportada** para subir (`ease > 7`, §3.2) | ❌ Se sube solo por días seguidos | Medio: hoy alguien puede subir aunque le cueste | Al subir de paso, "¿Te resultó fácil?" (Sí / Todavía no). "Todavía no" mantiene el paso 7 días más (lane 24) |
| G7 | **Identidad** "soy alguien que…" en Consolidación (§3.1) | ❌ | Bajo | Frase de identidad en la tarjeta al llegar a Consolidación/Firme (lane 22) |
| G8 | Exploración = 3 días con ≥ 80 % (§3.1) | ⚠️ "Inicio" son 7 días por calendario | Bajo | Se mantiene: con 3 avemarías no hace falta probar el tamaño |
| G9 | Consolidación exige además 14 días con ≥ 70 % / Automatismo 30 días en etapa | ⚠️ Solo umbral de constancia | Bajo | Equivalente en la práctica: 0,6 ≈ 18 días y 0,8 ≈ 30 días seguidos |
| G10 | Gamificación tipo Habitica (§1.1) | Excluido a propósito | — | La app ya tiene puntos para tareas; la oración no se premia con puntos (vault de oración §2) |
| G11 | Open mHealth, LightFM/Surprise, PostHog (§1.4, §1.5, §3.4) | Excluido | — | Sin wearables; 8 usuarios no alcanzan para filtrado colaborativo; analítica de producto no pedida |

**Conclusión:** el núcleo (etapas, score, escalera, recaída compasiva) está implementado y probado. Lo que el informe llama "el componente que no existe" quedó resuelto solo para el Rosario. Faltan los **recordatorios** (G1), que son el hueco más grande, y tres ajustes de adaptación (G4–G6) que hacen que el sistema escuche al usuario además de contar días.

---

## 2. Pantalla "Nuevo hábito" (2 pasos)

### 2.1 Qué dice la investigación

| Fuente | Aprendizaje | Cómo se aplica |
|---|---|---|
| Tiny Habits (Fogg) | La receta es **ancla + conducta mínima + celebración**: "Después de ___, voy a ___". Una receta no escrita se olvida | El paso 2 es literalmente esa frase, y queda visible en la tarjeta |
| Tiny Habits | La gente arranca demasiado grande | La plantilla propone la versión mínima; el usuario no escribe la meta en el paso 1 |
| Streaks | Lista de hábitos predefinidos + título propio con ícono; frecuencia; recordatorio opcional | Paso 1 = elegir de plantillas o escribir |
| Streaks | Pantalla principal limitada (6 hábitos) para no sobrecargarse | Límite suave: avisar si ya hay 2 hábitos en *Inicio* |
| Habitify | Saltear días sin penalizar ("Skip", "Off Mode") | Días no programados = justificados (no cuentan) |
| Guías de onboarding | Flujo corto, presets contra la hoja en blanco, hora del recordatorio con selector | Todo cabe en 2 pantallas; el recordatorio es un campo opcional |

### 2.2 Los dos pasos

```
┌─ Nuevo hábito ─────────────── 1 de 2 ─┐   ┌─ Nuevo hábito ─────────────── 2 de 2 ─┐
│ ¿Qué querés empezar?                  │   │ Después de…                           │
│                                       │   │ (Al despertar)(Antes del desayuno)    │
│ ORACIÓN                               │   │ (Al volver del colegio)(Antes de      │
│ [Ángelus] [Examen de conciencia]      │   │  cenar)(Después del Completorium)     │
│ [Bendecir la mesa] [Evangelio del día]│   │ [ otro momento…            ]          │
│ [Ofrecimiento de obras]               │   │                                       │
│ ORDEN Y ESTUDIO                       │   │ …voy a                                │
│ [Hacer la cama] [Leer] [Ordenar]      │   │ [ leer 1 versículo         ]  ← mínimo│
│                                       │   │   Meta: el Evangelio completo (14 d)  │
│ [ ✎ Escribir otro hábito…        ]    │   │                                       │
│                                       │   │ Días  (Todos)(Lun–Vie)(Elegir)        │
│ Para: (Yo)(Juan)(María)…  ← padres   │   │ Recordarme  [ 07:15 ]  (opcional)     │
│                                       │   │                                       │
│                       [ Siguiente → ] │   │ [← Atrás]            [ Empezar hoy ]  │
└───────────────────────────────────────┘   └───────────────────────────────────────┘
```

**Paso 1 — ¿Qué?** Un toque en una plantilla avanza solo al paso 2 (nada más que decidir). "Escribir otro hábito…" abre un `Input` y el botón Siguiente. Los padres ven además "Para:" con los miembros (por defecto, ellos mismos); los hijos crean solo para sí.

**Paso 2 — ¿Cuándo y cuánto?** La receta de Fogg, ya completada por la plantilla y editable:
- **Ancla**: chips con los momentos del día de la familia (`ToggleGroup`) o texto libre. El ancla define en qué franja aparece el hábito (§2.4).
- **Versión mínima**: precargada por la plantilla. Debajo, en texto chico, la meta y cuánto falta para escalar, para que se vea que crece solo.
- **Días**: Todos / Lun–Vie / Elegir (7 toggles). Los días no elegidos no cuentan como falta.
- **Recordatorio**: hora opcional; solo aparece cuando exista la lane 23.
- **Empezar hoy** crea el hábito, cierra y muestra la tarjeta nueva con un brillo breve. La celebración de Fogg es el confeti existente al marcarlo por primera vez.

Sin pasos extra de confirmación ni de configuración de escalera: eso lo resuelven la plantilla y el motor.

### 2.3 Escaleras (resuelve G2)

- **Plantillas** (`catalogo.ts`, datos puros): cada una trae nombre, ancla sugerida, días y una escalera de 2–4 pasos con `diasParaSubir`, igual que el Rosario. Ej.: *Evangelio del día*: 1 versículo (7 d) → el párrafo (7 d) → el Evangelio completo.
- **Hábito escrito por el usuario**: escalera de un solo paso (como el Completorium). Se mide por etapas y constancia, sin subir de paso.
- El motor ya es genérico (`crearMaquina(pasos)`); hay que pasar de `MAQUINAS[habito]` fijo a una máquina por escalera, y tratar los días no programados como `justificado`.
- Las 3 oraciones del Camino siguen igual y quedan como hábitos "de sistema" (no se pueden borrar ni editar).

### 2.4 Dónde se muestran los hábitos

| Lugar | Qué se ve | Por qué |
|---|---|---|
| **Página de hábitos** (la actual `/dashboard/oracion`, que pasa a llamarse *Mis hábitos* en el mismo grupo "Vida espiritual") | Todas las tarjetas agrupadas por **franja del ancla**: Mañana · Durante el día · Noche. Las oraciones del Camino entran en su franja (Matutinum mañana, Rosario día, Completorium noche). Botón "Nuevo hábito" en el `PageHeader` | Un solo lugar y una sola tarjeta (`HabitoCard` generalizada): sin UI duplicada. Agrupar por momento es como Fabulous arma rutinas, y refuerza el ancla |
| **Inicio** (`/dashboard`, panel *Agenda*) | Arriba de "Pendientes": sección "Hábitos de hoy" con los de la franja actual, un toque para marcar | Es la pantalla que todos abren; registrar en < 3 s sin cambiar de página |
| **Barra lateral** | El contador existente pasa a contar todos los hábitos pendientes de hoy | Reutiliza el badge de la lane 19 |
| **Familia** (pestaña de padres) | La tabla suma una columna por hábito personal activo de cada miembro | Los padres acompañan sin crear otra vista |

Por qué no en la lista de tareas: las tareas tienen puntos, vencimiento y revisión de padres; los hábitos no se "aprueban" ni vencen. Mezclarlos rompería las dos reglas.

### 2.5 Componentes (todos shadcn ya instalados, salvo Drawer)

`Dialog` en escritorio y **`Drawer`** (shadcn, sobre `vaul`, MIT) en móvil: el patrón "responsive dialog" de shadcn. Adentro: `ToggleGroup`, `Item`, `Field`, `Input`, `Button`, `Progress` (indicador 1/2).

### 2.6 Datos

```
Habito          id, usuarioId, plantilla?, nombre, ancla, franja (manana|dia|noche),
                dias (bitmask 0–127), escalera Json?, creadoPorId, desde @db.Date, archivadoEl?
RegistroHabito  habitoId, fecha @db.Date, marca (hecho|justificado), motivo?, registradoPorId
                @@unique([habitoId, fecha])
```

Aditivo (`db push`), sin tocar `PlanOracion` ni `RegistroOracion`. API: `POST /api/habitos` (crear), `PATCH /api/habitos/[id]` (editar o archivar), `PUT /api/habitos/[id]/registro`. Permisos con `usuariosObjetivo` (ya existe).

---

## 3. Lanes propuestas

- [ ] **Lane 21 · `task/lane-21-motor-habitos`**: motor genérico por escalera, días no programados, plantillas en `catalogo.ts`, modelos `Habito`/`RegistroHabito`, API y tests.
- [ ] **Lane 22 · `task/lane-22-nuevo-habito`**: pantalla de 2 pasos (Dialog/Drawer), página *Mis hábitos* por franjas, "Hábitos de hoy" en la Agenda, badge lateral. Incluye G3 (re-anclar) y G7 (identidad).
- [ ] **Lane 23 · `task/lane-23-recordatorios`** (G1): Web Push (`web-push` + service worker), cron de Vercel, cantidad según etapa (Inicio 1/día; Consolidación solo si no marcó; Firme ninguno; Retomando vuelve a 1).
- [ ] **Lane 24 · `task/lane-24-adaptacion`** (G4–G6): diagnóstico de recaída en un toque, señal de riesgo temprano y "¿Te resultó fácil?" al subir.

Orden sugerido: 21 → 22 (pedido directo) → 24 (adaptación, solo motor y una pregunta) → 23 (requiere infraestructura y permisos de notificación).

## 4. Fuentes

- Fogg, *Tiny Habits*: receta "After I…, I will…" + celebración. [themeaningmovement.com/tiny-habits](https://themeaningmovement.com/tiny-habits), [Stanford ASCEND](https://med.stanford.edu/content/dam/sm/ascend/documents/Introduction_%20Tiny%20Habits%20for%20Self%20Compassion,%20Getting%20Started.pdf)
- Streaks (creación de hábitos, límite de 6): [thesweetsetup.com](https://thesweetsetup.com/how-to-track-your-habits-using-streaks/)
- Habitify (Skip / Off Mode): [intercom.help/habitify-app](https://intercom.help/habitify-app/en/articles/6113621-learn-about-streak-in-habitify)
- Onboarding de hábitos (presets, flujo corto, hora del recordatorio): [screensdesign.com](https://screensdesign.com/articles/habit-tracker-app-onboarding-examples/)
