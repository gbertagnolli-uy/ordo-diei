# ROADMAP - Family Tasker

## Q1 - Estabilización y Experiencia Core
- [ ] Refactor de `complete/route.ts` para separar la lógica de negocio (Cálculo de Puntos/Gamificación).
- [ ] Implementación de "Loading States" universales y feedback visual de error en UI.
- [ ] Limpieza de clases Tailwind repetitivas (crear componentes UI base en `src/components/ui/`).

## Q2 - Gamificación y Retención
- [ ] Implementación de Onboarding / Tour interactivo para nuevos usuarios.
- [ ] Panel de "Logros y Trofeos" persistente en el perfil del usuario.
- [ ] Sistema de "Retos Semanales" dinámicos (Ej: Completar 5 tareas antes del mediodía).

## Q3 - Escalabilidad y Rendimiento
- [ ] Migración de validaciones manuales a `Zod` en toda la API.
- [ ] Optimización de re-renderizados usando `React.memo` y selectores granulares en Zustand.
- [ ] Revisión de índices en PostgreSQL (Prisma).
# Roadmap de Mejoras: Family Tasker

## PRIORIDAD CRÍTICA (Resolver inmediatamente)
1. **Seguridad y Consistencia de Datos (Transacciones concurrentes)**:
   - Implementar control de concurrencia optimista (`version` col) o bloqueos en `prisma.tarea.update` para evitar el "double-spending" al completar tareas simultáneamente.
2. **Validación de Roles y Permisos Segura**:
   - Asegurar que en `/api/tasks/[id]/approve` y `/complete` no puedan ser llamados por scripts maliciosos. Limitar llamadas y validar correctamente `asignadoId` y `creadorId`.
3. **Manejo de Husos Horarios (Timezones)**:
   - Migrar cálculos de rachas (streaks) y deadlines a horas UTC o guardar el timezone del usuario para evitar rotura de rachas injustas.

## PRIORIDAD ALTA (Mejoras de experiencia o estabilidad)
1. **Refactorización Arquitectónica de API**:
   - Extraer la lógica de gamificación pesada de los archivos `route.ts` hacia una capa de servicios (`src/services/TaskService.ts`, `src/services/GamificationService.ts`).
2. **Crear Índices de Base de Datos**:
   - Añadir `@@index([estado])`, `@@index([asignadoId])`, `@@index([fechaVencimiento])` en el esquema de Prisma.
3. **Gestión de UI / UX Centralizada**:
   - Reemplazar alertas nativas (`alert()`) por un sistema de Toasts en un contexto global usando `Zustand` o bibliotecas como `sonner`.

## PRIORIDAD MEDIA (Mejoras recomendadas)
1. **Sistema de Logros Real**:
   - Crear una entidad `Logro` en Prisma en lugar de calcular insignias hardcodeadas en `ModalManager.tsx`.
2. **Mejorar UI de Tareas (`MyTasksBoard.tsx`)**:
   - Dividir la vista en secciones colapsables ("Vencidas", "Hoy", "Próximamente") en lugar de una lista única densa.
   - Refinar el uso del espacio y remover colores Tailwind estándar por variables CSS del sistema de diseño ya definido.
3. **Optimización de Performance Client-Side**:
   - Mover la lógica del `setInterval` de los timers fuera del árbol principal de renderizado (por ejemplo, usando referencias o componentes aislados) para evitar re-renders en `NoticeBar.tsx`.

## PRIORIDAD BAJA (Optimizaciones futuras)
1. **Soporte Offline PWA**:
   - Habilitar completado de tareas sin conexión y sincronización en segundo plano.
2. **Mecánicas AAA de Gamificación**:
   - Diseñar curvas de nivel logarítmicas complejas, árbol de habilidades, clanes/equipos familiares, y animaciones de unboxing con `Framer Motion` y WebGL (Three.js/Canvas).
3. **Internacionalización (i18n)**:
   - Limpiar el espanglish de la base de datos y proveer soporte para múltiples idiomas.

---
**Nota:** Todos estos cambios están enmarcados para su implementación progresiva en la rama `dev`.
