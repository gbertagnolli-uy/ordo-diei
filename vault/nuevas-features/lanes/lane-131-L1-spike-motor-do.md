# Lane 131 · L1 — Spike del motor Divinum Officium

**Rama** `task/lane-131-liturgia-l1-spike` · **Fecha** 2026-10-14 · **Estado** integrada.

## Pedido
Orden del usuario (`/goal`): ejecutar las 12 lanes de `LANES.md` (R1–R3, L1–L9) según `PROMPT_REPOSO_LITURGIA.md`; documentar todo lo pendiente o a revisar en un solo archivo (`PENDIENTES_REPOSO_LITURGIA.md`); seguir hasta terminar. La primera carga masiva de la liturgia pide OK previo.
L1 (LANES.md): completar `liturgia/SPIKE_MOTOR.md` §9 — salida a parsear, deduplicación medida, regla de respaldo de idioma, opciones de salida, Misa «solo propio» vs completa, origen de las oraciones del Rosario. Sin código de producción.

## Qué se hizo
- Se clonó DO en el commit fijo `32be5f26…` (sparse, en `vendor/divinum-officium/`, ignorado por git) y se instalaron las dependencias Perl en `.cache/do-perl5/`.
- Se generaron 744 documentos (octubre 2026 × 3 versiones × 8 Horas) más una semana de Misa en español e inglés, y se midieron dedup, tiempos y respaldo de idioma.
- Se reescribió `SPIKE_MOTOR.md` §9 con resultados (ver ahí): **salida = `officium.pl`/`missa.pl` con `content=1`**; dedup 11 % de filas / 14,7 % de bytes; 40 MB comprimidos proyectados para 24 meses × 3 versiones; respaldo por **línea**; Misa siempre completa (el «solo propio» se deriva en el parser); oraciones del Rosario parcialmente fuera de DO.
- `.gitignore`: `/vendor/divinum-officium/` y `/.cache/`.
- Se creó el archivo común `PENDIENTES_REPOSO_LITURGIA.md`.

## Decisiones tomadas
- `content=1` en lugar de `EofficiumXhtml.pl` (más simple, mismo contenido).
- Respaldo de idioma: heurística local, no segunda pasada en inglés.

## Cómo verificar
Leer `SPIKE_MOTOR.md` §9; reproducir con `scripts/liturgia/descargar.sh` + `instalar-perl.sh` (L2) y `perl officium.pl "date1=10-14-2026&command=prayLaudes&version=Tridentine - 1906&lang1=Latin&lang2=Espanol&content=1"`. No hay código de producción ni cambios en la base.

## Pendientes
Ver `PENDIENTES_REPOSO_LITURGIA.md` (sección L1).
