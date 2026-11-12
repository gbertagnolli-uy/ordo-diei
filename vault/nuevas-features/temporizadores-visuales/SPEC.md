# Temporizadores visuales — Especificación

> Amplía [`README.md`](README.md). Investigación: Time-Timer / Choiceworks (accesibilidad TDAH/Autismo). Se apoya en lo que **ya existe**: `Tarea.tiempoEjecucionEstimadoSeg`, `timerStartedAt`, `tiempoAcumuladoTimer` y `POST /api/tasks/[id]/timer`.

## 1. Objetivo
Mostrar el tiempo restante como **algo que se ve disminuir** (no números abstractos), para ayudar a niños pequeños y neurodivergentes en transiciones y tareas con duración.

## 2. Componente `TemporizadorVisual`
Variantes (prop `variante`):
- **`disco`** (por defecto): círculo tipo Time-Timer; el sector coloreado **se achica** en sentido horario hasta desaparecer. SVG con `stroke-dasharray` (sin librerías).
- **`barra`**: barra horizontal que se vacía (para tarjetas pequeñas).
- **`arena`** *(fase 2)*: reloj de arena.
Props: `duracionSeg`, `restanteSeg` (derivado de hora de fin, no de un contador propio), `estado` (`corriendo|pausado|terminado`), `tamano` (`sm|md|xl` pantalla completa), `pictograma?`, `mostrarNumero` (por defecto **oculto** en `xl`, visible pequeño), `onFin`.
- **Color por fase** (tokens del tema, claro/oscuro): > 50 % verde → 25–50 % ámbar → < 25 % rojo. **Además** un patrón/rayado y el texto de fase («Mitad», «Casi») para no depender solo del color (daltonismo, WCAG 1.4.1).
- Animación fluida con `requestAnimationFrame` a ≤ 30 fps; con `prefers-reduced-motion` se actualiza cada segundo.
- Al terminar: pulso suave, sonido `timer.fin` (ver sonidos), mensaje grande «¡Tiempo!» y acciones **[Marcar hecha] [+5 min]** (según contexto).

## 3. Dónde aparece
1. **Tarjeta de tarea** con duración estimada: botón «▶ Empezar» abre el modo **foco** (pantalla completa, disco `xl`, pictograma, nombre de la tarea, [Pausar] [Terminar]).
2. **Hábitos** con duración (ej. cepillarse 2 min, oración 10 min): campo nuevo `duracionMin` opcional en `Habito`.
3. **Temporizador libre** (botón «Temporizador» en la barra): elegir minutos con botones grandes (1, 5, 10, 15, 30) y pictograma. Útil para transiciones («10 minutos y apagamos la TV»).
4. **Cuenta regresiva a un evento** (hora de cena/oración): lo configuran los padres; la barra del cofre (`cofreHorario`) es la primera instancia — **reutilizar** su cálculo.

## 4. Reglas
- El tiempo se calcula por `horaFin = inicio + duración + pausas`; sobrevive a recargas, cambio de ruta y suspensión (se recalcula al volver).
- Un temporizador activo cuenta como **actividad** (`useMantenerActivo`) y evita el cierre por inactividad; se libera al terminar.
- Un solo temporizador de foco por usuario; el libre puede coexistir en pantalla de pared (fase 2).
- Pausa/reanudar y «+ tiempo»; no se puede reducir por debajo de lo transcurrido.
- Tiempo real de tarea registrado (`tiempoRealEjecucionSeg`) se alimenta del mismo reloj existente.

## 5. Pictogramas
Campo `pictograma` (string) en tarea/hábito/temporizador libre. Set inicial: **emoji/íconos Lucide** (cepillarse, comer, estudiar, rezar, ordenar, bañarse…). Fase 2: **ARASAAC** (licencia CC BY-NC-SA; verificar uso antes). Selector de íconos grande en el formulario.

## 6. Datos
`Habito.duracionMin Int?`; `Tarea` ya tiene lo necesario; `TemporizadorLibre` **no se persiste** en v1 (estado en cliente + `localStorage` con `horaFin`).

## 7. Criterios de aceptación
1. «Empezar» en una tarea de 10 min muestra el disco lleno que se reduce suavemente; recargar la página no lo reinicia.
2. Cambia de color en los umbrales y muestra texto de fase.
3. Al terminar suena (si hay sonido), pulsa y ofrece Marcar hecha / +5 min.
4. Con el temporizador en marcha no se cierra la sesión por inactividad.
5. Con `prefers-reduced-motion` no hay animación continua.
6. Accesible: `role="timer"`, `aria-live` cada minuto restante («quedan 5 minutos»), operable por teclado.
7. Tests de la función pura `tiempoRestante` (pausas, suspensión, fin).
