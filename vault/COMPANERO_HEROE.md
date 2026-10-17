# Compañero «héroe» (lane 220)

> Pedido del usuario (2026-10-16), registrado **completo y textual** en §1. Reemplaza al «compañero que evoluciona» de la lane 203 ([`ENGAGEMENT_PLAN.md`](ENGAGEMENT_PLAN.md)).
> Lista de arte que hay que generar: [`COMPANERO_IMAGENES.md`](COMPANERO_IMAGENES.md).

Rama `task/lane-220-companero-heroe` · worktree `../ordo-diei-lanes/lane-220` · base `dev`.

## 1. Pedido del usuario (textual, nada omitido)

> Trabajemos en el compañero, quiero que sea como el "héroe" de la app, como se usa en juegos, pero acá que sea el compañero.
>
> Quiero varios, una monja joven, un sacerdote joven, un hombre, una mujer, un niño y una niña.
> Yo te voy a copiar las imagenes de cada uno, necesito que me pidas cuantas precisás y en qué postura, para generarlas.
> Por ej.: Si es para recibir al que faltó con cariño, podría ser un gesto de abrazo, si es para la mañana temprano, podría dar los buenos días con una taza de café en la mano, si es para cuando se ganó un premio, podría ser una expresión de felicitar, y así con cada vez que aparezca el compañero.
>
> A su vez, e compañero/a debe tener una pantalla propia, debajo de cartas, para que se pueda ingresar y hacerle mejoras de XP y de accesorios.
>
> En vez de resolverlo con imagenes, estoyy creando modelos 3D.  Como eso va a tomar un tiempo, mientras tanto resolvamoslo con images, pero con unas pocas por personaje.
>
> Aqui te paso algo que me pasó otra IA para que tengas en cuenta: *(texto completo en el apéndice A)*

## 2. Qué se hizo

- **Seis compañeros** a elegir («¿Quién te va a acompañar?»): la hermana (monja joven), el padre (sacerdote joven), el amigo (hombre), la amiga (mujer), el niño y la niña. Cada uno con su nombre sugerido y su **propia voz** (`companeroFrases.ts`: 7 situaciones × 2–3 frases por personaje, con voseo y sin géneros para el usuario).
- **Es de todos**, hijos y padres (los 6 personajes incluyen adultos). Aparece en el inicio (reemplaza a la tarjeta de la lane 203) y tiene **pantalla propia `/dashboard/companero`, debajo de Cartas** en la barra lateral, con un punto ámbar mientras no se eligió o hay un nivel nuevo por festejar.
- **Pose según el momento** (`situacionDe` / `poseDelMomento`, prioridad de arriba abajo):

  | Situación | Cuándo | Pose |
  |---|---|---|
  | Festejo | Subió de nivel y no lo festejó | Felicitando |
  | Regreso | Volvió después de faltar 2 días o más | Abrazo («¡Qué alegría verte de nuevo!», sin contar los días) |
  | Carta | Hay cartas por reclamar | Enseñando |
  | Mañana | 5 a 11 h | Buenos días (taza de café) |
  | Tarde | 12 a 18 h | Neutral |
  | Noche | 19 h en adelante y madrugada | Reflexión |

  La frase es la misma durante todo el día y cambia al siguiente. Tocar al compañero lo hace decir algo distinto cada vez.
- **Nivel y XP: los de siempre** (`xpTotal` + `nivelDe`). El héroe es el espejo del progreso que ya existe, así que **no hay economía nueva ni hace falta enganchar nada** en tareas y hábitos. El día con sanción ya reduce esa XP a la mitad (lane 200).
- **Qué se gana subiendo de nivel**: poses nuevas (Enseñando en el nivel 2, Reflexión en el 3; hasta que llegan se usa la neutral), **espacios para objetos** (1 al empezar, 2 en el nivel 4, 3 en el 8), un **marco** para su escena cada 5 niveles y la posibilidad de comprar accesorios más raros.
- **Relación («días juntos»)**: lo que antes eran las etapas de la lane 203. Cuenta los días distintos en que se entró y nunca baja: Recién presentados → Amigos (7) → Compañeros de camino (30) → Amigos del alma (100).
- **Accesorios** (`accesorios.ts`): 4 escenarios y 6 objetos, con rareza común/rara/épica/legendaria. Son **de escena** y **solo cosméticos**; los de regalo son la capilla y la veladora. Se compran con las monedas de siempre (puntos, y granos de incienso para los épicos). Con sanción la compra está cerrada («Accesorios cerrados por hoy»), igual que la Tienda; lo que ya se tiene se puede seguir poniendo.
- **Pantalla**: escena a la izquierda (tocable) y tres pestañas: **Mejoras** (qué abre cada próximo nivel + la relación), **Accesorios** (comprar y poner/sacar) y **Álbum** (las poses, las bloqueadas en silueta con su nivel; tocar una la muestra en la escena).
- **Sin imágenes funciona igual**: cada imagen tiene respaldo (emoji) y se prueba la pose pedida, luego la neutral, luego el emoji. Cuando se copian las imágenes a `public/companeros/` aparecen solas. `npm run companeros -- <carpeta>` convierte PNG/JPG a WebP con el nombre correcto.

