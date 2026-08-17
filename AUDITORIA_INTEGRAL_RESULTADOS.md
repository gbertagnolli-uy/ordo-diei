# Auditoría Integral de Producto, UX, UI, Gamificación, Código y Calidad

**Family Tasker (Version 0.1.0)**
*Auditoría realizada por el Equipo Multidisciplinario (Product Manager Senior, UX/UI, Game Designer AAA, QA, Arquitectos y Seguridad)*

---

## 1. Resumen Ejecutivo

La plataforma "Family Tasker" tiene un núcleo funcional sólido y una premisa de gamificación atractiva, pero presenta múltiples oportunidades de mejora para alcanzar un estándar AAA. Actualmente, la arquitectura se basa fuertemente en un enrutamiento y lógica centralizados en endpoints como `/complete`, lo que genera riesgos de escalabilidad y mantenibilidad. Desde la perspectiva de UX/UI, la experiencia es funcional pero carece de pulido en microinteracciones, estados vacíos y feedback visual consistente (el sistema depende en exceso de la barra de notificaciones y modales genéricos).

En gamificación, las mecánicas base (rachas, bonos de tiempo, niveles calculados) existen, pero la "economía virtual" está incompleta, sin un bucle claro de "gasto" o recompensa a largo plazo que mantenga la retención más allá del nivel 5. Existen problemas técnicos inmediatos en la lógica de la zona horaria y condiciones de carrera en la base de datos que requieren atención prioritaria.

---

## 2. Hallazgos Críticos (Prioridad Inmediata)

*   **Vulnerabilidad de Estado (Race Conditions en Tareas):** La API `/api/tasks/[id]/complete` realiza cálculos de recompensas y luego una transacción. Múltiples peticiones concurrentes podrían evadir el check inicial `task.estado === "Completada"` si se envían simultáneamente, lo que permitiría a un usuario farmear puntos infinitos.
    *   *Solución:* Actualizar la cláusula `where` en `prisma.tarea.update` para incluir el estado previo esperado (`where: { id: taskId, estado: "Pendiente" }`).
*   **Problemas de Conexión de Base de Datos:** El entorno depende de un pooler remoto de Supabase que presenta fallos intermitentes (P1001/Tenant not found) debido a configuraciones de red y dependencia de SSL `rejectUnauthorized: false`.
    *   *Solución:* Migrar la configuración a variables de entorno más robustas, habilitar PgBouncer adecuadamente en Supabase y manejar reconexiones automáticas en el PrismaClient.
*   **Zona Horaria en Backend (Cron y Fechas):** Las validaciones de "Happy Hour" (17:00-19:00) y "Streaks" utilizan `new Date()` sin normalizar UTC o la zona horaria del usuario. Esto genera que los bonos dependan del reloj del servidor (Vercel) en lugar de la hora local del usuario.
    *   *Solución:* Estandarizar todas las operaciones de tiempo a UTC e inyectar la compensación de zona horaria del cliente en los headers de la petición.

---

## 3. Hallazgos UI (Interfaz de Usuario)

*   **Problema:** Dependencia excesiva de variables de color personalizadas (`var(--primary)`, `color-mix(...)`) de forma dispersa, lo que dificulta la implementación de un modo claro/oscuro fluido.
    *   *Mejora:* Consolidar el sistema de diseño en la configuración de Tailwind (`tailwind.config.js`) extendiendo el tema en lugar de usar clases arbitrarias pesadas.
*   **Problema:** La "NoticeBar" parpadea (`animate-pulse`) constantemente para estados como Happy Hour, lo cual es visualmente agotador tras varios minutos.
    *   *Mejora:* Reemplazar la animación continua con una microinteracción de entrada y un indicador estático elegante.
*   **Problema:** Densidad de información alta en los modales (ej. `ModalManager.tsx`). Modales muy largos no tienen scroll delimitado, rompiendo la vista en dispositivos móviles.
    *   *Mejora:* Implementar diseño responsivo estricto para componentes `Modal`, usando `max-h-[80vh] overflow-y-auto`.

---

## 4. Hallazgos UX (Experiencia de Usuario)

