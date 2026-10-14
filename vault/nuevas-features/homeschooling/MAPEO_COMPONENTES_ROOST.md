# Mapeo de Extracción y Adaptación: Roost (MIT) hacia Ordo Diei

> **Propósito:** Guía de referencia técnica para las lanes de desarrollo. Detalla los componentes, servicios y tipos del repositorio clonado en `/home/x7/Downloads/dev/roost` que se utilizarán como base, indicando qué se preserva, qué se modifica y cómo se integra con el stack de Ordo Diei.

---

## 1. Módulo LMS y Reproductor de Lecciones

### Archivo Fuente en Roost: `src/components/groups/learn/LessonPlayer.tsx`
- **Ubicación destino:** `src/components/homeschooling/lms/LessonPlayer.tsx`
- **Líneas clave en Roost:**
  - `getEmbedUrl()` [L30-L37]: Soporte para YouTube (`https://www.youtube.com/embed/${id}`) y Vimeo.
  - `handleToggleComplete()` [L39-L55]: Invocación de completado de lección y refresco reactivo.
  - Botones de navegación Anterior/Siguiente [L95-L120]: Navega fluidamente por el árbol del curso.
- **Adaptaciones para Ordo Diei:**
  1. **YouTube IFrame API:** Reemplazar el `iframe` estático por una suscripción a eventos de tiempo (`player.getCurrentTime()`) para disparar los **Checkpoints de Active Recall**.
  2. **Estilos:** Adaptar clases `dark:text-surface-*` a los tokens de color semánticos de Ordo Diei (`text-foreground`, `bg-card`, `border-border`).
  3. **Backend:** Sustituir la llamada directa a Supabase `markLessonComplete` por la Server Action `completarLeccionAction` de Next.js.
  4. **Gamificación:** Al marcar como completado, conectar con el motor de recompensas de Ordo Diei (XP, incienso, racha de hábitos y animación de confeti).

---

### Archivo Fuente en Roost: `src/components/groups/learn/LearnSidebar.tsx` y `ModuleDetail.tsx`
- **Ubicación destino:** `src/components/homeschooling/lms/LearnSidebar.tsx`
- **Líneas clave en Roost:**
  - Renderizado de lista de grabaciones/lecciones con checkmarks [L45-L95].
  - Duración estimada por video y enlaces a recursos adicionales (`assets`).
- **Adaptaciones para Ordo Diei:**
  1. **Desbloqueo Secuencial (Sequential Drip):**
     - Añadir icono de candado (`Lock` de Lucide) cuando `!isUnlocked`.
     - Lógica de desbloqueo: La lección $N$ solo es clickeable si la lección $N-1$ fue completada con calificación $\ge 70\%$, o si el padre activó `modoLibrePadres: true`.
  2. **Indicador de Repaso Espaciado:** Si una lección fue inyectada por el motor de reset, mostrar un distintivo `Badge` ámbar: *"Repaso sugerido"*.

---

### Archivo Fuente en Roost: `src/components/groups/learn/ProgressBar.tsx`
- **Ubicación destino:** `src/components/homeschooling/lms/CourseProgressBar.tsx`
- **Líneas clave en Roost:**
  - Barra de progreso porcentual fluida [L1-L35] calculada como `(completed_count / recording_count) * 100`.
- **Adaptaciones para Ordo Diei:**
  1. Utilizar el componente base `Progress` de Radix UI / Shadcn ya instalado en Ordo Diei.
  2. Integrar variante de color dinámico según la materia (`colorMateria`).

---

## 2. Módulo de Portafolio y Captura de Evidencias

### Archivo Fuente en Roost: `src/pages/ShowcaseSubmit.tsx` y `ShowcaseCard.tsx`
- **Ubicación destino:** 
  - `src/components/homeschooling/portfolio/CapturaEvidenciaModal.tsx`
  - `src/components/homeschooling/portfolio/EvidenciaCard.tsx`
