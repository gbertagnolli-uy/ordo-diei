# Lane 229 — Cofre de los padres

Pedido: «Quiero cambiar la exigencia del cofre para administradores, con registrar el comportamiento de los niños es suficiente. Debe ser bien claro, registra el comportamiento de tus hijos para desbloquear tu cofre y el de ellos.»

- El cofre de «Tu parte de hoy» se gana al registrar el comportamiento de todos los hijos (`cofreGanado` en `src/lib/engagement/misiones.ts`). Las otras misiones suman puntos pero ya no lo condicionan. Sin hijos, hacen falta todas.
- `ParteDeHoy` devuelve `cofre` (ganado) y `completa` (todas las misiones).
- Textos claros en «Tu parte de hoy», en la misión y en «Mis premios».

## Lane 231 — sin importar qué administrador registró
Pedido: «si el comportamiento ya se registró, sin importar qué administrador lo hizo, ya se deben desbloquear los cofres de todos los administradores, el único requisito es que estén registrados los comportamientos de los niños».

- `desbloquearCofresDePadres` (`src/lib/engagement/servidor.ts`): al registrar comportamiento o conducta de hoy, si todos los hijos ya tienen registro, deja el cofre en «Mis premios» de todos los padres, sin esperar a que entren.
- Idempotente: `darCofreDeLaParte` no duplica si el padre entra después.

## Lane 234 — el cofre diario de los niños queda vinculado a `/dashboard/admin/conducta`
Pedido: «EL cofre de los niños no quedó vinculado a lo que se registra en /dashboard/admin/conducta. Ya registré el comportamiento de los niños y no se les desbloqueó el cofre diario.»

- **Causas:**
  1. `registrarConducta` (`src/lib/conducta/server.ts`) solo llamaba a `desbloquearCofresDePadres()`, pero nunca llamaba a `otorgarCofreDelDia(usuarioId)` para el hijo (a diferencia de `registrarComportamiento`).
  2. `otorgarCofreDelDia` cortaba antes de las 18:00 (`horaEnFamilia < HORA_COFRE`), por lo que si los padres registraban la conducta temprano en `/dashboard/admin/conducta`, el cofre del hijo no se creaba en `Recompensa`.
  3. En `/dashboard/mis-premios`, `getRecompensas` corría en paralelo con `DashboardLayout` (o sin reejecutar el layout al navegar con `<Link>`), leyendo `Recompensa` antes de que `otorgarCofreDelDia` terminara.
  4. `CofreDelDia` mostraba «tus papás aún no registraron tu comportamiento» incluso cuando ya habían registrado conducta `< 4` (Regular/Mal/Muy mal).
- **Solución:**
  - `registrarConducta` y `desbloquearCofresDePadres` llaman a `otorgarCofreDelDia` para dejar el cofre del niño creado en `Recompensa` apenas se registra «Bien» o «Excelente» (4–5), y si se corrige a `< 4` y todavía no se abrió, lo retira (`retirarCofreDeHoy`). La apertura sigue habilitándose a las 18:00.
  - `getRecompensas` espera a `otorgarCofreDelDia(usuarioId)` antes de leer las recompensas y devuelve `conductaHoy` para que `CofreDelDia` distinga entre cofre desbloqueado esperando las 18:00, conducta registrada menor a «Bien» y día aún sin evaluar.

