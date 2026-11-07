# Avisos de terceros

## Roost — https://github.com/msrbuilds/roost
- Copia literal en `vendor/roost/` (commit `492af4763d19d51ffe4ed3e11a95c3761245deca`, ver `vendor/roost/ORIGEN.md`).
- Archivos portados a `src/` llevan la cabecera `Portado de vendor/roost/<ruta> (msrbuilds/roost@492af47)`.
- Uso doméstico con permiso del usuario (ver `vault/nuevas-features/DECISIONES.md`, D23).

## Open Fliqlo — https://github.com/CogitoForge-AI/Open-Fliqlo
- Licencia MIT; la fuente de los dígitos es Gluqlo (ISC, `vendor/open-fliqlo/packages/fliqlo_ui/fonts/LICENSE-gluqlo.txt`).
- Clon en `vendor/open-fliqlo/` (ver `ORIGEN.md`: commit clonado y cambios). Es una app Flutter: se compila con `scripts/construir_fliqlo.sh` a `public/fliqlo/` y `RelojFlip.tsx` la embebe en un iframe.

## web-push — https://github.com/web-push-libs/web-push
- Licencia MPL-2.0 (paquete npm `web-push`). Se usa tal cual, sin copiar su código, para firmar y mandar los avisos push (lane 204).

## BookOrbit — https://github.com/bookorbit/bookorbit
- Licencia AGPL-3.0 (`vendor/bookorbit/LICENSE`) con términos adicionales (`vendor/bookorbit/ADDITIONAL_TERMS.md`): toda interfaz con material de BookOrbit debe mostrar «Powered by BookOrbit» enlazado al proyecto, declarar que es una versión modificada con su fecha y ofrecer el código fuente correspondiente cuando aplique la sección 13 de la AGPL.
- Copia en `vendor/bookorbit/` (commit `6ad1445dab35757164ed3bf31e83caeb6ba24ad2`, ver `vendor/bookorbit/ORIGEN.md`). Los archivos portados a `src/` llevan la cabecera `// Portado de vendor/bookorbit/<ruta> (bookorbit/bookorbit@6ad1445)`.
- Lector de ePub: `public/lector/foliate/` es foliate-js (MIT, John Factotum) tal como lo sirve BookOrbit (ver `public/lector/foliate/ORIGEN.md`); su atribución de BookOrbit está en los «Avisos legales» del lector.
- Licencias AGPL pendientes de revisión legal por Gabriel.

## Homebranch — https://github.com/Oghamark/homebranch
- Licencia AGPL-3.0 (`vendor/homebranch-web/LICENSE`).
- Copia en `vendor/homebranch-web/` (monorepo `281a75ef94ef257d3a158cf58b83b303197a063e`, submódulo `homebranch-web` `5a5b55f96f5cc814debbc336951706ad26229966`, ver `vendor/homebranch-web/ORIGEN.md`). Los archivos portados a `src/` llevan la cabecera `// Portado de vendor/homebranch-web/<ruta> (Oghamark/homebranch-web@5a5b55f)`.
- Licencia AGPL pendiente de revisión legal por Gabriel.

## dovli — https://github.com/MayankJha0333/dovli
- Licencia MIT, Copyright (c) 2026 Mayank Jha (`vendor/dovli/LICENSE`).
- Copia en `vendor/dovli/` (commit `eb453e0`, ver `vendor/dovli/ORIGEN.md`). Los archivos portados a `src/` llevan la cabecera `// Portado de vendor/dovli/<ruta> (MayankJha0333/dovli@eb453e0)` (lane 271, bloc de notas).
- Dependencias que trae el port: BlockNote (`@blocknote/*`, MPL-2.0), Mantine (`@mantine/*`, MIT), `idb` (ISC), `nanoid` (MIT), `cmdk` (MIT, la paleta de búsqueda; agregado en M0c).