- **Líneas clave en Roost:**
  - `useDropzone` [L13] para arrastrar y soltar imágenes o abrir selector de archivos.
  - Auto-guardado de borradores en `localStorage` (`showcase_submit_draft`) [L33-L47].
  - Carga múltiple de imágenes y previsualización inmediata [L65-L75].
  - `src/services/showcase.ts`: CRUD de evidencias y cola de moderación.
- **Adaptaciones para Ordo Diei:**
  1. **Disparador Nativo de Cámara en Móvil/Tablet:**
     - Añadir botón de captura táctil: `<input type="file" accept="image/*" capture="environment" />`.
     - En tablets de pared o portátiles, permitir también selección de archivo tradicional o arrastre.
  2. **Nota de Voz Embebida (10 segundos):**
     - Añadir botón de micrófono con la Web MediaRecorder API para que el niño grabe una breve explicación de su trabajo manual.
  3. **Almacenamiento en Ordo Diei:**
     - Conectar directamente con el modelo `Archivo` de Ordo Diei mediante `POST /api/archivos` (que ya procesa, recorta y comprime a WebP con `sharp`).
  4. **Flujo de Aprobación de Padres:**
     - Adaptar la vista de moderación de Roost (`admin/Showcases.tsx`) para usar el componente táctil `SwipeRow.tsx` (desarrollado en la Lane 75 de Ordo Diei), permitiendo al padre aprobar o pedir ajustes con un deslizamiento del dedo.

---

## 3. Módulo de Calendario y Logística Familiar

### Archivo Fuente en Roost: `src/components/calendar/CalendarView.tsx`
- **Ubicación destino:** `src/components/homeschooling/calendar/LiquidCalendar.tsx`
- **Líneas clave en Roost:**
  - Integración nativa con `react-big-calendar` y `date-fnsLocalizer` [L1-L25].
  - Vistas configurables: `month`, `week`, `day` y `agenda`.
  - Manejo de selección de slots y eventos (`handleSelectEvent`, `handleSelectSlot`) [L43-L53].
- **Compatibilidad con Ordo Diei:**
  - **Match Absoluto:** Ordo Diei ya tiene exactamente instaladas las versiones requeridas:
    - `"react-big-calendar": "^1.19.4"`
    - `"@types/react-big-calendar": "^1.16.3"`
    - `"date-fns": "^4.4.0"`
- **Adaptaciones para Ordo Diei:**
  1. **Lógica de "Días de Nieve" / Feriados:**
     - Renderizar días marcados en `DiaNoLectivo` con sombreado rayado gris y texto *"No lectivo: [Motivo]"*.
  2. **Redistribución por Arrastre:**
     - Al arrastrar una lección a otra fecha, disparar la Server Action de recálculo dinámico de Pacing.
  3. **Eventos Mixtos:**
     - Mostrar simultáneamente las lecciones académicas del día y las tareas/hábitos regulares de Ordo Diei para tener una vista unificada del hogar.

---

## 4. Módulo de Consultas y Servicios (Backend)

### Archivo Fuente en Roost: `src/services/module.ts`
- **Ubicación destino:** `src/lib/homeschooling/server/queries.ts` y `actions.ts`
- **Transformación de Arquitectura:**
  - En Roost, las consultas se realizan con el cliente Supabase de frontend (`supabase.from('modules').select(...)`).
  - En Ordo Diei, por seguridad y rendimiento en Next.js 16, se migran a **Server Functions tipadas con Prisma 7**:
    ```typescript
    // Antes (Roost / Supabase client):
    // const { data } = await supabase.from('modules').select('*').eq('group_id', groupId);

    // Ahora (Ordo Diei / Prisma 7 Server Action):
    import prisma from '@/lib/prisma';

    export async function getMateriasConProgreso(alumnoId: number) {
      return await prisma.materia.findMany({
        where: { alumnoId, activa: true },
        include: {
          recursos: {
            include: {
              planCurso: {
                include: {
                  diasLectivos: true
                }
              }
            }
          }
        },
        orderBy: { orden: 'asc' }
      });
    }
    ```
