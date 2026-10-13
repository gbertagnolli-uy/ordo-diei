# Lane 95 — Aviso LCP de medalla.webp

**Pedido (textual):** "comprime la imagen: [browser] Image with src "/premios/medalla.webp" was detected as the Largest Contentful Paint (LCP). Please add the `loading="eager"` property if this image is above the fold." Aclaración: la imagen del cofre pegada fue sin querer; solo hay que reparar el aviso de LCP.

**Hecho:** `loading="eager"` en la `<Image>` de la ilustración de las tarjetas de `MisPremios.tsx` (afecta cofre, medalla y regalo). `medalla.webp` ya pesa 15 KB, no se recomprimió.
