# Lane 156 — Homeschooling: lo que faltaba de las specs

Pedido del usuario: "implementa todo lo faltante y lo que no se hizo. Tambien lo que quedó fuera analiza si se debe hacer, en caso que si analiza como hacerlo."

## Hecho
- Cámara en `TarjetaHoy` y en Primero/Después (`EnviarEvidencia` con el `diaLectivoId`).
- Reordenar cursos y lecciones desde la interfaz (subir/bajar; modo «Ordenar» en la materia).
- Editar y archivar una materia (cabecera de la materia) y restaurar las archivadas (panel).
- Gestión de planes: `cambiarPlan` (estado, fecha de fin, días) y `quitarPlan`, `PATCH|DELETE /api/homeschooling/planes/[id]`, menú por alumno en el detalle del curso y diálogo `EditarPlan`.
- Contraste AA: `contraste.ts` + `contraste.test.ts` (lee `globals.css`); corrección de los avisos `destructive` en el tema oscuro.
- N4 conectado (`useMantenerActivo`), `TemporizadorLeccion` (reloj visual) en Primero/Después y `Cronometro` para actividades.

## Verificación
`tsc`, `eslint`, `npm test` (363) y `next build` en verde. Nuevos tests: contraste (7), temporizador (4), planes (1 sin base + 1 con base, saltado sin la bandera). Sin prueba en navegador todavía (lane 158).
