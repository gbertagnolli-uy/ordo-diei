# Auditoría Integral de Producto, UX, UI, Gamificación, Código y Calidad
**Family Tasker (v0.1.0)**

---

## 1. Resumen Ejecutivo

La aplicación "Family Tasker" presenta una base funcional prometedora para la gestión de tareas familiares, integrando conceptos de gamificación (puntos, estrellas, sorpresas, rachas) para incentivar el cumplimiento de los deberes del hogar. Se observa un fuerte enfoque en el backend mediante el uso de **Next.js 16.2.1** (App Router), **Prisma** (con `pg` en PostgreSQL), Zustand para la gestión de estado y **Tailwind CSS** para los estilos.

Sin embargo, tras una revisión técnica y de experiencia de usuario exhaustiva, se han detectado oportunidades críticas de mejora:

*   **Bloqueantes Técnicos**: Había errores de compilación (`npm run build`) debido a conflictos de variables en `route.ts` de finalización de tareas, múltiples definiciones en `ModalManager.tsx`, y solapamientos de tipos en `NoticeBar.tsx` y `MyTasksBoard.tsx` (estos errores han sido mitigados durante la auditoría).
*   **Problemas Estructurales**: Ausencia de paginación o estrategias eficientes de carga en la lectura de datos, fuerte acoplamiento de lógica de negocio compleja (como el cálculo de Happy Hour, rachas y puntos) dentro de las rutas de API en lugar de servicios modulares.
*   **Gamificación**: La economía virtual es altamente inflacionaria (los usuarios pueden ganar muchos puntos sin un ecosistema de "quema" claro). Las recompensas son algo lineales.

A continuación, se detalla el análisis multidisciplinario completo priorizado para elevar la aplicación a estándares AAA de la industria.

---

## 2. Auditoría de UI (Interfaz de Usuario)

### Hallazgos y Áreas de Mejora:
*   **Gestión de Variables CSS Personalizadas:** El proyecto hace un uso excesivo de variables CSS con funciones complejas dentro de las clases de Tailwind (`bg-[color-mix(in-srgb,var(--primary)_10%,transparent)]`). Esto reduce la mantenibilidad, dificulta el debug visual y hace que el diseño se sienta inconsistente si no se auditan rigurosamente todos los tokens de diseño.
    *   **Solución AAA**: Migrar estas combinaciones a la configuración de Tailwind (`tailwind.config.js`) mediante plugins o extendiendo la paleta de colores para mantener un código JSX limpio.
*   **Consistencia Visual de Notificaciones:** `NoticeBar.tsx` maneja una barra estática superior. Las notificaciones varían visualmente usando colores del sistema (`error`, `primary`, `secondary-container`). La legibilidad puede verse afectada si los colores no cumplen con la ratio WCAG 2.1 AA.
*   **Densidad de Información en Dashboards:** Componentes como `MyTasksBoard` y `ModalManager` agrupan insignias, rachas y listados de tareas en la misma vista, provocando sobrecarga cognitiva.
    *   **Solución AAA**: Ocultar estados secundarios detrás de tooltips modernos, microinteracciones (ej. hover sobre rachas revela el historial) y utilizar _skeleton screens_ para reducir la densidad inicial percibida.
*   **Feedback Visual Limitado**: Aunque se utiliza `canvas-confetti`, gran parte de los botones o interacciones no poseen estados claros de `active`, `focus-visible`, o `disabled` (p. ej., en formularios de ingreso de PIN).

---

## 3. Auditoría de UX (Experiencia de Usuario)

### Hallazgos y Áreas de Mejora:
*   **Onboarding y Activación:** No hay evidencia de flujos que guíen al usuario sobre la economía (puntos, estrellas, penalizaciones) tras el primer inicio de sesión.
*   **Manejo de Errores Silencioso:** En ciertas rutas (ej., `/api/tasks/[id]/approve`), si hay un error al aprobar, la UI no lo maneja de forma elegante más allá de un posible console.error. Un usuario (Padre/Madre) no recibe _feedback_ claro si la acción falló por problemas de red.
*   **Arquitectura de Información (Navegación):** Los roles están segmentados, pero todos convergen en `/dashboard`. El flujo de descubrimiento de funcionalidades de Padre (aprobar) frente al de Hijo (completar) no está claramente delimitado en la interfaz, compartiendo a veces las mismas lógicas de componentes.
*   **Tiempo Hasta Obtener Valor:** Un usuario nuevo "Hijo" tiene 0 puntos, ninguna racha y ninguna tarea completada. La vista inicial puede parecer vacía ("Estados Vacíos").
    *   **Solución AAA**: Implementar "Tareas de Bienvenida" pregeneradas y auto-aprobadas que otorguen las primeras "Victorias Rápidas" y configuren el _engagement loop_ inicial.

