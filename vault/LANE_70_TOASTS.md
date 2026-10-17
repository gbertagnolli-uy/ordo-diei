# Lane 70 — Notificaciones con SwipeToast

Pedido (textual): "Todas las notificaciones de la app ya no deben ser en mensaje de consola de navegador, sino con notificaciones con este componente: npx shadcn@latest add @react-bits/SwipeToast-TS-TW"

- Componente instalado: `src/components/SwipeToast.tsx` (@react-bits/SwipeToast-TS-TW; agregó `@hugeicons/*`).
- `src/lib/toast.ts`: store global, API `toast.success/error/info(titulo, descripcion?)`, usable desde cualquier cliente.
- `src/components/Toaster.tsx`: montado en `app/layout.tsx`, apila los SwipeToast.
- Todos los `alert()` reemplazados por `toast.*`; el banner propio de `AdminCartasView` también.
- `confirm()` se dejan (son confirmaciones bloqueantes, no notificaciones).
