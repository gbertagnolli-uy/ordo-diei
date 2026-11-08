# Origen de public/lector/foliate

- Repositorio: https://github.com/bookorbit/bookorbit
- Commit: `6ad1445dab35757164ed3bf31e83caeb6ba24ad2`. Copiado el 2026-11-07 (lane 280).
- Es el motor [foliate-js](https://github.com/johnfactotum/foliate-js) tal como lo sirve BookOrbit
  en `client/public/assets/foliate/`. Copia literal, sin cambios, en
  `vendor/bookorbit/client/public/assets/foliate/`.
- Licencias: foliate-js es MIT (Copyright (c) John Factotum); `vendor/fflate.js` es de
  [fflate](https://github.com/101arrowz/fflate) (MIT) y `vendor/zip.js` de
  [zip.js](https://github.com/gildas-lormeau/zip.js) (BSD-3-Clause).
- Los módulos se cargan como `<script type="module">` desde
  `src/components/biblioteca/lector/useFoliate.ts` (`/lector/foliate/view.js`). Los imports entre
  archivos son relativos: no mover archivos sueltos.
- La atribución de BookOrbit que exigen sus términos adicionales está en los avisos legales del
  lector y en `THIRD_PARTY_NOTICES.md`.
