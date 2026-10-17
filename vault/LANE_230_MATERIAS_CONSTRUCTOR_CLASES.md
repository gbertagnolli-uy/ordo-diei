# Lane 230 — Panel Materias, Constructor de Clases y Evaluaciones Imprimibles

## Resumen de cambios
1. **Nuevo panel «Materias» (`/dashboard/homeschooling/materias`)**:
   - Se incorporó la pestaña **Materias** en `CabeceraEstudio.tsx` para padres, separándola del **Panel** principal.
   - `PanelMaterias.tsx` centraliza la gestión de materias (crear, editar, archivar, restaurar, eliminar), cursos (crear, importar, Biblioteca Católica), métricas de clases/materiales/quizzes por curso, asignación al plan y carga directa de materiales para el plan diario.
2. **Panel principal de Resumen y Notificaciones (`/dashboard/homeschooling`)**:
   - `PanelHomeschooling.tsx` quedó dedicado exclusivamente al resumen del día (KPIs), centro de notificaciones (`AvisoEstudio` con lectura rápida y marcado como leído), alertas de repaso y revisiones pendientes, resumen semanal y estado diario por hijo.
3. **Carga multimodal de materiales de estudio (Plan y Cursos)**:
   - Se amplió el sistema de archivos (`guardarArchivoEstudio` en `src/lib/archivos.ts`, `POST /api/upload` con `modo="estudio"` y `GET /api/archivos/[clave]?descargar=1`) para admitir tanto imágenes comprimidas WebP como documentos descargables (`.pdf`, `.epub`, `.doc`, `.docx`, `.odt`, `.txt`, `.md`, `.csv`, `.xls`, `.xlsx`, `.ppt`, `.pptx`).
   - `AgregarMaterial.tsx` y `ListaMaterial.tsx` ofrecen 5 modos explícitos: **Texto / Tarea** (con barra Markdown y vista previa), **Imagen / Lámina** (subida desde el dispositivo o URL), **Video embebido** (YouTube, Vimeo, `.mp4`/`.webm` con reproductor en vivo), **Archivo / Libro descargable** (subida o Drive/Docs) y **Enlace web**.
4. **Constructor de Clases y Cursos (estilo Circle / Thinkific enfocado en tareas)**:
   - `CursoForm.tsx` crea por defecto cursos estructurados por clases y tareas (`unidad: "leccion"`), permitiendo configurar el umbral de aprobación de evaluaciones.
   - `CursoDetalle.tsx` muestra siempre el **Constructor de clases y evaluaciones** en orden `1..N`, con botones directos en cada fila para **Materiales**, **Quiz / Eval.** e **Imprimir**.
   - `LeccionForm.tsx` permite armar una clase combinando consigna Markdown, imagen subida (`miniaturaUrl`), video embebido y documento descargable (o un único formato de contenido) y pasar directo a configurar su evaluación.
   - `VistaLeccion.tsx` integra en una sola vista la consigna Markdown, video/archivo descargable, imagen de la clase, bloques de materiales expandidos (`ListaMaterial`) y las preguntas del Quiz/Assessment.
5. **Quizzes, Evaluaciones (Assessments) y Clases Imprimibles (`/dashboard/homeschooling/imprimir/quiz/[id]`)**:
   - `HojaQuizImprimible.tsx` genera hojas A4 listas para imprimir en tres modos: **Evaluación para el alumno** (sin respuestas, con encabezado de calificación y renglones opcionales de desarrollo), **Clave de respuestas para padres** (con opción correcta marcada y explicación) y **Hoja de clase completa** (consigna + imágenes + bloques de lectura + evaluación).