---

## 4. Auditoría de Gamificación

Comparado con sistemas AAA o aplicaciones líderes como Duolingo o Habitica, el sistema de gamificación presenta bases sólidas, pero carece de un techo que fomente la retención a largo plazo.

### Análisis:
*   **Sistemas de Niveles (Mastery & Progression):** El sistema calcula niveles mediante `Math.floor(Math.sqrt(puntosAcumulados / 100)) + 1` en `src/lib/levelUtils.ts`. Esto crea una curva cuadrática de experiencia. **Fortaleza**: Requiere esfuerzo exponencial. **Debilidad**: Los títulos de rango ("Novato" a "Héroe Legendario") están hardcodeados y solo llegan a Nivel 15.
*   **Economía Virtual y Recompensas (Loops):** Los puntos se acumulan infinitamente (`availablePoints`, `lockedPoints`). No hay sumideros de puntos evidentes ("Point Sinks") donde los niños puedan gastar sus puntos (ej. tienda de avatares, canje de premios reales dentro de la app), lo que eventualmente rompe la motivación extrínseca por hiperinflación.
*   **Mecánicas Temporales (Happy Hour & Fin de Semana):** Se identificó en `tasks/[id]/complete/route.ts` la "Happy Hour" entre las 17:00 y las 19:00. **Fortaleza**: Buen uso de recompensas variables (10 puntos extra). Sin embargo, la lógica estaba acoplada rígidamente (Hardcodeada a horas del servidor vs zona horaria local).
*   **Rachas (Streaks):** La lógica de mantener la racha si `diffDays === 1` es clásica y efectiva. Se le añaden multiplicadores de hasta 20 puntos, lo cual es excelente.
*   **Sorpresas (Variable Ratio Schedule):** Las tareas elegibles tienen un 10% de entregar una sorpresa y un 30% de entregar estrellas extra. Esto es diseño AAA (como las cajas de botín).

### Recomendaciones Nivel AAA:
*   Crear una "Tienda del Hogar" conectando `availablePoints` con premios del mundo real (ej. "1 Hora extra de TV = 500 Puntos").
*   Añadir un sistema de "Vidas" o "Protección de Racha" congelable (Freeze) para evitar frustración grave si un niño se enferma un día, evitando que abandone la app.

---

## 5. Detección de Bugs (Solucionados y Latentes)

### Bugs Críticos Solucionados Durante Auditoría:
*   **Build Failure 1 - Errores de Sintaxis y Duplicación en API (`src/app/api/tasks/[id]/complete/route.ts`):** Había llaves de cierre faltantes, y re-declaraciones de variables como `estadoFinal`, `basePoints` y bloques `catch` rotos. Rompía el compilador de Next.js (Turbopack). _(Corregido)_
*   **Build Failure 2 - Importaciones Duplicadas (`ModalManager.tsx`):** `getLevelInfo` importada dos veces, causando errores severos de compilación. _(Corregido)_
*   **Build Failure 3 - Store de Zustand no importado (`MyTasksBoard.tsx`):** Uso de `useAuthStore` sin realizar el `import` correspondiente. _(Corregido)_
*   **Build Failure 4 - Tipos Incompatibles en Estado (`NoticeBar.tsx`):** Asignaciones al estado `messageType` enviaban `"happyHour"` pero la firma TypeScript del estado esperaba `"happyhour"`. _(Corregido)_

### Bugs Latentes o de Lógica (Riesgos):
*   **Zona Horaria en Happy Hour (`route.ts` vs `NoticeBar.tsx`):** `now.getHours()` en el servidor (`route.ts`) usa la hora UTC de Vercel (o la zona del servidor), mientras que `now.getHours()` en cliente (`NoticeBar.tsx`) usa la hora local del dispositivo. Esto causará que el frontend muestre que hay Happy Hour pero el servidor no otorgue los puntos, generando frustración extrema ("Bug de Sincronización").
    *   **Solución:** Pasar el timezone offset desde el cliente o usar `.getUTCHours()` en ambos y ajustar lógicas al huso local del hogar configurado.
