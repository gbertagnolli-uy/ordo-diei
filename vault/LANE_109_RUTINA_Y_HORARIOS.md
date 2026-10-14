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

### G. Correcciones y Mejoras de Pulido Exhaustivo (Feedback del Usuario)
1. **Modo Enfoque / Pantalla Completa:**
   - Implementado mediante `React Portal` montado directo en `document.body` + soporte nativo de la API de Pantalla Completa HTML5 (`requestFullscreen` / `exitFullscreen`) y tecla `Escape`.
   - Salida del layout del dashboard sin restricciones de overflow, funcionando de manera impecable en tablets o monitores montados en pared.
2. **Posponer en Cascada y Sincronización de Timers:**
   - La función `posponerDesdeEtapa` y `posponerRutina` extienden la etapa actual o previa e incrementan en cascada la hora de inicio y fin de todas las etapas posteriores del día.
   - En `BarraAlarmaActiva`, el menú desplegable permite posponer +5, +10, +15 o +30 minutos, actualizando el cronograma completo de la familia y persistiendo la configuración.
   - Evita la desincronización (cuando una etapa llegaba a 13:15 y cambiaba antes de que el timer llegara a cero): ahora el reloj, el temporizador y el cronograma están 100% coordinados.
3. **Botón de Pausa Real:**
   - Congela el segundero y el ratio circular en el instante exacto del clic.
   - Al reanudar, si la pausa superó los 30 segundos, desplaza automáticamente en cascada el horario de la etapa actual y las siguientes para que no se pierda el tiempo planificado.
4. **Movimiento Continuo del Disco SVG (Time-Timer):**
   - Se reemplazó el porcentaje entero redondeado (que saltaba en tramos cada 18 segundos) por un flotante de alta precisión `ratioRestante` (0.0 a 1.0) con transición CSS suave `stroke-dashoffset 0.1s linear`.
5. **Termómetro de Ritmo y Ejecución:**
   - Se implementó `calcularTermometroEjecucion` que compara las tareas completadas respecto a las que **deberían estar hechas según la hora actual** (indicando "¡Ritmo Impecable!", "Buen Ritmo", "Con Demora" o "Preparados"), evitando la desmotivación de mostrar solo un porcentaje global del día.
6. **Ocultar Etapas Completadas en Tab "Diaria":**
   - Interruptor conmutador `Ocultar completadas` / `Mostrar completadas` con icono, filtrado reactivo de tarjetas y banner discreto al final que permite volver a ver todas con un clic.
7. **Diseño Pulido de Notificación Flotante:**
   - `BarraAlarmaActiva` rediseñada con glassmorphism, glow ámbar, `DropdownMenu` nativo y badge distintivo.

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
  - `npm test`: **112 tests** (109 aprobados, 3 tests de base de datos omitidos según regla de no escribir en DB de producción sin `PERMITIR_TESTS_DB=1`).
  - `npx tsc --noEmit`: **0 errores de TypeScript**.
  - `npm run build`: compilación de producción exitosa con Turbopack.
  - Servidor de prueba: corriendo en puerto `3001` (`npx next start -p 3001`).

---

## 4. Estado Git y Reglas de Lanes
- Rama: `task/lane-109-rutina-y-horarios`
- Worktree: `../ordo-diei-lanes/lane-109`
- **NO MERGEADA:** Según instrucción explícita del usuario (*"pero no la mergees al finalizar"*), la rama y worktree quedan intactos y listos para revisión y testing.
