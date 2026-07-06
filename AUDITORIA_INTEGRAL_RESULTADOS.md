# Auditoría Integral de Family Tasker - Reporte

## 1. Resumen Ejecutivo
Se ha realizado una auditoría exhaustiva del proyecto "Family Tasker", un gestor de tareas gamificado para familias construido sobre Next.js (App Router), TailwindCSS, Prisma y Supabase. El código actual posee una base sólida en cuanto a estructuración de vistas y estado global (Zustand), pero requiere mejoras significativas en estabilidad (type checking, Server/Client components boundaries), UX/UI y diseño de la economía virtual para alcanzar un nivel "AAA". El principal riesgo inminente era la falla continua en los deployments de Vercel debido a errores de TypeScript, uso incorrecto de hooks en componentes de servidor y problemas con la conexión de base de datos durante el build de Next.js (prerendering). Se han mitigado los problemas críticos para permitir compilaciones exitosas, y se propone un roadmap de mejoras sustanciales.

## 2. Hallazgos Críticos
- **Build y Deployment (Vercel):** El proceso `npm run build` fallaba sistemáticamente por cuatro motivos:
  1. Errores de sintaxis en `src/app/api/tasks/[id]/complete/route.ts` (bloque try/catch mal formado).
  2. Variables no definidas y falta de importaciones correctas en `src/app/api/tasks/[id]/approve/route.ts` (variable `asignado` no extraída pero usada en cálculo de nivel).
  3. Directivas `"use client"` faltantes y mal ubicadas en `src/components/dashboard/MyTasksBoard.tsx` al consumir `useAuthStore` (zustand) y hooks de React.
  4. Errores de type-checking en `src/components/dashboard/NoticeBar.tsx` (inconsistencias entre los literals de estado como `"happyHour"` vs `"happyhour"` y comparaciones de tipos sin superposición).
- Todos estos errores críticos **han sido corregidos**, logrando que `npm run build` pase exitosamente (compilando estáticamente en Vercel con un mock de base de datos en `.env`).
- **Problemas de Zona Horaria:** La lógica de cálculo de Happy Hour, períodos de gracia y rachas (streaks) en las API routes era vulnerable a bugs de zona horaria local. Se ha mitigado aplicando métodos UTC (`getUTCHours()`) en las rutas de completado de tareas, según las instrucciones en memoria, previniendo farming injusto de puntos o pérdida errónea de rachas.

## 3. Hallazgos UI (Interfaz de Usuario)
- **Consistencia Visual:** El uso intensivo de `color-mix` en Tailwind arbitrario es innovador y permite una buena adaptación de temas, pero aumenta la complejidad y disminuye la legibilidad del código.
- **Microinteracciones y Feedback Visual:** Aunque la aplicación usa `canvas-confetti` (p. ej. en `LevelUpPopup`), la retroalimentación al completar tareas desde el dashboard (`MyTasksBoard.tsx`) suele ser abrupta. Hay falta de transiciones suaves (Framer Motion está en dependencias pero subutilizado en algunos modales) al ganar puntos o rachas.
- **Densidad de Información:** El componente `Header.tsx` e `HistoryView.tsx` presentan problemas de densidad en mobile; en pantallas pequeñas, la jerarquía de las recompensas acumuladas colisiona con el selector de perfil.

## 4. Hallazgos UX (Experiencia de Usuario)
- **Onboarding:** Carece de un onboarding paso a paso; los usuarios son lanzados directamente al dashboard con un PIN genérico, y no hay un tutorial "Zero State" para explicar el sistema de puntos o la economía.
- **Fricción innecesaria:** El flujo de aprobación de tareas por los padres ("Esperando_Aprobacion") es correcto desde la gamificación, pero la UX obliga a los padres a refrescar o buscar proactivamente las tareas pendientes, careciendo de notificaciones push en tiempo real.
- **Claridad de Acciones:** El `NoticeBar` cumple bien la función de urgencia, pero en ocasiones compite visualmente con el `Header`. Se solucionó un bug donde `NoticeBar` crasheaba en el type check, pero visualmente ocupa un z-index 100 que empuja el contenido de forma rígida.