*   **Cálculo de Rachas Deficiente:** En `api/tasks/[id]/complete/route.ts`, si un usuario completa una tarea al filo de la medianoche, leves diferencias entre cliente y servidor pueden romper una racha de muchos días. No contempla la zona horaria real.
*   **Bug de Nivel en Aprobación (`api/tasks/[id]/approve/route.ts`):** Hacía referencia a una variable `asignado` no declarada antes de inicializar la lógica de niveles, lo que provocaba errores de compilación (`ReferenceError`). _(Corregido en la auditoría)_

---

## 6. Detección de Features Incompletas

*   **Paginación y Virtualización de Tareas:** Las consultas de Prisma (`findMany`) en paneles de usuario cargan todas las tareas del histórico en la memoria (e.g., listas de `MyTasksBoard` y `ModalManager`). Cuando la familia acumule cientos de tareas (ej. tareas repetitivas semanales durante un año), la página colapsará en dispositivos móviles de gama baja.
*   **Flujo de Penalizaciones Incompleto:** La base de datos tiene un campo `penalizacionesReparacion` en `Usuario`, pero no se evidencian endpoints en el backend de la API (al nivel actual del código inspeccionado) que ejecuten la lógica de restar puntos a un usuario mediante castigos de forma sistemática.
*   **Surprise Logic Discrepancia:** La API `/complete` tenía código esperando que la tarea tuviera un flag `isSurpriseEligible`, pero este fue modificado/faltaba sincronizar con el frontend. De igual forma, el código de sorpresa calculaba puntos mal referenciados.
*   **Administración Central de Permisos:** Dependencia manual y hardcodeada de `rolFamiliar === "Padre" || rolFamiliar === "Madre"` en múltiples endpoints. Falta un Middleware o decorador estandarizado que prevenga fugas de autorización de manera escalable.

---

## 7. Detección de "Mockups de Cartón" (Falsos Positivos)

*   **Valores de "Insignias Dinámicas" Calculados en el Aire:** Las insignias de `ModalManager` (como "Misión 10" o "Francotirador") no persisten en la base de datos (no existen modelos de Logros ni Tablas de Emblemas). Son simples condiciones `if` evaluadas en el cliente (`user.totalTasksCompleted >= 10`). Si se cambian las condiciones, el usuario pierde retroactivamente su "Insignia", lo que rompe la sensación de maestría y posesión ("Ownership").
*   **Sorpresas Aleatorias Ficticias:** La "sorpresa" en `/complete` incrementaba un contador de estrellas, pero no había rastro de un sistema de inventario (cofres, items especiales). El modelo de datos es solo numérico (`surprises: Int`). Visualmente dice "Ganaste un premio sorpresa" pero realmente es un sumador de enteros vacío.

---

## 8. Detección de Inconsistencias

*   **Estado de Tareas ("EstadoTarea" Enum):** Hay estados en la base de datos como `En_progreso`, `Pausada`, `Vencida`, `No_Realizada`, `Esperando_Aprobacion`. Sin embargo, los queries filtran mayormente hardcodeando cadenas string en vez de importar los `Enums` de Prisma. Esto genera vulnerabilidades en refactorizaciones.
*   **Inconsistencia de Estados en Puntos:** El código tiene dos contadores para lo mismo: `availablePoints`, `lockedPoints`, y `puntosAcumulados`. El frontend suma todo como un total, pero el pipeline de `Pendiente -> Completado -> Aprobado` transfiere puntos entre locked y available. Si ocurre un fallo en la red tras marcarla como completada, o el Padre no aprueba nunca, la economía del niño se congela perpetuamente.

---

## 9. Auditoría Exhaustiva del Código

### Arquitectura y Convenciones:
*   **Aislamiento de Lógica (Fat Controllers):** Las rutas de la API en Next.js actúan como Controladores (MVC) pero están asumiendo responsabilidades de lógica de negocio profunda. El archivo `tasks/[id]/complete/route.ts` tiene más de 100 líneas dedicadas solo a calcular la puntuación, rachas, bonos y sorpresas.
    *   **Riesgo:** Alto acoplamiento. Imposible de realizar tests unitarios sin levantar un entorno de Next.js mockeado entero.
    *   **Solución:** Extraer toda la lógica a servicios inyectables puros en una carpeta `src/services/` (ej. `GamificationService.calculateTaskRewards(task, user)`).
*   **Prisma Client en Next.js:** Se instancia un cliente global en `lib/prisma.ts` lo cual es correcto. Sin embargo, no se hace uso de estrategias agresivas de caché para consultas estáticas de configuración de reglas, impactando a los costos de Supabase.

