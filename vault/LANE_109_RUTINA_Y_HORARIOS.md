# Lane 109 — Pantalla "Rutina y Horarios" y Temporizador en Vivo

## Pedido del usuario (textual)
> crea una lane nueva y un worktree y rama task, pero no la mergees al finalizar.
> Quiero una nueva pantalla, llamada "Rutina y Horarios".
> Será para registrar y gestionar la rutina familiar.
> Tanto la rutina diaria como semanal, como mensual.
> Quiero que investigues en internet, apps existentes de rutina, estudios, la mejor forma de organizar la pantalla de rutina.
> Quiero que sea fácil de completar y editar.
> Quiero que sirva para que los padres registren, consulten y modifiquen la rutina familiar.
> De momento tengo esto definido:
> 08:00 Levantarse, vestirse, lavarse la cara, peinarse
> 08:15 hacer la cama
> 08:20 rezamos
> 08 30 desayuno
> 09:00 Estudio
> 09:25 Pausa
> 09:30 Estudio
> 09:55 Pausa
> 10:00 Recreacion, agua, baño
> 10:15 Ayudo en areas comunes, ropa, barrer,ordenar
> 10:20 Segunda tanda de estudio
> 12:00 Angelus - Preparar almuerzo
> 12:40-13:00 almuerzo
> 13:15 Orden y limpieza de cocina
> 13:40 descanso, cafe, libro, sentarse afuera
> 14:30 ejercicio afuera, aire libre, juego
> 15:00 coronita misericordia
> 15:30 manualidad, arte, plantacion, musica
> 16:30 lectura
> 17:00 merienda
> 18:00 colaboro en tareas del orden el hogar
> 18:30-19:00 Baño
> 19:00 Tiempo de lecturas, recreacion,
> 20:00 Preparacion cena
> 20:30 Cena
> 21:00 Los pequeños duermen
> 21:30 Oracion de la noche
> 22:00 A dormir..
> Quiero que esté cargado ya en la app.
> Piensa la mejor forma de visualizar la rutina.
> Tambien quiero que integres "Alarmas/Recordatorios" que suenen en cada etapa de la rutina.
> A su vez debe de haber una nueva pantalla linkeada en el sidebar, llamada "Horarios" para que los usuarios puedan visualizar la rutina y también que se active una cuenta regresiva cada vez que se alcanza el horario de una etapa de la rutina, con el tiempo disponible hasta la proxima etapa.
> Para ello busca en internet los mejores visualizadores de timers/temporizadores para el stack actual.

---

## 1. Investigación y Fundamentos de Diseño
- **Estudio de aplicaciones líderes:**
  - **Tiimo:** Enfoque neuroinclusivo (ADHD/Autismo/TDAH). Línea de tiempo visual continua con temporizador circular decreciente (Time-Timer) y alertas sonoras de transición que liberan a los padres de ser el "policía" que da órdenes.
  - **Hearth Display & Skylight Calendar:** Pantallas tipo *Family Command Center* montadas en pared o cocina, donde los niños ven los bloques del día y la cuenta regresiva sin depender de leer números abstractos en un reloj convencional.
  - **Routinery / Choiceworks:** Secuencias de rutinas con retroalimentación inmediata, micro-pasos y marcas de completitud.
  - **Pedagogía familiar y Homeschooling (Charlotte Mason / Waldorf):**
    - Los horarios rígidos al minuto provocan frustración cuando surge un imprevisto; la mejor solución es combinar **Puntos de Anclaje** (Comidas, Ángelus, Coronita, Descanso) organizados en **Macro-bloques** (*Mañana*, *Estudio*, *Mediodía*, *Tarde*, *Hogar* y *Noche*).
    - Un **temporizador visual circular (Time-Timer)** permite a los niños ver el tiempo como algo físico que disminuye, facilitando transiciones en paz.

---

## 2. Lo Implementado