## 3. Datos

SQL **solo aditivo** aplicado a la base (sin `DROP`), regla 6 de `AGENTS.md`:
- `Companeros` + `Personaje` (texto, `null` = todavía no eligió), `Nivel_Visto` (último nivel festejado) y `Equipados` (JSON `{ fondo, objetos[] }`). `Etapa_Vista` queda sin uso.
- Tabla nueva `Companero_Accesorios` (usuario + clave; los de regalo no tienen fila).

Los compañeros que se habían creado con la lane 203 conservan su nombre y ven la tarjeta «Elegí quién te acompaña».

## 4. Decisiones que tomé (el usuario puede corregirlas)

1. **Todos tienen compañero**, también los padres.
2. **Solo cosméticos** en esta versión (la otra IA proponía pasivas como +5 % de XP o proteger la racha): tocarían la economía, que el usuario cuida.
3. **Las primeras 4 poses ya están desde el nivel 1** (neutral, buenos días, abrazo y felicitando), porque son las que cumplen la función de saludar, abrazar y felicitar el primer día; solo Enseñando y Reflexión se ganan.
4. **Accesorios de escena**, no «puestos» en el personaje: así 46 imágenes alcanzan (ver `COMPANERO_IMAGENES.md`).
5. Fase 1: **6 poses por personaje** (36 imágenes). Las poses de la fase 2 (pensando, te extrañé, durmiendo, leyendo, sorprendido, celebración) quedan para más adelante o para los modelos 3D.
6. Los avisos push de la lane 204 no cambian.

## 5. Pruebas

- 11 unitarias de reglas y catálogo (`companero.test.ts`), 2 del script de imágenes, 2 de integración con base local (`companero_integracion.test.ts`, con `PERMITIR_TESTS_DB=1`): elegir y cambiar de personaje, nombre sugerido, regreso, festejo de nivel, compra única y atómica, nivel mínimo, saldo, sanción y espacios al equipar.
- Verificado en Chromium (teléfono) con la base local: selector, inicio, pantalla y sus tres pestañas, con y sin imágenes, y el festejo de nivel; vista de una madre.

---

## Apéndice A · texto que pasó el usuario (otra IA), completo

# PARTE 1: Anatomía de la mecánica de "Héroes" en apps

## Qué función cumple realmente el héroe

El héroe no es decoración: cumple **cinco funciones simultáneas**:

1. **Ancla emocional**: es la cara de la app. La gente no vuelve "a la app", vuelve "a ver a su compañero".
2. **Espejo del progreso**: su evolución visual refleja tu esfuerzo. Subiste de nivel → él cambia. Es tu progreso hecho personaje.
3. **Mensajero de recompensas**: premios, logros y avisos llegan *a través* de él (te felicita, te abraza, te celebra). Esto convierte feedback frío en feedback emocional.
4. **Motor de retención**: su estado depende de tu constancia. Si faltás, él lo nota.
5. **Interfaz de guía**: enseña, presenta contenido, explica novedades (por eso las poses de "señalar" o "mostrar").

## Los tres loops

**Loop core (diario, segundos):**
Abrir la app → el compañero te recibe con una reacción contextual → realizás una acción → ganás XP → barra visible, feedback inmediato → reacción de él.

**Loop meta (semanal, acumulativo):**
Acumular XP → subir de nivel → desbloquear pose/accesorio/título → personalizar → nuevo look → más apego → más ganas de volver.

**Loop de cuidado y colección:**
Su estado de ánimo depende de tu racha (loss aversion: no querés verlo triste) + completar sets de accesorios (colección).

## La estrategia psicológica detrás