---

## 10. Auditoría de Base de Datos

### Modelo y Esquema (Prisma):
*   **Falta de Constraints Rigurosos:** En `PremioEntregado`, aunque hay un `@@unique([premioId, usuarioId])`, los registros históricos de auditoría (`HistorialAccion`) pueden crecer indefinidamente sin estrategias de particionado.
*   **Ausencia de Índices (Indexación Carente):** `Tarea` será consultada fuertemente por `creadorId`, `asignadoId` y `estado`. El esquema actual (`schema.prisma`) carece de `@@index([asignadoId, estado])`. Esto causará Full Table Scans en PostgreSQL cuando el volumen de tareas crezca, destruyendo la latencia.
    *   **Acción Requerida:** Añadir `@@index([asignadoId, estado, fechaVencimiento])` en el modelo `Tarea`.

---

## 11. Auditoría de Rendimiento

*   **Renders Innecesarios:** `ModalManager.tsx` contiene una cantidad excesiva de cálculos en línea (`user.totalTasksCompleted >= 10`, etc) dentro del ciclo de renderizado de React.
*   **Manejo de Modales (Memory Leaks):** En `ModalManager`, los modales no parecen ser desmontados del DOM (unmounted) cuando se cierran, sino que simplemente se ocultan usando CSS u opacidad, o mantienen la memoria ocupada reteniendo datos previos de otros componentes montados.
*   **Waterfall Requests en Dashboard:** La obtención de "Mis Tareas", "Premios", y "Reglas" puede ocurrir en secuencias (dependiendo del fetching del frontend), ralentizando el First Meaningful Paint (FMP).
    *   **Solución AAA:** Implementar React Query / SWR para caché o hacer SSR con RSC (React Server Components) en la ruta de Layout.

---

## 12. Auditoría de Seguridad

*   **Autenticación sin Rate-Limiting:** `src/app/api/auth/login/route.ts` procesa el PIN sin ningún mecanismo de control de intentos (`throttle`).
    *   **Riesgo Crítico:** Un hermano malintencionado podría realizar un ataque de fuerza bruta muy veloz contra el PIN (que suele ser un número simple como 1234) para acceder a la cuenta y aprobarse tareas.
*   **Validaciones Insuficientes:** No hay librerías tipo `Zod` validando fuertemente el payload del JSON entrante en las rutas POST y PUT, confiando en las validaciones primitivas o en el casting inseguro (`Number(id)`), lo que abre la puerta a un vector de ataque si se pasan objetos gigantescos o nulos.

---

## 13. Priorización Ejecutiva

A continuación, un plan de ataque escalonado ("Roadmap AAA"):

### CRÍTICO (Resolver en las próximas 24h)
1.  **Divergencia de Zonas Horarias (Happy Hour & Streaks):** Unificar el uso de tiempos usando offsets UTC manejados estrictamente para evitar que la interfaz mienta sobre los puntos que el usuario ganará.
2.  **Añadir Rate-Limit al Login:** Proteger el endpoint de autenticación contra fuerza bruta de PINs.
3.  **Implementar Índices en Base de Datos:** Prevenir que la app colapse cuando las tablas crezcan; modificar Prisma Schema.

### ALTO (Mejoras fundamentales para la estabilidad y retención)
1.  **Refactorizar la Lógica de Puntos:** Extraer el motor de recompensas de los controladores API hacia servicios puros unit-testeables.
2.  **Economía Funcional (Point Sinks):** Implementar la capacidad real para que un usuario canjee premios a cambio de la reducción de `availablePoints`.
3.  **Protección de Puntos:** Implementar transacciones resilientes para asegurar que si el internet falla, los puntos nunca se desvanezcan del estado `locked` o `available`.

### MEDIO (Mejoras de Experiencia de Usuario AAA)
1.  **Estados Vacíos y Onboarding:** Pantallas dedicadas explicando "Cómo Jugar" al iniciar sesión por primera vez.
2.  **Gestión de Modales:** Centralizar en Zustand y asegurarse de destruir los componentes modales cerrados para liberar memoria y alivianar el DOM en móviles.

### BAJO (Optimizaciones Futuras)
1.  **Migrar Tokens CSS:** Pasar los colores `color-mix` dinámicos directamente a utilidades controladas del `tailwind.config.js`.
2.  **Paginación Infinita:** Reemplazar las listas planas por flujos paginados, para escalar la app a varios años de uso familiar continuo.
