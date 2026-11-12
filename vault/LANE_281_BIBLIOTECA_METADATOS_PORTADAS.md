---
lane: 281
titulo: Biblioteca — extracción de metadatos y miniatura de portada al subir libros
plane: "#29"
estado: integrada
rama: task/lane-281-biblioteca-metadatos-portadas
agente: agy
actualizado: 2026-11-07
---

# Lane 281 — Biblioteca: extracción de metadatos y miniatura de portada al subir libros

## Especificación
Gabriel (2026-11-07):
1. «Al subir libros a la Biblioteca debería procesar los metadatos para poder extraerlos y tambien obtener la miniatura de la portada. revisa el repo original que se usó como base, para entender cómo hacía esto.»
2. «Si para todos los tipos de archivos, PDF, ePub, mobi, azw, cbr, cbz, fb2, azw3. Necesito que se obtengan los metadatos de cualquier que sea.»

Comportamiento esperado:
- Se admiten en la Biblioteca y en `/api/upload` (`modo="estudio"`) todos los formatos pedidos: `epub`, `pdf`, `mobi`, `azw`, `azw3`, `cbz`, `cbr`, `fb2` (además de los de audio `mp3`, `m4b`, `m4a`, `ogg`).
- Al crear un libro en `POST /api/biblioteca/libros` (`crearLibro`), el servidor lee los bytes del archivo subido (`leerArchivo`) y extrae automáticamente de cualquier formato:
  - `titulo` (si el cliente no mandó uno explícito distinto del nombre del archivo, o como enriquecimiento del archivo subido)
  - `autor`
  - `sinopsis`
  - `portada` (`Buffer` de la imagen extraída del archivo), que se pasa por `guardarImagen(..., { perfil: "portada" })` (400×600 `fit: "inside"` con `sharp`, igual que `generateThumbnail` de BookOrbit) y se persiste en `portadaUrl`.
- Si el archivo no trae metadatos internos completos (o el título interno es basura de conversor con extensión de archivo), cae en el parser de nombre de archivo portado de BookOrbit (`parseBookFilename`: `Autor - Título`, `Título -- Autor`, `[Serie #N]`, `(Año)`).

## Decisiones
- D1 · Portar al servidor (`src/lib/biblioteca/metadatos.ts`) los extractores de BookOrbit (`bookorbit/bookorbit@6ad1445`) y Homebranch (`Oghamark/homebranch`) sin dependencias nativas externas ni binarios de sistema (apto para Vercel serverless):
  - **ePub**: lector ZIP por directorio central (`zlib.inflateRawSync`), lectura de `META-INF/container.xml` → `.opf`, parser OPF (`dc:title` + subtítulo EPUB3, `dc:creator` filtrando rol `aut`, `dc:description` sin etiquetas HTML) y extractor de portada con las 5 prioridades de `cover-epub.ts` (incluyendo páginas XHTML de portada con `<img>` o `<image>`).
  - **MOBI / AZW / AZW3**: parser binario PalmDB + cabecera `MOBI` + registros `EXTH` (`100` autor, `103` sinopsis, `503` título actualizado, `201`/`202` offset de portada) y extracción del registro de imagen validando magic bytes (JPEG/PNG/GIF/WebP).
  - **FB2** (plano o comprimido en ZIP): detección de codificación por BOM y declaración XML (`TextDecoder` con soporte `utf-8`, `utf-16le/be`, `windows-1251`, `iso-8859-1`, `koi8-r`), lectura de `<title-info>` (`<book-title>`, `<author>`, `<annotation>`) y portada desde `<coverpage><image href="#id"/></coverpage>` → `<binary id="id">` en base64.
  - **CBZ / CBR**: detección real de contenedor por magic bytes (`PK\x03\x04` ZIP vs `Rar!\x1a\x07` RAR v4/v5, `detectComicContainerFormat`), extracción de `ComicInfo.xml` y comentario JSON `ComicBookInfo/1.0`, y extracción de la primera imagen ordenada naturalmente (`compareArchiveEntryNames`, ignorando ocultos/`__MACOSX`).
  - **PDF**: extracción de stream XMP (`<x:xmpmeta>`, incluyendo streams comprimidos con `FlateDecode`) y diccionario `/Info` (`/Title`, `/Author`, `/Subject` en literal `(...)` octal/escapado o hex `<FEFF...>` UTF-16BE/PDFDocEncoding), más extracción de la primera imagen embebida (`DCTDecode` JPEG / PNG) en servidor y render opcional de la primera página en cliente si existe soporte.
  - **Audio (`mp3`, `m4b`, `m4a`, `ogg`)**: lectura de tags ID3v2 (`TIT2`/`TALB`, `TPE1`/`TPE2`, `COMM`, `APIC`), átomos MP4/M4B (`©nam`/`©alb`, `©ART`, `desc`, `covr`) y comentarios Vorbis (`TITLE`, `ARTIST`, `DESCRIPTION`, `METADATA_BLOCK_PICTURE`).