| Mecanismo | Cómo se aplica al héroe |
|---|---|
| **Efecto de dotación** | Lo que personalizás y nombrás pasa a ser "tuyo" → abandonar la app es abandonarlo a él |
| **Aversión a la pérdida** | Perder la racha lo entristece (suave, nunca cruel) |
| **Refuerzo variable** | No siempre reacciona igual: el mismo evento puede mostrar 2-3 variantes → sorpresa |
| **Costo hundido afectivo** | 60 niveles invertidos en él pesan más que 60 días de hábito abstracto |
| **Meta a corto plazo siempre visible** | Siempre hay algo a 1-2 sesiones de distancia ("a 300 XP de...") |

## Evolución y niveles

- **XP**: se gana con acciones de la app (ver Parte 2 para el mapeo).
- **Curva**: nivel *n* cuesta ~100 × *n* XP (los primeros suben en minutos, luego se espacia).
- **Qué cambia al subir de nivel** (esto es clave, respondiendo tu pregunta):
  - Desbloqueo de **poses nuevas**: literalmente "el compañero aprende a abrazar" a nivel 3, "aprende a celebrar" a nivel 5. Las poses se ganan, no existen todas desde el inicio.
  - Desbloqueo de **slots de accesorios**: nivel 1 → 1 slot; nivel 5 → 2; nivel 10 → 3.
  - **Título de relación** que evoluciona: "Recién presentados" → "Amigos" → "Compañeros de camino" → "Amigos del alma".
  - **Cambios sutiles de diálogo**: a niveles altos te trata con más cercanía.
  - **Hitos visuales**: marco, aura o brillo cada 5 niveles.
- **Anti-patrón a evitar**: nunca castigar fuerte. El Tamagotchi clásico (muerte por abandono) genera culpa y desinstalación. Tristeza breve y cálida, luego te recibe con abrazo.

## Accesorios y objetos

- **Tipos**: cosméticos (solo look), **funcionales** (pasivas: +5% XP, protege la racha una vez por semana, bonus de recompensas) y de **interacción** (habilitan una acción o pose nueva).
- **Rarezas**: común / raro / épico / legendario → codicia por los épicos.
- **Sets**: bonus por conjunto (ej. "Set madrugada": gorro + termo → +10% XP entre 6 y 9 am).
- **Progresión de desbloqueo** (la pregunta de "cómo"): primer accesorio **gratis y temprano** (primera sesión, para enseñar la mecánica), luego comprados con la moneda de la app, algunos por **logros** ("7 días seguidos"), algunos por **eventos** (Navidad, Pascua — perfecto para el tono de tu app), algunos por completar colecciones de cartas → conecta el héroe con tu feature existente de cartas.

**Cómo le afectan los objetos desbloqueados al héroe**: cambian su apariencia (apego), le dan pasivas (utilidad), agregan diálogos y a veces desbloquean poses nuevas. El objeto no es para el usuario: es *para él*, y el usuario se beneficia indirectamente. Ese matiz es lo que genera cariño.

## Referencias a estudiar

- **Finch** (la más parecida a lo tuyo): app de bienestar donde un pájaro crece por tus hábitos.
- **Duolingo**: el personaje como fuente de culpa/afecto y retención.
- **Pokémon GO (buddy)**: el compañero que aparece en momentos contextuales.
- **Habitica**: avatar que sube de nivel con tus hábitos reales.

---

# PARTE 2: Aplicación a tu "Compañero"

## Concepto general

Los 6 personajes (monja, sacerdote, hombre, mujer, niño, niña) se eligen **en el onboarding**: "¿Quién te va a acompañar?". Esa elección inicial es el primer acto de vínculo. Cada uno con personalidad distinta en sus diálogos, mismas mecánicas.

**Regla de oro**: las poses no existen todas desde el inicio. Se desbloquean al subir de nivel, así la progresión del compañero es *visible y emocional*, no solo numérica.

## Mapeo de escenas → gatillos de la app

| Evento de la app | Pose del compañero | Frase ejemplo |
|---|---|---|
| Apertura diaria (mañana) | Buenos días con café | "¡Buen día! Te estaba esperando" |
| Apertura (noche) | Té/veladora, tranquilo | "Qué lindo cerrar el día juntos" |
| Regreso tras faltar | Abrazo | "¡Qué alegría verte de nuevo!" |
| Racha rota (una sola vez) | Triste suave | "Te extrañé... ¿empezamos de nuevo?" |
| Premio/logro | Celebración | "¡Te lo merecías!" |
| Respuesta correcta / carta completada | Felicitando | "¡Sos grande!" |
| Nueva carta desbloqueada | Enseñando/mostrando | "Mirá lo que conseguimos" |
| Momento de reflexión | Orando/manos juntas | — |
| Madrugada | Durmiendo | (zzz) |
| Tocarlo en su pantalla | Reacción breve | Diálogo random |