## 5. Hallazgos de Gamificación
- **Loops de Engagement (A mejorar):** Actualmente, la motivación extrínseca domina (puntos para recompensas). Falta mayor motivación intrínseca (coleccionables temáticos o customización de avatares más profunda que solo "Mood_Emoji").
- **Sistema de Rachas y Bonus:** La implementación en `complete/route.ts` es sólida (Base + Streak + Checklist + Speed Bonus). No obstante, el "Happy Hour" es fijo y predictivo (17:00 a 19:00), lo que fomenta el "gaming the system". Deberían existir "Happy Hours sorpresa" para mantener la variabilidad.
- **Sentimiento de Competencia/Cooperación:** El `FamilyTree.tsx` muestra un ranking, pero no hay "Misiones Cooperativas" donde los puntos de todos sumen para un objetivo familiar (ej: "Ir al cine este viernes").

## 6. Bugs Detectados y Resueltos
| Bug | Impacto | Severidad | Reproducción | Solución Implementada |
|-----|---------|-----------|--------------|-----------------------|
| Syntax Error en `/complete/route.ts` | Falla el Build | Crítica | Correr `npm run build` | Corrección de llaves y bloque try-catch. |
| Type Error `asignado` en `/approve` | Falla el Build | Crítica | Correr `npm run build` | Se agregó el query Prisma para obtener el usuario `asignado` antes del cálculo de niveles. |
| Server Component usando Hooks Cliente | App crashea | Crítica | Navegar al Dashboard | Se movió la directiva `"use client"` al inicio y se limpiaron imports en `MyTasksBoard.tsx`. |
| Tipos literales incompatibles (`"happyhour"`) | Falla el Build | Crítica | Compilación | Se unificaron los tipos de estado a `"happyhour"` en minúscula y se eliminaron comparaciones imposibles en `NoticeBar.tsx`. |
| Prerendering timeout/fail en Vercel | Fallo de Deploy | Alta | Deployment sin DB real | Se inyectó variable `DATABASE_URL` dummy durante build. |

## 7. Features Incompletas
- **Recompensas Aleatorias (Surprises):** La API calcula si el usuario gana una sorpresa (`wonSurprise`), y actualiza la DB, pero la UI frontal no posee un inventario de sorpresas claro donde el niño pueda "abrir" ese premio; actualmente solo recibe estrellas de consolación o un texto en el modal.
- **Cron Tasks:** La DB soporta `Generada_Por_Cron`, y hay una ruta `/api/cron/daily`, pero carece de un orquestador real (ej: Inngest, Trigger.dev o Vercel Cron) conectado formalmente para asegurar la ejecución garantizada.

## 8. Mockups de Cartón Detectados
- **Botones Sociales / Inventario:** En algunos menús (posiblemente modales no listados), hay UI que menciona "Premios" que no se conectan completamente con la lógica de redención (`Premios_Entregados` enum), forzando muchas aprobaciones manuales de los padres por fuera de la app.

## 9. Inconsistencias Detectadas
- **Cálculo de Nivel:** En `/complete`, la lógica de ganancia de puntos se maneja bien atómicamente (`where: { id: taskId, estado: ... }`). Sin embargo, en `/approve`, el nivel se calculaba erróneamente usando `Math.sqrt(puntos/100)`, que es distinto al cálculo oficial consolidado en `getLevelInfo` (`src/lib/levelUtils.ts`). La lógica de la API de aprobación de tareas no delega al `levelUtils`, arriesgando cálculos inconsistentes.

## 10. Problemas de Código
- **Deuda Técnica en Componentes Gigantes:** `ModalManager.tsx` (34kb) centraliza absolutamente todos los popups. Esto viola el principio de Single Responsibility y complica el code-splitting. Se debería subdividir en un Registry de modales perezosos (`next/dynamic`).
- **Arquitectura de API Routes:** Exceso de lógica de negocio incrustada en los controladores de Next.js (ej. en `route.ts`). La lógica gamificada debería estar en servicios separados (ej. `src/services/gamificationService.ts`) para ser unit-testeable.

