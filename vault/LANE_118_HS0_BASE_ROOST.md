# Lane 118 — HS0: base de Roost

Pedido: "Empieza con lo especificado por el otro agente: vault/nuevas-features/homeschooling/PLAN_INTEGRACION_ROOST.md" → spec `LANE_HS0_BASE_ROOST.md`.

Hecho (todo portado de `vendor/roost`, que no se editó; sin cambios en `prisma/`, `package.json` ni `MissionCalendar.tsx`):
- `src/lib/homeschooling/video.ts` (+ test): `parsearEnlaceVideo`, `urlEmbed` (youtube-nocookie), `miniaturaVideo`; regex ampliada (/embed/, /shorts/, `watch?…&v=`, m., player.vimeo.com).
- `src/lib/homeschooling/roost/tipos.ts`: DTO snake_case de Roost con ids numéricos y estados `pendiente/aprobada/ajustar`.
- `src/lib/homeschooling/roost/router.tsx`: shim `useSearchParams/useNavigate/useParams/Link(to)` sobre `next/navigation`.
- `src/components/homeschooling/roost/`: `auth.tsx` (AuthProvider/useAuth), `CalendarView.tsx` (date-fns `es`, lunes, `withDragAndDrop`, clase `mission-calendar`, todo por props), `StarRating.tsx`, `StatsCard.tsx`.
- `guarda.test.ts`: prohíbe react-router, supabase, paleta de Roost y `dark:`; exige cabecera de origen en cada `.tsx`.
- `THIRD_PARTY_NOTICES.md`.

Nota: los imports relativos en tests llevan `.ts` (convención del repo con `node --test`).
Pendiente de HS0: probar `CalendarView` en una página local en claro/oscuro (solo verificado con `tsc` y `eslint`).
