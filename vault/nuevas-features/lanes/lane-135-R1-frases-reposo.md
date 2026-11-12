# Lane 135 · R1 — Frases del reposo: fuentes y datos

**Rama** `task/lane-135-reposo-r1-frases` · **Fecha** 2026-10-14 · **Estado** integrada; **selección y textos a revisar por el usuario**.

## Pedido
`LANES.md` R1 / `idle-marco-fotos/SPEC.md` §6: cerrar fuentes (Vulgata Clementina, Torres Amat verificado, Catecismo Mayor), proponer `seleccion-citas.txt` (≥ 365) **y pedir revisión al usuario**, `generar-frases.ts` → `citas-biblicas.json` y `catecismo-pio-x.json`, pruebas §6.3. Sin UI.

## Qué se hizo
- `scripts/reposo/`: `descargar-fuentes.sh`, `vulgata.ts`, `torres-amat.ts` (extracción por párrafos, corte y alineación de capítulos), `libros.ts`, `citas.ts`, `catecismo.ts` + `catecismo-ocr.ts` (limpieza del OCR), `generar-frases.ts` (CLI con `--borrador`), y sus pruebas.
- Datos: `src/data/reposo/citas-biblicas.json` (562 citas) y `catecismo-pio-x.json` (707 preguntas, 683 entran en los límites del reposo).
- `vault/.../idle-marco-fotos/ref/`: `README.md` (fuentes y decisiones), `seleccion-citas.txt`, `seleccion-descartadas.txt`, `torres-amat-correcciones.txt`.
- `npm run reposo:fuentes` y `npm run reposo:frases`.
- `src/data/reposo/datos.test.ts`: ≥ 365 citas, largos, referencias, numeración de la Vulgata en los salmos, restos de OCR y catecismo.

## Decisiones (las más importantes; el resto en `ref/README.md`)
- **Torres Amat de 1883-84** y no el de 1823: el OCR de 1823 (dos columnas intercaladas) no se puede extraer; el de 1884 sí. Ver pendientes.
- **Catecismo edición de 1973** (mismo texto de 1905): el escaneo de 1906 de D50 no tiene un OCR utilizable y Wikisource transcribió una sola página.
- Los versículos truncados por un salto de página y los ilegibles **no se publican**; las correcciones del OCR están a la vista en un archivo.

## Cómo verificar
`npm test` · `npx tsc --noEmit` · `npm run reposo:fuentes && npm run reposo:frases -- --borrador` para leer cada cita.

## Pendientes
`PENDIENTES_REPOSO_LITURGIA.md` (sección R1): revisión humana de la selección y de los textos, edición de 1823, profetas menores.
