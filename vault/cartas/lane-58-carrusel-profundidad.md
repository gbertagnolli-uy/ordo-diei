# Lane 58 — Detalle de carta: Depth Carousel con los 4 grados

## Pedido (textual)

> Actualmente las cartas no están mostrando sus versiones, sino que solo se muestra la versión actual desbloqueada mas alta. Por ende el usuario no puede ver las demás cartas ni tampoco -en caso que ya haya subido de nivel la carta- puede ver la carta mas basica  y la misma carta de nivel superior.
>
> Quiero que agregues una funcionalidad de  Depth Carrousel, imitando este componente: `DepthCarousel` (props: `items` [{image, alt}], `depth=220`, `spread=90`, `tilt=22`, `tiltDirection="right"`, `perspective=1400`, `visibleCards=4`, `falloff=0.2`, `blur=6`, `autoplay`, `loop`; contenedor `height:500px; position:relative`).
>
> Ahora bien, como ya tenemos varias funcionalidades en la vista actual de cartas, no pretendo que la modifiques en su esencia, sino que usando lo que ya está hecho -y muy importante no rompiendo nada- "dupliques la vista actual de una carta pero añadiendo las cartas de los otros 3 niveles además del nivel mas basico.
>
> La idea principal es que al entrar a la pagina de una carta, tambien se puedan ver como es la carta en los otros niveles.
>
> Ya hay un agente trabajando justamente en la vista de cartas. Por eso debes verificar que no te pises el trabajo.

## Estado: PLAN (sin código todavía)

## Hallazgos

- Ruta: `src/app/dashboard/cartas/[clave]/page.tsx` → `obtenerDetalleCarta` (`src/lib/cartas/server.ts`) → `DetalleCartaView`.
- `contenidoVisible` (`revelado.ts`) devuelve **solo `imagenUrl` del grado actual** (regla D19: "nunca URLs de grados superiores"). Por eso hoy no se ven los otros grados.
- `imagenDeGrado(carta, grado)` (`fragmentos.ts`) ya resuelve la imagen por grado con cascada; `CartaVista` ya recibe `grado` y `modo` (`holo | plana | bloqueada`, `blancoYNegro`).
- La carta en BD tiene `imagenUrl`, `imagenGrado2Url`, `imagenGrado3Url`, `imagenGrado4Url`.
- `components.json` ya tiene el registro `@react-bits` → `npx shadcn add @react-bits/DepthCarousel-TS-TW` (verificar nombre exacto en reactbits.dev).

## Conflicto con otro agente (lane 57, `task/lane-57-album-domo`)

Tiene SIN commitear cambios en `HoloCard.tsx`, `HoloCard.css`, `CartaVista.tsx`, `ColeccionView.tsx`, `package.json`, más `AlbumDomoView.tsx`, `DomeGallery.*`, `ReversoCarta.tsx`, `src/app/dashboard/cartas/album/`.
→ **Esta lane NO toca `HoloCard.*`, `CartaVista.tsx` ni `ColeccionView.tsx`.** Solo los consume. Si hace falta una prop nueva en `CartaVista`, esperar a que 57 mergee y hacer `git merge dev`.
→ Ambas tocan `package.json`/lockfile (57 agrega `@use-gesture/react`): resolver en el merge.

## Diseño

1. **Datos** (`server.ts`, `obtenerDetalleCarta`): agregar al DTO `grados: [{ grado: 1..4, imagenUrl, estado: 'actual' | 'superado' | 'bloqueado' }]`. Función pura nueva (p. ej. `versionesDeCarta` en `src/lib/cartas/versiones.ts`, con test) en vez de modificar `contenidoVisible`. `imagenUrl` actual no cambia → el detalle actual queda intacto.
2. **Componente** `src/components/cartas/DetalleCartaVersionesView.tsx` (nuevo): copia de `DetalleCartaView` que reemplaza la columna de la carta única por el carrusel de profundidad; el resto (progreso, oración, frase, datos, historia, reclamo) idéntico. Mejor aún: extraer lo común sin cambiar comportamiento solo si 57 no toca `DetalleCartaView` (no lo toca hoy).
3. **Carrusel** `src/components/ui/depth-carousel.tsx` (de React Bits, adaptado: `items` renderiza `CartaVista`, no `<img>`; el índice activo = grado actual al abrir). Items = 4 grados, cada uno con `CartaVista` (`modo` holo para grados ya reclamados, `bloqueada`/B&N para los no alcanzados). Mobile: `visibleCards` menor; respetar `prefers-reduced-motion` (sin autoplay). Autoplay desactivado (el usuario explora), loop activo.
4. **Selección de vista**: ruta `/dashboard/cartas/[clave]` sigue igual hasta decidir; propuesta: reemplazar la columna izquierda solo cuando haya ≥2 imágenes distintas entre grados; si la carta tiene una sola imagen, mostrar la vista actual sin carrusel.
5. **Verificación**: `npm run lint`, `tsc`, tests unitarios de `versiones.ts`, captura con Chromium headless en 1400×900 y 400×850 (como lane 55), comprobar que la vista actual de otras cartas no cambió.

## Decisión pendiente (usuario)

D19 prohíbe exponer imágenes de grados superiores al reclamado. Mostrarlos en el carrusel implica enviarlas al cliente. Opciones:
- A) Mostrar los grados superiores bloqueados (B/N + candado) — se envía la URL igual (se puede ver en red).
- B) Mostrarlos reales (spoiler total).
- C) Mostrar placeholder sin URL (silueta) para los no alcanzados; reales solo hasta el grado reclamado. (Respeta D19; no cumple "ver cómo es en otros niveles".)

## Registro

- Rama: `task/lane-58-carrusel-profundidad`; worktree: `../ordo-diei-lanes/lane-58` (desde `dev` 646c54b).
- Integra el orquestador con `git merge --no-ff` a `dev`; luego `git worktree remove` + `git branch -d`.
