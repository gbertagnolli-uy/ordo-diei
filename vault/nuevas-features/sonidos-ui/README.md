# Sonidos UI para recompensas y acciones

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

Línea que corresponde a esta feature: **«Sonidos UI para recompensas y acciones en la APP»**

## 2. Qué dice la investigación

- **Must-Have (MVP)** — inv. 1: «Check-off táctil con **sonidos de recompensa** (gamificación básica)».
- ROADMAP.md (Q4 2024, sin hacer): «Sonido y microinteracciones AAA al completar tareas».
- Relacionado: reclamar premios/cofre/cartas ya tiene confites y modales (`LANE_87`, `LANE_92`); faltan los sonidos.

## 3. Alcance propuesto (a validar)

Eventos candidatos: completar tarea/hábito, aprobación del padre, ganar XP/subir de nivel, reclamar premio, abrir cofre, abrir sobre/carta (rareza → sonido distinto), error/rechazo, toast, tap de botones, canje en el marketplace, fin de temporizador.

Diseño técnico propuesto:
- Un único módulo `lib/sonidos` con un mapa `evento → archivo` y una función `reproducir(evento)`; precarga perezosa; volumen global.
- Preferencias por usuario/dispositivo (silenciar, volumen) y respeto a un «modo silencio» del admin. Compartir el control con **música de fondo** (ver `../musica-fondo/`) para que los efectos bajen la música (ducking).
- Políticas de autoplay del navegador: el audio solo arranca tras un gesto; en modo kiosk/pared hay que «desbloquear» con el primer toque.
- Evaluar librería madura (ej. `use-sound`/Howler.js) antes de código propio (ver memoria *reuse-open-source*). Sonidos con licencia libre (CC0), guardar créditos.

## 4. Preguntas abiertas

1. ¿Estilo sonoro (juego retro, suave/infantil, solemne por ser app católica)?
2. ¿Origen de los assets: banco CC0, generados, o el usuario los provee?
3. ¿Quién configura el volumen: cada usuario, solo el admin, o ambos?
4. ¿Sonidos distintos por rareza de carta y por tipo de premio?
