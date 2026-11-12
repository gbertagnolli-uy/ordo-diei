# Lane 133 · L2 — Generador y modelo de datos de la liturgia

**Rama** `task/lane-133-liturgia-l2-generador` · **Fecha** 2026-10-14 · **Estado** código integrado; **primera carga en la base pendiente del OK del usuario** (ver `PENDIENTES_REPOSO_LITURGIA.md`).

## Pedido
`LANES.md` L2 y `liturgia/SPEC.md` §3–§5, §12: `scripts/liturgia/{descargar.sh,instalar-perl.sh,do.ts,parser.ts,generar.ts,do-libro.pl}`, `.gitignore`, scripts npm, modelos `DiaLiturgico`, `BloqueLiturgico`, `DocumentoLiturgico`, `GeneracionLiturgica` (SQL aditivo), dorados del parser, GitHub Action mensual (S9). Primera carga en la base **con OK del usuario**.

## Qué se hizo
- `scripts/liturgia/descargar.sh` (clon parcial del commit fijo `32be5f26…`), `instalar-perl.sh` (cpanm 1.7047 → `.cache/do-perl5/`), `do.ts` (spawn de Perl con tope global de procesos), `do-libro.pl` (exporta archivos de libro con `setupstring` original, `resolve@ => 2`).
- `parser.ts` (HTML de `officium.pl`/`missa.pl` con `content=1` → `Documento` + bloques con hash SHA-256; respaldo de idioma por línea D52; Misa con `propio` por sección), `textoLibro.ts` (texto crudo de DO → segmentos; martirologio), `kalendarios.ts` (Tabulae 1570 → 1888 → 1906), `generar.ts` (CLI: lotes de 31 días, `--solo-calendario`, `--libros`, `--volcar`, `--importar`, `--escribir`).
- `src/lib/liturgia/tipos.ts` (tipos de la SPEC §4 y constantes) y `src/lib/liturgia/calendario.ts` (Pascua, Adviento y `tiempoLiturgico`, con pruebas 2026–2035).
- Modelos Prisma + `scripts/liturgia/sql/001-tablas-liturgia.sql` (aplicado; solo `CREATE`).
- `.github/workflows/liturgia.yml` (mensual; inactiva hasta crear `LITURGIA_ACTION_ACTIVA=true`).
- `package.json`: `liturgia:descargar`, `liturgia:generar`; el `test` ahora incluye `scripts/**/*.test.ts`.
- Pruebas: dorados del parser (5 fixtures reales de DO en `__fixtures__/`), respaldo de idioma, martirologio, kalendarios, calendario litúrgico, utilidades del generador. El SQL de carga se verificó contra la base real **dentro de una transacción con rollback** (no quedó nada escrito).

## Decisiones
- Documentos «de libro»: clave `Sancti/10-14` (oficio), `Missa/Sancti/10-14` (misa), `Tempora/…`, `Commune/…`, `Psalterium/<n>`, `Psalterium/Common/Prayers`, `Psalterium/Mariaant`, `Missa/Ordo/Ordo`; martirologio por `MM-DD`; Kalendarium con `tipo = "kalendarium"`.
- Un bloque = una fila de DO (dos celdas). Si los títulos de sección no coinciden entre columnas, la fila queda como un solo bloque.
- Memoria acotada: el generador entrega lotes de 31 días y los descarta (la máquina tiene poca RAM libre).
- SQL crudo calificado con el `schema` de la URL (`esquemaDB`).

## Cómo verificar
`npm test` · `npx tsc --noEmit`. Ensayo: `node scripts/liturgia/generar.ts --versiones 1906 --desde 2026-10-12 --hasta 2026-10-18 --volcar .cache/ensayo` (no toca la base). Ver cifras del ensayo completo en `PENDIENTES_REPOSO_LITURGIA.md`.

## Pendientes
Ver `PENDIENTES_REPOSO_LITURGIA.md` (sección L2): OK de la primera carga, Action sin probar, `Titulo_Es` en ferias.
