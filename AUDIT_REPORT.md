# Auditoría Integral de Producto, UX, UI, Gamificación, Código y Calidad (Family Tasker)

Esta auditoría exhaustiva ha sido realizada por un equipo multidisciplinario para evaluar el estado actual de la plataforma y proponer mejoras alineadas con los más altos estándares de la industria.

## 1. Auditoría de UI (Interfaz de Usuario)

### Hallazgos
*   **Consistencia Visual y Colores:** El proyecto depende fuertemente de variables CSS personalizadas (`var(--primary)`, `var(--surface-container)`) y la función `color-mix`. Si bien es moderno, los valores arbitrarios en Tailwind en múltiples componentes (como `MyTasksBoard.tsx` y `NoticeBar.tsx`) dificultan el mantenimiento a gran escala y rompen con las convenciones estándar de Tailwind, haciendo el código verboso y denso visualmente para los desarrolladores.
*   **Densidad de Información:** Modales como el `ModalManager` y `UserStatsPopup` están sobrecargados de insignias (Misión 10, Fuego x3, etc.) calculadas "al vuelo", generando componentes muy largos e intrincados que podrían dividirse en componentes de interfaz más modulares para evitar sobrecarga cognitiva.
*   **Animaciones y Microinteracciones:** El uso de `canvas-confetti` y las etiquetas estáticas brindan un buen feedback, pero la plataforma carece de transiciones fluidas de Framer Motion en componentes clave, lo que reduce la calidad percibida en comparación con productos líderes de la industria.

### Mejoras Propuestas
*   Migrar las clases de Tailwind de colores arbitrarios (`[color-mix(in-srgb,var(--primary)_10%,transparent)]`) a plugins o utilidades configuradas en `tailwind.config.ts` o el equivalente en Tailwind v4 para estandarizar la paleta de colores.
*   Modularizar el sistema de modales y de insignias en pequeños componentes de React (ej. `<Badge level={10} />`).

## 2. Auditoría de UX (Experiencia de Usuario)

### Hallazgos
*   **Sobrecarga Cognitiva:** Componentes de notificaciones (`NoticeBar`) y los múltiples estados de tareas (Completada, Aprobada, Esperando_Aprobacion) presentan una curva de aprendizaje pronunciada para el usuario.
*   **Claridad de Acciones:** En `MyTasksBoard`, la mezcla de tareas pendientes, completadas y en revisión dentro de un mismo espacio sin jerarquía de filtros clara puede confundir al usuario final sobre "qué es lo siguiente que debe hacer".
*   **Manejo de Errores:** Errores de las APIs (como fallos al completar) a veces solo envían un string genérico que la UI debe interpretar.

### Mejoras Propuestas
*   Implementar un onboarding interactivo para explicar las reglas, estados de tareas (esperando aprobación) y el sistema de puntos.
*   Pestañas separadas (Tabs) en el dashboard: "Para Hoy", "En Revisión", y "Completadas".

## 3. Auditoría de Gamificación

### Hallazgos
*   La lógica de recompensas, streaks y bonos (Happy Hour, Checklist) es **robusta** pero extremadamente centralizada en la ruta `/api/tasks/[id]/complete/route.ts`.
*   **Loops de Recompensa:** Se calculan multiplicadores interesantes (Happy Hour de 17h a 19h y de fin de semana), pero el usuario carece de visibilidad clara antes de completar la tarea. El `NoticeBar` hace un buen trabajo avisando, pero se detectaron inconsistencias de tipado en sus alertas (`"happyHour"` vs `"happyhour"`).
*   **Insignias Dinámicas (Logros):** Actualmente se computan sobre el estado crudo (stats de tareas en el cliente) en lugar de guardarse en base de datos.
*   **Economía Virtual:** Puntos "Locked" (Esperando Aprobación) vs "Available". Excelente concepto, fomenta la motivación a corto plazo pero necesita de la aprobación de un padre (fricción en la cooperación social).

### Mejoras AAA Propuestas
*   Desacoplar la lógica de Gamificación de la ruta API de completar tareas y extraerla a servicios/lib (ej: `lib/gamificationEngine.ts`).
*   Almacenar "Logros Desbloqueados" en la DB (`UserAchievements`) con un timestamp, permitiendo animaciones y celebraciones unificadas la *primera vez* que ocurren, no cada vez que renderiza el modal.

## 4. Detección de Bugs (Corregidos)

*   **CRÍTICO - Fallo de Compilación (Sintaxis):** `src/app/api/tasks/[id]/complete/route.ts` tenía bloques `{}` no cerrados, lo que causaba un fallo total en Turbopack. (✅ Corregido).
*   **CRÍTICO - Errores de Tipado y Múltiples Declaraciones:** `estadoFinal` estaba declarado múltiples veces, y variables como `basePoints`, `streakBonus` generaban errores `Cannot find name`. (✅ Corregido).
*   **ALTO - Race Conditions en BD:** Las actualizaciones de estado en `approve/route.ts` y `complete/route.ts` no validaban el estado previo, permitiendo "doble completado" si un usuario o red enviaba peticiones simultáneas, resultando en minado infinito de puntos. (✅ Corregido usando clausulas transaccionales restrictivas `where: { id, estado: expectedState }`).
*   **ALTO - Mismatch en `NoticeBar`:** Conflictos de tipado ("happyHour" vs "happyhour") rompían el build. (✅ Corregido).
*   **MEDIO - ReferenceError en MyTasksBoard:** Faltaba importar `useAuthStore` resultando en que la UI no cargara para ciertos estados. (✅ Corregido).

