# Family Tasker - Implementation Roadmap

Este documento contiene el plan de acción derivado de la auditoría integral (ver `README_audit.md`). El propósito es dar seguimiento a las mejoras necesarias para llevar la aplicación a un nivel AAA.

## FASE 1: Corrección de Bugs y Estabilidad (MVP) - [Completado]
- [x] Arreglar API `/api/tasks/[id]/approve` (error con variable `asignado`).
- [x] Arreglar API `/api/tasks/[id]/complete` (errores de compilación, lógica de variables faltantes).
- [x] Arreglar compilación del frontend en `ModalManager.tsx` (múltiples definiciones de función).
- [x] Arreglar importaciones faltantes en `MyTasksBoard.tsx` (`useAuthStore`).
- [x] Arreglar NoticeBar.tsx (tipado estricto para `messageType`, fix de superposición de estados de la barra "happyhour" vs "evening").
- [x] Asegurar que el comando `npm run build` pase sin errores.

## FASE 2: UI / UX y Animaciones - [Pendiente]
- [ ] Aplicar transiciones de Framer Motion a todos los modales (Fade-in, slide-up).
- [ ] Implementar un componente de "Onboarding" interactivo para nuevos usuarios (especialmente para niños).
- [ ] Mejorar la jerarquía visual de `MyTasksBoard.tsx` (diferenciar visualmente tareas urgentes/vencidas).
- [ ] Simplificar el proceso de check del "Checklist" a un solo paso, eliminando clics innecesarios.

## FASE 3: Gamificación AAA - [Pendiente]
- [x] Funcionalidad base: Happy Hour Bonus (x1.5 puntos).
- [x] Funcionalidad base: Surprise Box (chance de drop aleatorio al completar tareas).
- [x] Funcionalidad base: Checklist Bonus (puntos extra por subtareas).
- [ ] Frontend: Recompensar visualmente el "Surprise" con animaciones o confeti.
- [ ] Crear la página/flujo de **Tienda de Recompensas (Rewards Shop)** para canjear "puntos" o "estrellas" por premios reales (vinculado a `/api/premios`).
- [ ] Reemplazar avatares estáticos por íconos o insignias de nivel dinámicos en el Header/Leaderboard.

## FASE 4: Arquitectura de Base de Datos y Código - [Completado]
- [x] Actualizar `schema.prisma` agregando `@@index` a `estado` y `asignadoId` en la tabla `Tarea`.
- [x] Ejecutar `npx prisma generate` y crear migraciones.
- [ ] Refactorización de código: Modularizar endpoints gigantes como `route.ts` de 'complete' en servicios (Ej: `services/taskCompletion.ts`).
- [ ] Optimizar re-renders en `MyTasksBoard` implementando `React.memo` o selectores más finos en Zustand.

## FASE 5: Seguridad - [Pendiente]
- [ ] Validar en TODAS las llamadas de API si `user.id === tarea.asignadoId` o si `user.rolFamiliar` es Padre/Madre para prevenir que usuarios manipulen tareas de otros por fuerza bruta.
