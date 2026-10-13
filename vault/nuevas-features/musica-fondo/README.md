# Música de fondo

> Estado: **planificación** (2026-10-13). Sin lanes creadas todavía.

## 1. Pedido del usuario (textual)

> Empecemos la planificación de estas nuevas features:
>
> Marketplace (Para canjear alguna de las monedas de la app por premios fisicos reales)
> Homeschooling (Complejo, es casi una app nueva extra)
> Sonidos UI para recompensas y acciones en la APP
> Meal planner
> Temporizadores Visuales
> Idle State: Marco de Fotos Dinamico en pantalla principal donde aparecen las fotos de los usuarios para iniciar sesion
> Kiosk Mode / App Pinning
> Musica de fondo
>
> Anota todo esto en el vault en carpetas separadas.
>
> (Más la investigación pegada: [`../ref/investigacion-1-centros-de-comando.md`](../ref/investigacion-1-centros-de-comando.md) y [`../ref/investigacion-2-software-puro.md`](../ref/investigacion-2-software-puro.md).)

Línea que corresponde a esta feature: **«Musica de fondo»**

## 2. Qué dice la investigación

- **Won't-Have por ahora** — inv. 1: «Reproductor de Música Nativo: mejor incrustar un widget de Spotify». Construir un reproductor propio es costoso; preferir embed o terceros.
- Es decir, el usuario pidió «Música de fondo» pero la investigación recomienda no construir un reproductor completo.

## 3. Opciones (a decidir con el usuario)

| Opción | Pro | Contra |
|---|---|---|
| A. Pistas propias (archivos CC0/libres o licenciados) en loop, controladas por la app | Sin cuentas externas, funciona offline y se integra con sonidos/ducking/timers | Hay que conseguir y alojar los audios y atender licencias |
| B. Widget/embed Spotify o YouTube | Catálogo enorme, el SO ya lo sabe reproducir | Requiere cuenta/Premium para el SDK, anuncios en embed, no se puede atenuar con efectos, depende de internet |
| C. Radio/stream por URL (ej. canal de música sacra) | Simple, sin hostear audio | Depende de terceros, cortes, licencias |

Recomendación inicial: **A** (música ambiental suave por franja del día y por pantalla) con arquitectura que permita enchufar B/C después. Compartir el motor de audio con `../sonidos-ui/` (ducking al sonar un efecto).

## 4. Consideraciones

- Autoplay: solo tras un gesto del usuario; en kiosko, un primer toque «habilita el sonido».
- Con la pantalla de marco (`../idle-marco-fotos/`) activa: ¿sigue sonando? Configurable.
- Control: play/pausa, volumen, silencio global y horarios (no de noche). Admin decide si los niños pueden controlarla.

## 5. Preguntas abiertas

1. ¿Qué tipo de música (sacra, instrumental, clásica, lo-fi)?
2. ¿Archivos propios, Spotify o radio online?
3. ¿Suena siempre o solo en ciertas pantallas / momentos (rezo, tareas)?
4. ¿Quién la controla?
