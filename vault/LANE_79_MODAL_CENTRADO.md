# Lane 79 — Modal de nota "No lo hice" centrado

**Pedido (textual):** "El modal debe aparecer al medio de la pantalla, ahora está apareciendo pegado al borde izquierdo. Debe aparecer centrado."

**Causa:** era un `Popover` anclado a un `<span sr-only>` sin posición. **Fix:** se reemplazó por el `Dialog` prebuilt (`ui/dialog`) en `HabitoCard.tsx`, centrado en pantalla.
