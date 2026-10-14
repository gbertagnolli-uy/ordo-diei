# Lane H3 — Evidencia con foto y portafolio

> Lista para implementar. Depende de **H2**. Tamaño **M**. Solo **fotos** (HD6); el audio queda fuera de v1.

## Objetivo
El niño fotografía un trabajo, el padre lo revisa deslizando, y las mejores quedan en un portafolio.

## Modelo (esta lane agrega)
`EvidenciaAprendizaje` y enum `EstadoEvidencia` (ARQ §3).

## Servidor
- `servidor/evidencia.ts`: `crearEvidencia({ alumnoId, diaLectivoId?, archivoClave, titulo?, nota? })`, `revisar({ actorId, id, accion: "aprobar" | "ajustar", estrellas?, comentario? })` (solo Padre/Madre), `destacar(id, bool)`, `listarPendientes()`, `portafolio({ alumnoId?, materiaId?, desde?, hasta? })`.
- La foto se sube con la ruta existente `POST /api/archivos` (compresión WebP con `sharp`, tope 4 MB, perfil `general`); la evidencia guarda la `clave`. Validar que la clave exista.
- **Las estrellas son solo valoración: no dan monedas ni XP** (evita una segunda fuente de premios; el premio del trabajo ya viene de la Tarea).
- Al borrar una evidencia, borrar su `Archivo` si ninguna otra fila lo usa (función `limpiarArchivo` con test).
- API: `POST /api/homeschooling/evidencias`, `GET /api/homeschooling/evidencias?estado=`, `PATCH /api/homeschooling/evidencias/[id]`.

## UI
- **Botón de cámara** en `VisorLeccion` y en la tarjeta de «Hoy aprendo»: `<input type="file" accept="image/*" capture="environment">` (sin `react-dropzone`); vista previa, «Repetir», título/nota opcionales, «Enviar». Guardar la nota a medias como borrador si existe el sistema N5.
- **Revisión del padre** `/dashboard/homeschooling/revision`: lista de pendientes con foto, alumno, materia, día. Se usa `SwipeRow` de Ordo **con su sentido existente: izquierda = aprobar (verde), derecha = pedir ajuste (rojo/ámbar)**, más los botones equivalentes (igual que `ParentReviewPanel`). Al aprobar, estrellas 1-5 opcionales; al pedir ajuste, comentario obligatorio.
- **Portafolio** `/dashboard/homeschooling/portafolio`: grilla filtrable por alumno, materia y mes; tarjeta con foto, fecha, estrellas y materia; interruptor «Destacar» (alimenta el reporte de H5). Referencia visual: Roost `ShowcaseCard`.
- Estados vacíos y esqueletos con `Empty`/`Skeleton`.

## Pruebas
`node:test` de permisos (un Hijo no puede aprobar ni ver evidencias ajenas), de `limpiarArchivo`, y de validación de clave. Manual con usuario temporal.

## Aceptación
1. Desde una tablet se toma la foto y llega a la bandeja del padre.
2. Deslizar a la izquierda aprueba, a la derecha pide ajuste; los botones hacen lo mismo.
3. Las destacadas se ven en el portafolio y son accesibles al reporte (H5).
4. Un Hijo solo ve sus propias evidencias.
