# Lane 142 — L6 Missale (`/dashboard/liturgia/missale`)

> Implementada el 2026-10-14 sobre la rama `task/lane-142-liturgia-l6-missale`.
> Dependencias: L3 (lane 136).
> Especificación: `vault/nuevas-features/liturgia/SPEC.md` §10.3, §11, §12, §13.

## 1. Pedido y Objetivo
Implementar la pantalla Missale para el Santo Sacrificio de la Misa tradicional:
- `CabeceraLiturgica` con título («Missale»), subtítulo («Sancta Missa · Santo Sacrificio»), selector de versión (Tridentine 1906, 1888, 1570) y navegación por fecha.
- Nota D53 visible para 1888 y 1906: «DO usa el Misal de 1910 para esta versión», que se oculta al seleccionar 1570.
- `ToggleGroup` para alternar entre:
  - **«Solo el propio»**: muestra únicamente las partes propias del día litúrgico (Introitus, Oratio / Colecta, Lectio / Epístola, Graduale / Tractus / Alleluja / Sequentia, Evangelium, Offertorium, Secreta, Præfatio si es propia, Communio, Postcommunio y conmemoraciones).
  - **«Misa completa»**: muestra la totalidad de la Misa con el Ordinario intercalado tal como lo entrega el motor de Divinum Officium.
- Contador dinámico de secciones visibles en el encabezado de control.
- Lector bilingüe con `LiturgiaTexto` (latín / español / ambos con rúbricas destacadas en `--rubrica`).
- Estados de carga (Skeleton) y aviso amigable cuando los datos aún no están generados en la base de datos.
- Envoltura en `<Suspense>` conforme a las reglas de Next.js para rutas que leen `useSearchParams`.

## 2. Decisiones tomadas
- **Lógica de filtrado pura (`src/lib/liturgia/missa.ts`)**:
  - Función pura `filtrarSeccionesMisa(secciones, modo)` testeada unitariamente con `src/lib/liturgia/missa.test.ts`.
  - Aprovecha la propiedad `propio: boolean` generada por el parser de DO (`scripts/liturgia/parser.ts`), derivada en el Spike L1 (`SPIKE_MOTOR.md` §9.5).
- **React y Rendimiento**:
  - `docFiltrado` memorizado con `useMemo` evitando re-cálculos innecesarios durante el renderizado.
  - Secciones bilingües con `content-visibility: auto` y anclas de navegación directa provistas por `LiturgiaTexto`.

## 3. Pruebas y Verificación
- Tests unitarios: 315 tests (299 pasan, 0 fallan, 16 saltados de base real).
  - Nuevos tests en `src/lib/liturgia/missa.test.ts`: filtrado de modo completa, propio y manejo de listas vacías.
- Tipos de TypeScript: `npx tsc --noEmit` completó con código 0 sin errores.
- Compilación de producción: `npm run build` completó con éxito en 28.3s con Turbopack, reconociendo `/dashboard/liturgia/missale` como ruta dinámica.

## 4. Pendientes y sin verificar
- Verificación visual interactiva en navegador real del comportamiento del anclaje y el scroll en pantallas táctiles (registrado en `PENDIENTES_REPOSO_LITURGIA.md`).
