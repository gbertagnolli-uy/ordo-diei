# Lane 87 — Reconocimiento (premio a la virtud) e imágenes por tipo de tarjeta

**Pedido (textual):** "Tambien quiero agregar un tipo de premio que es el «Reconocimiento». Es un premio a la virtud o a buenas acciones. La imagen para usar en la card es esta «medal-icon-poster-1» en public/imagenes. Ademas de eso la imagen para usar en el cofre en la card debe ser: «cofre» en public/imagenes"

## Decisiones
- **Reconocimiento = nuevo tipo de ítem de premio** (`reconocimiento`, texto = la virtud o la buena acción), junto a puntos, vale, etc. Igual que el vale, cada uno llega como su **propia tarjeta**, **ya entregada** (no es sorpresa ni hay que reclamarlo): `Recompensa` tipo `reconocimiento`, título = la virtud, origen = «Por: {comportamiento}». Se puede combinar con otros premios en el mismo registro. Cuenta como comportamiento positivo para el cofre del día.
- **Imágenes** (`public/Imagenes/` está en `.gitignore`, por eso se optimizaron a `public/premios/`): `cofre.webp` (cofre, fondo blanco) para los cofres, `medalla.webp` (medalla, PNG con transparencia) para los reconocimientos. El resto sigue con `regalo.webp`. Mapa `IMAGEN` en `MisPremios.tsx`.
- Insignia «Reconocimiento» con medalla; el pie dice «Recibido el … de {padre}». Como las demás tarjetas ya recibidas, lanza regalitos al click (Cool Mode).
- Pendiente de decisión: hoy el niño no recibe aviso (banner) por un reconocimiento, solo lo ve en Mis premios.

## Lane 88 — Medalla 10 % más chica
**Pedido (textual):** "la imagen usada en el card de reconocimiento deberia ser un 10% menor."
Hecho: `scale-90` sobre la imagen solo en las tarjetas de reconocimiento (`MisPremios.tsx`); el panel de la tarjeta no cambia de tamaño.