### A. Rutina Oficial Precargada (28 Etapas)
- Precargada en `src/lib/rutina/tipos.ts` (`RUTINA_PREDETERMINADA`) cubriendo las 24 horas del día exactamente según lo solicitado por el usuario:
  1. `08:00 - 08:15`: Levantarse, vestirse, lavarse la cara, peinarse (Higiene, Sun)
  2. `08:15 - 08:20`: Hacer la cama (Hogar, BedDouble)
  3. `08:20 - 08:30`: Rezamos (Oración, Church)
  4. `08:30 - 09:00`: Desayuno (Nutrición, Utensils)
  5. `09:00 - 09:25`: Estudio (Estudio, BookOpen)
  6. `09:25 - 09:30`: Pausa (Pausa, Coffee)
  7. `09:30 - 09:55`: Estudio (Estudio, BookOpen)
  8. `09:55 - 10:00`: Pausa (Pausa, PauseCircle)
  9. `10:00 - 10:15`: Recreación, agua, baño (Recreación, Smile)
  10. `10:15 - 10:20`: Ayudo en áreas comunes, ropa, barrer, ordenar (Hogar, Sparkles)
  11. `10:20 - 12:00`: Segunda tanda de estudio (Estudio, GraduationCap)
  12. `12:00 - 12:40`: Ángelus - Preparar almuerzo (Oración, Bell)
  13. `12:40 - 13:15`: Almuerzo (Nutrición, Utensils)
  14. `13:15 - 13:40`: Orden y limpieza de cocina (Hogar, Home)
  15. `13:40 - 14:30`: Descanso, café, libro, sentarse afuera (Descanso, Coffee)
  16. `14:30 - 15:00`: Ejercicio afuera, aire libre, juego (Deporte, Activity)
  17. `15:00 - 15:30`: Coronita de la Misericordia (Oración, Church)
  18: `15:30 - 16:30`: Manualidad, arte, plantación, música (Creatividad, Palette)
  19. `16:30 - 17:00`: Lectura (Lectura, BookMarked)
  20. `17:00 - 18:00`: Merienda (Nutrición, Utensils)
  21. `18:00 - 18:30`: Colaboro en tareas del orden del hogar (Hogar, Home)
  22. `18:30 - 19:00`: Baño (Higiene, Bath)
  23. `19:00 - 20:00`: Tiempo de lecturas, recreación (Recreación, Smile)
  24. `20:00 - 20:30`: Preparación de la cena (Nutrición, Utensils)
  25. `20:30 - 21:00`: Cena (Nutrición, Utensils)
  26. `21:00 - 21:30`: Los pequeños duermen (Descanso, Moon)
  27. `21:30 - 22:00`: Oración de la noche (Oración, Church)
  28. `22:00 - 08:00`: A dormir... (Descanso, Moon)

### B. Visualizador de Temporizador y Cuenta Regresiva (`TemporizadorDisco.tsx`)
- Inspirado en **Time-Timer** y **Tiimo**:
  - Disco circular SVG con arco decreciente animado en sentido horario.
  - Indicador numérico gigante con tipografía monoespaciada (`MM:SS` o `HH:MM:SS`).
  - Semáforo cromático por fase:
    - `> 50%`: Esmeralda sereno (tiempo suficiente).
    - `20% - 50%`: Ámbar dorado (mitad del tiempo).
    - `< 20%`: Rosa coral pulsante (últimos minutos de la etapa).
  - Controles de intervención familiar: `Pausar / Reanudar`, `+5 min` (extender bloque), `Saltar a Siguiente etapa`.
  - Preview continuo de la siguiente etapa y la hora en que comenzará.
  - **Modo Enfoque Pantalla Completa (Kiosk Display):** Permite dejar la pantalla activa en un iPad o monitor de cocina/sala como centro de comando familiar.

### C. Motor Autónomo de Audio y Alarmas (`audioRutina.ts`)
- Basado en **Web Audio API** sintetizado:
  - Cero dependencias de archivos de audio externos (no sufre por 404 ni problemas de red, funciona offline).
  - 5 timbres armónicos de alta fidelidad:
    1. **Campanilla:** Arpegio celestial de campanillas agudas con caída suave.
    2. **Monasterio:** Campana grave de bronce con sobretonos armónicos (ideal para el Ángelus y la Coronita).
    3. **Cuenco Zen:** Resonancia tibetana profunda.
    4. **Marimba:** Timbre de madera cálido y alegre para bloques diurnos y pausas.
    5. **Ping Suave:** Tono minimalista de dos notas.
  - Controles de audio: interruptor de silencio, selector de timbre, control de volumen (0-100%) y botón de prueba inmediata.
  - Permiso y envío de **Notificaciones nativas del navegador** (`Notification API`).
  - **Banner animado de transición (`BarraAlarmaActiva.tsx`)** que avisa en pantalla cuando se inicia una nueva etapa con sonido y botón "¡Listo!".

