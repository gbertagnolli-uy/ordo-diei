# Referencia de UI: tiendas de juegos freemium (texto original del usuario, 2026-10-13)

> Pegado textualmente. Adaptación a Ordo Diei en `../SPEC.md` §9 y en `../../../LANE_103_TIENDA.md`.

# Cómo organizan el UI las tiendas de juegos freemium

## 1. Dónde vive la tienda (arquitectura de información)

Antes del layout interno, los juegos resuelven la **integración** de tres formas:

- **Botón fijo en el HUD → modal fullscreen** (Clash of Clans): la tienda abre como overlay desde cualquier parte del juego. El botón tiene un **dot rojo** cuando rotó el inventario → crea el hábito de "entrar a mirar" a diario.
- **Pestaña de primer nivel en el menú** (CoD, BF6): la Tienda es un destino del menú principal, casi siempre **hermanada con el Pase de batalla** como pantalla paralela (son "dos tiendas": rotativa vs. progresión), con cross-links entre ambas.
- **Espacio físico del mundo** (Sky): vitrinas que se recorren; la exploración es el contenido.

Regla universal: la tienda está siempre a **≤1 tap del home** y se anuncia con novedades.

## 2. El esqueleto vertical (de arriba a abajo)

Casi todas las tiendas móviles comparten este orden de scroll:

```
┌────────────────────────────┐
│ ✕      🪙 320 [+]   🎫 2   │ 1. Sticky: saldos + recarga
├────────────────────────────┤
│  ┌──────────────────────┐  │
│  │    HERO / BANNER     │  │ 2. Carrusel 2-4 slides
│  └──────────────────────┘  │    (pase, evento, bundle)
├────────────────────────────┤
│ ⏱ TERMINA EN   23:59:12   │ 3. Zona de urgencia:
│ ┌────┐ ┌────┐ ┌────┐      │    deal del día / expira pronto
│ │ 🔥 │ │ ✨ │ │ 🐣 │  →   │
├────────────────────────────┤
│ (Destacados)(Bundles)(…)   │ 4. Chips/tabs de categoría
│ ┌─────┐ ┌─────┐ ┌─────┐   │    (se vuelven sticky al
│ │ 🐶  │ │ 🎩  │ │ 🛡  │ → │ 5. Filas horizontales     │    scrollear)
│ └─────┘ └─────┘ └─────┘   │    o grid 2 columnas
│ [  Pase de temporada  ▶ ] │ 6. Cola: pase, gratis diario
└────────────────────────────┘
```

La **lógica del orden** es: *promociones → urgencia → novedades → catálogo permanente → monedas*. Lo que querés que compren va arriba del fold; el catálogo largo va abajo porque **se busca, no se descubre**.

## 3. Anatomía de la tarjeta de ítem

```
┌──────────────┐
│              │
│   [ ARTE ]   │ ← 65-75% de la tarjeta
│              │
│ ⌛ 23:12     │ ← timer como overlay
│        NUEVO │ ← badge en esquina
├──────────────┤
│ Nombre ítem  │ ← 1-2 palabras
│       80 🪙  │ ← precio SIEMPRE visible
└──────────────┘
```

Convenciones que casi nadie rompe:

- **El arte vende, el texto confirma**: el render/illustration es el 70% del peso visual.
- **Precio nunca oculto** ni detrás de un tap (confianza y menos fricción).
- **La tarjeta entera es el CTA** — no hay botón por ítem; el botón explícito vive en la pantalla de detalle.
- Descuentos: precio tachado + precio nuevo + badge (anclaje de valor).
- Estados visuales: equipado (borde + tilde), comprado (grayscale + ✓), bloqueado (candado), agotado (grayscale + "vuelve el lunes").

## 4. Filas horizontales vs. grid — cuándo usar cada una

| Patrón | Uso | Detalle fino |
|---|---|---|
| **Fila scroll-x** | Descubrimiento (destacados, novedades) | Mostrar **2.5–3.3 cards** (la tercera cortada a medias es el affordance de "hay más") |
| **Grid 2 col scroll-y** | Catálogo de búsqueda (todo el permanente) | Densidad + comparación de precios lado a lado |

La mezcla estándar: descubrimiento arriba en filas, catálogo abajo en grid. Cada fila lleva **título + razón** ("Termina pronto", "Novedades de la temporada") — nunca solo el nombre de la categoría.

## 5. La pantalla de monedas (el verdadero checkout)

- Lista vertical de **4–6 packs**, toda la fila es CTA.
- Cada pack: ícono de monedas (**el tamaño del ícono crece con el pack** — truco visual clásico), cantidad, bonus "+20%", precio en dinero real.
- Un pack con marco de **"Mejor valor"** (suele ser el segundo más grande, no el más caro).
- **Bonus de primera compra** con ribbon, visible una sola vez.
- Tras comprar: animación del saldo incrementándose en el header.

## 6. Detalle y flujo de compra

- **Detalle**: bottom sheet (móvil) o página completa (consola). Arte/video arriba → contenido del bundle como fila de iconos → **preview en vivo** (equipar/probar, como el operador 3D de CoD) → precio + CTA **sticky abajo en thumb zone**.
- **Checkout en 1 paso**: confirmación con nombre, precio y saldo resultante ("Te quedarán 240 🪙").
- **"No te alcanza" integrado**: CoD abre la recarga *dentro del mismo flujo*, sin sacarte del checkout. Nunca un dead-end.
- **Post-compra obligatoria**: overlay de celebración (confetti + sonido + ítem equipándose). Refuerza la decisión y enseña dónde quedó lo comprado.

## 7. Gramática visual (reglas que se repiten en todos)

- Saldo **siempre visible** (sticky) con "+" pegado.
- Precio con **ícono de moneda** en todos lados; nunca números pelados.
- **Un color = una acción**: comprar es un solo color en toda la app; urgencia tiene otro, reservado solo para lo que expira de verdad.
- Timer solo en ítems que realmente expiran (si todo es urgente, nada lo es).
- **Densidad decreciente**: arriba pocas cards grandes, abajo grid denso.
- Sin paginación: scroll continuo o "ver todo" por sección.

## 8. Adaptación para tu app de niños

Simplificando el esqueleto:

1. Sticky con saldo, **pero el "+" abre "ganar monedas" o "pedir a un adulto"** — nunca la recarga directa (parent gate).
2. **Sin carrusel hero**; una sola card de "Oferta del día" con horario fijo anunciado.
3. Máximo **4 chips de categoría**, grandes, con ícono + texto.
4. Grid 2 columnas de cards grandes; arriba del grid, una fila de **metas de ahorro** (frascos con progreso).
5. Detalle en bottom sheet con preview del avatar + CTA fijo.
6. Checkout de 2 pasos con el precio dicho en voz alta (o iconizada) para lectores tempranos.
7. Post-compra: celebración + tutorial de equipar (esto sí cópienlo tal cual de los juegos — es de lo mejor que tienen).

Si querés, hago el wireframe detallado pantalla por pantalla (tienda → detalle → checkout → celebración) con medidas y estados, listo para pasarlo a Figma.
