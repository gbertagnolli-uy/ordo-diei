# Lane 136 · L3 — API de lectura y componentes base de la liturgia

**Rama** `task/lane-136-liturgia-l3-api` · **Fecha** 2026-10-14 · **Estado** integrada.

## Pedido
`LANES.md` L3 y `liturgia/SPEC.md` §6–§9: `src/lib/liturgia/*`, `/api/liturgia/*`, `SelectorVersion`, `CabeceraLiturgica`, `LiturgiaTexto`, token `--rubrica`, colores litúrgicos, grupo «Liturgia» en `AppSidebar` con rutas vacías (`Empty`) para las pantallas que aún no existen.

## Qué se hizo
- **Lecturas** (`src/lib/liturgia/`): `repositorio.ts` (interfaz `RepoLiturgia` + implementación Prisma importada a demanda), `lecturas.ts` (`leerDia/Mes/Hora/Misa/Martirologio/Libro/Indice/Kalendarium`; resuelve hashes → bloques y omite los que falten), `parametros.ts` (validación de `fecha`, `version`, `anio/mes`, `hora`, `clave`, `tipo`; prefijos de clave por libro), `colores.ts`, `cliente.ts` (fechas, versión recordada), `api.ts` (plantilla común de las rutas: sesión → 401, parámetros → 400, sin dato → 404 `{estado:"no-generado"}` sin caché, ok → `Cache-Control: private, max-age=86400`).
- **API** `GET /api/liturgia/{dia,mes,hora,missa,martyrologium,libro,indice,kalendarium}`. `kalendarium` no estaba en la tabla de la SPEC §6: se agregó porque L7 necesita el índice por mes (lo guarda L2 como `tipo="kalendarium"`).
- **Componentes** (`src/components/liturgia/`): `SelectorVersion` (`NativeSelect`), `CabeceraLiturgica` (título, versión, ‹ fecha › con `Calendar` en `Popover`, punto de color, título latín/castellano, rango, líneas), `LiturgiaTexto` (`ToggleGroup` Ambos/Latín/Español, chips de sección, dos columnas ≥ `lg`, `content-visibility:auto`), `ColorLiturgicoPunto`, `useParametrosLiturgia` (versión y fecha en la URL; versión recordada por pantalla en `localStorage`), `useLectura`, `PantallaPendiente`.
- **`--rubrica`** en `globals.css` (claro `#9f1d20`, oscuro `#f28b82`; contraste medido 7,5:1 y 7,6:1) y utilidad `text-rubrica`.
- **Navegación**: grupo «Liturgia» en `AppSidebar` (8 ítems, nombre latino; castellano en el tooltip; visible para todos los roles) y 8 rutas `/dashboard/liturgia/*` con `PantallaPendiente` (`Empty`).
- Tests: `lecturas.test.ts` (12) y `cliente.test.ts` (4).

## Decisiones
- La lectura depende de una interfaz (`RepoLiturgia`), no de Prisma: se prueba con un repositorio en memoria y **ningún test toca la base**.
- Claves de libro tal como las nombra el generador (lane 133): `Sancti/…`, `Tempora/…`, `Commune/…`, `Missa/<Sancti|Tempora|Commune>/…`, `Missa/Ordo/…`, `Psalterium/…`. Un tipo de libro solo acepta sus prefijos (`parametros.ts`). El Rosario no sale de DO: lo escribe L9 (`rosarium.json`), el prefijo `Rosarium/` queda reservado.
- `LiturgiaTexto` no usa todavía `ui/drag-scroll` (está en la lane 109, sin integrar): los chips de sección usan una fila con `no-scrollbar`. Cuando 109 integre conviene cambiarlo.
- Nuevas pantallas con `useParametrosLiturgia` (usa `useSearchParams`) deben ir dentro de `<Suspense>`.

## Cómo verificar
`npm test` · `npx tsc --noEmit`. En el navegador (con la base generada): `/api/liturgia/dia?fecha=2026-10-14` y `/dashboard/liturgia/*`. Sin datos, las rutas responden 404 `{"estado":"no-generado"}` y la cabecera dice «Este día todavía no se generó».

## Verificado / sin verificar
- Verificado en Chromium (página de prueba temporal, ya borrada): cambio de versión actualiza la URL y se recuerda tras recargar, modos Ambos/Latín/Español, navegación de fecha, rúbricas en rojo en claro y oscuro, vista móvil, grupo «Liturgia» en la barra lateral.
- **Sin verificar**: las rutas de la API contra la base real (todavía no hay primera carga, L2); el render con documentos reales de DO; contraste sobre fotos (es de L5).
