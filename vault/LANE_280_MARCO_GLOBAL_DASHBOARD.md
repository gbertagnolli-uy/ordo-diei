---
lane: 280
titulo: Marco global de /dashboard (barra con trigger + padding en el layout)
plane: "-"
estado: integrada
rama: task/lane-280-marco-global-dashboard
agente: claude (X7)
actualizado: 2026-11-07
---

# Lane 280 — Marco global de /dashboard

## Especificación
Gabriel (2026-11-07): `/dashboard/biblioteca` no tenía el botón de colapsar el sidebar ni padding. «La idea es que sea algo global y no que cada página lo ponga por su cuenta. Si no, cada vez que hago una pantalla nueva te olvidás de poner el botón de colapsar de PageHeader. Lo mismo con el contenedor de cada vista, ya debería tener un padding o margin global.» Decisión registrada en [[REDISENO_UI_V3]] §7. Diseño aprobado por Gabriel el mismo día.

## Decisiones
- D1 · El layout de `/dashboard` dibuja siempre la barra superior (`SidebarTrigger` + migas). Las migas salen solas de la URL con un mapa único de rutas (`src/components/app/rutasDashboard.ts`).
- D2 · `PageHeader` deja de dibujar la barra: solo manda título, subtítulo, botones y (opcional) una fila de secciones a la barra global por portal. Si una página no lo usa, se ven las migas automáticas.
- D3 · El layout pone el padding del contenido (`p-4 sm:p-6`, `print:p-0`). El ancho máximo lo elige cada pantalla.
- D4 · Excepciones sin padding, en una sola lista (`SIN_PADDING` en `rutasDashboard.ts`): `/dashboard` (tablero con panel lateral), `/dashboard/notas`, `/dashboard/homeschooling/mensajes`, `/dashboard/homeschooling/materias/[id]`.
- D5 · Las pestañas de Estudio pasan a ser la segunda fila de la barra global (prop `secciones` de `PageHeader`); se quita la cabecera propia.

## Archivos en alcance
- `src/components/app/rutasDashboard.ts` (+ test) (crear)
- `src/components/app/MarcoDashboard.tsx` (crear)
- `src/components/app/PageHeader.tsx`, `src/app/dashboard/layout.tsx`, `src/app/dashboard/liturgia/layout.tsx`, `src/components/homeschooling/nav/CabeceraEstudio.tsx` (modificar)
- Contenedores raíz con padding propio de las pantallas de `/dashboard` (modificar: solo se quita el padding duplicado)
- Alturas `calc(100svh-…)` de `NotasWorkspace`, `MateriaSidebar`, `Mensajeria` (modificar)
- Biblioteca: `DetalleLibro`, `GestionBiblioteca`, páginas `libro/[id]` y `leer/[id]` (modificar)

## Criterios de aceptación
- Toda pantalla de `/dashboard` muestra el botón de colapsar y tiene padding, sin que la página haga nada.
- Ninguna pantalla queda con doble barra ni doble padding.
- Estudio conserva pestañas, buscador, mensajes, avisos y atrás/adelante.
- Impresión sin barra ni padding.
- Escritorio y celular, claro y oscuro.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint <archivos>` · recorrida en navegador

## Hallazgos
- Antes de la lane el botón se dibujaba de 5 maneras (PageHeader en ~20 páginas, CabeceraPagina, CabeceraEstudio y 7 vistas vía PageHeader) y casi todas las pantallas ponían su propio padding.

## Bitácora
- 2026-11-07 · claude (X7) · INICIO · worktree `ordo-diei-lanes/lane-280` desde dev `4703831`
- 2026-11-07 · claude (X7) · implementado: `MarcoDashboard` + `rutasDashboard` (+2 tests), `PageHeader` por portal, Estudio en la barra global, 58 contenedores sin padding duplicado, alturas de notas/materia/mensajes. tsc 0, eslint 0 errores. Verificación visual contra `verif-db` (3180 lane, 3181 base `4703831`) con `verif-db/i280.mjs`.
- 2026-11-07 · claude (X7) · Gabriel: «Los testeos los hago yo» / «No levantes nada». Verificación visual cortada a mitad (medido: Horarios antes 0 triggers/44px → después 1/24px; Calendarium 36px → 24px; sin anomalías hasta `users/pines`). Servidores, base local y worktree de comparación bajados. Se agregó a la lane la regla 10 de AGENTS.md (no levantar servidores sin permiso). `node_modules` de la lane había quedado con `@prisma/client` y `sharp` vacíos tras desarmar el worktree de comparación (el principal y la 281 intactos); reparado con `npm install` + `prisma generate`. Gates: tsc 0, 714 pass, 1 fail ajeno (ver abajo). Sin commit: espera las pruebas de Gabriel.
- 2026-11-07 · claude (X7) · arreglo del test de agenda con OK de Gabriel (vencimiento 2099); al traer `dev` se conservó la versión equivalente de la 281.
- 2026-11-07 · claude (X7) · FIN · Gabriel: «mergeá todo a dev». PR #87 integrado (`872073f`, merge commit) tras traer #86 (lane 281; mismo arreglo del test de agenda → se conservó el de dev). Gates: 722 pass / 0 fail, tsc 0, Vercel preview OK. `limpiar-lane.sh 280` OK.
- 2026-11-07 · claude (X7) · Integrado también el PR #85 de otro agente (`task/lane-280-lector-ebook-foliate`, lector ePub a pantalla completa con foliate-js) → `6b5b86f`. Conflictos resueltos conservando ambos lados: `vendor/bookorbit/ORIGEN.md` (viñeta foliate + línea de la 281) y el test de agenda (versión de dev). 728 pass / 0 fail, tsc 0, Vercel OK. El lector es `fixed inset-0 z-[70]`: el marco global no lo afecta.


## Pendientes
- Pruebas visuales de Gabriel (biblioteca + lector nuevo, Estudio en celular, notas/mensajes/materia, hojas de imprimir).
- PR #84 dev → main: lo integra Gabriel.
- Base local `verif-db`: quedó un libro de prueba (id 102, «Historia de un alma») en `Biblioteca_Libros`.

## Hallazgos (cont.)
- **Colisión de número:** el PR #85 usó también el número 280 y no tiene archivo en el vault; su trabajo queda registrado acá y en [[LANE_270_BIBLIOTECA_BOOKORBIT]]. Próxima lane libre: 282.
- Ramas remotas `dev-11158472334127854692`, `dev-17333965249241393208`, `dev-2244126613689611360`: auditorías de junio–agosto (una de Jules) sobre `42fd3f7` (13/06), anteriores al rediseño. **No se integraron** (pisarían meses de trabajo). **Borradas del remoto el 2026-11-08 con OK de Gabriel.** SHA para recuperarlas si hiciera falta: `9e3ef0f9a13068d09d6c95c82c352700d514cbad`, `e63b6b6bc963df5eb835ff7a1c0e5b50ac19a240`, `08256afeb4adbdcb08de990e9d812eae9c021af9` (en ese orden).
- Worktree viejo `ordo-diei-lanes/lane-249` (rama ya integrada) y carpeta suelta `ordo-diei-lanes/lane-247`: no son de esta lane; se dejan.
- `src/components/tasks/agendaUtils.test.ts` («un día futuro sin instancia…») falla en `dev` desde las 18:00 del 2026-11-07: la tarea `unica` vence ese día a las 18:00 y `estadoEnAgenda` compara con la hora real → «Atrasada». Bomba de tiempo del test (lane 262), no de la app. **Resuelto** (2026-11-07): vencimiento relativo a «mañana» en `dev` (lanes 281/280, mismo arreglo).
