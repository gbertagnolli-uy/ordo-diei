# Lane 71 — Creación de tareas con Stepper (formulario multipaso)

Pedido (textual): "para la creacion de tareas quiero usar un steper, para que sea un "formulario multipaso". [...] La idea principal es facilitar la creación de tareas y no pedir toda la información de una."
Componente provisto por el usuario (pegado en el chat): Stepper con `Step`, props `step/onStepChange/linear/frame/theme/nextButtonProps…` (@hugeicons).

- `src/components/Stepper.tsx`: el componente tal cual se entregó (+ un `eslint-disable react-hooks/refs` en `tightRef.current = tight`).
- `src/components/dashboard/TaskForm.tsx`:
  - **Alta** (`/dashboard/tasks/new`): 5 pasos — Qué (título, descripción) · Quién (global / miembros) · Cuándo (recurrencia, fecha, hora) · Esfuerzo (minutos, dificultad) · Extras (checklist, recompensa sorpresa). El último botón es "Registrar Tarea".
  - **Edición** (modal del admin): sigue siendo un formulario de una página con las mismas secciones apiladas.
  - Todos los campos pasaron a estado controlado (el Stepper desmonta los pasos que no se ven, así que `FormData` ya no sirve). El body enviado a la API es idéntico; los campos que no aplican a la recurrencia se mandan `null`, como antes.
  - Validación por paso con `toast.error` al apretar "Siguiente"; `linear` impide saltar pasos no alcanzados.
  - Tema: sigue la clase `dark` de `<html>` y el color sólido usa `--primary`.
- Sin cambios de esquema ni de API.
