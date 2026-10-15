# Avisos de terceros

## Roost — https://github.com/msrbuilds/roost
- Copia literal en `vendor/roost/` (commit `492af4763d19d51ffe4ed3e11a95c3761245deca`, ver `vendor/roost/ORIGEN.md`).
- Archivos portados a `src/` llevan la cabecera `Portado de vendor/roost/<ruta> (msrbuilds/roost@492af47)`.
- Uso doméstico con permiso del usuario (ver `vault/nuevas-features/DECISIONES.md`, D23).

## Open Fliqlo — https://github.com/CogitoForge-AI/Open-Fliqlo
- Licencia MIT; la fuente de los dígitos es Gluqlo (ISC, `vendor/open-fliqlo/packages/fliqlo_ui/fonts/LICENSE-gluqlo.txt`).
- Clon en `vendor/open-fliqlo/` (ver `ORIGEN.md`: commit clonado y cambios). Es una app Flutter: se compila con `scripts/construir_fliqlo.sh` a `public/fliqlo/` y `RelojFlip.tsx` la embebe en un iframe.
