# Lane H3 — Evidencia con foto y portafolio (portado del Showcase de Roost)

> Lista para implementar. Depende de **H2**. Tamaño **M**. Solo fotos (HD8). Las evidencias de un hijo solo las ven él y los padres (HD15).
> Número: el siguiente libre al crearla. Rama sugerida `task/lane-NN-hs-evidencia`. **Dependencia nueva:** `react-dropzone@14.3.8` (versión exacta, la del lockfile de Roost).

## Objetivo
El niño fotografía un trabajo, el padre lo revisa deslizando, y las mejores quedan en un portafolio.

## Modelo (esta lane agrega)
`EstadoEvidencia`, `EvidenciaAprendizaje`, `EvidenciaImagen` y sus relaciones inversas (ARQ §3.2).

## Servidor
- Cliente `src/lib/homeschooling/roost/services/showcase.ts` con las funciones de `vendor/roost/src/services/showcase.ts` (mismos nombres y tipos): `createShowcase`, `getShowcaseById`, `getUserShowcases`, `addShowcaseImage`, `removeShowcaseImage`, `getShowcasesForModeration`, `approveShowcase`, `rejectShowcase`, `featureShowcase`, `unfeatureShowcase`, `getShowcaseStats`.
- Servidor `src/lib/homeschooling/servidor/evidencia.ts` + `mapShowcase` traducido en `dto.ts` (de `vendor/roost/src/db/adapters/mongodb/index.ts:363`). Mapeo de estados: `pending↔pendiente`, `approved↔aprobada`, `rejected↔ajustar`; `featured` = `destacada: true`.
- `approveShowcase` acepta `estrellas` (1-5) opcionales; `rejectShowcase` exige comentario (va a `comentarioPadre`). **No** se porta el trigger `trg_showcase_approval_points` de Roost: aprobar o destacar **no** cambia ningún saldo.
- Las fotos se suben con `subirImagen` (`src/lib/subirImagen.ts` → `POST /api/upload`, compresión y WebP ya implementados); se guarda la URL `/api/archivos/<uuid>`. Validar con `claveDeUrl` (`src/lib/archivos.ts`) que la URL sea de `Archivo`.
- Al borrar una evidencia o una imagen: `limpiarArchivo(url)` borra el `Archivo` si ninguna otra `EvidenciaImagen` usa esa URL.
- Permisos: el Hijo crea y ve solo las suyas; solo Padre/Madre listan pendientes, aprueban, piden ajuste y destacan.
- API: `POST /api/homeschooling/evidencias`, `GET /api/homeschooling/evidencias?estado=&alumnoId=&materiaId=&mes=`, `PATCH /api/homeschooling/evidencias/[id]`, `POST|DELETE /api/homeschooling/evidencias/[id]/imagenes`.

## UI (origen → destino)
| Roost | Ordo | Cambios |
|---|---|---|
| `pages/ShowcaseSubmit.tsx` (solo dropzone L229-260, vista previa y borrador L33, L80-156) | `evidencia/EnviarEvidencia.tsx` (`Sheet`) | `useDropzone` de react-dropzone; título y nota opcionales; sin URL, tagline, categoría, stack ni editor rico; borrador en `localStorage` como Roost (si existe el sistema de borradores N5, usar ese) |
| `pages/admin/Showcases.tsx` | `revision/RevisionEvidencias.tsx` | Contadores con `StatsCard` (HS0); filtro por estado; **aprobar** con `StarRating` opcional; **pedir ajuste** = el modal de rechazo (estado L45, `handleReject` L94, modal L418) con comentario obligatorio; destacar/quitar. Cada fila con `SwipeRow` de Ordo (`src/components/SwipeRow.tsx`) con su sentido existente: **izquierda = aprobar, derecha = pedir ajuste**, más los botones equivalentes (como `ParentReviewPanel`) |
| `pages/Showcase.tsx` + `components/showcase/ShowcaseCard.tsx` + `ShowcaseFilters.tsx` | `portafolio/Portafolio.tsx` + `EvidenciaCard.tsx` + `FiltrosPortafolio.tsx` | Filtros alumno/materia/mes (en lugar de categoría/tags); tarjeta con foto, fecha, estrellas y materia; interruptor «Destacar» para padres |

- **Cámara:** botón en `VisorLeccion` y en `TarjetaHoy`. Pasar `capture="environment"` y `accept="image/*"` por `getInputProps({ capture: "environment" })`. **Si react-dropzone no reenvía `capture`** (verificarlo en el navegador de la tablet), agregar un botón «Cámara» con `<input type="file" accept="image/*" capture="environment">` oculto que llama al mismo `onDrop`.
- Páginas: `/dashboard/homeschooling/revision` (padres) y `/dashboard/homeschooling/portafolio` (todos; el hijo ve solo lo suyo). `Empty`/`Skeleton` de `ui/` para vacíos y carga.

## Tests
Permisos (un Hijo no aprueba ni ve evidencias ajenas), `limpiarArchivo`, validación de URL, y que aprobar/destacar no modifique `availablePoints`, `lockedPoints`, `stars` ni `experienciaHabitos`.

## Aceptación
1. Desde la tablet se toma la foto y llega a la bandeja del padre.
2. Deslizar a la izquierda aprueba, a la derecha pide ajuste; los botones hacen lo mismo.
3. Las destacadas se ven en el portafolio y las usa el reporte de H5.
4. Un Hijo solo ve sus evidencias.