*   **Fricción de Activación:** El proceso de selección de usuario y uso del PIN en Numpad es repetitivo si se usa en dispositivos personales (el usuario debe autenticarse cada vez).
    *   *Mejora:* Ofrecer opción de "Mantener sesión iniciada en este dispositivo" usando cookies persistentes para el usuario habitual del dispositivo.
*   **Estados Vacíos (Empty States) Inexistentes:** Cuando no hay tareas asignadas (`MyTasksBoard.tsx`), la interfaz se ve vacía y rota, sin llamados a la acción (CTA) motivadores.
    *   *Mejora:* Diseñar ilustraciones divertidas para estados vacíos: "¡Día libre! Todas las tareas completadas."
*   **Falta de Feedback Inmediato:** Al aprobar una tarea, se recarga el componente o cambia de estado secamente.
    *   *Mejora:* Incorporar transiciones de Framer Motion al mover tarjetas de "Pendiente" a "Completado".

---

## 5. Hallazgos de Gamificación

*   **Economía Rota (Sink Faltante):** Los usuarios ganan puntos (`availablePoints`), pero no hay un sistema claro y visible de tienda o "Canje" estructurado en el frontend de recompensas (se entregan premios pero no hay catálogo de "compras" con puntos).
*   **Loops de Progreso Aislados:** El cálculo de nivel (`levelUtils.ts`) se basa en la raíz cuadrada de los puntos. Sin embargo, no se celebra activamente en la UI cuando un usuario está a punto de subir de nivel (falta el efecto "Near Miss" o "Casi ahí").
    *   *Mejora AAA:* Introducir un "Cofre de nivel" que se desbloquee visualmente al alcanzar metas clave (Nivel 5, 10, 20).
*   **Sistemas Repetitivos:** Las rachas ("Streaks") solo dan puntos extra. Deberían desbloquear elementos cosméticos persistentes (avatares, marcos, temas de la app).

---

## 6. Bugs Detectados

| Bug | Severidad | Reproducción | Solución |
| :--- | :--- | :--- | :--- |
| Race Condition en Puntos | CRÍTICA | Enviar 2 POST a `/api/tasks/[id]/complete` al mismo tiempo. | Update atómico con condición en el `where`. |
| Timezone Happy Hour Mismatch | ALTA | Completar una tarea a las 18:00 hora local, pero el servidor Vercel está en UTC (22:00 o 02:00). No se otorga bono. | Forzar envío de zona horaria desde el cliente y validar en backend. |
| Inconsistencia de Tipos en TS | ALTA | El objeto `user` y `currentUser` difieren en el store de Zustand (`authStore.ts`). | Estandarizar la interfaz de usuario en todo el frontend. |
| Expiración de Recurrencias | MEDIA | El script `/api/cron/daily` puede marcar tareas como no realizadas pero no avisa al usuario al día siguiente. | Crear un inbox/notificación de "Tareas perdidas de ayer". |

---

## 7. Features Incompletas (Work in Progress)

*   **Temporizador de Tareas (`Timer_Started_At`):** La base de datos tiene soporte para cronómetros, pero la API de pausa y reanudación no está completamente integrada con prevención de pérdida de datos si el usuario cierra el navegador.
*   **Aprobación Desvinculada del Nivel Real:** La API de `/approve` ahora calcula el nivel actual, pero no puede determinar con certeza si la aprobación *provocó* un aumento de nivel (porque no guarda el nivel previo en DB). Falta un historial de niveles.
*   **Notificaciones Push/Web:** El sistema confía plenamente en que la familia abra la app. Faltan recordatorios externos.

---

## 8. Detección de "Mockups de Cartón"

1.  **Botones de Compartir Logros:** Posibles botones de "Share" en los modales de celebración que no generan ninguna acción de Web Share API real.
2.  **Pantallas de Placeholder:** La sección de `dashboard/admin` tiene visualizaciones de estadísticas que no reflejan analíticas avanzadas, sino conteos básicos.
3.  **Avatares Dinámicos:** El campo `fotoUrl` existe, pero gran parte del tiempo se usa un fallback genérico; no hay interfaz clara para subir o gestionar avatares de manera intuitiva.

---

## 9. Inconsistencias Detectadas

