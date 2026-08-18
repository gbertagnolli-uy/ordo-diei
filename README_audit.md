# Auditoría Integral de Producto, UX, UI, Gamificación, Código y Calidad

## 1. Auditoría de UI (Interfaz de Usuario)
**Hallazgos Críticos:**
- La interfaz depende en gran medida de "CSS-variables" incrustadas manualmente o usando `color-mix` en vez de definir un sistema de diseño consistente de Tailwind en `tailwind.config.js`.
- **Accesibilidad:** Uso de colores de bajo contraste en algunos estados inactivos o deshabilitados.
- **Microinteracciones y Animaciones:** Se usa `canvas-confetti`, pero en algunas acciones de aprobación o completación no hay un feedback de "loading" claro para el usuario, causando "double clicks".
- Faltan Skeleton Loaders al iniciar la app, generando pantallas vacías hasta que los datos terminan de cargar.
- Componentes sobrecargados de información, como `MyTasksBoard`, que mezcla lógicas complejas de negocio con la vista.

**Recomendaciones:**
- Implementar un sistema de diseño estricto.
- Añadir Skeleton Loaders.
- Refactorizar las modales para no saturar el `ModalManager.tsx` de 1200+ líneas.

---

## 2. Auditoría de UX (Experiencia de Usuario)
**Hallazgos:**
- **Onboarding:** No existe un onboarding paso a paso; los usuarios son lanzados directo a la lista de tareas.
- **Flujos Críticos:** El padre necesita aprobar tareas una por una; falta un botón "Aprobar todo" o "bulk approve".
- **Fricción Innecesaria:** Al marcar un checklist como completado, requiere volver y confirmar en la tarea principal, agregando clics de más.
- **Manejo de Errores:** Errores de API ("Tenant not found" o "timeout") devuelven `error interno` sin opciones de reintento en el cliente.

**Recomendaciones:**
- Añadir un "bulk approve" en `AdminTasksClient.tsx`.
- Mejorar el estado de `Loading/Saving` en botones de acción.

---

## 3. Auditoría de Gamificación
**Hallazgos:**
- **Loops de engagement:** Hay puntos y rachas (streaks), pero el nivel se calcula con una fórmula de raíz cuadrada matemática (en `levelUtils.ts`) que se siente lineal después del nivel 5.
- **Recompensas variables:** El sistema de `surprises` tiene un 10% de chance, lo cual es bajo; podría ajustarse dinámicamente si el usuario lleva muchos días sin ganar.
- **Economía Virtual:** Los puntos ganados pueden usarse para premios, pero no hay un sistema para gastarlos parcialmente sin perder nivel (locked vs available points).

**Recomendaciones (Nivel AAA):**
- Separar "Experiencia" (XP para subir nivel) de "Monedas" (Puntos gastables). Gastar monedas no debería bajar el nivel.
- Agregar "Daily Quests" rotativas independientes a las tareas del hogar.
- Añadir avatares o banners desbloqueables.

---

## 4. Detección de Bugs
- **Bug 1 [CRÍTICO]:** En `/api/tasks/[id]/approve/route.ts`, las variables `nivelAntes` y `asignado` estaban mal instanciadas, rompiendo la aprobación de tareas. *(Corregido durante esta sesión).*
- **Bug 2 [CRÍTICO]:** Build en Turbopack Next.js fallando en Vercel por errores de sintaxis TS en `complete/route.ts` y `ModalManager.tsx`. *(Corregido durante esta sesión).*
- **Bug 3 [ALTO]:** Race Condition en la completación de tareas rápidas: un usuario puede hacer doble clic en el botón "Completar" y ganar puntos dobles antes de que se deshabilite el botón.
- **Bug 4 [MEDIO]:** En `/api/tasks/[id]/complete/route.ts`, el bono `checklistBonus` se calculaba antes de revisar si la tarea tenía un checklist. *(Corregido).*
- **Bug 5 [BAJO]:** `NoticeBar.tsx` tenía `"happyHour"` hardcodeado en la interfaz que no coincidía con los tipos definidos en la prop *(Corregido a `"happyhour"`)*.

---

## 5. Detección de Features Incompletas
- **Sistema de Modos de Humor (Moods):** Existe `moodEmoji` en base de datos y `MoodSelector.tsx`, pero no parece afectar el gameplay o dar bonos pasivos.
- **Premios recurrentes:** Los premios tipo "Frecuencia Mensual" o "Semanal" están modelados en DB (`Premio`), pero la entrega automática vía CRON no está completamente cableada en `api/cron/daily/route.ts`.