### D. Rutina Diaria, Semanal y Mensual
- **Pestaña En Vivo:** Temporizador visual central, estado actual, cuenta regresiva a la próxima etapa y cronograma de las próximas horas.
- **Pestaña Rutina Diaria (`TimelineDiario.tsx`):**
  - Lista completa de las 28 etapas con filtros por macro-bloque (Mañana, Estudio, Mediodía, Tarde, Hogar, Noche) y buscador en tiempo real.
  - Checkbox interactivo de cumplimiento diario con barra de progreso porcentual del día.
- **Pestaña Rutina Semanal (`RutinaSemanalView.tsx`):**
  - Desglose por día (Lunes a Domingo), diferenciando el ritmo de homeschooling de días laborables (Lun-Vie) frente al ritmo de Sábado (Hogar, compras y excursión) y Domingo (Día del Señor, Santa Misa y almuerzo festivo).
- **Pestaña Rutina Mensual (`RutinaMensualView.tsx`):**
  - Virtud del mes familiar, metas mensuales y propósitos con registro de cumplimiento.

### E. Editor Familiar para Padres (`EditorEtapaModal.tsx`)
- Exclusivo para roles de Padres (`Padre` / `Madre`):
  - Modificar cualquier horario, título, descripción, icono y categoría.
  - Habilitar o deshabilitar la campana sonora individualmente por etapa.
  - Configurar si la etapa aplica todos los días, solo días de semana o solo fines de semana.
  - Botón de **"Restablecer Horarios por Defecto"** para volver a las 28 etapas oficiales en 1 solo clic.

### F. Enlace en el Sidebar
- En `src/components/app/AppSidebar.tsx`:
  - Agregado en el grupo **Rutina** el ítem **`Horarios`** (con icono `CalendarClock`), direccionando a `/dashboard/horarios` y tooltip descriptivo.
  - Soporte de redirección en `/dashboard/rutina` -> `/dashboard/horarios`.

### G. Segunda ronda de correcciones (feedback textual del usuario, 2026-10-14)

> Hay una rama en donde se estaba trabajando la pantalla de "Horarios", lamentablemente el otro agente es una porqueria y no es tan bueno cosas complejas, le va mejor en cosas puntuales o de copy (agy).
> Problemas detectados (no son todos, debés revisar funcionalidad de todo):
> Conmutador de ocultar completadas no funciona.
> Notificación muestra pildora "Nueva etapa!" que ocupa espacio innecesario y hace que todo lo demas quede amontonado (eliminar pildora). Deberia mostrar el titulo mas pequeño y sin descripción.
> En tab "Diaria" -en el filtro de etapa que muestra "Todo el dia", "Mañana", etc.- aparece una scroll bar horizontal, en vez de que sean scroleables con "drag and scroll" y existe un off canvas para lo elementos que no entran.
> Termometro debe calcular el porcentaje de completitud desde que inició el dia hasta la hora actual, un atraso no significa 0% como dice ahora.
> Modo enfoque no abre el cronometro en fullscreen, sino que lo expande en un div abajo del layout de la aplicación (ERROR GARRAFAL)
> Tab en vivo, debajo del timer, debe permitir volver a la tarea/etapa anterior.
> Botón "Modo Enfoque" aparece en todas las pantallas pero no funciona.
>
> (Lista previa pegada por el usuario) Timer no funciona en modo enfoque · "Comienza nueva etapa": posponer no funciona y debería posponer todos los horarios de ese día · Timers desincronizados (13:15 empezó uno nuevo sin que el anterior llegara a cero) · Botón de pausa sin efecto · Notificación flotante precaria · Diaria debe ocultar las completadas · Revisar todo de forma exhaustiva · Barra circular a "tramos" · El progreso debe compararse con el horario (termómetro de ejecución).

**Causas encontradas y arreglos (en `lane-109`):**

