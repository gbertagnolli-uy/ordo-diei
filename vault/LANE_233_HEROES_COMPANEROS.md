# Lane 233: los héroes de las carpetas son los Compañeros

Rama `task/lane-233-heroes-companeros` · worktree `../ordo-diei-lanes/lane-233` · base `dev`.
Listado personaje → objeto (lo que pidió el usuario): [`COMPANERO_PERSONAJES_OBJETOS.md`](COMPANERO_PERSONAJES_OBJETOS.md).

## 1. Pedido del usuario (textual)

> Ya copié. Ahora quiero usar esas imagenes para los heroes de la app. Cada carpeta tiene un nombre, que es el nombre del personaje.
>
> Dentro de cada carpeta estan todas las posturas del personaje. Algunas son t-pose.
>
> Quiero que los "Compañeros" de la app, sean esos personajes, con esos nombres que aparecen en la carpeta /Heroes/[nombre]
>
> Todavia no generé ningun objeto. Lo que decidí hacer, es generar una imagen por personaje con el objeto.
>
> Despues de terminar de subir todos los personajes, nombrarlos y que quede todo funcionando en la app, Necesito que me pases el listado de cada personaje con cada objeto en un documento markdown.
>
> De momento solo debes resolver eso y todo lo que esté trancado lo dejás para documentado para resolver en otro goal.

Mensajes posteriores, durante el trabajo:

> Todas las imagenes tienen fondo blanco. Si necesitas que les quite el fondo, puedo hacerlo de forma programatica, pero no creo que sea necesario

> pero si recortas el blanco, elementos como el ojo que tiene blanco se va a recortar, porque es necesario recortar?

> Tambien podes usar remgb con python:
>
> Creá un flujo local de eliminación de fondos usando Python y rembg.
>
> Requisitos:
> - Procesar imágenes sin usar APIs pagas ni servicios externos de IA.
> - No utilizar modelos de lenguaje para procesar las imágenes.
> - Aceptar JPG, JPEG, PNG y WEBP.
> - Guardar los resultados como PNG transparente.
> - Permitir procesar todas las imágenes de una carpeta por lotes.
> - Nunca sobrescribir las imágenes originales.
> - Reutilizar el modelo cargado para procesar múltiples imágenes.
> - Crear un script ejecutable y documentar cómo usarlo.
> - Si es posible, integrarlo como herramienta MCP para Claude Code.
> - Verificar que cada archivo generado tenga canal alfa y que la salida sea válida.

> quiero que ya dejes prontos los personajes y eso implica usar rembg ahora

> Las que dicen buenos dias, dejalas con fondo, no compliques

> ya te dije que si no podés lo hago yo a mano en photoshop o con alguna herramienta

> no quiero que quites esos textos de buenos dias

## 2. Qué se hizo

- **26 héroes en el catálogo** (`PERSONAJES`, `src/lib/engagement/companero.ts`): clave = nombre sin tildes ni espacios (`Dom Pío` → `dom-pio`), nombre propio como nombre del compañero, `voz` (una de las 6 voces de frases que ya había), `arte` y `objeto`. Reemplazan a los 6 genéricos de la lane 220.
- **Importador** `npm run heroes -- <carpeta Heroes>` (`scripts/importar-heroes.ts`): clasifica los archivos (nombres en inglés) en las 6 poses de la app por palabras clave, descarta T-pose, perfiles y hojas de diseño, quita repetidas (por contenido), **les quita el fondo con rembg** y escribe `public/companeros/<clave>/<pose>.webp` con transparencia (recortado por la figura, todas las poses a la misma altura y sobre el mismo lienzo). `--informe` muestra qué archivo eligió para cada pose sin escribir nada. Las correcciones manuales van en `CORRECCIONES` (hoy: neutral de Padre Santiago y de Vicente, que salían de perfil y de espaldas). 8 MB en total.
- **Quitar fondo (local, rembg)**: `scripts/quitar-fondo.py` (lote, PNG con alfa verificado, sin tocar originales, modelo cargado una vez) y `scripts/quitar_fondo_mcp.py` (herramienta MCP). Detalle en [`QUITAR_FONDO.md`](QUITAR_FONDO.md).
- **Buenos días**: por pedido del usuario esa pose queda **como viene, con fondo blanco y su cartel «¡Buenos días!»** (sin rembg ni recorte de texto). La escena y el álbum le ponen `mix-blend-mode: multiply` para fundir el blanco (`POSES_CON_FONDO` en `companero.ts`).
- **Quien ya tenía compañero** (los 6 genéricos guardados en la base) no pierde nada: `personajeGuardado` los pasa a `madre-isabel`, `padre-santiago`, `pedro`, `barbara`, `felipe` y `laura`. No hubo cambio de esquema ni de base.
- **Selector**: ofrece los 22 que tienen imágenes (`PERSONAJES_ELEGIBLES`); los 4 sin imágenes no se pueden elegir (el servidor también lo rechaza).
- **Objeto de cada héroe**: se muestra en «Su objeto» (pantalla del compañero) con `public/companeros/<clave>/objeto.webp` y, hasta que exista, su emoji. `npm run companeros` acepta `<clave>-objeto.png`.
- **Pruebas**: el catálogo tiene que decir la verdad sobre `public/companeros` (completo = 6 poses, parcial = neutral y menos de 6, sin imágenes = nada).

