# Plan de lanes — nuevas features

Numeración definitiva = la siguiente libre en el momento de crear cada lane (usar `git branch --list 'task/lane-*'` **y** `ls vault/LANE_*` antes; ya hubo colisiones). Aquí se usan códigos **N1…N14**. Cada lane = worktree propio desde `dev`, SQL aditivo (nunca `db push`), `scripts/integrar.sh`, registro en el vault, limpieza del worktree (AGENTS.md).

## Orden y dependencias

```
~~N1 Spike Google Fotos~~ (cancelada, D34)
N2 Audio: motor + efectos ──► N3 Música            
N4 Inactividad (hook) ──► N5 Borradores ──► N6 Cierre por inactividad
R1 Frases (Vulgata + Torres Amat + Catecismo) ─┐
R2 Pool Unsplash + panel ───────────────────────┼──► R3 Reposo v2 (UI) ◄── N4   (título del día: lee L2 si hay datos)
L1 Spike DO ──► L2 Generador + modelo ──► L3 API + componentes ──► L4 Calendarium · L5 Breviarium · L6 Missale
                                                               └─► L7 Proprium (Tempore + Sanctorum) · L8 Ordinarium + Psalterium · L9 Rosarium
N9 Marketplace núcleo ──► N10 Mkt admin ──► N11 Mkt miembros ──► N12 Mkt sobres/sistema
N13 Temporizadores ◄── N2, N4
N14 Meal planner F1       H1.. Homeschooling (después)
```
Prioridad: **N4→R3→N5→N6** (R1 y R2 antes de R3; N7 quedó reemplazada por R1–R3) (pedido más concreto del usuario), en paralelo **N9→N12**, luego N2/N3/N13, la liturgia (L1–L9), después N14 y Homeschooling.

## Lanes

### ~~N1 · Spike Google Fotos~~ — **cancelada** (2026-10-14, D34: el reposo usa Unsplash)
- Leer la documentación vigente de *Picker API* y *Media items*: vida del `baseUrl`, límites, si se permite cachear/copiar, vida de la sesión, scopes y verificación de la app OAuth (modo «prueba» limita a 100 usuarios y los tokens caducan a 7 días ⇒ ver si hay que pasar a «producción»).
- Prototipo en rama: conectar, elegir fotos y descargar una.
- **Salida:** `idle-marco-fotos/SPIKE.md` con la estrategia A/B/C elegida. Tamaño S.

### N2 · Motor de audio + sonidos de efectos
- `src/lib/audio/*`, `PreferenciaAudio`, menú «Sonido», importador de la **carpeta de sonidos del usuario** (pendiente de recibir) y `mapa.json`, enganchar eventos del catálogo (`sonidos-ui/SPEC.md` §3, §5).
- Tests: mapa evento→archivo, reglas de silencio. Tamaño M.

### N3 · Música de fondo
- Importador de carpeta, `PistaMusical`, bucket de almacenamiento, mini reproductor persistente, `ConfigAudio`, Media Session. Depende de N2. **Necesita la carpeta de canciones del usuario.** (La de sonidos de N2 también está pendiente.) Tamaño M.

### N4 · Detector de inactividad (solo hook y pruebas)
- `useInactividad`, `lib/actividad.ts`, `useMantenerActivo`, canal entre pestañas. Reloj inyectable para tests. Sin cambios visibles. Tamaño S.

### N5 · Borradores
- Tabla `Borrador`, API, `useBorrador` y registro, `BandaBorrador`, «Mis borradores». Integrar los formularios de la tabla §4.2 (modo `final`/`solo-borrador`). Tamaño M–L.

### N6 · Cierre de sesión por inactividad
- `GuardiaInactividad` (60 s en dashboard, 15 s en login), aviso de 10 s, secuencia §3 (vaciar borradores → logout), sesión deslizante (si se aprueba S3). Depende de N4, N5 y R3 (antes N7). Tamaño M.

### ~~N7 · Pantalla de reposo (UI) + fotos subidas~~ — **reemplazada por R1–R3** (ver abajo)
- `ReposoPantalla` en `/` con logo, nombre, **Entrar**, rotación de fotos propias (`FotoReposo`, `ConfigReposo`), respaldo de partículas, anti burn-in, panel «Reposo y fotos» en Administración. Estados `REPOSO → SELECTOR` en `AuthPageClient`. Tamaño M.

### ~~N8 · Google Fotos~~ — **cancelada** (D34)
- OAuth + Picker + importación según N1, `/api/admin/reposo/google/*`, desconexión. Tamaño M–L.

