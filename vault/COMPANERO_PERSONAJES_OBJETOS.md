# Compañeros: personajes y su objeto

> Generado desde el catálogo (`PERSONAJES` en `src/lib/engagement/companero.ts`, lane 233). Parte de [`COMPANERO_HEROE.md`](COMPANERO_HEROE.md); el registro de la lane está en [`LANE_233_HEROES_COMPANEROS.md`](LANE_233_HEROES_COMPANEROS.md).
> **Los objetos son una propuesta mía**: el catálogo no dice qué santo o personaje es cada uno, así que los elegí por el nombre y por cómo se ve la ilustración. Cambiá cualquiera antes de generar la imagen: se edita en la columna `objeto` del catálogo (nombre y emoji) y este archivo se vuelve a armar.

Todavía **no hay ninguna imagen de objeto**: la app muestra el emoji de respaldo en «Su objeto» (pantalla del compañero) hasta que exista `objeto.webp`.

## Listado (26 personajes)

| Personaje | Clave | Ilustraciones (poses de 6) | Objeto | Dónde va la imagen del objeto |
|---|---|---|---|---|
| Angelito | `angelito` | ✅ Completo (6/6) | 🏮 Farolito de luz | `public/companeros/angelito/objeto.webp` |
| Bárbara | `barbara` | ✅ Completo (6/6) | 🏰 Torrecita de tres ventanas | `public/companeros/barbara/objeto.webp` |
| Catalina | `catalina` | ✅ Completo (6/6) | 🎡 Rueda de madera con una pluma | `public/companeros/catalina/objeto.webp` |
| Cecilia | `cecilia` | ✅ Completo (6/6) | 🪕 Laúd pequeño | `public/companeros/cecilia/objeto.webp` |
| Daniel | `daniel` | ✅ Completo (6/6) | 📜 Rollo con una profecía | `public/companeros/daniel/objeto.webp` |
| Dom Pío | `dom-pio` | ✅ Completo (6/6) | 🔔 Campanita del monasterio | `public/companeros/dom-pio/objeto.webp` |
| Felipe | `felipe` | ✅ Completo (6/6) | 🍞 Dos panes y un pescado | `public/companeros/felipe/objeto.webp` |
| Isaías | `isaias` | 🟡 Parcial (1/6) | 🔥 Brasa en unas tenazas | `public/companeros/isaias/objeto.webp` |
| Josecito | `josecito` | ✅ Completo (6/6) | 🔨 Martillito de carpintero | `public/companeros/josecito/objeto.webp` |
| Laura | `laura` | ✅ Completo (6/6) | 🌷 Lirio blanco | `public/companeros/laura/objeto.webp` |
| Lucas | `lucas` | 🟡 Parcial (1/6) | 🖋️ Evangelio y pluma | `public/companeros/lucas/objeto.webp` |
| Madre Isabel | `madre-isabel` | ✅ Completo (6/6) | 🌹 Rosas en un pañuelo | `public/companeros/madre-isabel/objeto.webp` |
| Magdalena | `magdalena` | 🟡 Parcial (1/6) | 🫙 Frasco de perfume | `public/companeros/magdalena/objeto.webp` |
| María | `maria` | ✅ Completo (6/6) | 📿 Rosario celeste | `public/companeros/maria/objeto.webp` |
| Mariana | `mariana` | ⛔ Sin imágenes (0/6) | 🌼 Azucena | `public/companeros/mariana/objeto.webp` |
| Marta | `marta` | 🟡 Parcial (1/6) | 🥄 Cucharón de madera | `public/companeros/marta/objeto.webp` |
| Maximiliano | `maximiliano` | 🟡 Parcial (1/6) | 👑 Dos coronas, blanca y roja | `public/companeros/maximiliano/objeto.webp` |
| Miguel | `miguel` | ⛔ Sin imágenes (0/6) | 🛡️ Escudo pequeño | `public/companeros/miguel/objeto.webp` |
| Padre Santiago | `padre-santiago` | ✅ Completo (6/6) | 🐚 Concha de peregrino | `public/companeros/padre-santiago/objeto.webp` |
| Pedro | `pedro` | ✅ Completo (6/6) | 🔑 Llaves grandes | `public/companeros/pedro/objeto.webp` |
| Rafael | `rafael` | ⛔ Sin imágenes (0/6) | 🐟 Bastón y pez | `public/companeros/rafael/objeto.webp` |
| Rosa | `rosa` | ✅ Completo (6/6) | 🌹 Corona de rosas | `public/companeros/rosa/objeto.webp` |
| San Miguel Arcángel | `san-miguel-arcangel` | ✅ Completo (6/6) | 🗡️ Espada de llamas | `public/companeros/san-miguel-arcangel/objeto.webp` |
| Teresa | `teresa` | ✅ Completo (6/6) | 🌹 Ramito de rosas y crucifijo | `public/companeros/teresa/objeto.webp` |
| Verónica | `veronica` | ⛔ Sin imágenes (0/6) | 🕊️ Velo con un rostro | `public/companeros/veronica/objeto.webp` |
| Vicente | `vicente` | ✅ Completo (6/6) | 💰 Bolsita de monedas | `public/companeros/vicente/objeto.webp` |

## Cómo subir cada imagen de objeto

1. Nombre de origen: `<clave>-objeto.png` (por ejemplo `pedro-objeto.png`, `dom-pio-objeto.png`).
2. `npm run companeros -- <carpeta con los originales>` las pasa a WebP en `public/companeros/<clave>/objeto.webp` (768 px máx.) y salta lo que no coincide con el catálogo.
3. Aparece sola en la pantalla del compañero; no hace falta tocar código.

Pedido para el generador: *«Ilustración del mismo personaje (adjuntar su imagen neutral como referencia), mismo estilo, sosteniendo / con \[objeto]. Fondo blanco. Cuerpo entero o el objeto solo, a elección.»* La app solo lo muestra dentro de un cuadrado, así que sirve cualquiera de las dos cosas.
