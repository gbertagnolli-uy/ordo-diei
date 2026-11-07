# Origen de vendor/bookorbit

- Repositorio: https://github.com/bookorbit/bookorbit
- Commit: `6ad1445dab35757164ed3bf31e83caeb6ba24ad2`. Copiado el 2026-11-07 (lane 270).
- Licencia: AGPL-3.0 (`LICENSE`) + términos adicionales (`ADDITIONAL_TERMS.md`): toda interfaz con material de BookOrbit debe mostrar «Powered by BookOrbit» (enlazado a https://github.com/bookorbit/bookorbit) en un «Acerca de» o «Avisos legales» accesible a todos, ofrecer el código fuente correspondiente cuando aplique la sección 13 de la AGPL y declarar que es una versión modificada con fecha. La revisión legal está pendiente de Gabriel (vault `BACKLOG_PLANE.md`, D-BP2).
- Archivos copiados sin cambios (Vue + NestJS: se porta la lógica TypeScript, no los componentes Vue):
  - `LICENSE`, `ADDITIONAL_TERMS.md`, `NOTICE`
  - `server/src/db/schema/{books,reader,collections}.ts`, `server/src/db/audio-track-order.ts`
  - `server/src/modules/{reading-state,user-book-status,audiobook,search}/`
  - `client/src/features/reader/audiobook/`
- Lo portado a `src/` lleva la cabecera `// Portado de vendor/bookorbit/<ruta> (bookorbit/bookorbit@6ad1445)`. En la lane 281 se portaron a `src/lib/biblioteca/metadatos.ts` los extractores de metadatos y portadas de `server/src/modules/metadata/lib/{epub.ts,opf-parser.ts,cover-epub.ts,mobi-parser.ts,fb2-parser.ts,cover-fb2.ts,cbz-metadata.ts,cover-cbz.ts,cover-cbr.ts,pdf-parser.ts,pdf-xmp-reader.ts,filename-parser.ts}` y `server/src/common/{cbz-zip-reader.ts,comic-format-detect.ts,archive-entry-sort.ts,utils/fb2-encoding.utils.ts}`.
- `THIRD_PARTY_NOTICES.md` se actualiza al final de la lane (D6 de `vault/LANE_270_BIBLIOTECA_BOOKORBIT.md`).
