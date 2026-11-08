# Origen de vendor/homebranch-web

- Repositorio: https://github.com/Oghamark/homebranch (monorepo; submódulo `homebranch-web`)
- Commit del monorepo: `281a75ef94ef257d3a158cf58b83b303197a063e`; commit de `homebranch-web`: `5a5b55f96f5cc814debbc336951706ad26229966`. Copiado el 2026-11-07 (lane 270).
- Licencia: AGPL-3.0 (`LICENSE`). La revisión legal está pendiente de Gabriel (vault `BACKLOG_PLANE.md`, D-BP2).
- Archivos copiados sin cambios (React + Chakra UI: se traduce a los componentes shadcn de Ordo):
  - `LICENSE`
  - `src/entities/book/`, `src/features/library/`
  - `src/app/routes/dashboard/{library,book,read-book,book-shelf,currently-reading}.tsx`
- Lo portado a `src/` lleva la cabecera `// Portado de vendor/homebranch-web/<ruta> (Oghamark/homebranch-web@5a5b55f)`.
- `THIRD_PARTY_NOTICES.md` se actualiza al final de la lane (D6 de `vault/LANE_270_BIBLIOTECA_BOOKORBIT.md`).
