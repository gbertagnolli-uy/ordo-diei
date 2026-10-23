# Lane 254 — Foto de prueba obligatoria en tareas

## Contexto y requerimiento
Al crear o editar una tarea, un padre puede activar **«¿Exige foto de prueba?»**. Si la tarea tiene la opción activa, el asignado no puede marcarla como completada hasta subir una foto. La foto se puede sacar con la **cámara nativa del dispositivo** o elegir desde el **almacenamiento/galería**; en ambos casos se sube directo a la app (sin pegar enlaces ni usar la webcam del navegador).

Decisiones acordadas:
- Una sola foto por tarea; se puede reemplazar antes de completarla.
- Si un padre rechaza la tarea, se borra la foto y el asignado debe subir una nueva.
- Si cambia el responsable, se descarta la foto anterior.
- Las instancias recurrentes y las copias por co-responsables heredan la **exigencia**, pero no la foto.

## Cambios realizados

### Base de datos / Prisma
Se agregaron tres campos a `Tarea`:
- `requiereFotoPrueba` (`Requiere_Foto_Prueba`, boolean, default `false`)
- `fotoPruebaUrl` (`Foto_Prueba_URL`, texto opcional)
- `fotoPruebaSubidaEn` (`Foto_Prueba_Subida_En`, timestamp opcional)

SQL aplicado (solo `ALTER TABLE ... ADD COLUMN`, sin `DROP`):

```sql
ALTER TABLE "Tareas" ADD COLUMN     "Foto_Prueba_Subida_En" TIMESTAMP(3),
ADD COLUMN     "Foto_Prueba_URL" TEXT,
ADD COLUMN     "Requiere_Foto_Prueba" BOOLEAN NOT NULL DEFAULT false;
```

La imagen se guarda en la tabla `Archivo` existente (WebP comprimido con `sharp`, mismo pipeline que `/api/upload`) y la tarea solo conserva la URL `/api/archivos/<uuid>`.

### Backend
- **Nuevo endpoint** `POST /api/tasks/[id]/foto-prueba`: valida sesión y permiso (`puedeCompletarTarea`), exige que la tarea pida foto y esté abierta, recibe el archivo, lo comprime/guarda y lo asocia a la tarea. Reemplaza la foto anterior y limpia el archivo viejo si quedó huérfano.
- **Crear tarea** (`POST /api/tasks`): acepta y propaga `requiereFotoPrueba` en tareas normales, globales y rotativas.
- **Editar tarea** (`PUT /api/tasks/[id]`): actualiza la exigencia, la propaga a la regla padre de una instancia generada, la copia en nuevas filas de co-responsables y **descarta la foto si cambia el responsable**. Al eliminar una tarea o sus filas también se limpian las fotos asociadas.
- **Bulk** (`/api/tasks/bulk`): las copias para nuevos asignados heredan la exigencia.
- **Recurrencia** (`generarRecurrentes.ts`): las instancias nuevas heredan `requiereFotoPrueba`; no copian `fotoPruebaUrl`.
- **Completar** (`/api/tasks/[id]/complete`): devuelve 400 si la tarea exige foto y no tiene una URL interna válida.
- **Aprobar** (`/api/tasks/[id]/approve`): verificación defensiva equivalente.
- **Rechazar** (`/api/tasks/[id]/reject`): limpia `fotoPruebaUrl`/`fotoPruebaSubidaEn` y borra el archivo para exigir una foto nueva.

### Frontend
- **`TaskForm`**: nuevo switch en el paso «Extras» para exigir foto de prueba; se envía en creación y edición.
- **`FotoPruebaTarea`** (nuevo): tarjeta con vista previa y dos botones:
  - **Tomar foto** → `<input type="file" accept="image/*" capture="environment">` (cámara trasera en móvil; en escritorio abre el selector del sistema).
  - **Elegir foto** → selector de imágenes del dispositivo.
  - Muestra progreso de subida y permite reemplazar la foto existente.
- **`TaskDetailPanel`**: muestra la tarjeta de foto, deshabilita «Finalizar» y «Marcar realizada» mientras falte la foto, muestra la foto en el modal de confirmación y permite verla en grande.
- **`TaskBoard`**: bloquea arrastrar a «En revisión» sin foto y abre el detalle con un aviso.
- **`TaskTable`** y **`AdminTasksClient`**: indicador de foto obligatoria / foto pendiente.
- **`ParentReviewPanel`**: miniatura y modal de la foto antes de aprobar, y aviso si falta.

### Tests
- `src/lib/tareas/fotoPrueba.test.ts` (nuevo): regla `fotoPruebaPendiente`/`pideFotoPrueba`.
- `src/lib/generarRecurrentes.test.ts`: verifica que la instancia hereda la exigencia y no la foto.
- `npm test`: **616 tests, 0 fallos** (39 omitidos por requerir `PERMITIR_TESTS_DB=1`).
- `npx tsc --noEmit`: sin errores.

## Archivos modificados
- `prisma/schema.prisma`
- `src/app/api/tasks/[id]/foto-prueba/route.ts` (NUEVO)
- `src/app/api/tasks/[id]/route.ts`
- `src/app/api/tasks/[id]/approve/route.ts`
- `src/app/api/tasks/[id]/complete/route.ts`
- `src/app/api/tasks/[id]/reject/route.ts`
- `src/app/api/tasks/route.ts`
- `src/app/api/tasks/bulk/route.ts`
- `src/lib/generarRecurrentes.ts`
- `src/lib/generarRecurrentes.test.ts`
- `src/lib/subirImagen.ts`
- `src/lib/tareas/fotoPrueba.ts` (NUEVO)
- `src/lib/tareas/fotoPrueba.test.ts` (NUEVO)
- `src/lib/tareas/fotoPruebaServidor.ts` (NUEVO)
- `src/components/tasks/FotoPruebaTarea.tsx` (NUEVO)
- `src/components/tasks/TaskDetailPanel.tsx`
- `src/components/tasks/TaskBoard.tsx`
- `src/components/tasks/TaskTable.tsx`
- `src/components/dashboard/TaskForm.tsx`
- `src/components/dashboard/ParentReviewPanel.tsx`
- `src/app/dashboard/admin/tareas/AdminTasksClient.tsx`
- `vault/LANE_254_FOTO_PRUEBA_TAREAS.md` (NUEVO)