| Problema | Causa real | Arreglo |
|---|---|---|
| Modo Enfoque se expandía "debajo del layout" | El contenedor llevaba `relative` **y** `fixed`; en Tailwind v4 `relative` gana, así que el portal quedaba en flujo normal al final del `<body>`. Además solo existía la instancia dentro de la pestaña En Vivo, por eso el botón del encabezado no hacía nada en las otras pestañas | Overlay `fixed inset-0` real (`role=dialog`) renderizado a nivel de página (funciona desde cualquier pestaña) + **Fullscreen API** (`requestFullscreen`/`fullscreenchange`/Esc) + bloqueo del scroll del body. Disco y tipografías escalan con el viewport |
| Pausa sin efecto / timers desincronizados | La pausa congelaba solo los números pero el reloj seguía: la etapa cambiaba (y sonaba la alarma) "por debajo" con el contador congelado | Pausa real: mientras está pausado, **todo** el tablero (etapa, cuenta regresiva, termómetro, alarmas) usa el instante congelado. Al reanudar, si pasaron ≥30 s, el resto del día se corre lo que duró |
| Posponer del aviso "no funciona" | Al posponer, la etapa previa volvía a ser la vigente y el detector de alarmas la veía como "etapa nueva": sonaba y reabría el aviso en bucle | Se registra la etapa previa como ya avisada; el aviso se oculta cuando deja de ser la etapa vigente. Posponer corre **todas** las etapas posteriores del día |
| Ajustes se guardaban en la rutina base | Posponer/pausar/+5 modificaban la rutina para siempre (mañana empezaba corrida) | Nuevo `ajusteDia` (por fecha) en la configuración: los ajustes aplican solo a hoy; la rutina base no cambia. Editar/borrar/restablecer en el editor descarta el ajuste del día |
| Cumplimientos se perdían al recargar | Estaban solo en memoria de la página | `cumplidasDia` (por fecha) persistido junto a la configuración |
| Barra circular a tramos | Transición de 0,1 s con tick de 1 s | Transición lineal de 1 s (giro continuo); el anillo se reinicia al cambiar de etapa |
| Termómetro marcaba 0% con cualquier atraso | Contaba etapas enteras "esperadas" (≥50% transcurrido) | Ponderado por **minutos** desde el inicio del día hasta ahora; la etapa en curso no cuenta como atraso salvo que ya esté marcada. ≥100% de lo vencido ⇒ impecable; ≥70% bueno; menos ⇒ demorado |
| Filtro con scroll horizontal | `overflow-x-auto` + clase `scrollbar-none` inexistente | Componente `ui/drag-scroll.tsx` sobre **Embla** (`dragFree`): se arrastra con mouse/touch, sin barra, con degradé en los bordes; lo que no entra queda fuera de cuadro. Usado también en el selector de días de Semanal |
| Pastilla "¡Nueva Etapa!" | — | Aviso rediseñado en una sola fila compacta: título pequeño + horario, "Posponer" (+5/10/15/30) y "Listo". Sin descripción ni pastilla |
| Falta "volver a la etapa anterior" | `Siguiente` solo cerraba el aviso, no avanzaba | Botones **Anterior / Siguiente** bajo el timer (+ filas "Anterior:" y "Siguiente:"). Siguiente: la actual termina ahora y el día se adelanta lo sobrante. Anterior: se retoma la anterior ahora (hasta 15 min, `RETOMAR_ETAPA_MAX_MIN`) y el resto se corre. Navegar no dispara campana ni aviso |
| Sonaba la campana al abrir la página | El detector trataba la primera etapa leída como "nueva" | La primera lectura solo registra la etapa |
| Alarma sin sonido si no hubo clic previo | Autoplay policy: el `AudioContext` nacía suspendido | `prepararAudio()` en el primer gesto del usuario |
| Notificaciones del navegador nunca se pedían | `solicitarPermisoNotificacion` no se llamaba | Interruptor "Avisos del navegador" en el menú de audio; `notificacionesNavegador` se respeta |
| Hidratación (hora del servidor ≠ cliente) | La página dibujaba hora/etapa en el servidor | Se dibuja solo en cliente (`useSyncExternalStore`), con skeleton |
| Editor aceptaba inicio = fin | — | Validación y mensaje; el editor siempre toma la versión base de la etapa (no la corrida por ajustes) |
| "Ocultar completadas" | En la prueba en navegador **funciona** (28→25 tarjetas con 3 marcadas, banner "Ver todas"). Si vuelve a fallar en el servidor del usuario, probablemente era un build viejo | Conteos ahora sobre las etapas de hoy; cumplimientos persistidos. Verificado en navegador |

---

## 2.b Pendientes / cosas para revisar (hallazgos de esta ronda)

