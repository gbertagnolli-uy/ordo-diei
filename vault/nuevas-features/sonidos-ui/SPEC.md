# Sonidos de interfaz — Especificación

> Amplía [`README.md`](README.md). Comparte el motor con [`../musica-fondo/SPEC.md`](../musica-fondo/SPEC.md). Es **Must-Have** en la investigación (check-off con sonidos de recompensa).

## 1. Objetivo
Dar retroalimentación sonora breve a acciones y recompensas para reforzar el bucle de hábito, sin molestar ni sonar en horas de silencio.

## 2. Motor de audio compartido (`src/lib/audio/`)
- `reproducir(evento, opciones?)` es la **única** API para los componentes. Los componentes **no** conocen archivos.
- Canales: `efectos` y `musica` con volumen independiente; ducking de música al sonar un efecto «grande».
- Precarga perezosa por grupos (sprite de Howler); uso de Web Audio para baja latencia.
- Estado de autoplay: el motor se «desbloquea» en el primer gesto (clic en Entrar / toque). Antes de eso `reproducir` encola nada y no falla.
- Se silencia por: preferencia del usuario, horario silencioso del admin, pestaña oculta (salvo música), `prefers-reduced-motion` no aplica.
- Háptica opcional: `navigator.vibrate(15)` en móviles compatibles, ligada a la misma preferencia.

## 3. Catálogo de eventos

| Evento | Dónde se dispara (archivo actual) | Sonido | Duración |
|---|---|---|---|
| `tap` | botones primarios (opcional, desactivado por defecto) | clic suave | < 60 ms |
| `tarea.completada` | `useTaskActions` al completar | «ding» alegre | ~0,6 s |
| `tarea.aprobada` | notificación de aprobación | campanilla | ~0,8 s |
| `tarea.rechazada` / `error` | `toast` de error | tono bajo corto | ~0,3 s |
| `habito.hecho` | `HabitoCard` al marcar | pluma/campana | ~0,6 s |
| `xp.ganado` | animación de XP | «blip» ascendente | ~0,4 s |
| `nivel.sube` | subida de nivel | fanfarria corta | ~1,5 s |
| `racha.suma` | racha | chispa | ~0,5 s |
| `premio.reclamar` | `MisPremios` al reclamar | cofre/campanas | ~1 s |
| `cofre.abrir` | `ModalSorpresa` | apertura mágica | ~1,5 s |
| `sobre.abrir` | `ModalAperturaSobre` (rasgado) | rasgado de papel | ~0,8 s |
| `carta.revelar.{comun,buena,perfecta,celestial}` | revelado de carta | 4 niveles crecientes (celestial = coro) | 0,5–3 s |
| `carta.desbloqueada` | carta nueva | acorde brillante | ~1,2 s |
| `marketplace.compra` | compra exitosa | caja registradora suave | ~0,8 s |
| `marketplace.bloqueado` | tocar producto bloqueado | candado | ~0,3 s |
| `timer.fin` | temporizador visual | campanilla repetida 2× | ~2 s |
| `aviso.sesion` | aviso de cierre (10 s) | pip suave | ~0,3 s |

## 4. Preferencias (UX)
- Menú de usuario → **«Sonido»**: interruptor «Efectos», deslizador «Volumen de efectos», interruptor «Música», deslizador «Volumen de música», botón «Probar».
- Admin: **horario silencioso**, volumen máximo, «sonidos para niños habilitados» (ver `ConfigAudio` en música).
- Valores por defecto: efectos ON al 60 %, música OFF hasta que el usuario la active (evita sorpresas).
- Cambios sin recarga; guardados en `PreferenciaAudio` (por usuario) y `localStorage` como respaldo.

## 5. Assets (D15: los entrega el usuario en una carpeta)
- **Entrada:** carpeta del usuario con los archivos (`.mp3`, `.wav`, `.ogg`, `.m4a`). Sin nombres obligatorios.
- **Importador** `scripts/importar-sonidos.mjs <carpeta>`: lista los archivos, los **normaliza** (ffmpeg: mono, OGG + MP3, −16 LUFS, recorte de silencios, tope ≈ 30 KB para efectos cortos y ≈ 150 KB para fanfarrias) y los copia a `public/sonidos/`. Pocos y livianos ⇒ sí van en el repo.
- **Asignación a eventos:** `public/sonidos/mapa.json` (`evento → archivo`). Si el nombre del archivo coincide con un evento del catálogo (§3, p. ej. `nivel.sube.mp3`) se asigna solo; el resto queda **sin asignar** y el script imprime una tabla «evento sin sonido / archivo sin evento» para que el usuario o el agente decidan.
- **Eventos sin sonido** simplemente no suenan (el motor ignora el evento; no es error).
- **Paso previo a implementar (lane N2):** recibir la carpeta, escucharla/listarla y proponer la asignación a los eventos del catálogo; el usuario valida.
- Créditos y licencias en `public/sonidos/CREDITOS.md` (el usuario indica el origen).

## 6. Modelo de datos
`PreferenciaAudio { usuarioId @id, efectos Boolean=true, volEfectos Int=60, musica Boolean=false, volMusica Int=40, haptica Boolean=true }`.

## 7. Criterios de aceptación
1. Completar una tarea reproduce `tarea.completada` una sola vez (sin duplicar por re-render).
2. Apagar «Efectos» silencia todo, incluida la fanfarria.
3. En horario silencioso no suena nada, pero la interfaz funciona.
4. Antes del primer gesto no hay errores de autoplay en consola.
5. Cada rareza de carta suena distinto.
6. Los assets suman < 600 KB y se cargan solo cuando se necesitan.
7. Pruebas unitarias del mapa evento→archivo y de las reglas de silencio.

## Requisitos que vienen de Homeschooling (2026-10-15)
- El motor **no debe sonar cuando `document.documentElement.dataset.relajado` esté activo** (modo relajado de un alumno con TDAH/TEA): es la misma señal que corta el confeti en `ModalManager.celebrate`.
- Homeschooling lo usaría en tres lugares: acierto/fallo de un checkpoint de video, resultado del quiz final y victoria al completar la Tarea del día. Detalle en `vault/nuevas-features/homeschooling/INTEGRACION_CON_OTRAS_LANES.md`.
