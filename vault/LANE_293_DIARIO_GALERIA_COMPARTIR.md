---
lane: 293
titulo: Diario fase 3 — galería de fotos y compartir (tarjeta de imagen, Markdown, «compartido» desde otras apps)
plane: "#31"
estado: integrada
rama: task/lane-293-diario-galeria-compartir
agente: claude
actualizado: 2026-11-08
---

# Lane 293 — Galería y compartir

Tercera lane de la fase 3 («adjuntos y datos») del plan aprobado por Gabriel el 2026-11-08, continuación de [[LANE_292_DIARIO_IMPORTAR]]. Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`).

## Fuentes leídas completas (2026-11-08)
- **Daily You** `7cc237d`: `lib/pages/gallery_page.dart`, `lib/pages/share_page.dart`.
- **moodiary** `2c552dd`: `moodiary_export/lib/src/data/image_composer.dart`, `presentation/{image_export_page,share_sheet}.dart`, `presentation/image_card/{card,card_style,blocks}.dart`, `data/export_options.dart` (`ImageExportOptions`).

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Galería: grilla de tarjetas con las fotos de cada entrada | `gallery_page.dart` | `GaleriaDiario` |
| Búsqueda con espera, filtro por etiquetas (alguna / todas / sin), orden por fecha / ánimo / contador con sentido | `gallery_page.dart` | misma tubería que la búsqueda (lane 285) con `fotos=si` |
| Tarjeta grande (lista o con búsqueda) / tarjeta chica (grilla) | `gallery_page.dart` | opción «Grilla / Lista» + grande si hay texto buscado |
| «Ocultar fotos en la galería» | `hideImagesInGallery` | opción «Mostrar fotos» |
| Cantidad de resultados, botón «subir» pasados 500 px, tocar abre la entrada | `gallery_page.dart` | idem (lleva al día de la entrada) |
| Compartir como imagen: tarjeta con fecha, hora, ánimo, categoría, etiquetas, título y cuerpo con formato, claro u oscuro, marca de agua, ancho y escala | `image_composer`, `image_card/*`, `image_export_page` | `tarjeta.ts` (diseño puro) + `dibujarTarjeta.ts` (canvas) + `CompartirEntrada` |
| Guardar o compartir el PNG | `image_export_page` (`_saveToAlbum`, `_share`) | descargar / `navigator.share({files})` |
| Compartir como Markdown | `share_sheet.dart` | texto Markdown compartido, copiado o descargado `.md` |
| Recibir texto de otra app y elegir el día (nueva o agregar a una existente) | `share_page.dart` | `share_target` del manifiesto + `/dashboard/diario/compartido` |

## Decisiones
- **G1 · La galería usa la búsqueda de la lane 285** con un filtro nuevo `soloFotos` (`fotos=si`): entradas con fotos adjuntas o con imágenes dentro del texto. Los ids con imagen en el texto salen de una consulta SQL de solo lectura sobre `Diario_Entradas."Contenido"`; la privacidad (personal = solo el autor) se aplica igual en Prisma después. El filtro no cuenta como «filtro activo» de la búsqueda común.
- **G2 · Daily You pone tarjeta grande con búsqueda o en modo lista**: igual. Las opciones (modo, mostrar fotos) se recuerdan en el navegador (`diario.galeria.<tipo>`).
- **G3 · Entradas sin valor de ánimo o de contador van siempre al final** (ya lo hace `ordenarHallazgos`).
- **G4 · Página de 48** con «Ver más» (Daily You carga todo en memoria; acá es un servidor remoto).
- **S1 · La tarjeta de imagen se dibuja en el navegador con `canvas`**, no con `ImageResponse` del servidor: el cuerpo con formato (listas, citas, código, tablas, párrafos con negrita) necesita corte de líneas real, y las fotos ya viven en el mismo origen (`/api/archivos/<id>`).
- **S2 · El diseño es puro y se prueba:** `tarjeta.ts` recibe una función para medir texto y devuelve la lista de cosas a dibujar con sus posiciones y la altura total; el canvas solo ejecuta esa lista. Así el corte de líneas, las alturas y los bloques se prueban con `npm test` sin navegador.
- **S3 · Ancho 360 px (moodiary), escala 1–3 (moodiary usa 3).** El lienzo se limita a 16.000 px de alto y 16 millones de píxeles (límite de los navegadores móviles): se baja la escala como `_kDowngradeAboveLogical` de moodiary; si aun a escala 1 no entra, el cuerpo se corta con «…» y se avisa.
- **S4 · Bloques de la tarjeta:** párrafo, título (6 niveles), cita, listas (con viñeta, numeradas, de tareas), código, regla (sólida, rayas, puntos, doble, ondulada, con texto), imagen (con ancho %), tabla, enlace a entrada. Marcas: negrita, cursiva, tachado, subrayado, código, resaltado, enlace.
- **S5 · Compartir = Web Share API con archivo cuando el navegador lo permite;** si no, se descarga el PNG. Con Markdown: `navigator.share({text})` o copiar o descargar.
- **S6 · «Compartido» desde otras apps** usa `share_target` GET (título, texto, enlace) del manifiesto. Tiene que haber sesión iniciada. Elige diario (personal / familiar), día (hasta hoy) y si crea una entrada nueva o agrega el texto a una existente de ese día que se pueda editar (Daily You muestra el menú de elección cuando el día ya tiene una).

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **Fotos, videos y audios que llegan desde «Compartir» del celular:** el `share_target` con archivos exige POST multipart; Vercel corta el cuerpo en 4,5 MB (una foto de celular suele pasarlo) y además hace falta un service worker que no se puede verificar sin servidor. Solo texto y enlace.
- **Compartir en DOCX y PDF** (`share_sheet`): ya figuran fuera de la lane 291 (necesitan fuentes y un motor de maquetado).
- **Tarjeta de varias entradas** (moodiary la arma con un alcance): acá una entrada por tarjeta.
- **Resaltado de sintaxis en el código de la tarjeta** (`codeHighlighter`): el código va con fondo y fuente monoespaciada, sin colores por lenguaje.
- **Video y audio en la tarjeta**: el diario todavía no los guarda (lane 294 / 277 fase B).
- **Galería con videos** (Daily You muestra miniaturas de video): idem.
- **Guardar en el álbum del celular** (`MediaManager.saveToGallery`): la web no tiene acceso al álbum; «Guardar» descarga el PNG y el sistema decide dónde queda.

## Arquitectura
- Reglas puras con tests: `src/lib/diario/galeria.ts`, `src/lib/diario/tarjeta.ts`, `src/lib/diario/compartido.ts`; cambios en `busqueda.ts` (`soloFotos`).
- Servidor: `servidor-busqueda.ts` (filtro `soloFotos`). Sin rutas nuevas ni cambios de base.
- UI: `src/components/diario/galeria/GaleriaDiario.tsx`, `src/components/diario/compartir/{dibujarTarjeta.ts,CompartirEntrada.tsx}`, `src/app/dashboard/diario/compartido/page.tsx` y `CompartidoVista.tsx`; botones en `DiarioVista` y en `ListaDia`; `share_target` en `src/app/manifest.ts`.

## Archivos en alcance
`src/lib/diario/{galeria,tarjeta,compartido,busqueda}.ts` + tests · `src/lib/diario/servidor-busqueda.ts` · `src/components/diario/{galeria,compartir}/**` · `src/components/diario/{DiarioVista,ListaDia}.tsx` · `src/app/dashboard/diario/compartido/**` · `src/app/manifest.ts` · `vendor/{Daily_You,moodiary}/**` · `THIRD_PARTY_NOTICES.md`.

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Copiar fuentes a `vendor/`, `ORIGEN.md`, `THIRD_PARTY_NOTICES.md`.
- [x] M3 · Filtro `soloFotos` (reglas + servidor) + tests.
- [x] M4 · Reglas de la galería + UI.
- [x] M5 · Diseño de la tarjeta + tests + canvas + diálogo de compartir.
- [x] M6 · Compartido desde otras apps (reglas + página + manifiesto).
- [x] M7 · Gates, PR, integración y limpieza.
- [ ] M8 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario src/app/manifest.ts`

## Hallazgos
- El dibujo en canvas (`dibujarTarjeta.ts`), el diálogo de compartir y la página «compartido» no se pueden probar con `npm test` (necesitan el navegador); el diseño de la tarjeta (corte de líneas, bloques, alturas, escala) sí: `tarjeta.test.ts` (27 pruebas) con un medidor falso. Queda para la prueba de pantalla de Gabriel: una entrada con título, ánimo, etiquetas, lista, cita, código, tabla y una foto, en claro y oscuro.
- `share_target` solo se activa con la app instalada en el celular (PWA); hay que volver a instalarla o esperar a que el navegador relea el manifiesto.
- Si no hay sesión al llegar a `/dashboard/diario/compartido`, se manda al inicio y lo compartido se pierde (la app no guarda el destino del login).
- El filtro de fotos usa una consulta SQL de solo lectura sobre `Diario_Entradas."Contenido"::text`; no se pudo correr contra la base (regla 10 y datos de producción), verificada solo por tipos. Si falla, la galería muestra el error de la búsqueda.
- Gates: prisma validate (sin cambios de base), tsc ok, eslint ok, `npm test` 1007 pass / 0 fail (50 pruebas nuevas: galería 11, tarjeta 27, compartido 12).

## Bitácora
- 2026-11-08 · claude · INICIO 293 · lane creada desde `dev` = `007d117`.
- 2026-11-08 · claude · FIN 293 · commit f7311fa. INTEGRADA · PR #99 (merge commit), lane limpiada. Falta M8: prueba de pantalla de Gabriel.
