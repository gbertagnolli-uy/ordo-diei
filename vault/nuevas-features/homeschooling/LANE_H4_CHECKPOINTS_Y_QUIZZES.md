# Lane H4 — Active Recall, Checkpoints de Video y Quizzes

> **Estado:** Lista para ejecución cuando H2 esté integrada en `dev`.  
> **Dependencias:** Lane H2 (LMS y Reproductor de Lecciones).  
> **Tamaño:** L (Integración de YouTube IFrame API + Motor de Quizzes + Repaso Espaciado + Economía de Cartas).

---

## 1. Objetivo de la Lane

Transformar el consumo pasivo de videos en **aprendizaje activo (Active Recall)** mediante pausas automáticas programadas en el reproductor (Checkpoints), donde el video se congela y despliega preguntas de comprensión interactiva. Implementar el motor de quizzes con umbral de aprobación ($\ge 70\%$) para el desbloqueo de la siguiente lección, el algoritmo de **repaso espaciado (SM-2)** para conceptos difíciles y la entrega de **fragmentos de cartas holográficas coleccionables** como recompensa lúdica.

---

## 2. Checkpoints de Video Interactivos

### 2.1 Integración con YouTube IFrame API
- En `src/components/homeschooling/lms/LessonPlayer.tsx`:
  - Cargar el script asíncrono `https://www.youtube.com/iframe_api`.
  - Inicializar la instancia del reproductor `window.YT.Player`.
  - Configurar un listener de `timeupdate` (intervalo de 500 ms) para monitorear `player.getCurrentTime()`.
- **Lógica de Congelamiento y Pausa:**
  - Cuando `Math.floor(currentTime) === checkpoint.segundoPausa` y el checkpoint aún no ha sido respondido:
    1. Invocar `player.pauseVideo()`.
    2. Renderizar un overlay modal sobre el contenedor del video.
    3. Bloquear la barra de progreso de YouTube (`controls: 0` o pointer-events deshabilitados).
    4. El video no puede reanudarse hasta que el estudiante seleccione una respuesta.

### 2.2 Overlay de Pregunta
- Componente `src/components/homeschooling/lms/CheckpointModal.tsx`:
  - Pregunta clara con tipografía de alto contraste.
  - Opciones de respuesta en botones grandes táctiles.
  - Retroalimentación inmediata:
    - **Acierto:** Sonido suave de acierto, animación sutil verde y botón **«Continuar video»** (invoca `player.playVideo()`).
    - **Fallo:** Explicación pedagógica breve y opción de retroceder 30 segundos para volver a ver la explicación antes de reintentar.

---

## 3. Motor de Quizzes y Desbloqueo Secuencial

- Cada lección puede incluir un cuestionario final de 3 a 5 preguntas (`VideoCheckpoint` o `PreguntaQuiz`).
- **Cálculo de Calificación:**
  $$\text{Calificación} = \left(\frac{\text{Aciertos}}{\text{Total Preguntas}}\right) \times 100$$
- **Regla del 70%:**
  - Si Calificación $\ge 70\%$:
    - Se marca la lección como aprobada (`completada: true`).
    - Se desbloquea automáticamente la siguiente lección en `LearnSidebar.tsx`.
    - Se registra en `ProgresoLeccion`.
  - Si Calificación $< 70\%$:
    - Se invita al alumno a repasar el material.
    - La lección siguiente permanece con candado.
    - El padre recibe un aviso en su panel: *"Leo obtuvo 50% en Fracciones: requiere repaso"*.

---

## 4. Algoritmo de Repaso Espaciado (SM-2 Lite)

- Si un alumno reprueba un quiz 2 veces consecutivas o el padre lo activa manualmente:
  - Se genera un registro en `RegistroRepaso`:
    ```typescript
    await prisma.registroRepaso.create({
      data: {
        alumnoId,
        materiaId,
        conceptoClave: leccion.titulo,
        leccionOrigenId: leccion.id,
        intervaloDias: 1,
        factorFacilidad: 2.5,
        proximaFechaRepaso: addDays(new Date(), 1)
      }
    });
    ```
  - Al día siguiente, la vista del niño en "Hoy Aprendo" incluye un mini-desafío de repaso de 5 minutos antes de iniciar la lección del día.

---

## 5. Gamificación: Integración con Cartas Holográficas de Ordo Diei

- Para evitar la fatiga de los exámenes y aplicar **Stealth Assessment** (evaluación encubierta):
  - Al aprobar un quiz con puntuación perfecta ($100\%$):
    - El sistema otorga fragmentos de una Carta de Santos o Virtudes de Ordo Diei (`MovimientoFragmento` con `tipo: "recompensa_estudio"`).
    - Se muestra la carta 3D animada con shaders holográficos mediante el componente existente `HoloCard.tsx`.
    - Esto incentiva al estudiante a buscar el 100% para coleccionar las cartas de grado 4 (`gradoReclamado: 4`).

---

## 6. Criterios de Aceptación

1. El video de YouTube se detiene automáticamente en el segundo exacto configurado para el checkpoint.
2. El estudiante no puede saltar la pregunta ni adelantar el video.
3. Responder correctamente reanuda la reproducción sin recargar la página.
4. El cálculo de puntaje valida correctamente el umbral del 70% para desbloquear la lección siguiente.
5. Al obtener 100%, se entregan fragmentos de cartas en la base de datos y se muestra la animación de `HoloCard`.
