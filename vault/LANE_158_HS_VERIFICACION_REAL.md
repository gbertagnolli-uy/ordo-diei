# Lane 158 — Verificación real de Homeschooling (base real + navegador) y lo que encontró

Pedido del usuario: "implementa todo lo faltante y lo que no se hizo" (lo que no se hizo era la prueba en navegador y los tests con base real).

## Hecho
- **Tests con base real** (`PERMITIR_TESTS_DB=1`, solo los 5 archivos de `servidor/*.test.ts` y antes de correrlos se comprobó que no había restos `__test_hs`): 23 tests. 4 fallaban por un defecto real → `renumerar` (reordenar/borrar lecciones) usaba SQL crudo que no respeta el esquema `family_tasker`; ahora usa dos fases de `update`. También se arregló un id viejo en `planes.test.ts`. Resultado 23/23; la base quedó limpia.
- **Recorrido con navegador** (`scripts/e2e-homeschooling/`, README incluido; guarda: exige `PERMITIR_TESTS_DB=1`): fase A 53/53, B 45/45, C 50/50, D 19/19. Capturas en `vault/nuevas-features/homeschooling/verificacion/capturas/` (sin los hijos reales).
- **Correcciones que salieron de ahí:** barra de alumnos con scroll; `w-full min-w-0` en las páginas; `history.pushState` en la navegación de la materia (instantáneo y con «atrás»); visor a pantalla completa (`data-[side=bottom]:h-svh`); reordenado optimista; `loading.tsx`; `selectable` del calendario; contraste del tema oscuro; panel compacto (hijos sin cursos en una línea), ícono en el encabezado del plan, barra del gráfico con ancho máximo.
- **Guardas de regresión** en `roost/guarda.test.ts`: sin SQL crudo, `w-full min-w-0` en contenedores de página, `pushState` en el shim de router.

## Verificado y no verificado
Ver `PLAN_VERIFICACION.md` «Verificación real» y `HALLAZGOS_PENDIENTES.md` (P-44 a P-47): el arrastre del calendario, un video real y la cámara de la tablet siguen sin poder comprobarse automáticamente.
