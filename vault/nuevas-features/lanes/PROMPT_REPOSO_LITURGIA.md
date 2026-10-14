# Prompt de entrega — Reposo v2 (R1–R3) y Liturgia (L1–L9)

> Para el agente (agy, Claude u otro) que implemente estas lanes. Escrito el 2026-10-14 (lane 125, D56). **Nada de esto está implementado todavía.**

Trabajás en `ordo-diei`. Tu lane es **una** de las de la tabla de estado de [`LANES.md`](LANES.md) («Ronda 9»). Tomá la primera «⏳ lista» cuyas dependencias estén «✅ integrada», salvo que el usuario te indique otra.

## 1. Antes de tocar nada
1. Leé `AGENTS.md` y cumplilo al pie de la letra: worktree propio desde `dev` (`git worktree add -b task/lane-NN-… ../ordo-diei-lanes/lane-NN dev`), `npm install`, **nunca `prisma db push`** (SQL aditivo con `migrate diff` + `db execute`, y si el SQL trae `DROP`, no se aplica), integrar **solo** con `scripts/integrar.sh`, limpiar el worktree después.
2. Número de lane: el siguiente libre según `git branch --list 'task/lane-*'` **y** `ls vault/LANE_*` (hay varios agentes; ya hubo choques).
3. Copiá el `.env` del directorio principal a tu worktree (`cp ../../ordo-diei/.env .`). Ahí están `DATABASE_URL` y las credenciales de Unsplash (`UNSPLASH_ACCESS_KEY`…). **Nunca** escribas valores de claves en código, tests, vault ni commits.
4. Leé, en este orden: [`../DECISIONES.md`](../DECISIONES.md) §10–§11 (D34–D56, S7–S11), el SPEC de tu lane y, si es L*, [`../liturgia/SPIKE_MOTOR.md`](../liturgia/SPIKE_MOTOR.md). **El SPEC manda.** Si choca con el código real, no improvises: anotalo en el vault y avisá al usuario.
5. Next.js de esta versión cambia APIs: leé la guía correspondiente en `node_modules/next/dist/docs/` antes de escribir rutas, Server Components o `fetch` con caché.
6. En el mismo commit que crea tu lane, cambiá su fila en la tabla de estado de `LANES.md` a «🔨 en curso (lane NN)».

## 2. Reglas de esta entrega
- **UI**: solo componentes prebuilt del proyecto (`src/components/ui/*`: `Card`, `Button`, `Tabs`, `ToggleGroup`, `Calendar`, `Popover`, `Select`/`native-select`, `Skeleton`, `Empty`, `Tooltip`…) y librerías ya instaladas (`motion`, `lucide-react`). Nada duplicado; lo nuevo **reemplaza**, no se agrega al lado. No cambiar comportamientos existentes (login, cartas, hábitos, `/dashboard/oracion`).
- **Legibilidad sobre fotos (D54)**: se resuelve con **más opacidad del velo**, nunca eligiendo fotos con zonas oscuras. Contraste ≥ 4,5:1 medido; si no llega, más opacidad.
- **Divinum Officium (D47, D48)**: **no se reescribe el motor en TS**. Se ejecuta el Perl original (descargado a `vendor/divinum-officium/`, en `.gitignore`, commit fijo) desde scripts; la app en Vercel **solo lee la base**. Para libros sin fecha, `setupstring()` de DO vía `scripts/liturgia/do-libro.pl`.
- **Español (D52)**: nunca mostrar inglés como español; si falta traducción, latín + «sin traducción». Torres Amat es solo para las frases del reposo.
- **Base de producción**: la lane L2 genera miles de filas en tablas nuevas. **Pedí OK explícito al usuario antes de la primera carga** y no corras el generador desde tests. Tests contra la base real, solo con `PERMITIR_TESTS_DB=1` y si el usuario lo pide.
- **Librerías maduras** antes que código propio (memoria *reuse-open-source*); anotá en el vault cada librería nueva (versión, licencia, para qué).
- Textos de la UI en el español rioplatense del proyecto (voseo, como en `lib/cartas/textos.ts`). Nombres latinos según D46.

## 3. Qué entrega cada lane (resumen; el detalle está en el SPEC)

| Lane | SPEC | Entregable mínimo para integrar |
|---|---|---|
| R1 Frases | reposo §6 | JSON de citas (≥ 365, Vulgata + Torres Amat verificado, numeración Vulgata) y catecismo completo; script generador; tests §6.3. **La selección de citas se muestra al usuario antes de integrar.** |
| R2 Unsplash | reposo §5 | Modelos `ConfigReposo`/`FotoUnsplash` (SQL aditivo), `lib/reposo/unsplash.ts` con `fetch` inyectable y tests, refresco en `/api/cron/daily`, API pública y de admin, tarjeta «Reposo» en Administración. Tema Nature `6sMVjTLSkeQ`. |
| R3 Reposo v2 | reposo §3–§4, §7–§8 | Requiere **N4** (detector de inactividad, aún no implementado: si sigue sin estar, hacelo como lane propia antes, según `sesion-inactividad-borradores/SPEC.md`). Pantalla completa, alternancia, imagen al azar sin repetir las últimas 12, título del día desde `/api/reposo/dia` (vacío si no hay datos). |
| L1 Spike DO | liturgia §2–§5, SPIKE §9 | Solo documentación + prototipos fuera de `src/`: completar `SPIKE_MOTOR.md` §9 con mediciones. |
| L2 Generador | liturgia §3–§5, §12 | Scripts `scripts/liturgia/*`, modelos, dorados del parser, Action mensual; primera carga **con OK del usuario**. |
| L3 API + base UI | liturgia §6–§9 | `lib/liturgia/*`, `/api/liturgia/*`, `SelectorVersion`, `CabeceraLiturgica`, `LiturgiaTexto`, `--rubrica`, grupo «Liturgia» en `AppSidebar`. |
| L4–L9 Pantallas | liturgia §10.1–§10.8 | Una pantalla (o par) por lane, con sus criterios de §13. L5: overlay de D54 y contraste medido en las 8 fotos. L9: regla dominical del Rosario confirmada con fuente impresa preconciliar, citada en el código. |

## 4. Cierre de cada lane
1. `npm test` y `npx tsc --noEmit` en verde; eslint de lo tocado.
2. Verificá los criterios de aceptación de tu sección del SPEC, uno por uno, y escribí cuáles quedaron **sin verificar** (las pruebas en navegador las hace el usuario).
3. Registro: `vault/nuevas-features/lanes/lane-NN-<codigo>.md` con pedido, decisiones tomadas, qué se hizo, cómo verificar y pendientes. Fila de `LANES.md` → «✅ integrada (lane NN)».
4. `scripts/integrar.sh` desde tu worktree; después `git worktree remove` y `git branch -d` (AGENTS.md §8).
