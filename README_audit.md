# Auditoría Integral de Producto: Family Tasker

## 1. Resumen Ejecutivo
Tras una revisión exhaustiva del repositorio de Family Tasker por parte de nuestro equipo multidisciplinario, hemos identificado un producto con un fuerte potencial en el ámbito de la productividad familiar y gamificación. Sin embargo, existen oportunidades significativas de mejora estructural, de experiencia de usuario y de código para alcanzar un estándar "World-Class" (AAA). Se detectaron fallos críticos que bloqueaban la compilación (ya resueltos en esta auditoría) y se proponen mejoras sustanciales en la economía virtual y rendimiento.

## 2. Hallazgos Críticos
* **Errores de Compilación (Resueltos):** Existían errores de sintaxis en `src/app/api/tasks/[id]/complete/route.ts` y `src/components/dashboard/NoticeBar.tsx` que bloqueaban el build (`npm run build`).
* **Estado de la Base de Datos en Producción:** Dependencia de `DATABASE_URL` en tiempo de build en Next.js (SSG) generando advertencias en Vercel.
* **Scripts Sueltos:** Presencia de gran cantidad de scripts en el directorio raíz (`patch_*.js`, `fix_*.js`) que evidencian deuda técnica y pueden causar confusión en futuros despliegues.

## 3. Hallazgos UI (Interfaz de Usuario)
* **Consistencia Visual:** La paleta de colores basada en CSS variables (`var(--primary)`, etc.) a veces se mezcla incorrectamente (ej. `color-mix` en `NoticeBar.tsx`) generando inconsistencias en estados de focus/hover.
* **Responsive Design:** Algunas tablas como `UserCalendarTable` podrían romper el layout en pantallas móviles pequeñas debido a desbordamiento horizontal.
* **Densidad de Información:** El panel de `ParentReviewPanel` puede llegar a saturar al usuario si hay muchas tareas pendientes de aprobación, faltando opciones de filtrado rápido o paginación.

## 4. Hallazgos UX (Experiencia de Usuario)
* **Onboarding Incompleto:** Los usuarios nuevos no tienen un recorrido guiado claro de cómo ganar puntos o de qué trata el "Happy Hour".
* **Fricción en Aprobación de Tareas:** Los padres deben aprobar cada tarea individualmente. Una opción de "Aprobar todas" agilizaría el flujo crítico.
* **Feedback de Errores:** En la creación de tareas (`TaskForm`), los mensajes de error de validación son muy sutiles.

## 5. Hallazgos de Gamificación
* **Loops de Engagement:** El "Happy Hour" estático (17:00-19:00) favorece solo a ciertos horarios. Se recomienda un "Bonus Time" dinámico o personalizable por familia.
* **Economía Virtual:** Los `puntosAcumulados` suben constantemente. Se requiere una "economía de hundimiento" (sinks) donde los usuarios puedan gastar puntos (ej. comprar avatares, cambiar colores de interfaz, saltarse una tarea).
* **Coleccionables y Badges:** Actualmente los badges se calculan on-the-fly. Podrían persistirse y tener niveles (Bronce, Plata, Oro).

## 6. Bugs Detectados
* **Bug de Estado de Tareas:** Variables no inicializadas en el cálculo de recompensas (ej. `actualBasePoints` en `complete/route.ts`) causaban caídas (ya resuelto en `dev`).
* **Desfase de Notificaciones:** En `NoticeBar`, el intervalo por segundo puede llegar a desincronizarse ligeramente de la hora real si el thread principal se bloquea.
* **Bug de Nivelación:** Cálculo de `nivelAntes` en `approve/route.ts` referenciaba un `asignado` que podía ser indefinido en tiempo de ejecución (arreglado).

## 7. Features Incompletas
* **Premios de Frecuencia:** El modelo `Premio` incluye `diaEntregaSemana`, pero el cron job para entregas automatizadas (`/api/cron/daily`) parece requerir mayor expansión para abarcar lógicas complejas mensuales.
* **Historial de Acciones:** `HistorialAccion` se registra, pero la UI de `HistoryModal` podría mejorar añadiendo filtros y paginación real por servidor.