## Sistema de XP (a mapear con tus acciones reales)

Ejemplo de tabla — ajustala a lo que la app ya puntúa: abrir la app (+10), completar una carta (+25), racha diaria (+15 × días), responder bien (+5), etc.

## Pantalla del Compañero (debajo de Cartas)

1. **Header**: nombre + título de relación + nivel + barra de XP con "a X XP de [próximo desbloqueo]".
2. **Escena central**: el compañero en su pose contextual con accesorios equipados. Tocarlo → animación + burbuja de diálogo.
3. **Tabs internos**:
   - **Mejoras**: qué desbloquea el próximo nivel (preview de la pose nueva, en silueta).
   - **Accesorios**: slots equipados + inventario por rareza, con pasivas visibles.
   - **Álbum**: poses desbloqueadas + "momentos vividos" (la primera vez que celebró algo tuyo, etc.) → loop de colección.

## Accesorios propuestos (temática)

- **De escena** (veladora, planta, banderín, perchero, cuadro): *agnósticos al personaje* → una sola imagen sirve para los 6.
- **Personales** (rosario, estola, book, flor, gorro, bufanda, termo): dependen del personaje.
- **Funcionales en v1**: rosario (+5% XP en oraciones/reflexión), termo (protege racha 1 vez/semana), etc.

**Decisión de producción importante**: 6 personajes × 12 poses × 10 accesorios = 720 imágenes. La solución: poses base + accesorios de escena como capas PNG superpuestas (no dependen del personaje) y solo los accesorios personales requieren versión por personaje. Con eso el catálogo se mantiene manejable.

---

# PARTE 3: Qué imágenes necesito que me pases

## Especificaciones para todas (consistencia)

- Mismo estilo artístico en las 6 (elegí uno y no lo cambies).
- Cuerpo entero, proporción 3:4, mirando levemente a 3/4 frontal.
- Fondo plano uniforme o transparente, para recortar.
- Misma ropa, peinado y rasgos en todas las poses del mismo personaje.

## Set esencial (fase 1) — 6 poses por personaje

| # | Pose | Descripción exacta | Cuándo aparece |
|---|---|---|---|
| 1 | **Neutral / presentación** | De pie, sonrisa suave, brazos relajados | Pantalla del compañero (default), selector inicial |
| 2 | **Buenos días** | Saludando con una mano, taza en la otra | Apertura diaria |
| 3 | **Abrazo** | Brazos abiertos hacia la cámara | Regreso tras ausencia |
| 4 | **Celebración** | Brazos en alto, saltando, alegría plena | Premio o logro |
| 5 | **Enseñando** | Brazo extendido señalando a un costado | Presentar cartas/novedades |
| 6 | **Reflexión** | Manos juntas, ojos serenos | Momentos de oración/meditación |

**Total fase 1: 6 personajes × 6 poses = 36 imágenes** (+ 1 retrato/busto de cada uno para el selector, recortable de la pose 1).

## Set ampliado (fase 2, post-lanzamiento) — 6 poses más

| # | Pose | Descripción | Cuándo |
|---|---|---|---|
| 7 | **Felicitando** | Aplauso o pulgar arriba, orgulloso | Respuesta correcta |
| 8 | **Pensando** | Mano en el mentón | Pantallas de decisión |
| 9 | **Te extrañé** | Mirada baja, suave (no dramático) | Racha rota (una vez) |
| 10 | **Durmiendo** | Ojos cerrados, tranquilo | Apertura de noche/madrugada |
| 11 | **Leyendo** | Sentado con un libro | Idle secundario |
| 12 | **Sorprendido** | Manos cerca de la cara, asombro alegre | Sorpresas/eventos |

**Total final: 6 × 12 = 72 imágenes.**

## Cómo proceder

1. **Primero pasame las 6 poses #1 (neutras)**, una por personaje. Con esas fijo el estilo y te confirmo si sirven como referencia sólida para las demás.
2. Después pasame por personaje las poses 2 a 6, de a un personaje completo por vez (así chequeo consistencia).

Dos preguntas para afinar el diseño antes: **¿qué acciones de tu app deberían dar XP** (para mapear la tabla) y **querés que los accesorios sean solo cosméticos en v1 o ya con pasivas funcionales?**
