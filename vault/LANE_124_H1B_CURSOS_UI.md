# Lane 124 — H1b-2: interfaz del padre (materias, cursos, plan)

Pedido: "continua implementando hasta terminar" (meta del 2026-10-14). Segunda mitad de H1b (spec `LANE_H1B_ALTA_Y_PLAN_PADRE.md` §UI).

## Portado de `vendor/roost` (cabecera «Portado de …» en cada archivo)
`ModuleCard`→`cursos/CursoCard`, `ModuleGrid`→`CursoGrid`, `LearnSidebar`→`MateriaSidebar` (cajón móvil con `Sheet`), `CompactGroupHeader`→`MateriaHeader` (pestañas de alumnos), `ModuleDetail`→`CursoDetalle` (sin assets; plan de cada alumno y «Asignar a…»), `LearnGroupLayout`→`MateriaLayout` (una sola consulta), `ManageModuleModal`→`CursoForm`, `AddRecordingModal`→`LeccionForm`, `CreateGroupModal`→`MateriaForm` (reducido), `LessonPlayer`→`VistaLeccion` (vista previa del padre, sin completar), `pages/Calendar.tsx`→`plan/PlanCalendario` (sobre el `CalendarView` de HS0, con arrastre).

## Propio de Ordo (marcado `// Propio de Ordo`)
`PortadaCampo`, `iconos`, `MateriaPagina`, `plan/AsistenteCurso` (Stepper, 4 pasos), `plan/HoyNoHayClase` (antes/después), `plan/DiasSinClase`, `plan/PanelHomeschooling`, `plan/stepperVars`.

## Servidor / API agregado
`vistaNoLectivo`, `listarNoLectivos`, `quitarNoLectivo` en `servidor/planes.ts` (+ rutas `no-lectivos` GET, `no-lectivos/vista-previa`, `no-lectivos/[id]` DELETE); `servidor/vistas.ts`; `obtenerRecurso`.

## Páginas
`/dashboard/homeschooling` (padre: materias; hijo: «Próximamente»), `materias/[id]`, `plan`, `dias-sin-clase`; enlace «Estudio» en `AppSidebar` (no en `MainDock`).

## Verificación
`tsc`, `eslint`, `npm test` y `next build` en verde. No se hicieron capturas ni pruebas a mano (ver P-8). Hallazgos P-8 a P-12 en `HALLAZGOS_PENDIENTES.md`.