## 5. Detección de Features Incompletas

*   **Sistema de Sorpresas (SurpriseAwardPopup):** Se ve en `ModalManager` la funcionalidad de `SurpriseAwardPopup` pero depende de `/api/premios/entregar`, el cual podría tener deficiencias en su implementación si la BD no gestiona correctamente los inventarios de recompensas.

## 6. Detección de "Mockups de Cartón"

*   **Reglas (RulesPopup):** El componente carga texto estricto desde una API, pero si no responde, carga datos hardcodeados (`"1. Sé respetuoso..."`).
*   Insignias en `UserStatsPopup` son parcialmente "mockups" en el sentido de que no hay un modelo de base de datos que respalde la tenencia del logro, se calculan condicionalmente en cada render.

## 7. Detección de Inconsistencias

*   **UTC vs Local Time:** Las alertas de Happy Hour utilizan `.getHours()` local en la API de completado y `.getHours()` local en el `NoticeBar`. Si el servidor (en Vercel) y el cliente están en distintas zonas horarias, el bono del servidor no coincidirá con el banner del cliente. Esto es una inconsistencia crítica.
*   **Permisos de Aprobación:** En el frontend, el padre aprueba, pero la validación se hace string a string (`rolFamiliar === "Padre"` o `"Madre"`).

## 8. Auditoría Exhaustiva del Código

*   **Acoplamiento y Complejidad:** El controlador de `complete/route.ts` es un **God Object/Function**. Calcula rachas, premios, bonos temporales, bonos de checklist, verifica periodo de gracia y actualiza base de datos.
*   **Dependencias y Arquitectura:** Es imperativo refactorizar y mover la lógica de dominio (ej: cálculo de rachas) a `src/lib/`.

## 9. Auditoría de Base de Datos

*   Se requiere validar `npx prisma generate`. Ya que el entorno Supabase falla ocasionalmente y en desarrollo puede haber desincronizaciones entre el schema de BD y el Prisma Client generado.
*   **Recomendación:** Agregar modelos dedicados como `Achievement` y `TransactionHistory` para auditar a nivel base de datos los cambios de puntos y bloqueos.

## 10. Auditoría de Rendimiento

*   **Re-renders (React):** Modales que usan Zustand y variables calculadas localmente desencadenarán re-renders masivos si la matriz de tareas es muy grande. `tareas.map` en los modales debería estar memoizado, y usar paginación virtual para listas grandes.
*   **Caché y SSR:** El uso constante de peticiones POST y GET dinámicas sin un correcto uso de caché de Next.js App Router (Turbopack) penaliza la carga inicial.

## 11. Auditoría de Seguridad

*   Las rutas de API validan `getSession()`, pero en `complete/route.ts` se lee `task.asignadoId` del registro. Si un usuario (con sesión válida) completa la tarea usando su ID pero la tarea pertenece a otro miembro, el código actual no previene la acción siempre que la tarea exista. **Vulnerabilidad (IDOR)** potencial si no se cruza `session.user.id` con `task.asignadoId`.

## 12. Verificación Integral de Funcionamiento

*   El build general de Next.js fallaba por los diversos problemas comentados arriba. Al resolverse, la integración funciona pero restan las correcciones subyacentes recomendadas.

## 13. Priorización Ejecutiva

### CRÍTICO
1.  Solucionar vulnerabilidades potenciales de tipo IDOR (asegurar que un usuario normal sólo interactúa con sus tareas).
2.  Desacoplar `.getHours()` local y migrar todas las lógicas de fechas y streaks a UTC o usar Moment/date-fns asegurando la misma TimeZone que el servidor/cliente.

### ALTO
1.  Extraer el enorme bloque de cálculo de Gamificación de las APIs a librerías de utilidad testeables con Unit Tests.
2.  Normalizar los strings Hardcodeados (roles "Padre"/"Madre").

### MEDIO
1.  Refactorizar la UI para usar `tailwind.config.ts` o temas de CSS variables nativos de Tailwind v4 y evitar colores CSS mezclados en el render.
2.  Implementar paginación virtual en los modales largos.

### BAJO
1.  Mejorar las animaciones con Framer Motion en reemplazo de efectos bruscos.
2.  Crear modelo de `Achievements` en la base de datos para no recalcular insignias en caliente.

## 14. Roadmap y Resumen

Hemos documentado detalladamente el estado actual del producto, priorizado los cambios requeridos y procedido a limpiar los errores **críticos** que impedían la compilación en Vercel (errores en TypeScript y dependencias en Turbopack). El paso a seguir es ejecutar el Roadmap priorizando primero Seguridad y Refactoring de Código de Gamificación.
