# Lane 242 — Ajuste tipográfico y contención vertical de textos largos en Reposo

> Implementada el 2026-10-18 sobre la rama `task/lane-242-reposo-textos-largos`.

## 1. Pedido y Objetivo
En el screensaver (`ReposoPantalla` / `FraseReposo`), cuando toca una cita bíblica o pregunta del catecismo extensa, la suma del bloque N1 + N2 + N3 superaba la altura disponible de la pantalla, desbordando el contenedor y desplazando el botón «Entrar» fuera del viewport. Se pidió reducir el tamaño de los textos para que incluso los más largos entren holgadamente en el espacio disponible sin ocultar el botón de entrada.

## 2. Decisiones tomadas
- **Escala dinámica según carga vertical (`calcularEscalaFrase` en `src/lib/reposo/frases.ts`)**:
  - Se calcula un peso vertical ponderando el bloque principal `N1 * 1.6 + N2` y se interpola una escala entre `1.0` (frases cortas, peso ≤ 160) y `0.68` (frases en el tope de longitud, peso ≥ 620).
- **Reducción de la escala base y acople con `dvh` (`src/components/reposo/FraseReposo.tsx`)**:
  - N1 pasa de `clamp(1.75rem, 1rem+3vw, 3.5rem)` a `calc(var(--escala-frase, 1) * clamp(1.25rem, min(0.85rem+1.8vw, 3.6dvh), 2.35rem))` con ancho máximo ampliado de `36ch` a `46ch` (menos saltos de línea).
  - N2 pasa de `clamp(1.05rem, 0.8rem+1.2vw, 1.75rem)` a `max(0.875rem, calc(var(--escala-frase, 1) * clamp(0.95rem, min(0.75rem+0.9vw, 2.3dvh), 1.35rem)))` con ancho máximo ampliado de `52ch` a `62ch`, interlineado más compacto (`leading-snug sm:leading-normal`) y márgenes verticales reducidos (`mt-3 sm:mt-4`).
  - Se agrega además un `ResizeObserver` sobre el contenedor de la frase que verifica si en viewports de muy baja altura `scrollHeight > clientHeight` y aplica un factor de reducción adicional automático.
- **Protección de layout flex (`src/components/reposo/ReposoPantalla.tsx`)**:
  - Cabecera y zona inferior del botón «Entrar» con `shrink-0`.
  - Zona central con `min-h-0 flex-1 flex items-center`, impidiendo que el bloque central empuje al botón «Entrar» fuera de la pantalla.
- **Sincronización aditiva de base de datos (`Tareas.Rotacion_Config`)**:
  - Se verificó con `npx prisma migrate diff` que faltaba aplicar `ALTER TABLE "Tareas" ADD COLUMN "Rotacion_Config" JSONB;` (pendiente de la lane 238) y se ejecutó con `npx prisma db execute`, dejando `migrate diff` en `-- This is an empty migration.`.

## 3. Verificación
- `node --test src/lib/reposo/frases.test.ts`: 10/10 tests en verde (incluyendo pruebas de `calcularEscalaFrase`).
- `npx tsc --noEmit` y suite completa de tests vía `scripts/integrar.sh`.
- `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` devuelve `-- This is an empty migration.`.
