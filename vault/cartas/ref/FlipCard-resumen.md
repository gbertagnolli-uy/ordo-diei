# React Bits FlipCard (referencia)

Instalación: `npx shadcn@latest add @react-bits/FlipCard-JS-CSS`. Dependencia: `motion` (`motion/react`).

El usuario pegó el código completo (2026-10-11); aquí queda el resumen de lo que importa para HoloCard.

Props: `front`, `back`, `flipped`, `defaultFlipped`, `onFlipChange`, `axis` ('x'|'y'), `flipOnClick`, `draggable`,
`dragDistance`, `tilt`, `tiltMax`, `glare`, `glareOpacity`, `hoverScale`, `perspective`, `stiffness`, `damping`,
`width`, `height`, `radius`, `background`, `color`, `shadow`, `shadowColor`, `shadowOpacity`, `disabled`, `ariaLabel`.

Mecánica:
- `turn` (grados) es un motion value; el destino siempre es múltiplo de 180 (`snap = round(deg/180)*180`,
  `isBack = |round(deg/180)| % 2 === 1`).
- Pointer down: guarda el origen y el `turn` base. Pointer move: si el desplazamiento supera el umbral (4 px mouse,
  8 px táctil) empieza el arrastre: `turn = base ± (d / span) * 180`, con `span = dragDistance || ancho (alto si axis x)`.
  Guarda un historial de 90 ms para la velocidad.
- Pointer up: sin arrastre → click voltea (`flipOnClick`). Con arrastre → `to = clamp(snap(here + velocity * 0.16),
  snap(here) - 180, snap(here) + 180)` y resorte (`stiffness` 170, `damping` 20) hasta `to`; si cambia de lado
  dispara `onFlipChange`. Cancelado → vuelve a `snap(base)`.
- Teclado: Enter/Espacio voltea. `prefers-reduced-motion`: sin arrastre ni giro, cambia de cara con fundido.
- Cada cara es `inert` y `aria-hidden` mientras no se ve. Tilt y brillo (glare) siguen al puntero (no en táctil).
