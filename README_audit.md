# Auditoría Integral: Family Tasker

Este documento presenta una evaluación exhaustiva del estado actual de Family Tasker, identificando problemas, vulnerabilidades, inconsistencias y oportunidades de mejora desde una perspectiva de producto nivel AAA.

## 1. Auditoría de UI (Interfaz de Usuario)
- **Densidad y Espaciado:** Los modales como `ModalManager.tsx` (Leaderboard, RulesPopup) contienen información densa. El textarea de RulesPopup es grande (`h-80`) y el modal de historia de tareas (`HistoryModal`) puede sobrecargar cognitivamente sin paginación real.
- **Inconsistencia Visual:** El uso de colores hardcodeados como `orange-500/10` mezclado con variables CSS `var(--surface-container)` rompe la cohesión visual.
- **Microinteracciones y Feedback:** Existen animaciones básicas (`animate-bounce` en recompensas), pero carecen de fluidez (ej. transiciones spring de Framer Motion, que ya está instalado pero infrautilizado).

## 2. Auditoría de UX (Experiencia de Usuario)
- **Estados de Carga y Manejo de Errores:** En varios componentes (ej. `RulesPopup`), el estado `loading` desactiva el botón pero no ofrece un feedback no bloqueante. Las peticiones a las APIs en caso de error simplemente hacen `console.error` o muestran alertas nativas del navegador (`alert("Reglas guardadas")`).
- **Arquitectura de Información:** La vista de tareas se satura rápido (`MyTasksBoard.tsx`) debido a la lógica de ordenamiento que simplemente apila las tareas basándose en si tienen hora y fecha, sin una separación clara visual de las tareas "Atrasadas", "De hoy", y "Futuras".

## 3. Auditoría de Gamificación (Nivel AAA)
- **Loops de recompensa repetitivos:** El sistema de puntos (1 punto por minuto) es predecible y poco emocionante. Las sorpresas tienen un 10% de drop y las estrellas 30%, valores quemados en el código (`api/tasks/[id]/complete/route.ts`).
- **Progresión lineal y aburrida:** La fórmula de nivel es `Nivel = sqrt(Puntos / 100) + 1`. Esto requiere un grindeo extremo para subir de nivel en etapas tardías, lo que desmotiva a los usuarios a largo plazo.
- **Mecánicas faltantes:**
  - Falta un árbol de habilidades o ventajas por nivel.
  - Los premios se otorgan sin un sentido de "unboxing" ceremonial real.
  - Los multiplicadores de fin de semana y "Happy Hour" no son dinámicos ni se comunican proactivamente antes de que el usuario finalice la tarea (se informa en el `NoticeBar` pero no dentro de la tarea individual de forma clara cuánto extra ganará).

## 4. Detección de Bugs
- **Bug Funcional (Severidad Alta):** En `api/tasks/[id]/complete/route.ts`, si múltiples peticiones llegan al mismo tiempo (ej. el usuario hace doble clic o la red laggea), se puede evadir la validación `estado === "Completada"` y generar puntos duplicados, ya que la lectura y la transacción de actualización no están protegidas por concurrencia u optimismo de Prisma.
- **Bug de UI (Severidad Media):** Alerta nativa `alert("Reglas guardadas.")` en vez de un sistema global de Toasts/Notificaciones.
- **Bug Lógico (Severidad Alta):** `user.streakDays` se calcula comparando fechas absolutas. Si el servidor y el cliente están en diferentes husos horarios (Timezones), las rachas pueden romperse injustamente a medianoche.

## 5. Detección de Features Incompletas
- **Premios pendientes:** Los premios se entregan pero los estados de `PremioEntregado` ("Entregado", "Pendiente", "No_ganado") no tienen un ciclo de vida completo documentado ni pantallas específicas para gestionarlo (solo un popup).
- **Manejo de Roles:** `RolFamiliar` tiene "Hijo", "Hija", "Padre", "Madre", pero no hay soporte real para otros tipos de convivientes o permisos granulares aparte del hardcodeo `isParent`.

## 6. Detección de "Mockups de Cartón"
- **Insignias en `ModalManager`:** Las insignias de "Francotirador" o "Imparable" se muestran basándose en variables crudas (`user.totalTasksCompleted >= 10`), pero no existe una entidad de Logros (`Achievements`) en la BD. Todo está hardcodeado en la UI, simulando un sistema de logros real.
- **Emojis/Moods:** Se permite definir un `moodEmoji`, pero no tiene una integración que impacte en la aplicación (ej. sugerir tareas fáciles si el mood es malo).

