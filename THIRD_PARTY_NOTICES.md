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

## opencircle — https://github.com/devscalelabs/opencircle
- Licencia AGPL-3.0, Copyright (C) 2024-2025 Devscalelabs (`vendor/opencircle/LICENSE.md`). El `package.json` raíz de opencircle dice «ISC», pero el README y `LICENSE.md` dicen AGPL v3; vale `LICENSE.md`.
- Copia en `vendor/opencircle/` (commit `5a8beada3147c6bd922c44f9cfe5b4a82f1a4056`, ver `vendor/opencircle/ORIGEN.md`). Los archivos portados a `src/` llevan la cabecera `// Portado de vendor/opencircle/<ruta> (devscalelabs/opencircle@5a8beada)`: hoy, los servicios de `src/lib/social/servidor/` (posts, canales, reacciones, notificaciones; lane 276, módulo social).
- Licencia AGPL pendiente de revisión legal por Gabriel.

## moodiary — https://github.com/ZhuJHua/moodiary
- Licencia AGPL-3.0 (`vendor/moodiary/LICENSE`).
- Copia del editor web en `vendor/moodiary/editor/` y, desde las lanes 284, 285, 287 y 288, de `category_repository.dart` y de las fuentes de búsqueda, estadísticas y calendario (commit `2c552ddd7939a054122380397fb914cf000824b0`, ver `vendor/moodiary/ORIGEN.md`). Los archivos portados a `src/` llevan la cabecera `// Portado de vendor/moodiary/<ruta> (ZhuJHua/moodiary@2c552dd)` (lane 283, editor del diario).
- Dependencias que trae el port: Tiptap (`@tiptap/*`, MIT), `lowlight` (MIT), `marked` y `marked-cjk-friendly` (MIT), `prosemirror-search` (MIT).
- Licencia AGPL pendiente de revisión legal por Gabriel.

## Daily You — https://github.com/Demizo/Daily_You
- Licencia GPL-3.0 con términos adicionales (`vendor/Daily_You/LICENSE.txt`, `vendor/Daily_You/ADDITIONAL_TERMS.md`).
- Copia parcial de los archivos de etiquetas en `vendor/Daily_You/` (commit `7cc237d1dcef24a27ca0f78ad449cc199b61bea3`, ver `vendor/Daily_You/ORIGEN.md`). Los archivos portados a `src/` llevan la cabecera `// Portado de vendor/Daily_You/<ruta> (Demizo/Daily_You@7cc237d)` (lane 284, etiquetas del diario). Desde la lane 285 se suman las fuentes de búsqueda y orden, desde la 286 las de plantillas y escala de ánimo, desde la 287 las de estadísticas y desde la 288 las del calendario.
- Esta app no usa el nombre ni el logotipo de Daily You; el diario es una adaptación propia y así se declara.
- Licencia GPL pendiente de revisión legal por Gabriel.

## storypad — https://github.com/theachoem/storypad
- Licencia GPL-3.0 (`vendor/storypad/LICENSE`).
- Copia parcial de los modelos de etiquetas y, desde las lanes 285, 287 y 288, de las fuentes de búsqueda y filtros, estadísticas y calendario de ánimo en `vendor/storypad/` (commit `a76825e88740c935458beff404cbb95c889e4e2e`, ver `vendor/storypad/ORIGEN.md`). Los archivos portados a `src/` llevan la cabecera `// Portado de vendor/storypad/<ruta> (theachoem/storypad@a76825e)` (lane 284).
- Licencia GPL pendiente de revisión legal por Gabriel.
