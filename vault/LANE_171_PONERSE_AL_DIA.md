# Lane 171 — R1: «Ponerse al día» (reprogramar en un clic)

Catálogo C4 (la «feature estrella» de Homeschool Planet). Descubrimiento: el reparto de lo atrasado **ya se recalculaba solo** cuando el alumno abre «Hoy» (`tareas.ts` → `recalcular`). Lo que faltaba era el control del padre.

- `vistaPonerseAlDia` / `ponerseAlDia` (en `servidor/planes.ts`) + `GET/POST /api/homeschooling/alumnos/[id]/al-dia`: por cada plan activo atrasado, cuántas clases se atrasaron, cómo queda el reparto (días, unidades por día, último día) y, si no entra antes del fin (`sin_dias`/`sobrecarga`), la primera fecha de fin (hasta +8 semanas) con la que sí entra.
- `PonerseAlDia`: diálogo desde el panel («Ponerse al día» junto a «N clases atrasadas»), con casilla «Extender el fin hasta…» por plan; un clic reparte todo desde hoy.
- No se tocan los días hechos; solo lo atrasado y lo futuro sin empezar.
- Pendiente: «compromisos fijos» que nunca se mueven (C4 parcial).
