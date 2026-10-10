# Lane 36 — Panel para agregar cartas

- **Rama:** `task/lane-36-cartas-admin` · **Worktree:** `../ordo-diei-lanes/lane-36`
- **Parte de:** lane 35 (`task/lane-35-cartas-tienda`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 y §1.1 pedido textual, §2.4 informe, §3 decisiones (D1–D18), §4 datos, §6 reglas. El informe completo está en `vault/cartas/ref/INFORME_SISTEMAS_CARTAS.md`.

## Al empezar
1. `git status` limpio y estás en `task/lane-36-cartas-admin`.
2. `git merge task/lane-35-cartas-tienda`.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense (rótulos en `src/lib/cartas/textos.ts`); nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
Crear y editar cartas que no existen. Solo Padre/Madre.

## Entregables
1. `/dashboard/cartas/admin` (o pestaña "Administrar" solo para Padre/Madre) con el mismo control de acceso que `src/app/dashboard/admin/page.tsx`; la API responde 403 a otros roles.
2. Lista con buscador y estado (activa/archivada, Sistema/Manual) en shadcn `table`; editar y archivar. Editar una carta del sistema marca `editadaManual=true`.
3. Formulario (shadcn `field`, `input`, `textarea`, `native-select`, selector de día y mes) validado con el **zod de la lane 30** en cliente y servidor: nombre, subtítulo, categoría, rareza, celebración (día y mes, opcional), historia, oración, frase y autor, **datasheet como lista ordenable** (agregar, quitar y reordenar datos `etiqueta/valor`; el orden es el de revelación; 4 a 8 datos; ayuda que explique "se revela de arriba hacia abajo"), **cuatro espacios de imagen, uno por grado** (D19): "Grado I · Desbloqueada" (obligatoria), "Grado II · Venerada", "Grado III · Iluminada" y "Grado IV · Gloriosa" (opcionales; si falta una se usa la anterior y el formulario lo avisa). Cada espacio con subida (reutilizar `/api/upload` o su patrón), vista previa, reemplazar y quitar; valida tipo (`.webp`/`.png`/`.jpg`), peso (≤ 300 KB, aviso si es más) y proporción retrato 63:88 (aviso si no coincide). El formulario también admite un crédito de imagen opcional. Fragmentos requeridos (por defecto el de la rareza). Mostrar los hitos calculados: 25 %, 50 %, 100 % y grados II/III/IV en fragmentos. La `clave` se genera sola (slug) y es única.
4. **Vista previa en vivo** con `CartaVista` modo `holo` y la pantalla de detalle resumida, más un **deslizador de 0 a 300 % de fragmentos** que muestra cómo se ve la carta en cada tramo de revelación y grado, **cambiando de imagen al cruzar 100 / 150 / 200 / 300 %** (usa `contenidoVisible`).
5. `POST/PUT/DELETE /api/cartas/admin` (archivar, no borrar físico si hay progreso de usuarios). Al crear, la carta aparece **de inmediato** en el álbum de todos (en blanco y negro).
6. Probar con clics reales: crear una carta con las 4 imágenes, otra con solo la del grado I (debe repetirla en los grados siguientes), y luego: ver en el álbum, editar, reordenar el datasheet, archivar, y que un hijo recibe 403.

## Fuera de esta lane
Fiesta y cumpleaños.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente); si al mergear la rama anterior hay conflicto en esa tabla, conservar ambas filas.
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
