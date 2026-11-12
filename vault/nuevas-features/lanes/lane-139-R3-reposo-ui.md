# Lane 139 — R3 Reposo v2 (UI)

> Implementada el 2026-10-14 sobre la rama `task/lane-139-reposo-r3-ui`.
> Dependencias: N4 (lane 138), R1 (lane 135), R2 (lane 137).
> Especificación: `vault/nuevas-features/idle-marco-fotos/SPEC.md` §1–§4, §7–§8.

## 1. Pedido y Objetivo
Completar la interfaz de usuario de la Pantalla de Reposo v2 (salvapantallas contemplativo) en la raíz `/`:
- Fotografías de naturaleza de Unsplash (o partículas de respaldo si no hay fotos/red).
- Frase protagonista, alternando estrictamente una cita bíblica (latín Vulgata + español Torres Amat + referencia) y una pregunta del Catecismo de San Pío X (pregunta + respuesta).
- Esquina superior izquierda: logo OD y «Ordo Diei».
- Esquina superior derecha: título del oficio del día según Divinum Officium (Tridentine 1906, `/api/reposo/dia`).
- Esquina inferior izquierda: atribución obligatoria de Unsplash con enlaces y UTM.
- Parte inferior central: botón «Entrar».
- Máquina de estados en `/`: `[REPOSO] --Entrar--> [SELECTOR] --elige--> [PIN]`, con retorno automático a `REPOSO` tras 15 segundos de inactividad (`useInactividad`).
- Protección anti burn-in (desplazamiento ±24 px cada 60 s y atenuación de esquinas y botón a opacidad 0.6 tras 5 minutos sin actividad táctil o del cursor).

## 2. Decisiones tomadas
- **Lógica de frases y mazo barajado (`src/lib/reposo/frases.ts`)**:
  - Filtro estricto de longitud y paridad (latín ≤ 220, español ≤ 300, pregunta ≤ 140, respuesta ≤ 360).
  - Barajado Fisher-Yates sin repetición hasta agotar el mazo.
  - Al rebarajar, se evita que el primer elemento del nuevo ciclo coincida con el último del ciclo anterior.
  - Alternancia estricta Biblia ↔ Catecismo persistida en `localStorage` (`ordo-diei:reposo-secuencia:v1`).
  - Duración dinámica por frase: `clamp(12 s, 8 s + 55 ms * chars, 32 s)`.
  - Exclusión de las últimas 12 fotos utilizadas en el pool (`elegirFotoSinRepetirUltimas`).
- **Endpoint del día (`src/lib/reposo/dia.ts` y `src/app/api/reposo/dia/route.ts`)**:
  - Mapea el oficio Tridentine 1906 para la fecha local en `APP_TZ` (por defecto `America/Montevideo`).
  - Si la base aún no tiene datos de liturgia generados, responde `null` con HTTP 200 y no rompe.
- **Componentes (`src/components/reposo/*`)**:
  - `TituloDia.tsx`: tipografía Newsreader en 2–3 líneas, primera línea en cursiva, líneas secundarias con opacidad 0.7.
  - `FraseReposo.tsx`: jerarquía N1 (clamp 1.75–3.5rem) > N2 (clamp 1.05–1.75rem) > N3 (uppercase sans 0.8–0.95rem). Margen izquierdo 10–12%. Atributos `lang="la"`, `lang="es"` y `aria-live="polite"`.
  - `FondoUnsplash.tsx`: doble capa para fundido cruzado (1.5 s), efecto Ken Burns (escala 1 -> 1.08), velos de legibilidad (≥ 4.5:1), enlaces con UTM para autor y Unsplash, y respaldo automático en partículas doradas si no hay foto.
  - `ReposoPantalla.tsx`: orquesta el ciclo continuo, timer por frase, precarga de la siguiente imagen y anti burn-in.
- **Integración con Auth (`src/components/auth/AuthPageClient.tsx`)**:
  - Estado `modo`: `"REPOSO"` | `"SELECTOR"` | `"PIN"`.
  - Entrada a `/` muestra el salvapantallas; «Entrar» pasa a selector de usuarios.
  - `useInactividad` vigila 15 s (o `segundosLogin` de la configuración) en `SELECTOR` y `PIN` para volver a `REPOSO`.
- **Compatibilidad de script**: corrección de la variable `dueño=` por `duenio=` en `scripts/integrar.sh` para compatibilidad universal con bash.

## 3. Pruebas y Verificación
- Tests unitarios en verde:
  - `src/lib/reposo/frases.test.ts`: 9 tests (paridad, límites, duración, barajado, alternancia estricta, no repetición, exclusión de 12 fotos).
  - `src/lib/reposo/dia.test.ts`: 4 tests (formato de fecha en `APP_TZ`, retorno de `null` sin datos, mapeo de campos de 1906, filtrado de versión).
  - Suite completa: 306 tests (290 pasaron, 0 fallaron, 16 saltados que requieren `PERMITIR_TESTS_DB=1`).
- TypeScript: `npx tsc --noEmit` en verde sin errores.
- Eslint: 0 errores y 0 warnings en todo el código tocado.
- Build: `npm run build` exitoso con Turbopack.

## 4. Pendientes y sin verificar
- Verificación en navegador real: las transiciones visuales, fluidez de animación y visualización en pantallas físicas se delegan a las pruebas de usuario (anotado en `PENDIENTES_REPOSO_LITURGIA.md`).
