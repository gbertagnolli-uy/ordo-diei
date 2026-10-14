# Lane H3 — Evidencia Rápida y Portafolio Digital

> ⚠️ **Auditado el 2026-10-13**: ver [`AUDITORIA.md`](AUDITORIA.md). Donde este documento contradiga a la auditoría, **manda la auditoría**. Condiciones obligatorias de esta lane en el recuadro «Correcciones de auditoría».

> ### Correcciones de auditoría (obligatorias)
> 1. **Privacidad (E1):** `/api/archivos/<uuid>` es público. Las fotos/audios de los niños deben servirse **con sesión y permiso** (padres + el propio alumno): ruta nueva o flag privado en `Archivo`.
> 2. **Audio (E2):** `Archivo` solo acepta imágenes. Hay que ampliarlo (MIME `audio/webm` y `audio/mp4`, iOS no graba webm; tope ~200 KB y 10 s) o dejar la nota de voz fuera de v1.
> 3. **Espacio (E3):** fotos y audio van en Postgres (`Bytes`). Medir y poner tope por alumno/mes; plan B Supabase Storage.
> 4. **Swipe invertido (C6):** en Ordo (lane 75) **izquierda = aprobar (verde), derecha = rechazar**. Respetarlo.
> 5. Bonus de XP/estrellas con tope diario, por el pipeline existente (C2/C3). Limpiar `Archivo` huérfanos al borrar (B10).
> 6. Sin `react-dropzone` (A3): `<input type=file capture>` alcanza. Borrador de la nota con el sistema de borradores (N5).

> **Estado:** Lista para ejecución cuando H2 esté integrada en `dev`.  
> **Dependencias:** Lane H2 (LMS y Lecciones).  
> **Componentes Fuente:** `src/pages/ShowcaseSubmit.tsx`, `src/components/showcase/ShowcaseCard.tsx` de **Roost (MIT)** y `src/components/SwipeRow.tsx` de **Ordo Diei**.  
> **Tamaño:** L (Cámara web/nativa + Audio + Subida WebP + Aprobación Swipe + Galería).

---

## 1. Objetivo de la Lane

Permitir al estudiante capturar de forma inmediata evidencias visuales (fotos de dibujos, maquetas, experimentos científicos) y notas de audio de sus actividades académicas, almacenándolas de forma comprimida en el modelo `Archivo` de Ordo Diei. Proveer al padre un panel de revisión táctil con gesto de deslizamiento (Swipe) para aprobar con estrellas/comentarios, alimentando el **Portafolio Digital Anual** del estudiante.

---

## 2. Componentes a Extraer y Adaptar

### 2.1 Botón Flotante de Cámara y Modal de Captura
- **Ubicación destino:** `src/components/homeschooling/portfolio/CapturaEvidenciaModal.tsx`
- **Adaptado de:** `roost/src/pages/ShowcaseSubmit.tsx`.
- **Mecánica de Captura Táctil:**
  ```tsx
  {/* Disparador nativo para tablets y smartphones */}
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    capture="environment"
    className="hidden"
    onChange={handleFileSelected}
  />
  ```
  - Si el dispositivo no tiene cámara o está en escritorio, permite seleccionar archivo o arrastrar y soltar (`useDropzone`).
  - Previsualización instantánea de la imagen capturada con opción de reintentar.

### 2.2 Grabadora de Audio de 10 Segundos
- **Mecánica:** Mediante la Web MediaRecorder API (`navigator.mediaDevices.getUserMedia({ audio: true })`):
  - Botón de micrófono: al mantener presionado o tocar "Grabar", inicia la captura.
  - Temporizador visual de cuenta regresiva (10 segundos máximo).
  - Generación de blob comprimido `audio/webm`.
  - Permite al niño explicar verbalmente su creación: *"Esta es mi maqueta del volcán hecha con plastilina y bicarbonato"*.

### 2.3 Procesamiento y Almacenamiento en Ordo Diei
- Se envía la foto y el audio al endpoint `/api/archivos` de Ordo Diei.
- El servidor procesa la imagen con `sharp`, optimizándola a formato WebP progresivo y generando una clave única UUID (`Archivo.clave`).
- Se crea el registro relacional en `EvidenciaAprendizaje`:
  ```prisma
  model EvidenciaAprendizaje {
    id           Int              @id @default(autoincrement())
    diaLectivoId Int?
    alumnoId     Int
    archivoClave String
    audioVozClave String?
    notaEstudiante String?
    estado       EstadoEvidencia  @default(pendiente_revision)
    ...
  }
  ```

---

## 3. Panel de Aprobación de Padres (Swipe de Moderación)

- **Ubicación:** `/dashboard/homeschooling/revision`
- **Reutilización de Componente:** `src/components/SwipeRow.tsx` (creado en Lane 75 de Ordo Diei).
- **Flujo de Interacción:**
  - El padre ve una tarjeta con la foto del trabajo, el audio de 10s reproducible y los datos de la materia.
  - **Deslizar a la izquierda (Verde):** Aprueba la evidencia, asigna 1 a 5 estrellas opcionales y acredita una bonificación de XP al alumno.
  - **Deslizar a la derecha (Ámbar/rojo):** Solicita ajustes o agrega una nota correctiva *"Por favor rehacer la página 14 corrigiendo los signos"*.

---

## 4. Galería del Portafolio Anual

- **Ubicación:** `/dashboard/homeschooling/portafolio`
- **Adaptado de:** `roost/src/components/showcase/ShowcaseCard.tsx`.
- **Características:**
  - Grilla visual estilo Pinterest/Showcase filtrable por:
    - Alumno (Leo, Sofía).
    - Materia (Historia, Arte, Ciencias).
    - Mes / Trimestre escolar.
  - Cada tarjeta muestra la fotografía en alta calidad, fecha de realización, estrellas otorgadas por el padre y etiqueta de materia.
  - Opción **«Destacar para el reporte oficial»**: Marca las mejores evidencias del año para ser incluidas automáticamente en la exportación de cumplimiento legal (Lane H5).

---

## 5. Criterios de Aceptación

1. En la vista de lección del niño aparece el botón de cámara accesible en 1 clic.
2. Al tomar la foto en una tablet, se previsualiza y sube exitosamente a la base de datos a través de `/api/archivos`.
3. La nota de voz de 10s se graba y reproduce limpiamente en el navegador.
4. Las evidencias pendientes se listan en el panel del padre y pueden aprobarse mediante gesto swipe.
5. El portafolio anual muestra las fotos aprobadas con sus fechas y materias correspondientes.