## 3. Estado de las carpetas

| Estado | Héroes |
|---|---|
| ✅ Completo (6/6 poses) | Angelito, Bárbara, Catalina, Cecilia, Daniel, Dom Pío, Felipe, Josecito, Laura, Madre Isabel, María, Padre Santiago, Pedro, Rosa, San Miguel Arcángel, Teresa, Vicente |
| 🟡 Parcial (solo la neutral; las demás poses muestran esa) | Isaías, Lucas, Magdalena, Marta, Maximiliano |
| ⛔ Carpeta vacía (no se puede elegir) | Mariana, Miguel, Rafael, Verónica |

## 4. Trabado o para otro goal

1. **Carpetas vacías**: Mariana, Miguel, Rafael y Verónica no traen ninguna imagen (¿falló la copia por SMB o todavía no se generaron?). Al llegar: copiarlas, correr `npm run heroes -- <carpeta>` y pasar su `arte` a `completo` o `parcial` en el catálogo; la prueba avisa si no coincide.
2. **Poses que faltan** en los 5 parciales. Isaías, Magdalena, Marta y Maximiliano tienen una sola imagen (la neutral); Lucas solo trae hojas de diseño, T-pose y perfil, y se usó la que mejor servía como neutral. Hay que generarles las otras 5 poses.
3. **Objetos**: ninguna imagen generada todavía. Los objetos del listado son una propuesta mía; hay que confirmarlos (sobre todo los de Daniel, Felipe, Maximiliano, Miguel y Rafael, donde no sé qué personaje es) y generar las 26 imágenes. Falta decidir si el objeto va solo o con el personaje sosteniéndolo.
4. **Buenos días con fondo**: al dejar esa pose con su fondo blanco, sobre un escenario oscuro (como `noche`, cuando exista) el `multiply` la va a oscurecer. Si molesta, pasar esas imágenes por `scripts/quitar-fondo.py` (con o sin `--solo-figura` según se quiera conservar el cartel) y sacarla de `POSES_CON_FONDO`.
5. **Herramienta MCP de quitar fondo**: se probó que lista la herramienta y procesa una imagen, pero no dentro de una sesión de Claude Code (hay que darla de alta con `claude mcp add`, ver `QUITAR_FONDO.md`).
6. **Poses de la fase 2** que ya traen las carpetas y hoy no se usan: leyendo, durmiendo, sorprendido, corriendo, aplaudiendo, saltando de alegría. Falta agregarlas a `POSES` y a una situación (ver `COMPANERO_IMAGENES.md`, «Fase 2»).
7. **Frases**: los héroes comparten las 6 voces que ya existían (Angelito y Josecito hablan como niño, San Miguel como hombre…). Escribir frases propias por héroe queda para otro goal.
8. **Comprobación en la app real**: las pruebas y `tsc` pasan, pero no pude abrir la app con sesión y base en este entorno (la base de pruebas no conecta), así que no vi el selector ni la escena en pantalla.
9. **Imágenes de los 6 genéricos viejos** (`public/companeros/monja/`, etc.): no existían, no hay nada que borrar.
