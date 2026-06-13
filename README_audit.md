# Auditoría y Mejoras de Family Tasker

Esta auditoría es el resultado del análisis de todo el producto (UI, UX, Gamificación, Código, Base de Datos, Rendimiento y Seguridad) con el fin de priorizar mejoras que lleven la aplicación al nivel de productos AAA.

## 1. Resumen Ejecutivo
*Family Tasker* tiene bases sólidas con Next.js, Tailwind y Prisma, pero carece de un pulido que maximice el engagement y la motivación del usuario final. Existe una desconexión entre la economía virtual y el bucle de gamificación; además de varios bugs funcionales menores, mockups y problemas de deuda técnica.
Prioridad absoluta: Arreglar bugs de lógica en la recompensa y finalizar flujos clave para tener un Minimum Viable Product (MVP) estable y adictivo.

## 2. Hallazgos Críticos (Bugs que rompen la app)
* **API de Aprobación Fallida**: La API `/api/tasks/[id]/approve` no podía leer la variable `asignado` lo que rompía la acreditación de puntos. *Solucionado* refactorizando la consulta a base de datos.
* **Componente `ModalManager`**: Exportaba una función que re-definía `getLevelInfo` de forma innecesaria lo que causaba un error de compilación de TypeScript. *Solucionado*.
* **`NoticeBar` Tipos Inválidos**: El componente presentaba tipos inconsistentes para los `messageType` ("happyhour" vs "happyHour"). *Solucionado*.
* **`MyTasksBoard` Contexto Perdido**: No importaba `useAuthStore` que es crítico para el filtro de tareas. *Solucionado*.
* **API `Complete` lógica rota**: Había cierres erróneos de corchetes e variables no inicializadas en el bono del checklist. *Solucionado*.

## 3. Hallazgos UI (Interfaz de Usuario)
* **Jerarquía visual plana**: Falta de diferenciación más notable entre tareas importantes (urgentes) y tareas secundarias.
* **Consistencia visual**: El uso intensivo de variables custom (ej: `var(--surface-container-low)`) en vez de una paleta estandarizada de Tailwind hace difícil el mantenimiento.
* **Animaciones**: Confetti existe pero los modales aparecen de forma brusca. Se deberían aplicar transiciones de Framer Motion de manera consistente (fade-in, slide-up).

## 4. Hallazgos UX (Experiencia de Usuario)
* **Falta de Onboarding**: Los usuarios nuevos (niños) pueden no entender de inmediato cómo tildar tareas. Un tour interactivo guiado mejoraría esto.
* **Retroalimentación ambigua**: Aunque se muestra un modal de éxito, la visualización en la tabla no da la satisfacción inmediata de que la tarea *desaparezca* fluidamente (falta drag and drop / swipe gestures).
* **Demasiados clics**: El proceso para tildar algo del checklist y enviarlo debería ser un solo paso.

## 5. Hallazgos de Gamificación (Nivel AAA)
* **Sistemas desaprovechados**: La economía virtual (puntos y estrellas) existe, pero no hay un sistema claro de "Tienda" para gastarlos (solo una mención a premios).
* **Mejoras aplicadas**:
    - Implementado un "Happy Hour" real (multiplicador x1.5 si se completa entre las 17:00 y 19:00).
    - Agregado "Surprise Logic" (pequeña posibilidad de ganar una estrella o recompensa sorpresa al completar a tiempo) para crear recompensas variables (sistema de tragamonedas que retiene usuarios).
    - Agregada bonificación por "Checklist Completado".

## 6. Bugs Detectados (Menores pero molestos)
* **Racha (Streak)**: El cálculo podía romperse si el usuario cambiaba de zona horaria (las fechas asumen la hora del servidor).
* **Feedback de Tarea**: A veces se marcaba como 'retraso' cuando era el mismo día pero con unos segundos de diferencia.

## 7. Features Incompletas
* Tienda de recompensas (Rewards Shop) totalmente implementada para gastar "estrellas" y "puntos".
* Avatares dinámicos basados en nivel (ahora es solo un icono).
* Leaderboard familiar en tiempo real.

## 8. Mockups de Cartón
* Varios botones de "Ver detalles" o "Notificaciones" en el header podrían no estar mapeados a modales reales.
* El "NoticeBar" tenía condiciones confusas donde `happyhour` pisaba la condición de "evening" de forma inconsistente.

## 9. Inconsistencias
* Nombramiento mixto: Spanglish (mezcla de `rewardPoints`, `estadoFinal`, `tiempoEjecucionEstimadoSeg`).
* La tienda de Zustand almacena el usuario actual en `currentUser` en vez de un modelo genérico `user`, lo cual confunde con otras librerías.

## 10. Problemas de Código y Refactors
* El archivo de la API `route.ts` de complete era un monolito inmenso (200+ líneas). Necesitaría modularizarse (ej: `calculateRewardPoints(task, user)`).
* Deuda Técnica: Uso extensivo de `any` en tipados (`MyTasksBoard.tsx`), lo que reduce la protección de TS.

## 11. Base de Datos
* No se detectan índices de rendimiento faltantes en los logs, pero para escalabilidad se debería indexar `estado` y `asignadoId` en la tabla Tareas.

## 12. Rendimiento
* Hay componentes 'use client' pesados que re-renderizan todo el board cuando cambia una sola tarea. Usar memoization (`React.memo`) ayudaría.
* Vercel y Supabase PostgreSQL sufren de desconexiones (P1001), por lo cual el pool config `ssl: { rejectUnauthorized: false }` es fundamental.

## 13. Seguridad
* Posibles problemas de autorización en las APIs de completado de tareas: cualquier usuario autenticado podría (en teoría) completar la tarea de otro si conoce el ID y los controles no son suficientes. (El control `if (user.id !== tarea.asignadoId && no es padre)` debería reforzarse explícitamente en todas las rutas).

## 14. Roadmap y Quick Wins
* **Quick Win (1):** Implementar animaciones a todos los modales para una experiencia pulida. (Se requiere poco esfuerzo con Framer Motion).
* **Quick Win (2):** Mostrar el "Surprise" ganado en el UI con un popup glorioso de Canvas Confetti especial.
* **Largo Plazo:** Re-estructurar el código a Clean Architecture para separar los casos de uso (Ej: `ApproveTaskUseCase`) del Next.js Router.