- D2 · Perfil `portada` en `PERFILES_IMAGEN` (`src/lib/archivos.ts`): máximo 600 px de lado (`fit: "inside"`, `withoutEnlargement: true`, ≤ 150 KB en WebP).
- D3 · En `vendor/bookorbit/ORIGEN.md` se registra qué archivos adicionales de `bookorbit/bookorbit@6ad1445` se portaron en esta lane.
- D4 · Regla de Gabriel (2026-11-07): nunca levantar servidor (`next dev` / `next start`) sin permiso explícito, porque consume mucha RAM.

## Arquitectura
- `src/lib/biblioteca/metadatos.ts` (nuevo, puro sobre `Buffer`): `extraerMetadatosLibro(datos: Buffer, formato: Formato, nombreArchivo?: string)` → `{ titulo: string | null; autor: string | null; sinopsis: string | null; portada: Buffer | null }`.
- `src/lib/biblioteca/metadatos.test.ts` (nuevo): pruebas unitarias de todos los formatos (`epub`, `pdf`, `mobi`, `azw`, `azw3`, `cbz`, `cbr`, `fb2`, audio y fallback por nombre de archivo).
- `src/lib/biblioteca/reglas.ts` (+ `reglas.test.ts`): incorpora `mobi`, `azw`, `azw3`, `cbz`, `cbr`, `fb2` en `Formato` y `FORMATOS`.
- `src/lib/archivos.ts`: perfil `portada` en `PERFILES_IMAGEN` y soporte de `mobi`, `azw`, `azw3`, `cbz`, `cbr`, `fb2` y audios en `guardarArchivoEstudio`.
- `src/lib/biblioteca/servidor.ts`: en `crearLibro`, si falta `autor`, `sinopsis`, `portadaUrl` o si el título coincide con el nombre crudo del archivo (o no se indicó), lee el archivo con `leerArchivo`, corre `extraerMetadatosLibro` y si obtuvo `portada` la guarda con `guardarImagen(..., { perfil: "portada" })`.
- `src/components/biblioteca/SubirLibro.tsx`: acepta en el selector todos los formatos (`.epub,.pdf,.mobi,.azw,.azw3,.cbz,.cbr,.fb2`) y envía el nombre del archivo para que el servidor complete título, autor, sinopsis y miniatura de portada.

## Archivos en alcance
- `src/lib/biblioteca/metadatos.ts` (crear)
- `src/lib/biblioteca/metadatos.test.ts` (crear)
- `src/lib/biblioteca/reglas.ts` (modificar)
- `src/lib/biblioteca/reglas.test.ts` (modificar)
- `src/lib/biblioteca/servidor.ts` (modificar)
- `src/lib/archivos.ts` (modificar)
- `src/components/biblioteca/SubirLibro.tsx` (modificar)
- `vendor/bookorbit/ORIGEN.md` (modificar)

## Microtareas

### M1 · Ampliar formatos en `reglas.ts` y `archivos.ts` + perfil `portada` [agy]
- [x] hecha (`mobi`, `azw`, `azw3`, `cbz`, `cbr`, `fb2` + perfil `portada` ≤ 600 px / 150 KB y caché en memoria al guardar estudio)

### M2 · Extractor multi-formato `src/lib/biblioteca/metadatos.ts` + `metadatos.test.ts` [agy]
- [x] hecha (extractores para `epub`, `pdf`, `mobi`, `azw`, `azw3`, `cbz`, `cbr`, `fb2` y audio + parser de nombre de archivo; 13 tests unitarios en verde)

### M3 · Integrar extracción y miniatura en `servidor.ts` y `SubirLibro.tsx` [agy]
- [x] hecha (`crearLibro` enriquece título, autor, sinopsis y genera miniatura WebP con `guardarImagen(..., { perfil: "portada" })`)

## Criterios de aceptación
- Subir un archivo `epub`, `pdf`, `mobi`, `azw`, `azw3`, `cbz`, `cbr` o `fb2` extrae título, autor, sinopsis y genera la miniatura de portada en `Archivos_Subidos` (`portadaUrl`).
- Tests unitarios para los 8 formatos de libro + fallback de nombre de archivo pasan en verde.
- `npx tsc --noEmit`, `npm test` y `npx eslint` sin errores.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/lib/biblioteca src/lib/archivos.ts src/components/biblioteca/SubirLibro.tsx`

## Pendientes

## Hallazgos
- En los libros de prueba reales del proyecto (`Gramática latina...epub`, `Vulgata Clementina - 1598.epub`), el OPF traía artefactos de conversor (`Documento Convertido` como título y `0` como creador). Se incorporó filtro de artefactos en `esTituloArtefacto` y `limpiarAutorExtraido` para caer limpiamente al parser de nombre de archivo cuando el metadato interno es basura.
- `agendaUtils.test.ts` tenía `new Date(2026, 10, 7, 18, 0, 0)` fijo; pasadas las 18:00 del 2026-11-07 pasaba a dar `"Atrasada"`. Se corrigió usando fecha relativa futura (`Date.now() + 86_400_000`).

## Bitácora
- 2026-11-07 18:43 · agy · INICIO · worktree `ordo-diei-lanes/lane-281` creado desde `dev` (`4703831`)
- 2026-11-07 19:07 · agy · FIN · PR #86 abierto con `abrir-pr.sh` (`tsc` 0, `eslint` 0, `npm test` 708 pass / 0 fail), integrado a `dev` (`55a674e`) con merge commit y worktree limpiado con `limpiar-lane.sh 281`
