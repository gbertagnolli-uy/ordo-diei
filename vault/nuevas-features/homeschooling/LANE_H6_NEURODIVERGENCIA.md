# Lane H6 — Neurodivergencia: Primero/Después, historias sociales y modo relajado

> Lista para implementar. Depende de **H2**. Tamaño **M**. **Kiosk, Curfew y Battery Health salen de esta lane** (decisión D6: APP nativa). Lo que no se puede hacer desde un navegador no se promete.

## Objetivo
Reducir la sobrecarga para niños con TDAH/TEA/dislexia con vistas simples y menos estímulo.

## Modelo (esta lane agrega)
`PreferenciaAlumno`, `HistoriaSocial` (ARQ §3).

## Entregables
1. **Modo relajado** (`PreferenciaAlumno.modoRelajado`, lo activa el padre desde el perfil del alumno o el propio alumno):
   - Atributo `data-relajado` en `<html>` que activa un bloque de variables CSS (paleta pastel desde los tokens existentes: baja saturación, mayor contraste de texto) y fuerza **cero animaciones decorativas** (equivale a `prefers-reduced-motion`).
   - No lanzar confeti (`canvas-confetti`) y reemplazarlo por un check estático.
   - Si existe el motor de audio (N2) y música (N3): silenciar fanfarrias y música para ese alumno. No se crean sonidos nuevos.
   - Probar contraste AA en las pantallas de Hoy aprendo.
2. **Primero / Después** (`primeroDespues`): variante de «Hoy aprendo» con dos tarjetas enormes — **PRIMERO** = la lección actual (con barra de tiempo estimada, del tiempo de la Tarea) y **DESPUÉS** = `recompensaDespues` (texto que fija el padre: «15 min de Lego»). Al terminar PRIMERO se atenúa y DESPUÉS pasa a primer plano. Sin temporizador obligatorio; si existe N13, mostrarlo.
3. **Historias sociales:** CRUD simple del padre (título + 3 a 5 pasos con texto corto e icono Lucide) y visor a pantalla completa de pasos grandes. El padre puede «Mostrar hoy» una historia (aparece como tarjeta en la parte superior de Hoy aprendo hasta que el niño la vea). Plantillas iniciales: «Hoy no hay clase», «Vamos al médico», «Vienen visitas».
4. Pantalla del padre para configurar lo anterior por alumno.

## Pruebas
Test de la función que decide qué vista mostrar (normal / primero-después / relajado) y de la normalización de pasos (3–5, texto no vacío). Capturas con modo relajado activo.

## Aceptación
1. Con modo relajado no hay confeti ni movimiento decorativo y el color es sereno.
2. Primero/Después muestra una sola tarea y su recompensa.
3. El padre crea una historia social y el niño la ve en pasos grandes.
4. Nada de esto requiere permisos del sistema ni APIs no soportadas.
