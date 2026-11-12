# Lane 143 — L7 Proprium: Tempore y Sanctorum

> Implementada el 2026-10-14 sobre la rama `task/lane-143-liturgia-l7-proprium`.
> Dependencias: L3 (lane 136).
> Especificación: `vault/nuevas-features/liturgia/SPEC.md` §10.4, §10.5, §11, §12, §13.

## 1. Pedido y Objetivo
Implementar las dos pantallas de Proprium de la liturgia tradicional:
1. **Proprium de Tempore** (`/dashboard/liturgia/proprium-de-tempore`):
   - `CabeceraLiturgica` sin fecha (libro temático) con selector de versiones.
   - Índice por los 8 tiempos litúrgicos tradicionales: Adventus, Nativitas, Epiphania, Septuagesima, Quadragesima, Passio, Pascha, Pentecostes (post Pentecosten).
   - Lista interactiva de domingos y ferias de cada tiempo con sus títulos latinos y códigos de DO (ej. `Adv1-0`, `Pent04-2`).
   - Botón/enlace «¿Cuándo cae este año?» que enlaza al Calendarium del ciclo actual.
   - Modo detalle con dos pestañas bilingües: **Missa** y **Officium** procesadas a través de `LiturgiaTexto`.
2. **Proprium Sanctorum** (`/dashboard/liturgia/proprium-sanctorum`):
   - Índice por los 12 meses del año (Ianuarius .. December) leyendo el Kalendarium de la versión seleccionada (1906, 1888, 1570 mostrando cómo se agregan o faltan santos entre versiones).
   - Buscador en tiempo real por nombre latino del santo o fecha (`MM-DD`).
   - Tarjetas de santos con fecha, nombre latino, rango tradicional (Simplex, Semiduplex, Duplex, Duplex I/II classis), punto de color litúrgico y mención de conmemoraciones.
   - Enlace directo «Ver en el Calendarium del año».
   - Modo detalle con dos pestañas bilingües: **Missa** y **Officium** con `LiturgiaTexto`.

## 2. Decisiones tomadas
- **Lógica pura en `src/lib/liturgia/proprium.ts`**:
  - `clasificarClaveTempora(clave, titulo)` clasifica automáticamente cualquier formulario en los 8 tiempos litúrgicos.
  - `textoRango(rango)` traduce los números de rango de DO a la nomenclatura litúrgica preconciliar.
  - `deducirColorSanto(nombre)` asigna el color litúrgico tradicional (rojo para mártires, morado para vigilias y blanco para el resto).
  - Funciones puras `filtrarSantosPorMes` y `buscarSantos` probadas exhaustivamente en `proprium.test.ts`.
- **Arquitectura de UI y Server Components**:
  - Ambas pantallas utilizan componentes clientes (`PropriumDeTemporeVista.tsx`, `PropriumSanctorumVista.tsx`) envueltos en `<Suspense>` dentro de las páginas de Next.js App Router para soportar parámetros de URL sin deshidratación.
  - El detalle de cada celebración carga los documentos resueltos (`/api/liturgia/libro?tipo=...&clave=...&version=...`) de forma granular sólo cuando la pestaña correspondiente está activa.

## 3. Pruebas y Verificación
- Tests unitarios: 319 tests (303 pasan, 0 fallan, 16 saltados de base real).
  - 4 nuevos tests en `src/lib/liturgia/proprium.test.ts`.
- Tipos de TypeScript: `npx tsc --noEmit` completó con código 0 sin errores.
- Compilación de producción: `npm run build` completó con éxito en 26.3s con Turbopack, reconociendo ambas rutas como dinámicas.

## 4. Pendientes y sin verificar
- Verificación en navegador real con datos masivos de santos cargados en la base (anotado en `PENDIENTES_REPOSO_LITURGIA.md`).
