# Lane 114 — Clon literal de Roost

Pedido del usuario: "Quiero que clones el repo literal, verbatim. Luego de clonado dentro del proyecto, tenés que adaptarlo e integrarlo. No quiero que programes un nuevo roost, quiero que uses el existente." Sin importar licencia ni tamaño.

- Repo: https://github.com/msrbuilds/roost (commit 492af47) copiado sin modificar a `vendor/roost/` (308 archivos, ver `ORIGEN.md`).
- `tsconfig.json` y `eslint.config.mjs` excluyen `vendor/`. Los tests solo corren `src/**`.
- Roost: Vite + React Router + Tailwind 3 + Express + Supabase/Prisma. Ordo Diei: Next 16 + Tailwind 4 + Prisma. Las piezas útiles (groups/learn, calendar, services de cursos) se portan a `src/` desde `vendor/roost`, sin reescribirlas.
- Pendiente: lane de adaptación (H1+) que porte el código de `vendor/roost/src/components/groups/learn` y servicios. Reemplaza la regla "solo referencia visual" de MAPEO_COMPONENTES_ROOST.md.
