# Temporizadores visuales

> Estado: **planificación** (2026-10-13). Sin lanes creadas todavía.

## 1. Pedido del usuario (textual)

> Empecemos la planificación de estas nuevas features:
>
> Marketplace (Para canjear alguna de las monedas de la app por premios fisicos reales)
> Homeschooling (Complejo, es casi una app nueva extra)
> Sonidos UI para recompensas y acciones en la APP
> Meal planner
> Temporizadores Visuales
> Idle State: Marco de Fotos Dinamico en pantalla principal donde aparecen las fotos de los usuarios para iniciar sesion
> Kiosk Mode / App Pinning
> Musica de fondo
>
> Anota todo esto en el vault en carpetas separadas.
>
> (Más la investigación pegada: [`../ref/investigacion-1-centros-de-comando.md`](../ref/investigacion-1-centros-de-comando.md) y [`../ref/investigacion-2-software-puro.md`](../ref/investigacion-2-software-puro.md).)

Línea que corresponde a esta feature: **«Temporizadores Visuales»**

## 2. Qué dice la investigación

- **Temporizadores Visuales (Time-Timer) y pictogramas** — inv. 1 §2: barras de progreso que se vacían (rojo → verde) en vez de números abstractos; soporte para no lectores con iconos. Es una **feature de accesibilidad (neurodivergencia, TDAH/Autismo)**; reduce crisis en las transiciones. Benchmark: Choiceworks, Visual Schedule. Prioridad **Should-Have**.
- Relacionado: la cuenta regresiva del cofre ya tiene una barra que se vacía (`LANE_92_COFRE_CUENTA_REGRESIVA.md`, `lib/comportamiento/cofreHorario.ts`) → reutilizar el componente/idea.

## 3. Alcance propuesto (a validar)

- Componente de temporizador visual: disco que se consume (estilo Time Timer) y/o barra; colores por fase; versión grande para la pantalla de pared.
- Se puede asociar a una **tarea/hábito** («cepillarse los dientes: 2 min», «hacer la tarea: 30 min») y arrancar desde la tarjeta.
- Pictograma por tarea (icono grande) para no lectores.
- Al terminar: sonido (ver `../sonidos-ui/`), aviso visual, y opción de marcar la tarea.
- Debe sobrevivir a recargas (guardar hora de fin, no un contador en memoria) y no depender de que la pantalla esté activa (ver `../kiosk-mode/`).
- Uso adicional: tiempo de pantalla/vales (los vales de la lane 86 ya tienen «usado en» como ticket).

## 4. Preguntas abiertas

1. ¿Duración fija por tarea o libre al iniciar?
2. ¿Visual solo o también anuncio por voz/sonido?
3. ¿Un timer por niño en simultáneo o uno global en la pantalla de pared?
4. ¿Qué set de pictogramas (propio, ARASAAC, emojis)? Verificar licencia.