*   **Terminología:** Se mezcla el español y el inglés en código e interfaces (ej. `isChecklist`, `timerStartedAt` vs `tiempoConsumidoTotalSeg`, `RolFamiliar`). La API devuelve errores en español y algunas variables están en inglés.
*   **Estados de Tareas:** Se manejan estados como `Esperando_Aprobacion` (string mágico) en lugar de utilizar puramente el `enum EstadoTarea` exportado por Prisma, propiciando errores tipográficos.

---

## 10. Auditoría de Código (Arquitectura y Calidad)

*   **Complejidad Ciclomática (Technical Debt):** Rutas como `/api/tasks/[id]/complete/route.ts` tienen más de 150 líneas de pura lógica anidada (cálculo de fechas, rachas, puntaje, transacciones de base de datos).
    *   *Refactor Necesario:* Mover toda la lógica de negocio de cálculo de recompensas a un servicio independiente (`src/services/TaskCompletionService.ts`).
*   **Acoplamiento Frontend/Backend:** El frontend asume directamente la forma del cálculo de puntos de la API, y si esta cambia, rompe el build (como se comprobó en los errores de TypeScript).
*   **Separación de Server/Client:** Errores previos por mezclar utilidades de servidor en componentes cliente. Faltan barreras arquitectónicas (como patrón `server actions` vs `api routes`).

---

## 11. Auditoría de Base de Datos

*   **Migraciones Faltantes (Índices):** La tabla `Tareas` se filtra constantemente por `asignadoId` y `estado` (`SELECT * FROM Tareas WHERE asignadoId = ? AND estado != 'Completada'`). Faltan índices compuestos en la DB para optimizar estas búsquedas.
    *   `@@index([asignadoId, estado])`
*   **Tablas Redundantes / Mal Estructuradas:** `Premio` y `PremioEntregado`. Falta una tabla central de "Catálogo de Recompensas" desvinculada de eventos de tiempo fijos.

---

## 12. Auditoría de Rendimiento

*   **Re-Renders de Zustand:** El uso de selectores generales en Zustand (ej. `const user = useAuthStore(state => state.currentUser)`) puede provocar renders si todo el estado cambia. Se recomiendan selectores atómicos.
*   **Memory Leaks y Event Listeners:** Revisar componentes con cronómetros (`MyTasksBoard.tsx`) para asegurar que los `setInterval` se limpien (clear) en los `useEffect` de desmontaje.

---

## 13. Auditoría de Seguridad

*   **IDs Incrementales Predecibles:** Uso de `autoincrement()` para las IDs de usuarios y tareas. Permite ataques de enumeración / Scraping (`/api/tasks/1`, `/api/tasks/2`).
    *   *Recomendación:* Migrar a UUIDs (cuidando la performance) o CUIDs.
*   **Protección de Rutas Incompleta:** Aunque se usa `session`, muchas rutas API no validan si el `session.user.id` tiene permisos de acceso *reales* sobre la `tareaId` solicitada (IDOR - Insecure Direct Object Reference).

---

## 14. Roadmap de Mejoras Priorizado

### CRÍTICO (Para resolver hoy)
1.  **Fix IDOR & Race Conditions:** Agregar validaciones de propiedad y actualización atómica (`where` pre-estado) en todas las rutas de Tareas (`/complete`, `/approve`, `/reject`).
2.  **Fix Timezones:** Parametrizar la zona horaria en las peticiones.

### ALTO (Para el próximo Sprint)
3.  **Refactor de la API de Gamificación:** Extraer la lógica de cálculo a servicios testeables con Jest/Vitest.
4.  **Optimización DB:** Crear índices para las queries más frecuentes en Tareas y Usuarios.

### MEDIO (Próximo Mes)
5.  **Revisión UX/UI de "Empty States":** Agregar ilustraciones y mensajes.
6.  **Sistema de Tienda:** Consolidar la economía virtual para usar los "Locked Points / Available Points".

### BAJO / OPTIMIZACIONES FUTURAS (Visionario)
7.  **Migrar IDs a UUID.**
8.  **Soporte Multi-Hogar:** Permitir separar la lógica de base de datos usando "Tenant ID" si la app se hace pública.
9.  **Animaciones AAA:** Mejorar la celebración de subida de nivel usando Rive o Lottie.

---
*Fin del Reporte*
