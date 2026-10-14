# Fuentes y datos de las frases del reposo (lane 135 · R1)

Qué hay acá y cómo se regenera. Pedido y reglas: [`../SPEC.md`](../SPEC.md) §6.

## Archivos (lo único que se edita a mano)
| Archivo | Para qué |
|---|---|
| `seleccion-citas.txt` | Las 562 referencias que están en los datos (D51: ≥ 365). Numeración de la Vulgata. |
| `seleccion-descartadas.txt` | Las propuestas que no llegaron (escaneo ilegible, versículo cortado, libro sin extractor). Se pueden sumar con una corrección. |
| `torres-amat-correcciones.txt` | Corrige el OCR de un pasaje: `Libro cap,vers \| antes => después`, `== texto completo` o `!! motivo` (no se publica). |

Los JSON salen de `npm run reposo:fuentes` (baja las fuentes a `.cache/reposo/`) y `npm run reposo:frases`
→ `src/data/reposo/citas-biblicas.json` y `src/data/reposo/catecismo-pio-x.json`. `npm run reposo:frases -- --borrador`
imprime el latín y el español de cada cita para revisarlos sin escribir nada. **Ningún versículo se tipea a mano.**

## Fuentes (decisiones de esta lane)
| Texto | Fuente | Por qué |
|---|---|---|
| Vulgata Clementina | Clementine Text Project (VulSearch), copia `BibleGet-I-O/Clementine-Vulgate` (`src/utf8`) | Texto sin acentos (se muestra tal cual). Los archivos traen la ligadura «œ» como el carácter de control U+009C: se restaura. |
| Torres Amat | OCR de **«La Sagrada Biblia», nueva edición ilustrada por Gustavo Doré (Montaner y Simón, 1883-84)**, tomos 1-4 de Internet Archive (`AI156`–`AI159`) | Es el texto de Torres Amat en la edición más difundida, y su OCR es limpio y con versículos numerados. **No es la primera edición (1823):** el escaneo de 1823 (`sagrada-biblia-torres-amat-completa`) está en dos columnas intercaladas con el latín y no se pudo extraer de forma confiable. Por eso algunos giros difieren de la 1.ª edición (p. ej. el Salmo 22 dice «El Señor me pastorea», no «El Señor es quien me gobierna»). |
| Catecismo Mayor de San Pío X | OCR de la **edición de 1973** (Internet Archive, `CatecismoMayorSanPioX1905EdicinDe1973152PPginas`) | Es el mismo texto de 1905, con numeración 1…708 y acentos. El escaneo de la versión castellana de 1906 que preveía D50 (`CatecismoMayorDeSanPoX`) tiene un OCR sin tildes ni números, y Wikisource solo transcribió **una** de sus páginas. |

## Cómo se extrae Torres Amat (`scripts/reposo/torres-amat.ts`)
1. Cada versículo es un párrafo `N. texto`; las notas son otros párrafos y las llamadas de nota quedan como números sueltos («…espíritu 11 : porque…»), que se quitan.
2. Se corta en capítulos cada vez que la numeración deja de crecer y se **alinea** con los capítulos de la Vulgata (alineación de peso máximo por el último versículo; si dos capítulos tienen la misma cantidad se desempata por afinidad léxica con el latín: Mt 21 y 22 tienen ambos 46).
3. Un versículo cortado por un salto de página (termina en una letra o un guion) **no se publica**; tampoco los que tienen palabras perdidas por el OCR: quedan en `seleccion-descartadas.txt`.
4. Se aplican las correcciones, se moderniza la ortografía de las tildes más evidentes (`á`→`a`, `ó`→`o`, `Christo`→`Cristo`, `dia`→`día`, `mió`→`mío`…; ver `MODERNIZAR`) sin cambiar palabras, se sacan los «—» de aclaración de la edición y un final «,» «;» «:» se cierra con punto.

## Revisión pendiente
Todo el texto español viene de un OCR corregido por un modelo, **no verificado por una persona contra el escaneo**. Hay que revisar sobre todo las líneas de `torres-amat-correcciones.txt` (cada una es una decisión) y una muestra de las citas. Ver `../../lanes/PENDIENTES_REPOSO_LITURGIA.md`.