---

## 6. Detección de "Mockups de Cartón"
- `RulesPopup` en `ModalManager.tsx`: Existe el UI de reglas, pero a menudo falla el fetch inicial, mostrando "Cargando..." o texto hardcodeado.
- Algunas notificaciones en `NoticeBar.tsx` solo desaparecen visualmente, pero no marcan en DB que el usuario ya las vio.

---

## 7. Detección de Inconsistencias
- **Terminología:** En algunos lados se habla de "Aprobar", en otros de "Validar".
- **Estados:** Tarea en `Esperando_Aprobacion` vs `Pendiente`. Los padres aprueban y pasa a `Aprobada`, no `Completada`, aunque el usuario ve `Completada` en la interfaz.
- La hora límite a veces se compara con hora local y a veces con UTC. Recomendado usar UTC (`getUTCHours()`).

---

## 8. Auditoría Exhaustiva del Código
- **Arquitectura:** Toda la lógica de negocio (puntajes, bonos de racha) está en los Controladores (`/api/.../route.ts`) en vez de extraerse a `/lib/gameEngine.ts`.
- `ModalManager.tsx` es un "God Component" con cientos de líneas y componentes inline definidos dentro.
- **Refactors Necesarios:** Mover todas las funciones de gamificación a una clase o servicio independiente.
- **Código duplicado:** Lógica de cálculo de nivel copiada en múltiples lados y no siempre usa `getLevelInfo`.

---

## 9. Auditoría de Base de Datos
- **Migraciones faltantes:** Si se separan `XP` de `Monedas`, habrá que agregar la columna `xp` en `Usuario`.
- Falta índice en `Tarea.estado` y `Tarea.fechaVencimiento` para mejorar las consultas del Dashboard.

---

## 10. Auditoría de Rendimiento
- `MyTasksBoard.tsx` re-renderiza todas las tareas cuando el cronómetro avanza, causando problemas de CPU.
- **Solución:** Extraer el componente de "Cronómetro/Timer" a un componente aislado para que solo él haga re-render.

---

## 11. Auditoría de Seguridad
- No hay validación de input exhaustiva (ej. Zod) en las llamadas API (como `elapsedSeconds` o `taskId`).
- Faltan rate limiters en las APIs.
- Posibilidad de ataques IDOR: No en todas las rutas se verifica si la tarea que se intenta completar o aprobar pertenece al usuario de la sesión, en algunas sí, pero no en todas.

---

## 12. Priorización Ejecutiva y Roadmap

### CRÍTICO
- [x] Corrección de bugs en APIs de aprobar y completar tareas (`complete/route.ts`, `approve/route.ts`). (Implementado)
- [x] Corrección de Build en Turbopack para solucionar Deployment en Vercel (`ModalManager.tsx`, `NoticeBar.tsx`, `MyTasksBoard.tsx`). (Implementado)
- [ ] Implementar protección contra "Double Click" en botones de acciones de estado.

### ALTO
- [ ] Refactor del `ModalManager.tsx` a múltiples archivos pequeños.
- [ ] Implementar Skeletors Loaders y feedback visual asíncrono.
- [ ] Índices en Base de Datos para campos frecuentemente buscados (`estado`, `fechaVencimiento`).

### MEDIO
- [ ] Extender sistema de Gamificación para separar Nivel (XP) de Puntos Gastables.
- [ ] Botón de "Aprobar Todo" en el Dashboard de Padres.

### BAJO
- [ ] Añadir validación estricta Zod en todos los endpoints de la API.

---

## 13. Problemas de Deployment en Vercel
Se lograron detectar y **reparar en vivo en la rama dev** errores de Build en TypeScript durante el proceso de Turbopack:
1. Variables y braces mal cerradas en `complete/route.ts` **(Corregido)**.
2. Errores de importación en `ModalManager.tsx` **(Corregido)**.
3. Variables no declaradas (`asignado`) y uso incorrecto de variables (`nivelAntes`) en `approve/route.ts` **(Corregido)**.
4. Errores de tipado en `NoticeBar.tsx` con la variable de "happyhour" no asignable **(Corregido)**.
5. Error en `MyTasksBoard.tsx` al usar un estado sin importar su dependencia (`useAuthStore`) **(Corregido)**.
6. Tipos incorrectos referenciados en dependencias faltantes durante bonus calculations en el complete handler **(Corregido)**.

**Estado Actual:** El proyecto compila y construye de forma correcta en `dev`.
