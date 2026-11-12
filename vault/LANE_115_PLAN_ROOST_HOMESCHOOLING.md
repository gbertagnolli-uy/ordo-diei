# Lane 115 — Plan de integración de Roost para Homeschooling

- Rama: `task/lane-115-plan-roost-homeschooling` (desde `dev` 5b5410f). Solo documentación: no toca `src/`, `prisma/` ni `vendor/roost/`.
- Entregable: [`nuevas-features/homeschooling/PLAN_INTEGRACION_ROOST.md`](nuevas-features/homeschooling/PLAN_INTEGRACION_ROOST.md).
- Además: aviso de revocación en `SPEC.md`, `ARQUITECTURA_DETALLADA.md`, `MAPEO_COMPONENTES_ROOST.md`, `lanes/LANES_HOMESCHOOLING.md`; puntero en `homeschooling/README.md`; ronda 6 (D26–D28) en `nuevas-features/DECISIONES.md`.
- Hallazgos principales: el Express de Roost no tiene cursos/eventos/showcase; el `DatabaseAdapter` de Roost no lo usa nadie; `complete` paga como tardía una Tarea sin `horaEjecucion`; `POST /api/archivos` no existe (es `POST /api/upload`).
- Lanes propuestas: 116–123 (re-verificar números al crearlas).

## Pedido del usuario (textual)

