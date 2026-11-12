# Lane 73 — Holo más suave

**Pedido (textual):** "Quiero bajar la intensidad del holo a nivel general. Para que pueda apreciarse mejor la imagen de las cartas. Pero a su vez, quiero que se aprecie el holo effect, no quiero bajar toda la intensidad."

**Cambio:**
- `INTENSIDAD_HOLO` en `CartaVista.tsx`: 0.5 → 0.34 (todas las cartas).
- Default de `intensity` en `HoloCard.tsx`: 0.85 → 0.6 (coherente por si otro consumidor no lo pasa).

Si se ve muy tenue o muy fuerte, ajustar solo `INTENSIDAD_HOLO` (rango útil 0.3–0.45).