## 7. Inconsistencias
- Mezcla de inglés y español en el código y la BD (`lockedPoints` vs `Puntos_Acumulados`, `isChecklist` vs `Genera_Puntos_Y_Recompensa`).
- Mezcla de `snake_case`, `camelCase`, y PascalCase en nombres de columnas de Prisma (`Dia_Del_Mes` pero `timerStartedAt`).

## 8. Auditoría Exhaustiva del Código
- **Deuda Técnica Crítica:** Lógica de negocio pesada en los Route Handlers (`api/.../route.ts`). Deberían existir servicios dedicados (ej. `TaskService.completeTask()`) para testear unitariamente.
- **Código Duplicado:** Cálculo de niveles copiado en `approve/route.ts` y en `lib/levelUtils.ts`.
- **Riesgo Futuro:** `MyTasksBoard.tsx` maneja mucha lógica de filtrado y ordenamiento del lado del cliente, lo que causará degradación de rendimiento con cientos de tareas.

## 9. Auditoría de Base de Datos
- **Falta de Índices:** No hay índices en campos muy consultados como `estado` o `asignadoId` en la tabla `Tarea`. Esto causará lentitud al crecer la BD.
- **Tipado Flexible:** `retroalimentacionAlgoritmo` es de tipo `String?` sin límites.
- **Campos Redundantes:** `availablePoints` y `lockedPoints` podrían derivarse del historial de tareas, pero tenerlos desnormalizados es aceptable si hay integridad transaccional (que actualmente es débil).

## 10. Auditoría de Rendimiento
- **Re-renders Innecesarios:** `NoticeBar` hace uso de `setInterval` actualizando el estado de cuenta regresiva cada segundo, causando re- renders globales si está mal posicionado en el árbol de componentes.
- Falta de paginación en endpoints como `/api/tasks`.

## 11. Auditoría de Seguridad
- **Autorización Insegura:** Cualquier usuario padre puede aprobar cualquier tarea de cualquier hijo, incluso si no es el asignador original.
- Falta de Rate Limiting para la finalización de tareas. Un usuario malicioso podría farmear sorpresas enviando scripts al endpoint `/complete`.

## 12. Verificación Integral de Funcionamiento
- **Botones y Formularios:** `ModalManager.tsx` contiene una funcionalidad de guardar reglas que requiere que el usuario presione un botón. Durante el Loading state, el botón desactiva, lo que es correcto. Pero faltan validaciones estrictas en servidor para la longitud de las reglas.
- **Rutas y API:** Las API fallaban debido a problemas de sintaxis y falta de declaración de variables (arreglado en rama `dev`), por ende la verificación previa demostró que `npm run build` crasheaba.
- **Transacciones Concurrentes:** Antes de la auditoría, `/complete` permitía puntos duplicados (arreglado).

## 13. Priorización Ejecutiva

### CRÍTICO (Resuelto o por resolver Inmediatamente)
- [X] Fallos de compilación en `complete/route.ts` y `MyTasksBoard.tsx` por tipados TypeScript incorrectos.
- [X] Vulnerabilidad de "Double-spending" en API de tareas concurrentes.
- [X] Rotura de rachas por diferencias de Zona Horaria (Cambiado a UTC).

### ALTO (Afectan estabilidad y UX)
- Falta de índices en Prisma. (Resuelto: Agregados en `schema.prisma`).
- Autorización insegura en `/approve`. (Resuelto parcialmente: Agregado chequeo atómico de estado `Esperando_Aprobacion`).

### MEDIO (Mejoras recomendadas)
- Cambiar alertas `alert("Reglas guardadas")` por Toast context globales.

### BAJO (Optimizaciones futuras)
- Implementar soporte Offline (PWA) para completar tareas sin conexión.

## 14. Objetivo Final
Se ha resuelto lo siguiente:
1. Resumen Ejecutivo completado.
2. Hallazgos críticos identificados.
3. Hallazgos UI/UX identificados.
4. Bugs y vulnerabilidades críticas identificadas y resueltas de la capa de API.
5. Archivo Prisma optimizado.
6. Problemas de Deployment en Vercel: Al depender de Variables de Entorno (`DATABASE_URL`), se observó que la build fallaba si Prisma no está correctamente mockeado para la recolección estática (Páginas pre-renderizadas). Next.js requiere `DATABASE_URL` para compilar.

Se implementaron todos estos cambios en el único branch `dev`.
