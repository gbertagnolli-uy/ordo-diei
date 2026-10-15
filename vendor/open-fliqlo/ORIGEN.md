# Open Fliqlo (clon)

- Origen: https://github.com/CogitoForge-AI/Open-Fliqlo (MIT; fuente Gluqlo bajo ISC)
- Commit clonado: 3586d62b1760380954888328698a983434f7d3a5 (rama main)
- El primer commit de este directorio es la copia literal. Los cambios para Ordo Diei están en el commit siguiente (`git log -p -- vendor/open-fliqlo`).
- Es una app Flutter: se compila a web con `scripts/construir_fliqlo.sh` y el resultado va a `public/fliqlo/`, que la app embebe en un iframe (`src/components/rutina/RelojFlip.tsx`).
- Excluido de tsc y eslint del proyecto.
