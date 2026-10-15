# Lane 92 — Cofre del día con cuenta regresiva

**Pedido (textual):**
> Ahora quieero añadir que siempre esté el cofre arriba en la sección de reclamar, pero con un contador de lo que falta hasta las 18:00hrs UTC -03:00.
> Mientras no llegue a esa hora, debe estar como "deshabilitado" para que no puedan reclamarlo antes. Cuando llegue la hora deben poder reclamarlo.
> Quiero una barra de progreso que se vaya vaciando hasta llegar a las 18, la barra debe empezar llena a las 24 horas faltantes e ir vaciandose paulatinamente segun el tiempo transcurrido.
> Quiero que el cofre sorpresa diario sea una sección nueva que esté entre los premios a reclamar y los reclamados.

## Hecho
- Sección **«Cofre del día»** (`CofreDelDia.tsx`) en Mis premios, entre «por reclamar» y «Reclamados»; los cofres salieron de la lista de por reclamar. Siempre visible.
- Lógica pura en `lib/comportamiento/cofreHorario.ts` (con tests): 18:00 UTC-03:00 = 21:00 UTC. Fases: `cuenta` (antes de las 18:00: botón deshabilitado, cuenta regresiva `hh:mm:ss` y barra = tiempo que falta / 24 h, llena a las 18:00 del día anterior y vacía a las 18:00); `listo` (desde las 18:00 con un cofre sin abrir: habilitado); `espera` (pasadas las 18:00 sin cofre: «ya abriste el de hoy» o «todavía no llegó», y cuenta para mañana con la barra llena de nuevo).
- **El servidor también lo exige:** `abrirPremioSorpresa` rechaza un cofre antes de las 18:00 («El cofre se abre desde las 18:00»), aunque alguien llame a la API a mano.
- El banner de «premio sorpresa» no cuenta el cofre antes de las 18:00 (no se puede abrir todavía).
- Si hay varios cofres sin abrir se muestra el primero y un aviso «Tenés N cofres más esperando».
