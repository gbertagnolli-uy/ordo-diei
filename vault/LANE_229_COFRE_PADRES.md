# Lane 229 — Cofre de los padres

Pedido: «Quiero cambiar la exigencia del cofre para administradores, con registrar el comportamiento de los niños es suficiente. Debe ser bien claro, registra el comportamiento de tus hijos para desbloquear tu cofre y el de ellos.»

- El cofre de «Tu parte de hoy» se gana al registrar el comportamiento de todos los hijos (`cofreGanado` en `src/lib/engagement/misiones.ts`). Las otras misiones suman puntos pero ya no lo condicionan. Sin hijos, hacen falta todas.
- `ParteDeHoy` devuelve `cofre` (ganado) y `completa` (todas las misiones).
- Textos claros en «Tu parte de hoy», en la misión y en «Mis premios».
