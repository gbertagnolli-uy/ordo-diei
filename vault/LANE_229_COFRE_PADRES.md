# Lane 229 — Cofre de los padres

Pedido: «Quiero cambiar la exigencia del cofre para administradores, con registrar el comportamiento de los niños es suficiente. Debe ser bien claro, registra el comportamiento de tus hijos para desbloquear tu cofre y el de ellos.»

- El cofre de «Tu parte de hoy» se gana al registrar el comportamiento de todos los hijos (`cofreGanado` en `src/lib/engagement/misiones.ts`). Las otras misiones suman puntos pero ya no lo condicionan. Sin hijos, hacen falta todas.
- `ParteDeHoy` devuelve `cofre` (ganado) y `completa` (todas las misiones).
- Textos claros en «Tu parte de hoy», en la misión y en «Mis premios».

## Lane 231 — sin importar qué administrador registró
Pedido: «si el comportamiento ya se registró, sin importar qué administrador lo hizo, ya se deben desbloquear los cofres de todos los administradores, el único requisito es que estén registrados los comportamientos de los niños».

- `desbloquearCofresDePadres` (`src/lib/engagement/servidor.ts`): al registrar comportamiento o conducta de hoy, si todos los hijos ya tienen registro, deja el cofre en «Mis premios» de todos los padres, sin esperar a que entren.
- Idempotente: `darCofreDeLaParte` no duplica si el padre entra después.