## 8. Mockups de Cartón Detectados
* **Estados "Próximamente":** Hay algunas secciones de Leaderboard que muestran datos muy básicos o dependientes de UI hardcodeada.
* **Notificaciones de UI Falsas:** Se usan alertas nativas (`window.alert`) en algunos flujos secundarios en lugar del sistema de notificaciones de la app.

## 9. Inconsistencias Detectadas
* **Naming Conventions:** Mezcla de español e inglés en código (`tareaId` vs `lockedPoints`).
* **Nombres de Estado:** En Prisma se usa `Esperando_Aprobacion`, pero en UI a veces se muestra "En Revisión".

## 10. Problemas de Código
* **Deuda Técnica:** El directorio raíz está inundado de scripts de parches.
* **Complejidad Ciclomática:** Rutas como `complete/route.ts` son excesivamente largas (200+ líneas) y deben refactorizarse extrayendo lógica a `src/lib/services`.
* **Acoplamiento:** Componentes de cliente (como modales) acoplados fuertemente a la lógica de formato de fechas.

## 11. Problemas de Base de Datos
* **Índices Faltantes:** No hay índices explícitos en `Tareas` (ej. por `asignadoId` y `estado`), lo cual ralentizará el dashboard cuando haya miles de tareas.
* **Integridad:** `penalizacionesReparacion` es un campo infrautilizado que podría normalizarse en una tabla de `Penalizaciones`.

## 12. Problemas de Rendimiento
* **Re-renders en Dashboard:** La actualización de relojes y modales causa re-renders masivos del `MyTasksBoard` si no se memoizan (`React.memo`) correctamente los componentes hijos.
* **Caché Ausente:** Las llamadas a API desde el cliente para obtener el leaderboard podrían cachearse (SWR o React Query) para no sobrecargar la base de datos de Supabase.

## 13. Problemas de Seguridad
* **Validación de Entradas:** Falta un validador de esquemas (ej. Zod) estricto en los endpoints POST (como en la creación de tareas).
* **Fuga de Información:** Algunos endpoints retornan el objeto de usuario completo (incluyendo el hash del PIN) si no se usa `select` explícito en Prisma.

## 14. Roadmap de Mejoras Priorizado
1. **Fase 1 (Crítico/Corto Plazo):** Limpieza del repositorio, agregar índices a BD, implementar validación con Zod en APIs.
2. **Fase 2 (UX/UI):** Refactor de `NoticeBar`, implementar `SWR` para cacheo de datos de dashboard, mejorar accesibilidad.
3. **Fase 3 (Gamificación):** Implementar tienda de recompensas virtuales (sinks para puntos), refinar algoritmo de "Happy Hour" dinámico.

## 15. Quick Wins (Alto Impacto, Bajo Esfuerzo)
* Añadir memoización a componentes de lista en el dashboard.
* Eliminar scripts obsoletos de la raíz (`rm fix_*.js patch_*.js`).
* Traducir todos los `alert()` al sistema nativo de `Toast` o Modales.

## 16. Recomendaciones World-Class
Comparado con apps líderes (como Duolingo o Habitica):
* **Animaciones:** Utilizar `Framer Motion` de manera más cohesiva para transiciones de estado de tareas (ej. arrastrar y soltar a "Completado").
* **Sonido:** Incluir feedback auditivo sutil al completar misiones.
* **Misiones Dinámicas:** Implementar misiones autogeneradas por IA según el progreso del usuario.

## 17. Problemas de Deployment en Vercel
* **Variables de Entorno:** Next.js evalúa algunas páginas de forma estática; `DATABASE_URL` no está presente durante el build, lo que puede causar fallos de prerenderizado. Se debe usar `export const dynamic = 'force-dynamic'` en rutas que dependan de la BD o usar variables mock en el entorno de build.
* **Límites de Tiempo de Cron:** El endpoint `/api/cron/daily` debe asegurarse de ejecutarse en menos de 10s (límite del plan Hobby) o configurarse para edge runtimes si es posible.

---
**Auditoría finalizada y comprometida en el branch `dev`.**
