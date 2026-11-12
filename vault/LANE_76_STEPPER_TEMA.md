# Lane 76 — Colores del Stepper según tema

Pedido (textual): "Ahora adapta los colores para que coincida con el dark y light theme"

- `TaskForm.tsx`: `STEPPER_VARS` pisa las variables `--stepper-*` con los tokens de la app (`--foreground`, `--muted`, `--card`, `--border`, `--primary`, `--primary-foreground`) y `color-mix` para los tonos translúcidos. Como los tokens cambian con la clase `.dark`, el Stepper sigue el tema solo.
- Se eliminó el hook `useSyncExternalStore` que leía la clase `dark` y la prop `theme`; `Stepper.tsx` no se tocó.