1. **Persistencia solo en el navegador.** La rutina, los ajustes del día y los cumplimientos viven en `localStorage`; `/api/rutina` guarda en memoria del servidor (se pierde al reiniciar y no se vuelve a leer). Cada dispositivo ve su propia rutina: una tablet de pared y el celular de los padres **no se sincronizan**. Falta modelo Prisma + migración (requiere SQL aditivo revisado, nunca `db push`).
2. **Semanal indiferenciada.** Las 28 etapas son `diasSemana: "todos"`, así que Lun–Dom muestran lo mismo; sábado/domingo solo tienen notas de texto. Falta definir (con el usuario) las rutinas distintas.
3. **Cascadas por índice.** `posponerDesdeEtapa`, `extenderEtapaActiva` y `posponerRutina` operan sobre toda la lista sin filtrar por `diasSemana`. Con etapas solo-laborables, la etapa "previa" podría no ser la de hoy. Las nuevas `avanzar/retrocederEtapaAhora` sí filtran por día.
4. **Pausa al minuto.** El horario se guarda en `HH:mm`: al reanudar el desplazamiento se redondea a minutos enteros (±30 s de diferencia con lo pausado).
5. **Anterior limitado a 15 min.** Decisión de diseño para no correr el día 100 min al volver a un bloque largo; se ajusta con +5 min. Confirmar con el usuario.
6. **Alarma solo con la página abierta.** No hay push/background; en iOS el audio exige un toque previo. Para una tablet de pared conviene dejarla en Modo Enfoque.
7. **Etapa nocturna (22:00–08:00)** cruza medianoche: al adelantar el día puede quedar un hueco antes de las 08:00 ("Descanso general"). Comportamiento aceptable pero sin tests específicos de UI.
8. **Metas mensuales** traen `mes: "2026-10"` fijo en los datos de ejemplo; no rotan solas de mes.
9. **Sin tests de componentes.** La lógica pura tiene 20 tests; la UI se verificó a mano con Chromium + puppeteer-core (scripts fuera del repo). Convendría un e2e liviano.
10. **Dependencia nueva:** `embla-carousel-react` (base del Carousel de shadcn).
11. **Lint heredado:** `react-hooks/set-state-in-effect` en `EditorEtapaModal` (sincronizar formulario) y un `eslint-disable` puntual en el detector de alarmas. Warnings de imports sin usar quedan en vistas Semanal/Mensual.
12. **Worktree:** esta rama tiene `dev` mergeado (incluye modelos nuevos de Prisma); hay que correr `npx prisma generate` (solo codegen) en el worktree. No se tocó la base.

---

## 3. Pruebas y Verificación
- Creados tests unitarios exhaustivos en `src/lib/rutina/calculadorHorarios.test.ts`:
  - Conversión precisa de horas `HH:mm` a minutos.
  - Detección de etapas activas en horas diurnas y nocturnas (cruce de medianoche 22:00 a 08:00).
  - Cálculo de tiempo restante y duración en segundos.
  - Cálculo de fases cromáticas (verde, ámbar, rojo) y `ratioRestante` continuo.
  - Desplazamiento en cascada (`posponerRutina`, `posponerDesdeEtapa`, `extenderEtapaActiva`).
  - Cálculo del Termómetro de Ejecución comparado con el momento presente.
- **Resultado:**
  - `npm test` (con `dev` mergeado): **235 tests**, 219 aprobados, 0 fallan, 16 omitidos (DB de producción sin `PERMITIR_TESTS_DB=1`). Rutina: 20 tests de lógica (termómetro por minutos, avanzar/retroceder, sincronía en el límite).
  - `npx tsc --noEmit`: **0 errores**. `npm run build`: OK.
  - Verificación en navegador (Chromium headless, reloj simulado): Modo Enfoque a pantalla completa real desde En Vivo y Diaria (Esc/"Salir" lo cierran), pausa congela etapa y contador, Siguiente/Anterior, aviso + posponer (+10 corre el día, sin re-alarma), ocultar completadas, drag del filtro, recarga sin campana.
  - `npm run build`: compilación de producción exitosa con Turbopack.
  - Servidor de prueba: corriendo en puerto `3001` (`npx next start -p 3001`).

---

## 4. Estado Git y Reglas de Lanes
- Rama: `task/lane-109-rutina-y-horarios`
- Worktree: `../ordo-diei-lanes/lane-109`
- **NO MERGEADA:** Según instrucción explícita del usuario (*"pero no la mergees al finalizar"*), la rama y worktree quedan intactos y listos para revisión y testing.
