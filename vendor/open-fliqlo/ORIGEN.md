# Open Fliqlo (clon)

- Origen: https://github.com/CogitoForge-AI/Open-Fliqlo (MIT; fuente Gluqlo bajo ISC)
- Commit clonado: 3586d62b1760380954888328698a983434f7d3a5 (rama main)
- El primer commit de este directorio es la copia literal. Los cambios para Ordo Diei están en el commit siguiente (`git log -p -- vendor/open-fliqlo`).
- Es una app Flutter: se compila a web con `scripts/construir_fliqlo.sh` y el resultado va a `public/fliqlo/`, que la app embebe en un iframe (`src/components/rutina/RelojFlip.tsx`).
- Excluido de tsc y eslint del proyecto.

## Cambios para Ordo Diei (solo web, todos marcados con `[Ordo Diei]`)
- `packages/fliqlo_ui/lib/src/theme.dart`: colores como getters con paleta clara/oscura, `light` y `transparentBackground`.
- `packages/fliqlo_ui/lib/src/flip_digit.dart`: sombra de la solapa más suave en tema claro.
- `apps/open_fliqlo/lib/main.dart`: en web lee `tema`, `fondo`, `modo` y las banderas (`show-seconds`, `use-24-hour`, ...) de la URL.
- `apps/open_fliqlo/lib/clock_screen.dart`: la pantalla de carga usa el fondo del tema en vez de negro con spinner.
- `apps/open_fliqlo/web/index.html`: body transparente y `color-scheme`.