### N9 · Marketplace — núcleo
- Esquema (§4), registro de monedas, `evaluarRequisito`, `estadoProducto`, `comprarProducto` (transacción, idempotencia, reembolso) con **tests unitarios**; sin UI. Tamaño L.

### N10 · Marketplace — administración
- Pantalla de productos (lista + formulario con vista previa), constructor de precios y requisitos, plantillas, compras (aprobar/rechazar/cancelar), badge en `PanelAdmin`. Tamaño L.

### N11 · Marketplace — miembros
- `/dashboard/marketplace`: grilla, filtros, bloqueado en grises con candado, detalle, confirmación, resultado, meta, «Mis compras». Entrada en `AppSidebar`. Tamaño L.

### N12 · Marketplace — productos del sistema
- Sembrar los 4 sobres como `origen:"sistema"` (leyendo `economia.ts`), tarjeta de fragmentos hacia la Tienda de cartas, delegación a `comprarSobre`, historial unificado. Tamaño M.

### N13 · Temporizadores visuales
- `TemporizadorVisual` (disco/barra), modo foco, temporizador libre, `Habito.duracionMin`, pictogramas Lucide. Depende de N2/N4. Tamaño M.

### N14 · Meal planner F1
- Recetas, plan semanal, lista de compras. Tamaño M.

### H1+ · Homeschooling (Ecosistema Completo — 6 Lanes H1..H6)
- Listo para implementar (auditoría resuelta: [`../homeschooling/AUDITORIA.md`](../homeschooling/AUDITORIA.md)). Plan maestro completo en [`LANES_HOMESCHOOLING.md`](LANES_HOMESCHOOLING.md) y arquitectura en [`../homeschooling/ARQUITECTURA_DETALLADA.md`](../homeschooling/ARQUITECTURA_DETALLADA.md).
- Lanes definidas: `H1a`, `H1b`, `H2` (Hoy aprendo), `H3` (evidencia), `H4` (quizzes y repaso), `H5` (horas y reportes), `H6` (neurodivergencia). Referencia visual de Roost en [`../homeschooling/MAPEO_COMPONENTES_ROOST.md`](../homeschooling/MAPEO_COMPONENTES_ROOST.md).

## Ronda 9 (2026-10-14) — Reposo v2 y Liturgia (lane 122)

**Estado (2026-10-14, D56): todas «⏳ lista para implementar», ninguna empezada.** Prompt de entrega para el agente: [`PROMPT_REPOSO_LITURGIA.md`](PROMPT_REPOSO_LITURGIA.md).

| Lane | Estado | Depende de | Lane real (al crearla) |
|---|---|---|---|
| R1 Frases | ⏳ lista | — | — |
| R2 Unsplash + panel | ⏳ lista | — | — |
| R3 Reposo v2 UI | ⏳ lista | N4, R1, R2 | — |
| L1 Spike DO | ✅ integrada (lane 131) | — | 131 |
| L2 Generador + modelo | ⏳ lista | L1 | — |
| L3 API + componentes | ⏳ lista | L2 | — |
| L4 Calendarium | ⏳ lista | L3 | — |
| L5 Breviarium | ⏳ lista | L3 | — |
| L6 Missale | ⏳ lista | L3 | — |
| L7 Proprium | ⏳ lista | L3 | — |
| L8 Ordinarium + Psalterium | ⏳ lista | L3 | — |
| L9 Rosarium | ⏳ lista | L3 | — |

Quien tome una lane cambia su fila a «🔨 en curso (lane NN)» en el mismo commit en que la crea, y a «✅ integrada (lane NN)» al integrar.

Especificaciones: [`../idle-marco-fotos/SPEC.md`](../idle-marco-fotos/SPEC.md) (R*) y [`../liturgia/SPEC.md`](../liturgia/SPEC.md) (L*). Decisiones D34–D53, supuestos S7–S11 en [`../DECISIONES.md`](../DECISIONES.md) §10. El número de lane se toma al crearla (ver arriba).

### R1 · Frases del reposo: fuentes y datos
- Cerrar fuentes (SPEC reposo §6.2): Vulgata Clementina, **Torres Amat** (verificar contra escaneo del s. XIX, numeración Vulgata), **Catecismo Mayor** (Wikisource).
- Proponer `ref/seleccion-citas.txt` (≥ 365 citas, D51) **y pedir revisión al usuario** antes de integrar.
- `scripts/reposo/generar-frases.ts` → `src/data/reposo/citas-biblicas.json` y `catecismo-pio-x.json`; tests de §6.3. Sin UI. Tamaño M.

