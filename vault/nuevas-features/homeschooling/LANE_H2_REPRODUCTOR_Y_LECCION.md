# Lane H2 — LMS: Reproductor de Lecciones y "Hoy Aprendo"

> ⚠️ **Auditado el 2026-10-13**: ver [`AUDITORIA.md`](AUDITORIA.md). Donde este documento contradiga a la auditoría, **manda la auditoría**. Condiciones obligatorias de esta lane en el recuadro «Correcciones de auditoría».

> ### Correcciones de auditoría (obligatorias)
> 1. **El bloque `prisma.usuario.update(... puntosAcumulados +20 ... streakDays +1)` de §4 está PROHIBIDO** (C1, C2): `puntosAcumulados` no es XP (el XP es `experienciaHabitos`) y `streakDays` subiría por lección y no por día. La recompensa pasa por el **pipeline existente** de hábitos/tareas (`lib/habitos`, `lib/comportamiento`).
> 2. **Una sola vez por lección** (clave única) y tope diario; desmarcar no devuelve ni repite el premio (C3, A6). Por defecto, premio sujeto a **aprobación del padre** (pregunta H.1 de la auditoría).
> 3. Progreso: actualiza `DiaLectivo` (fuente de verdad, B3); `ProgresoLeccion` solo para recursos con lecciones discretas.
> 4. Calendario del padre: extender `MissionCalendar` (A5). Roost es referencia visual (A2); sin `react-dropzone`.
> 5. Sonido de victoria: depende de **N2**; si no está, omitir. Mantener sesión activa durante la lección (`useMantenerActivo`, N4).
> 6. Ruta única `/dashboard/homeschooling` que bifurca por rol (E9).

> **Estado:** Lista para ejecución cuando H1 esté integrada en `dev`.  
> **Dependencias:** Lane H1 (Modelo y Pacing).  
> **Componentes Fuente:** `src/components/groups/learn/LessonPlayer.tsx`, `LearnSidebar.tsx`, `ProgressBar.tsx` de **Roost (MIT)**.  
> **Tamaño:** L (Frontend interactivo + Doble interfaz niño/padre + Integración de Recompensas).

---

## 1. Objetivo de la Lane

Construir la experiencia formativa diaria del estudiante (**"Hoy Aprendo"**) y el visor del curso, adaptando los componentes del reproductor de video y navegación de **Roost**. Implementar la **Doble Interfaz** (tarjetas táctiles gigantes para el niño vs. cockpit de gestión para el padre), el **desbloqueo secuencial (Sequential Drip)** con candados visuales y la acreditación inmediata de XP, incienso y efectos de celebración al finalizar.

---

## 2. Componentes a Extraer y Adaptar de Roost

### 2.1 `src/components/homeschooling/lms/LessonPlayer.tsx`
- **Base:** `roost/src/components/groups/learn/LessonPlayer.tsx`.
- **Funcionalidad:**
  - Contenedor con aspect-ratio 16:9 responsive.
  - Reproducción de videos educativos (YouTube y Vimeo) con parseo automático de IDs.
  - Título, descripción e instrucciones de la lección (soporte Markdown).
  - Barra de navegación entre lección anterior y siguiente (`ChevronLeft` / `ChevronRight`).
  - Botón grande de estado: **«Marcar como completada» / «Terminé»**.

### 2.2 `src/components/homeschooling/lms/LearnSidebar.tsx`
- **Base:** `roost/src/components/groups/learn/LearnSidebar.tsx`.
- **Funcionalidad:**
  - Lista de módulos y lecciones numeradas.
  - Checkmark verde circular para lecciones aprobadas.
  - **Mecánica de Candado:** Si `!modoLibrePadres` y la lección previa no está completada, el item se renderiza con opacidad 0.5, cursor deshabilitado y un icono `Lock` de Lucide.

### 2.3 `src/components/homeschooling/lms/CourseProgressBar.tsx`
- **Base:** `roost/src/components/groups/learn/ProgressBar.tsx`.
- **Funcionalidad:**
  - Indicador porcentual de avance del curso: `(completadas / total) * 100`.

---

## 3. Doble Interfaz: Niño vs. Padre

### A. Vista del Alumno: `/dashboard/homeschooling` (cuando el usuario es `Hijo` o `Hija`)
- **Cabecera "Hoy Aprendo":** Saludo personalizado, avatar del niño, racha actual de días estudiando (`streakDays`).
- **Grilla de Materias del Día:**
  - Tarjetas gigantes táctiles (`Card` con bordes redondeados y sombras suaves).
  - Icono Lucide grande alusivo a la materia (ej. `Calculator` para matemáticas, `BookOpen` para catecismo, `FlaskConical` para ciencias).
  - Tarea asignada para hoy por el motor de Pacing: *"Capítulo 4: La Antigua Roma"* o *"Páginas 22 a 25"*.
  - Botón de acción principal: **«Empezar»** (abre el visor de lección).
- **Celebración al terminar:**
  - Al presionar **«Terminé»**:
    1. Se actualiza el estado en base de datos (`DiaLectivo.estado = completada`).
    2. Se otorga la recompensa **vía el pipeline existente** (ver correcciones 1–2), no con `update` directo.
    3. Se dispara ráfaga de confeti con `canvas-confetti`.
    4. Se reproduce el sonido de victoria (vía audio manager de Ordo Diei).

### B. Vista del Padre: `/dashboard/homeschooling/admin` (cuando el usuario es `Padre` o `Madre`)
- **Selector de Alumno:** Pestañas con los avatares de los hijos.
- **Cockpit de Cursos:** Lista de materias activas, porcentaje de completitud y botón **«Añadir Curso»** (asistente de alta de materia y recurso).
- **Interruptor de Navegación Libre:** Toggle por curso para activar/desactivar el bloqueo secuencial para ese hijo.
- **Botón «Hoy no hay clase»:** Dispara el recálculo de Snow Day de la Lane H1 con confirmación previa.

---

## 4. Integración con el Ecosistema de Ordo Diei

- Reutilizar `useActiveUserStore` para sincronizar automáticamente el alumno en pantalla.
- Integración con el modelo `Usuario`:
  ```typescript
  await prisma.$transaction([
    prisma.progresoLeccion.create({
      data: { usuarioId, leccionId, completada: true }
    }),
    prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        puntosAcumulados: { increment: 20 },
        incienso: { increment: 1 },
        streakDays: { increment: 1 },
        lastTaskCompletedDate: new Date()
      }
    })
  ]);
  ```

---

## 5. Criterios de Aceptación

1. El niño ve en `/dashboard/homeschooling` exclusivamente las lecciones programadas para la fecha de hoy.
2. Al tocar una lección se abre `LessonPlayer` con el video/instrucciones correspondientes.
3. El candado impide que el niño salte a lecciones futuras sin completar las previas, salvo que el padre active el modo de navegación libre.
4. Al pulsar «Terminé», la UI actualiza el progreso en tiempo real, acredita los puntos en la barra superior del usuario y lanza la animación de confeti.
5. El padre puede ver el progreso global de cada hijo desde su panel de administración.
