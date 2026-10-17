# Marketplace — canjear monedas por premios físicos reales

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

Línea que corresponde a esta feature: **«Marketplace (Para canjear alguna de las monedas de la app por premios fisicos reales)»**

## 2. Qué dice la investigación

- **Economía de Recompensas (Tokenomics Familiar)** — inv. 1 §2: tareas valen monedas/estrellas; los padres configuran un «Marketplace» (ej. 50 estrellas = 30 min de iPad, 100 estrellas = $5 de propina). Benchmark: Skylight, Habitica (adaptado), Greenlight. Prioridad **Should-Have** (lo que justifica la suscripción).
- **Economía de Avatares y Tienda Virtual (cosméticos)** — inv. 2 §2: monedas que solo compran cosas dentro de la app (ropa, mascotas, fondos). Es la variante *virtual*; el pedido del usuario es la variante **premios físicos reales**.
- **Multiplicadores de dificultad ponderada** — inv. 2 §2: equilibrar la economía para que «tender la cama» no pague igual que «aprobar álgebra» (ya existe algo parecido: `LANE_67_DIFICULTAD_RECOMPENSA.md`).
- ROADMAP.md ya tenía «Tienda Familiar: gastar puntos acumulados en recompensas reales o virtuales» (Q4 2024, sin hacer).

## 3. Lo que ya existe en el repo (a reutilizar, verificar antes de diseñar)

- Monedas/saldos en `Usuario`: `availablePoints`, `lockedPoints`, `stars`, `surprises`, `incienso`. Hay que decidir **cuál(es)** se canjean.
- `Premio` / `PremioEntregado` (premios por tareas) y `Recompensa` (con `esVale`, estados `disponible → reclamada → entregada`, `entregadaPorId`): el flujo de «el padre entrega el premio» ya existe. Ver `LANE_85_COFRE_Y_MIS_PREMIOS.md`, `LANE_86_VALES.md`, `LANE_87_RECONOCIMIENTO.md`, `LANE_91_PREMIOS_UNO_A_UNO.md`, `ECONOMIA_CARTAS.md` (tienda de sobres con incienso).

## 4. Propuesta inicial (a validar con el usuario)

- Catálogo de artículos administrado por los padres: título, foto, costo en moneda X, stock, activo.
- El niño «canjea» → se descuenta el saldo → nace una `Recompensa` pendiente de entrega física → el padre la marca entregada (reutiliza el flujo existente).
- Límite/aprobación opcional del padre antes de descontar.

## 5. Preguntas abiertas

1. ¿Qué moneda se gasta: puntos, estrellas, incienso u otra nueva?
2. ¿El canje es inmediato o requiere aprobación del padre?
3. ¿Stock/límites por semana o por niño? ¿Artículos «ahorrables» (precio alto, se junta de a poco)?
4. ¿Se incluyen también artículos virtuales (cosméticos) o solo físicos?
5. ¿Lista de deseos del niño que sugiere artículos a los padres?
