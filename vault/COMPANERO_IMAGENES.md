# Compañero «héroe»: imágenes que hay que generar (fase 1, mientras llegan los modelos 3D)

> Parte de [`COMPANERO_HEROE.md`](COMPANERO_HEROE.md). Este archivo es la **lista de pedido** de arte: cuántas imágenes, de quién, en qué postura y dónde se copian.
> **Lane 233:** las carpetas de arte ya están importadas (`npm run heroes`) y los personajes son los 26 héroes; esta lista queda como referencia del pedido original. Lo que falta está en [`LANE_233_HEROES_COMPANEROS.md`](LANE_233_HEROES_COMPANEROS.md) §4.
> La app **ya funciona sin ninguna imagen** (muestra un emoji de reemplazo). Cada imagen que se copia aparece sola, sin tocar código.

## Resumen: 46 imágenes

| Grupo | Cantidad | Para qué |
|---|---|---|
| **Personajes**: 6 personajes × 6 poses | **36** | El compañero en pantalla, según el momento |
| **Fondos** (escenarios) | **4** | Accesorio «Escenario» de la pantalla del compañero |
| **Objetos de escena** | **6** | Accesorios que se apoyan al lado del compañero |

Los **marcos y auras** por nivel se dibujan con CSS: no hace falta imagen.
Los accesorios son **de escena** a propósito (un solo dibujo sirve para los 6 personajes). Un accesorio «puesto» en el personaje (gorro, estola, rosario al cuello) exigiría un dibujo por personaje y por pose (hasta 36 por accesorio): queda para los modelos 3D.

## Orden sugerido (para que el estilo salga parejo)

1. **Primero las 6 poses «neutral»**, una por personaje. Con esas se fija el estilo; se usan después como referencia para el resto del mismo personaje.
2. Después, **un personaje completo por vez** (sus otras 5 poses) para cuidar que mantenga cara, pelo y ropa.
3. Al final, los 4 fondos y los 6 objetos.

## Los 6 personajes

| Clave | Personaje | Nota |
|---|---|---|
| `monja` | Monja joven | Hábito sencillo |
| `sacerdote` | Sacerdote joven | Sotana negra y alzacuello |
| `hombre` | Hombre | Adulto, ropa de todos los días |
| `mujer` | Mujer | Adulta, ropa de todos los días |
| `nino` | Niño | Ropa de todos los días |
| `nina` | Niña | Ropa de todos los días |

Reglas para todos: **mismo estilo artístico** en los 6, **cuerpo entero**, **proporción 3:4** (vertical), **ligeramente de 3/4 frontal**, **fondo transparente** (PNG) o un color plano liso para recortar, y **misma ropa, peinado y rasgos** en todas las poses del mismo personaje. Que se vea cálido y amable, nunca solemne ni triste del todo.

## Las 6 poses de cada personaje (36 imágenes)

| Archivo | Pose | Descripción exacta | Cuándo aparece en la app |
|---|---|---|---|
| `neutral` | De pie, presentación | Sonrisa suave, brazos relajados | Pantalla del compañero, selector inicial, cualquier momento sin otra pose |
| `buenos-dias` | Buenos días | Saluda con una mano y sostiene una **taza de café** en la otra | Saludo al abrir la app por la mañana (5 a 11 h) |
| `abrazo` | Abrazo | Brazos abiertos hacia la cámara, sonrisa cariñosa | Cuando volvés después de faltar uno o más días |
| `felicitando` | Felicitando | Aplaude o pulgar arriba, orgulloso y feliz (puede tener los brazos en alto, alegría plena) | Premios, cofre abierto, hito de racha, subir de nivel, meta cumplida |
| `ensenando` | Enseñando | Un brazo extendido señalando a un costado, otro sosteniendo algo si querés | Cartas nuevas por reclamar y novedades |
| `reflexion` | Reflexión | Manos juntas en oración, ojos serenos o cerrados | Atardecer y noche (19 h en adelante) y momentos de oración |

Pose 1 también se usa recortada como **retrato** del selector («¿Quién te va a acompañar?»): no hace falta una imagen aparte.

### Dónde copiar los archivos

```
public/companeros/<personaje>/<pose>.webp
```

Ejemplos: `public/companeros/monja/neutral.webp`, `public/companeros/sacerdote/buenos-dias.webp`, `public/companeros/nina/abrazo.webp`.

- Formato **WebP** con transparencia, ~768 × 1024 px, idealmente < 200 KB cada uno.
- Si los generás en PNG o JPG: dejalos en una carpeta cualquiera y corré `npm run companeros -- <carpeta>`; el script los pasa a WebP, los achica y los deja en su lugar. Nombres de origen: `<personaje>-<pose>.png` (p. ej. `monja-abrazo.png`), `fondo-<clave>.png` (`fondo-jardin.png`) y `objeto-<clave>.png` (`objeto-veladora.png`). Lo que no coincide con el catálogo lo saltea y avisa.

## Fondos (4 imágenes)

Proporción **3:4**, misma que los personajes, sin personas, con el centro y la parte baja despejados (ahí se para el compañero). Estilo igual al de los personajes.

| Archivo | Escena | Cómo se consigue |
|---|---|---|
| `capilla` | Interior de una capilla sencilla, luz cálida de vitrales | **Regalo inicial** |
| `jardin` | Jardín de casa con flores y árbol, mañana soleada | Nivel 2 |
| `hogar` | Sala de una casa cálida con ventana y mesa | Nivel 3 |
| `noche` | Cielo estrellado con luna, siluetas de montes | Nivel 6 |

Se copian en `public/companeros/fondos/<archivo>.webp`.

## Objetos de escena (6 imágenes)

Cuadrados **1:1**, **fondo transparente**, un solo objeto, vistos de frente, con base apoyable (se paran al costado del compañero). ~512 × 512 px.

| Archivo | Objeto | Cómo se consigue |
|---|---|---|
| `veladora` | Vela votiva encendida en vaso de vidrio | **Regalo inicial** |
| `maceta` | Maceta con flores | Nivel 2 |
| `libros` | Pila pequeña de libros | Nivel 3 |
| `banderin` | Banderín de tela con una cruz, en un palito | Nivel 5 |
| `rosario` | Rosario de madera colgado de un gancho | Nivel 8 |
| `virgen` | Imagen pequeña de la Virgen María sobre un pedestal | Nivel 12 |

Se copian en `public/companeros/objetos/<archivo>.webp`.

## Fase 2 (más adelante, no hace falta ahora): 6 poses más por personaje

`pensando`, `te-extrane` (mirada baja, suave), `durmiendo` (madrugada), `leyendo`, `sorprendido`, `celebracion` (saltando). Para sumarlas hay que agregar su línea en `POSES` (`src/lib/engagement/companero.ts`) con el nivel en que se ganan y asignarlas a una situación; mientras no exista la imagen, la escena muestra la `neutral`. Serían 36 imágenes más.

## Pedido para el generador (modelo de prompt)

> Ilustración de personaje cuerpo entero, estilo \[el mismo para todos], proporción vertical 3:4, ligeramente girado a 3/4 frontal, fondo transparente. Personaje: \[descripción fija del personaje]. Pose: \[la de la tabla]. Expresión cálida y amable. Mantener exactamente la misma cara, pelo, ropa y proporciones que la imagen de referencia adjunta.

Adjuntar siempre la imagen `neutral` del mismo personaje como referencia.
