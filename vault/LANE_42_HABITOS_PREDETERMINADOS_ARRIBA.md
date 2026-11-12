# Lane 42: Hábitos predeterminados y carrusel arriba de todo

> Pedido (2026-10-10): "en dashboard/habitos los habitos predeterminados y su morph carrusel se deben mover al inicio arriba de todo"

## Cambios realizados
- En `src/components/habitos/HabitosClient.tsx`:
  - Se movió la sección de **Hábitos predeterminados** (que contiene `HabitosCarrusel` con `MorphSlider`) desde la anteúltima posición (abajo de todo, antes de comunitarios) hacia el inicio de la vista (`div.space-y-8`), arriba de todo.
  - Al ingresar a `/dashboard/habitos` (pestaña principal "Mis hábitos"), el usuario ve inmediatamente el carrusel interactivo de hábitos predeterminados para explorar y configurar hábitos con un solo toque.
  - Se actualizaron los comentarios numéricos de las secciones subsecuentes (Resumen de hoy / Anillo streaks, Alertas de recaída, Hábitos por franja, Escalera, Trayectoria y Calendario, y Hábitos comunitarios).

## Verificación
- `npm test`: 50 pasando (3 saltados que requieren base de datos real).
- `npm run build`: Compilación con Turbopack y verificación de tipos en Next.js 16.2.1 exitosas.