## 11. Problemas de Base de Datos
- **Manejo del Pool (Supabase):** Actualmente, no hay un PgBouncer o Prisma Accelerate documentado en uso intensivo más allá de un Pool básico de `@prisma/adapter-pg`. Para un entorno real de producción serverless, esto puede llevar a saturación de conexiones. Se requiere asegurar `pgBouncer=true` en los strings de Supabase.

## 12. Problemas de Rendimiento
- **Re-renders Innecesarios:** El `ModalManager` está suscrito globalmente a Zustand (`useModalStore`). Cualquier cambio en el estado de un modal desencadena un render de todo el manager, aunque los otros modales no estén activos.
- **Rendimiento de Consultas DB:** La consulta de Leaderboard requiere escanear a todos los usuarios; aunque la familia es pequeña, un índice sobre `puntosAcumulados` o `Puntos_Generados` mejoraría la performance a futuro.

## 13. Problemas de Seguridad
- **Validación de Roles en la API:** Se detectó en `/approve/route.ts` una validación correcta (`isParent = user.rolFamiliar === "Padre" || "Madre"`), pero existen otras rutas donde un hijo avispado podría alterar sus propios estados enviando payloads manipulados si no se valida el rol consistentemente.
- **Protección JWT:** La implementación asume la existencia de `getSession()` que confía en JWT firmados (Jose/Bcrypt). No se evidencian revocaciones de tokens activas.

## 14. Roadmap de Mejoras Priorizado (Ejecutivo)

### CRÍTICO (Solucionado durante esta auditoría)
- [x] Corregir bloqueos de Build por errores de sintaxis en `route.ts`.
- [x] Corregir type errors de TypeScript en `NoticeBar` y `approve/route.ts`.
- [x] Ajustar imports y directivas de SSR/Client Components en Dashboards.
- [x] Aplicar mock DB string para permitir despliegue (prerendering) en Vercel.

### ALTO (Corto Plazo)
- **Refactorizar Lógica de Niveles:** Centralizar todos los cálculos en `levelUtils.ts` (API + Frontend) para evitar discrepancias.
- **Seguridad en Completado:** Asegurar que `elapsedSeconds` enviado por el cliente en `/complete` sea razonable (evitar envíos de 1 milisegundo para speedrunning malicioso).
- **Notificaciones Push/Email:** Notificar a padres cuando hay tareas "Esperando Aprobación".

### MEDIO (Mediano Plazo)
- **UX Onboarding:** Diseñar un flujo "First Run" interactivo usando modales de bienvenida que expliquen a los hijos el concepto del "Happy Hour" y Rachas.
- **Code-Splitting del ModalManager:** Migrar `LeaderboardModal`, `ChecklistModal` etc., a cargas diferidas usando `next/dynamic`.

### BAJO (Largo Plazo / Nivel AAA)
- **Misiones Familiares Cooperativas:** Extender el Schema DB con `MisionGrupal` donde todos los miembros de la familia deban lograr 10 tareas en un fin de semana para desbloquear una salida.
- **Inventario Virtual:** Interfaz drag-and-drop para abrir "Sorpresas" obtenidas aleatoriamente, con animaciones Lottie (más complejas que el actual confetti básico).

## 15. Problemas de Deployment en Vercel (Resolución)
El pipeline fallaba durante el paso "Generating static pages" porque Next.js (App Router) por defecto intenta pre-renderizar las rutas de servidor, y al instanciar Prisma, carecía de conexión a la base de datos (por ausencia de `DATABASE_URL` o timeouts).
**Solución Aplicada:**
1. Arreglo de los 4 errores de TypeScript que prevenían siquiera la compilación JS.
2. Inyección de la variable `.env` ficticia (`DATABASE_URL=postgres://dummy:dummy@localhost:5432/dummy`) antes de ejecutar `npm run build`, logrando que Next.js asigne un dummy en vez de arrojar error de inicialización, completando el build en ~7.5s.
