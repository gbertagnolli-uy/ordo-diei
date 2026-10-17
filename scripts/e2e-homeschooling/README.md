# Recorrido de punta a punta de Homeschooling

Verifica **contra la base real y con un navegador real** lo que los tests sin base no pueden: permisos, la guardia de la Tarea, el
quiz sin filtrar la respuesta, los premios (sin cobrar dos veces), la navegación y los flujos de cada pantalla, con capturas en tres
tamaños. Corrida de referencia (2026-10-15): fase A 53/53, fase B 45/45 páginas, fase C 50/50.

> **Escribe en la base de DATABASE_URL (producción).** Crea 3 usuarios (`Padre|Leo|Mia … __test_hs_e2e`), materias, cursos, planes, una
> Tarea y una foto, y los borra con `limpiar.ts`. Solo corre con `PERMITIR_TESTS_DB=1` y nunca toca datos que no lleven la marca
> `__test_hs`. Hacelo solo si el dueño del proyecto lo autorizó.

## Cómo correrlo
```bash
# 1. Dependencia de prueba (no se guarda en package.json) y un Chromium del sistema
npm i --no-save playwright-core          # CHROMIUM=/usr/bin/chromium por defecto
# 2. Servidor de producción local (en una lane, con .env)
npx next build && npx next start -p 3100 &
# 3. Las fases, desde la raíz del repo
export PERMITIR_TESTS_DB=1
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/e2e-homeschooling/limpiar.ts   # por si quedaron restos
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/e2e-homeschooling/fase_a.ts    # API: crea los datos y recorre las reglas
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/e2e-homeschooling/fase_b.ts    # 15 páginas × móvil/tablet/escritorio: errores, desbordes
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/e2e-homeschooling/fase_c.ts    # interacción: navegación, reordenar, planes, visor, foto…
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/e2e-homeschooling/fase_e.ts    # video real (.webm generado con ffmpeg) + checkpoint
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/e2e-homeschooling/fase_f.ts    # cámara en Pixel 7 emulado: capture, compresión, evidencia
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/e2e-homeschooling/limpiar.ts   # SIEMPRE al terminar
```
Variables: `E2E_BASE` (por defecto `http://localhost:3100`), `E2E_SALIDA` (estado y capturas; por defecto `$TMPDIR/hs-e2e`), `CHROMIUM`.
Las fases entran como los usuarios de prueba con una cookie de sesión firmada con el `SESSION_SECRET` local.
Hay que correr `fase_a` antes que `b` y `c` (dejan los ids en `estado.json`) y limpiar entre corridas completas.

## Qué miran
- **A:** crear materia/curso/lecciones/preguntas/plan, permisos (hermano sin plan, hijo no crea), «Hoy», la Tarea con 18:00, la guardia
  (400 sin lecciones), lección 2 sin la 1 (409), quiz con y sin `correcta`, completar la Tarea, aprobar, no cobrar dos veces,
  evidencia (hijo sube, hermano no ve, padre aprueba y los saldos no cambian), horas, preferencias e historias.
- **B:** sin errores de consola ni HTTP ≥ 400, sin redirección al login y sin desborde horizontal, para padre e hijo.
- **C:** migas y botones de volver, botón «atrás» del navegador, pestañas, reordenar, pausar/reanudar/cambiar fin/quitar un plan,
  archivar y restaurar una materia, Primero/Después con reloj, historia social, cámara, visor, logro con modo relajado, cronómetro.
- **E:** archivo de video directo: carga, reproduce, pausa en el checkpoint, «Volver 30 s», acierto, completar la Tarea (requiere `ffmpeg`).
- **F:** teléfono emulado: `capture="environment"`, selector de «Cámara», foto de 2400×1800 comprimida, evidencia con 2 fotos, sin desborde.
