# Pendientes y cosas para revisar — Reposo v2 (R1–R3) y Liturgia (L1–L9)

> Archivo **único y común** (pedido del usuario, 2026-10-14): cada lane agrega acá lo que no pudo cerrar sola, lo que decidió por su cuenta y lo que el usuario tiene que mirar. Orden: lo más urgente primero dentro de cada lane. Marcá con `[x]` lo resuelto.

## Cómo leerlo
- **Revisar**: decisión o dato que el agente tomó y conviene que lo mire una persona.
- **Pendiente**: trabajo que quedó sin hacer (con motivo).
- **Sin verificar**: criterio de aceptación que solo se prueba en el navegador o con la base real.
- **Para el usuario**: acción que solo vos podés hacer (cargar una clave, dar un OK…).

## Generales
- [ ] **Para el usuario**: cargar `UNSPLASH_ACCESS_KEY` en las variables de entorno de Vercel (D55). Sin eso el reposo muestra el respaldo de partículas.
- [ ] **Para el usuario**: la primera carga masiva de la liturgia en la base (L2) requiere tu OK explícito; ver la sección de L2.
- [ ] **Revisar**: el código de la lane se numeró al crearla (la tabla de `LANES.md` dice cuál es cuál).

## L1 · Spike del motor DO (lane 131)
- **Revisar**: la regla de respaldo de idioma por línea se resolvió con una heurística (latín idéntico + palabras funcionales inglesas + lista de encabezados). Detalle y mediciones en `liturgia/SPIKE_MOTOR.md` §9.3. Si preferís exactitud total, se puede generar una pasada extra en inglés (duplica el tiempo de generación).
- **Revisar**: el Rosario necesita textos que **DO no trae** (Letanía Lauretana, Signum Crucis suelto, oración de Fátima, frutos y citas de los 15 misterios). Los escribe la lane L9 en `src/data/liturgia/rosarium.json` con la fuente anotada; **hay que revisarlos contra una fuente impresa**.
- **Sin verificar**: la proyección de espacio (< 150 MB) es una extrapolación de un mes (octubre 2026); se vuelve a medir tras la primera carga real.

## L2 · Generador y modelo de datos (lane 133)
- [ ] **Para el usuario — OK para la primera carga en la base de producción.** El generador está listo y probado; **no se corrió ninguna carga**. Comandos (desde la raíz del repo, con el `.env`):
  ```bash
  npm run liturgia:descargar                    # Divinum Officium (commit fijo) + dependencias Perl, una sola vez
  # 1) ensayo: genera, mide y deja JSON en .cache/ (no toca la base) — ya se corrió, ver cifras abajo
  # 2) carga: calendario 2026–2035 (3 versiones) y textos + libros 2026–2027 (3 versiones)
  LITURGIA_CONFIRMADO=si node scripts/liturgia/generar.ts --importar .cache/ensayo-cal  --escribir
  LITURGIA_CONFIRMADO=si node scripts/liturgia/generar.ts --importar .cache/ensayo-full --escribir
  ```
  Solo escribe en las 4 tablas nuevas (`Dias_Liturgicos`, `Bloques_Liturgicos`, `Documentos_Liturgicos`, `Generaciones_Liturgicas`); upsert idempotente (se puede repetir). Sin `LITURGIA_CONFIRMADO=si` el script se niega a escribir.
- **Hecho sin OK (aditivo, ya aplicado):** `CREATE TABLE IF NOT EXISTS` de esas 4 tablas (`scripts/liturgia/sql/001-tablas-liturgia.sql`, regla AGENTS §6). `prisma migrate diff` trajo además `DROP` de tablas de Homeschooling (lane de horas/reportes, ya en la base pero no en `dev`): **no se aplicó**; se filtró a solo los `CREATE` de liturgia.
- **Revisar**: `migrate diff` contra la base real muestra que la base tiene tablas `Homeschool_Actividades/Metas_Horas/Participantes` que `dev` todavía no declara (otra lane en curso). No es de liturgia; solo anotarlo para quien integre esa lane.
- **Revisar — SQL crudo y `schema`**: el SQL crudo de Prisma **no hereda** el `?schema=family_tasker` del adaptador (el ORM sí): `relation "…" does not exist`. El generador califica las tablas con `esquemaDB()`. `src/lib/homeschooling/servidor/cursos.ts:290` usa `$executeRaw` con `"Homeschool_Lecciones"` sin calificar: **podría fallar igual** (no lo probé; no es de esta lane).
- **Revisar — `scripts/integrar.sh`**: la variable `dueño=` (con «ñ») no es un identificador válido de bash en este entorno (`dueño=1963121: command not found`, línea 29). Pasa cuando el lock está tomado: el script igual aborta (`set -e`) pero sin el mensaje de «Otro agente está integrando». Conviene renombrarla a `duenio`. No lo toqué (es herramienta compartida).
- **Decisión que conviene mirar**: el título del día sale de la **cabecera de Laudes** (`officium.pl content=1`) y no de `kalendar.pl` como decía la SPEC §2: es el texto exacto del ejemplo del pedido y trae el color. `tiempo` y `dominical` se calculan por aritmética del año litúrgico (`src/lib/liturgia/calendario.ts`, con pruebas 2026–2035), no con el texto de DO.
- **Revisar**: `Titulo_Es` queda `null` en días de feria (el `[Officium]` español de Tempora no coincide con el título latino con fecha, p. ej. «…II. Octobris»). La UI muestra solo el latín. Para santos sí viene («S. Calixto, Papa y Mártir»).
- **Revisar**: se agregó `tipo = "kalendarium"` (además de hora/missa/martyrologium/libro) para el Kalendarium de cada versión (1570 + diferencias de 1888 y 1906 combinadas), que L7 necesita para el índice por mes. `clave` = la versión; las entradas van en `Titulo`.
- **Revisar**: la prueba de deduplicación de la SPEC §12 («dos días seguidos < 40 % de bloques nuevos») no se cumple a nivel de **una Hora** (13 vs 14-oct: 52 % nuevos, porque son feria y fiesta de mártir); a nivel de **mes completo** solo el 11 % de las filas es único (SPIKE §9.2). La prueba automática exige < 60 %.
- **Sin verificar**: la **GitHub Action** (`.github/workflows/liturgia.yml`) nunca corrió. Está inactiva hasta que crees la variable de repositorio `LITURGIA_ACTION_ACTIVA=true` y los secretos `DATABASE_URL`/`DIRECT_URL`. Como `dev` solo se integra en local, tampoco corre hasta que el archivo llegue a la rama por defecto de GitHub.
- **Sin verificar**: `descargar.sh` e `instalar-perl.sh` desde cero (se probó el mismo procedimiento a mano; el script se probó ejecutándolo sobre el clon existente).
- **Incidente (para que lo sepas)**: al crear el worktree de esta lane otro agente creó a la vez `lane-132` (Homeschooling horas/reportes) y por un descuido mío copié `vendor/` y `.cache/` en su directorio y corrí `npm install` ahí (falló en `prisma generate`). Los moví de vuelta a mi worktree; su directorio quedó con el mismo contenido que tenía (solo su cambio en `prisma/schema.prisma`). Mi lane quedó como **133**. Lección anotada en las reglas de trabajo: tras `git worktree add`, abortar si falla antes de copiar nada.
