# Lane 86 — Vales (premio sorpresa y familiar)

**Pedido (textual):**
> Quiero agregar un nuevo tipo de premio sorpresa y familiar (ambos). Será el "Vale". El vale es una especie de voucher, canjeable. Por ejemplo un "Vale por un viaje a Beto Carrero World", o también "Vale por un libro de hasta R$ 30 en Mercado Libre" o también "Vale por R$ 10 en el super". Esos vales, luego de haberse reclamado con la animación del regalo en 3D, deben aparecerle al usuario con un componente diferente cuando ya están reclamados, este: [TearTicket → `src/components/ui/tear-ticket.tsx`]
> La idea es que el vale tenga forma de vale, como un ticket que se puede "arrancar". Al arrancarse, quiere decir que ya se usó. Los padres pueden revertir eso en el panel de administración de premios sorpresa o familiares, por si alguien arranca sin querer. Adapta los colores a la app y al modo light y dark.
> A su vez todo lo que sean premios y vales ya reclamados, deben aparecer separados de los sin reclamar y debajo de la sección de los premios por reclamar. A su vez, cuando se reclame, la card o el vale debe pasar hacia la parte de abajo, y mostrar la fecha chiquito en una esquina, de cuando se reclamó.

## Decisiones
- **Vale = `Recompensa` de tipo `vale`** (`titulo` = lo que sigue a «Vale por»). Sin abrir se ve como «Vale sorpresa» (no revela el contenido), se abre con el regalo 3D (`abrirPremioSorpresa`) y queda `entregado`: no hay nada que entregar, el padre lo honra cuando se usa.
- **Usado = `Recompensa.usadoEn`** (columna nueva). El dueño lo arranca (`POST /api/recompensas/[id] {accion:"usar"}`, atómico); un padre lo revierte (`{accion:"restaurar"}`).
- **Sorpresa:** nuevo ítem `vale` en la bitácora de comportamiento. Cada vale llega como su propio regalo (`crearVale`); los demás ítems siguen juntos en un solo premio sorpresa.
- **Familiar:** `Premio.esVale` (columna nueva, casilla «Es un vale» en Premios familiares). Al ganarlo, `crearEntregaPremio` deja la entrega en `Entregado` y crea el vale sin abrir en «Mis premios» (no pasa por el popup viejo de estrellas).
- **Admin:** `ValesAdmin` (lista de vales con «Restaurar») en Comportamiento y en Premios familiares; lee `GET /api/vales`.
- **Mis premios:** primero lo que falta reclamar; debajo, «Reclamados» (premios y vales, el más reciente primero). Los reclamados llevan la fecha chica en la esquina; los vales abiertos usan `ValeTicket` (colores con tokens `--card`/`--primary`, claro y oscuro).
- **Esquema (aplicado con SQL aditivo, sin `db push`):** `ALTER TABLE "Premios" ADD "Es_Vale" BOOLEAN NOT NULL DEFAULT false; ALTER TABLE "Recompensas" ADD "Usado_En" TIMESTAMP(3);`
- Pendiente/limitación: si se elimina un registro de comportamiento, sus vales sin abrir no se borran solos (ya son premios independientes).