### R2 · Pool de Unsplash + panel «Reposo»
- `ConfigReposo`, `FotoUnsplash` (SQL aditivo), `src/lib/reposo/unsplash.ts` (refresco en el cron diario, aviso de descarga una vez por foto, ocultas), `/api/reposo/fotos|config`, `/api/admin/reposo/*`, tarjeta en Administración. Credenciales ya en el `.env` del directorio principal (D55; copiarlo al worktree). Falta que el usuario cargue `UNSPLASH_ACCESS_KEY` en Vercel. Tests con `fetch` inyectado. Tamaño M.

### R3 · Pantalla de reposo v2 (UI)
- `ReposoPantalla`, `FraseReposo`, `FondoUnsplash`, `TituloDia`, `src/lib/reposo/frases.ts` (mazos, alternancia, duración); estados `REPOSO → SELECTOR` en `AuthPageClient`; `/api/reposo/dia`. Depende de N4, R1, R2; el título aparece cuando L2 cargó datos. Tamaño M.

### L1 · Spike del motor DO (sin código de producción)
- Completar `liturgia/SPIKE_MOTOR.md` §9: salida a parsear, deduplicación medida (un mes × 3 versiones), regla de respaldo de idioma, opciones de salida, Misa «solo propio» vs completa, de dónde salen las oraciones del Rosario. Tamaño S.

### L2 · Generador y modelo de datos
- `scripts/liturgia/{descargar.sh,instalar-perl.sh,do.ts,parser.ts,generar.ts,do-libro.pl}`, `.gitignore`, scripts npm, modelos `DiaLiturgico`, `BloqueLiturgico`, `DocumentoLiturgico`, `GeneracionLiturgica` (SQL aditivo), dorados del parser, GitHub Action mensual (S9).
- **Primera carga en la base**: calendario 2026–2035 y textos 2026–2027 de las tres versiones. Es escritura masiva en la base de producción (tablas nuevas, sin tocar otras): **pedir OK al usuario antes de correrla**. Tamaño L.

### L3 · API y componentes compartidos
- `src/lib/liturgia/*`, `/api/liturgia/*` (SPEC §6), `SelectorVersion`, `CabeceraLiturgica`, `LiturgiaTexto`, token `--rubrica`, colores litúrgicos, grupo «Liturgia» en `AppSidebar` con rutas vacías (`Empty`) para las pantallas que aún no existen. Tamaño M.

### L4 · Calendarium (dashboard) — SPEC §10.1. Tamaño M.
### L5 · Breviarium (Hora destacada + cards + lector) — SPEC §10.2; elegir las 8 fotos (S10) por la luz del momento y verificar contraste ≥ 4,5:1 con el overlay de D54 (si falla, más opacidad). Tamaño M.
### L6 · Missale — SPEC §10.3. Tamaño S.
### L7 · Proprium de Tempore + Proprium Sanctorum — SPEC §10.4–10.5 (documentos «libro» de L2). Tamaño M.
### L8 · Ordinarium + Psalterium — SPEC §10.6–10.7. Tamaño M.
### L9 · Rosarium — SPEC §10.8; confirmar la regla dominical con fuente impresa preconciliar. Tamaño S–M.

Orden sugerido: **L1 → L2 → L3**, en paralelo **R1, R2**; después **R3**, **L5**, **L4**, y luego L6–L9 en cualquier orden.

## Reglas comunes de implementación
- **UI**: solo componentes prebuilt del proyecto (`Button`, `Card`, `Dialog`, `Sheet`, `Progress`, `Toast`…); sin duplicar componentes; no cambiar comportamientos existentes (memoria *ui-work-rules*).
- **Next.js**: leer `node_modules/next/dist/docs/` antes de escribir código (AGENTS.md; versión con cambios).
- **Librerías maduras** antes que código propio (Howler.js, music-metadata, zod, etc.).
- **Textos** en español rioplatense del proyecto (voseo ya usado en cartas: «Necesitás»); revisar consistencia con `lib/cartas/textos.ts`.
- **Pruebas**: `npm test` + `tsc --noEmit`; funciones puras con tests; ninguna prueba que escriba en la base real sin `PERMITIR_TESTS_DB=1`.
- **Vault**: cada lane crea `vault/nuevas-features/lanes/lane-NN-*.md` con pedido, decisiones, qué se hizo y cómo verificar.