> Sos un arquitecto de software senior. Tu tarea es DELIBERAR y producir un plan de integración. No escribas código de la app ni ejecutes migraciones.
>
> ## Contexto
> Repo: /home/x7/Downloads/dev/ordo-diei (Next.js 16.2.1, React 19, Tailwind 4, Prisma 7 + Supabase, zod 4, node:test, react-big-calendar + date-fns 4). Es una app familiar de hábitos/tareas con economía (puntos, XP, monedas, rachas, Tienda), de uso local en casa.
>
> Dentro del repo ya está clonado, SIN modificar, https://github.com/msrbuilds/roost en `vendor/roost/` (commit 492af47; ver `vendor/roost/ORIGEN.md`). Roost es una plataforma de comunidad: Vite + React Router 7 + Tailwind 3 + Express (`vendor/roost/server`) + Supabase/MongoDB, con capa de adaptadores (`src/db`, `src/auth`), 28 services en `src/services`, y ~115 componentes (feed, groups, groups/learn, calendar, events, leaderboard, messages, etc.).
>
> Quiero usar Roost como base para la feature Homeschooling (cursos, lecciones, progreso, calendario, evidencia, portafolio, reportes) de Ordo Diei.
>
> ## Restricción central (no negociable)
> NO se programa nada de cero que Roost ya tenga. Licencias y tamaño no importan; tengo permiso. Se reutiliza el código existente de `vendor/roost`: se copia/porta a `src/` y se adapta SOLO lo necesario (llamadas a datos, router, auth, estilos). Cada archivo portado debe llevar un comentario con su archivo de origen. `vendor/roost/` no se edita.
>
> ## Lectura obligatoria antes de deliberar
> 1. `AGENTS.md` y `CLAUDE.md` del repo (reglas de git, worktrees por lane, `scripts/integrar.sh`, PROHIBIDO `prisma db push`, Next 16 con breaking changes: leer `node_modules/next/dist/docs/`).
> 2. `vault/nuevas-features/homeschooling/` (ARQUITECTURA_DETALLADA.md v2, SPEC.md, lanes H1a–H6, AUDITORIA.md, MAPEO_COMPONENTES_ROOST.md) y `vault/nuevas-features/DECISIONES.md`. OJO: esos docs asumen "Roost = solo referencia visual" y "extender MissionCalendar"; ese supuesto fue REVOCADO por el usuario y debe reemplazarse. Pueden haber sido escritos con alucinaciones: verificá todo contra el código real.
> 3. `vendor/roost/CLAUDE.md`, `vendor/roost/src/**` (sobre todo `components/groups/learn`, `components/calendar`, `components/events`, `services/*`, `db/interfaces`, `contexts`, `pages`), `vendor/roost/prisma/`, `vendor/roost/schema.sql` y `vendor/roost/server/src`.
> 4. El código de Ordo Diei que se cruza: `prisma/schema.prisma`, `src/lib/habitos/server.ts`, `/api/tasks/[id]/complete` y `/approve`, `/api/archivos`, `src/components/tasks/MissionCalendar.tsx`, `src/lib/tienda/`, la auth y el shell del dashboard.
>
> ## Qué tenés que decidir y justificar, con evidencia (rutas y líneas)
> 1. **Inventario de Roost**: tabla de cada módulo/componente/service de Roost con: qué hace, tamaño, dependencias, y veredicto USAR / PORTAR / DESCARTAR para Homeschooling. Con motivo.
> 2. **Estrategia de integración** y comparación de alternativas, con recomendación:
>    a. Portar componentes React a Next (client components) + reescribir solo la capa de datos hacia route handlers/Prisma.
>    b. Correr el servidor Express de Roost como servicio aparte y consumirlo.
>    c. Híbrido.
>    Evaluá: Tailwind 3 vs 4, React Router vs App Router, Supabase client vs Prisma, auth de Roost vs la de Ordo Diei, y el riesgo para la base de producción compartida.
> 3. **Capa de datos**: cómo mapear el `DatabaseAdapter` y los services de Roost a Prisma de Ordo Diei. ¿Se escribe un adaptador Prisma que implemente la interfaz de Roost (así los services y componentes se portan casi sin cambios) o se editan los services? Elegí lo que minimice código nuevo.
> 4. **Modelo de datos**: qué tablas de Roost se reutilizan tal cual (traducidas a Prisma) y cuáles se reemplazan por lo ya existente (Usuario, Tarea, Archivo, puntos). Respetá la decisión de que cada día lectivo sea una `Tarea` real que reutilice `complete`/`approve` (sin código de premios nuevo), o argumentá con evidencia por qué Roost lo cambia. SQL solo aditivo, nunca `db push`.
> 5. **Lo que Roost NO tiene** y sí requiere Homeschooling (pacing/reparto por días lectivos, días no lectivos, quizzes con corrección en servidor, repaso espaciado, horas y reportes). Listalo, y para cada uno buscá primero si existe una librería madura (ver la regla "reusar open source") antes de proponer escribirlo.
> 6. **Plan por lanes** ejecutable: reordená o reescribí H1a–H6 (más una lane previa de "portar base de Roost") con: entregables, archivos de origen en `vendor/roost` → destino en `src/`, tests, criterios de aceptación y dependencias. Cada lane debe poder implementarla otro agente sin preguntar. Respetá worktree por lane, `scripts/integrar.sh` y números de lane libres (verificá con `git worktree list` y `git branch`).
> 7. **Riesgos y conflictos** concretos: dependencias a agregar (con versiones y conflicto con las existentes), duplicación de librerías, CSS/diseño que choca con los componentes del proyecto, seguridad (roles familiares vs roles de comunidad), y rendimiento.
> 8. **Qué se pierde o se recorta** de Roost a propósito (feed, mensajes, live room, etc.) y por qué.
>
> ## Formato de salida
> - Un único documento markdown en español, sin código de producción, con: resumen ejecutivo de 10 líneas, las decisiones 1–8, un registro de decisiones (D-N: decisión, alternativas, razón, cómo revertir) y una lista de preguntas abiertas que SOLO el usuario puede responder (máximo 5, con tu recomendación por defecto para cada una).
> - Marcá explícitamente cada afirmación como VERIFICADA (viste el código) o SUPUESTA. No inventes rutas, funciones ni APIs.
> - Si dos documentos del vault se contradicen, o uno contradice el código, señalalo.
>
> ## Reglas
> - No modifiques `vendor/roost/` ni el código de `src/`. Podés escribir el documento en una lane propia con worktree (`git worktree add -b task/lane-NN-... ../ordo-diei-lanes/lane-NN dev`) bajo `vault/nuevas-features/homeschooling/`, integrarlo con `scripts/integrar.sh` y limpiar el worktree.
> - Deliberá a fondo, contrastá al menos dos alternativas por decisión y elegí una. No me devuelvas un survey: devolvé una recomendación defendida.
