# Lane 247 — Compañero flotante en toda la app + botones de la tarea

Rama `task/lane-247-companero-flotante` (worktree `ordo-diei-lanes/lane-247`), base `dev`.

## Decisiones del usuario (pedido literal resumido)
1. En `/dashboard`, al hacer click en una tarea, tienen que verse los botones **Finalizar** y **No realizada** (o **Marcar realizada** + **No realizada** si no se inició).
2. El compañero aparece **flotando** sobre la pantalla, **sin la tarjeta (div) que había en el inicio**.
3. Se puede **arrastrar y soltar** en cualquier lugar.
4. Si se lo arrastra **hacia abajo del todo**, se **oculta**; entonces aparece en el Dock un **botón redondo con la foto del compañero** que lo vuelve a mostrar.
5. La imagen flotante es **la pose que corresponde** al compañero: la misma que muestra `/dashboard/companero`.
6. **Tocarlo** cambia la imagen (pasa a otra pose de las que ya aprendió). **Mantenerlo apretado 1 segundo** abre `/dashboard/companero`.
7. Las **frases** del compañero salen en un **globo de diálogo hecho con SVG**, arriba a la izquierda del personaje.
8. Aparece en **todas las pantallas de la app**, excepto el login y el salvapantallas (ambos viven en `/`, fuera del layout de `/dashboard`).

## Implementación
- `src/components/engagement/CompaneroFlotante.tsx` (cliente): arrastre con pointer events, umbral para distinguir toque de arrastre, long-press de 1 s, ocultar al soltarlo abajo, posición y estado «oculto» guardados en `localStorage` por usuario.
- `src/components/engagement/GloboDialogo.tsx`: globo con `<svg>` (cuerpo redondeado + cola) medido con `ResizeObserver`.
- `src/store/companeroFlotanteStore.ts`: estado compartido entre el flotante y el Dock (oculto / posición).
- `MainDock` + `FloatingDock`: ítem redondo con la foto del compañero cuando está oculto.
- `src/app/dashboard/layout.tsx`: arma los datos con `companeroDe` y monta el flotante para todo `/dashboard/*`.
- `src/app/dashboard/page.tsx`: se saca `CompaneroCard`; sólo queda la tarjeta de «Elegí quién te acompaña» si todavía no eligió personaje.

## Nota (lane 248)
Los gestos de esta lane se reemplazaron: tocar abre un menú (cambiar de imagen / abrir panel), dejar presionado arrastra, y la pose «buenos días» ya no se ve flotando. Ver `LANE_248_COMPANERO_MENU_ESCENAS.md`.

## Estado
Implementada y con tsc y tests en verde. Pendiente: verificación visual de Gabriel en el navegador (arrastre, ocultar al Dock, toque, presión de 1 s, globo SVG, botones de la tarea) y recién después integrar con `scripts/integrar.sh`.
