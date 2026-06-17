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
