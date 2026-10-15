# Avisos de terceros

## Roost — https://github.com/msrbuilds/roost
- Copia literal en `vendor/roost/` (commit `492af4763d19d51ffe4ed3e11a95c3761245deca`, ver `vendor/roost/ORIGEN.md`).
- Archivos portados a `src/` llevan la cabecera `Portado de vendor/roost/<ruta> (msrbuilds/roost@492af47)`.
- Uso doméstico con permiso del usuario (ver `vault/nuevas-features/DECISIONES.md`, D23).

## Open Fliqlo — https://github.com/CogitoForge-AI/Open-Fliqlo
- Licencia MIT. Es una app Flutter, no se puede importar desde React: `src/components/rutina/RelojFlip.tsx` porta su diseño del dígito (proporciones, bisagra, colores del modo oscuro, giro de la solapa de 500 ms) a CSS.
- Fuente de los dígitos: Gluqlo (`public/fonts/gluqlo.ttf`, licencia ISC en `public/fonts/LICENSE-gluqlo.txt`).
