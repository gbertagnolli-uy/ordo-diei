# Liturgia — motor Divinum Officium, Calendarium y libros litúrgicos

> Estado: **especificado** (2026-10-14, lane 122). Especificación: [`SPEC.md`](SPEC.md) · prueba real del motor: [`SPIKE_MOTOR.md`](SPIKE_MOTOR.md) · decisiones D40–D53: [`../DECISIONES.md`](../DECISIONES.md) §10 · lanes L1–L9: [`../lanes/LANES.md`](../lanes/LANES.md).

## 1. Pedido del usuario (textual, parte 2)

> 2) A su vez, debemos clonar el motor de Divinum Officium: https://www.divinumofficium.com/www/horas/Help/technical.html
>
> https://github.com/divinumofficium/divinum-officium
>
> Ese motor de divinum officium, alimentará varias cosas:
>
> - Mostrar el titulo del propio del día (el día que se celebra hoy, el santo, la festividad por ejemplo "S. Callisti Papæ et Martyris ~ Duplex
> Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris") en el screensaver.
> - Alimentar una pantalla de Calendario Liturgico, que debe tener un dashboard para mostrar los misterios del día, el santoral del dia, propio de día del misal, breviarum del día, todo de la liturgia de "Tridentine - 1906" con traducción al español, Calendarium Generale, esa y las versiones de 1888 y 1570 son las unicas versiones que deben descargarse y generarse. Sin embargo la que se usará de forma predeterminada para los usuarios es la de "Tridentine - 1906", habrá un selector en cada pantalla de cada tipo de contenido para modificar la versión.
> - Cada tipo de contenido con su propia pantalla (Breviarium, Missale, Propium Sanctorum, Ordinarium, Psalterium, Propium de Tempore), Misterium Rosarium (o como se diga correctamente en latin).
> - La pantalla de breviarium, debe seleccionar la oración correspondiente según la hora del día. Pero sin obligar, sino que mostrándola como principal, el usuario puede elegir otra card y rezar lo que le plazca. La oración destacada debe tener una imagen destacada, en forma de card con background completo y el texto encima, la imagen ocupando toda la card. En donde se muestra el texto, un pequeño overlay con degradado de negro a transparente, con baja opacidad, 5% mas o menos. La idea es una card muy visual para destacar la oración correspondiente (Laudes, Nona, Sexta, etc.)

La parte 1 (reposo con Unsplash y frases) está en [`../idle-marco-fotos/SPEC.md`](../idle-marco-fotos/SPEC.md); el pedido completo, en `DECISIONES.md` §10.

## 2. Referencias
- Divinum Officium (MIT): <https://github.com/DivinumOfficium/divinum-officium> — commit probado `32be5f2` (2026-10-14).
- Documentación técnica: <https://www.divinumofficium.com/www/horas/Help/technical.html>.
- Cálculo del calendario: `docs/how-the-calendar-works.md` del repo de DO.

## 3. Lo que ya existe en Ordo Diei
- `src/lib/cartas/eventos.ts`: fiestas por `MM-dd` para las cartas (santos con fecha fija) y `APP_TZ` (America/Montevideo). **No** calcula precedencia ni tiempos litúrgicos; no se reemplaza: las cartas siguen como están.
- `/dashboard/oracion` redirige a hábitos (Camino de oración). No se toca.
- No hay nada de Breviario, Misal ni calendario litúrgico.

## 4. Correcciones de nombres latinos (D46)
«Propium» → **Proprium** (Proprium Sanctorum, Proprium de Tempore). «Breviarum» → **Breviarium**. «Misterium Rosarium» → **Rosarium**, con subtítulo **Mysteria Rosarii** («los misterios del Rosario»).
