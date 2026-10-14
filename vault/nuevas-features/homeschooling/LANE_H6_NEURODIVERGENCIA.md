# Lane H6 — Neurodivergencia: Primero/Después, historias sociales y modo relajado

> Lista para implementar. Depende de **H2**. Tamaño **M**. Roost no tiene nada aplicable (se escribe). **Kiosk, Curfew y Battery Health no están acá** (D6: APP nativa). Lo que un navegador no puede hacer no se promete.
> Número: el siguiente libre al crearla. Rama sugerida `task/lane-NN-hs-neurodivergencia`. Sin dependencias nuevas.

## Objetivo
Reducir la sobrecarga para niños con TDAH/TEA/dislexia con vistas simples y menos estímulo.

## Modelo (esta lane agrega)
`PreferenciaAlumno`, `HistoriaSocial` y la relación inversa de ARQ §3.2.

## Entregables
1. **Modo relajado** (`PreferenciaAlumno.modoRelajado`; lo activa el padre desde el perfil del alumno o el propio alumno):
   - Atributo `data-relajado` en `<html>` que activa un bloque de variables CSS (paleta de baja saturación a partir de los tokens existentes, mayor contraste de texto) y quita animaciones decorativas (equivale a `prefers-reduced-motion`).
   - **Sin confeti:** el confeti de completar sale de `ModalManager` (`src/components/dashboard/ModalManager.tsx:48`, `celebrate(...)` para `TASK_SUCCESS`). Agregar ahí **solo** la condición «si `document.documentElement.dataset.relajado` no está activo» y mostrar un check estático en su lugar. Para los demás usuarios no cambia nada.
   - Si existen el motor de audio (N2) y la música (N3): silenciar fanfarrias y música para ese alumno. No se crean sonidos.
   - Contraste AA en «Hoy aprendo».
2. **Primero / Después** (`primeroDespues`): variante de «Hoy aprendo» con dos tarjetas enormes — **PRIMERO** = la lección actual (con barra del tiempo estimado de la Tarea) y **DESPUÉS** = `recompensaDespues` (texto del padre: «15 min de Lego»). Al terminar PRIMERO se atenúa y DESPUÉS pasa al frente. Si existe el temporizador (N13), mostrarlo.
3. **Historias sociales:** CRUD del padre (título + 3 a 5 pasos con texto corto e ícono Lucide) y visor a pantalla completa. «Mostrar hoy» la pone como tarjeta arriba de «Hoy aprendo» hasta que el niño la vea. Plantillas: «Hoy no hay clase», «Vamos al médico», «Vienen visitas».
4. Pantalla del padre para configurar lo anterior por alumno.

## Tests
Función que decide la vista (normal / primero-después / relajado) y normalización de pasos (3–5, texto no vacío). Capturas con modo relajado.

## Aceptación
1. Con modo relajado no hay confeti ni movimiento decorativo y el color es sereno; sin él, completar una tarea se ve igual que hoy.
2. Primero/Después muestra una sola tarea y su recompensa.
3. El padre crea una historia social y el niño la ve en pasos grandes.
4. Nada requiere permisos del sistema ni APIs no soportadas.
