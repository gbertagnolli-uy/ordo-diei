# Lane 144 — L8 Ordinarium y Psalterium

> Implementada el 2026-10-14 sobre la rama `task/lane-144-liturgia-l8-ordinarium-psalterium`.
> Dependencias: L3 (lane 136).
> Especificación: `vault/nuevas-features/liturgia/SPEC.md` §10.6, §10.7, §11, §12, §13.

## 1. Pedido y Objetivo
Implementar las pantallas para el Ordinario y el Salterio tradicional:
1. **Ordinarium** (`/dashboard/liturgia/ordinarium`):
   - Pestaña **Ordo Missæ**: texto invariable de la Santa Misa tradicional (`Missa/Ordo/Ordo`) con enlace destacado hacia el Missale del día para las lecturas y oraciones variables.
   - Pestaña **Preces**: oraciones y devociones comunes del Oficio Divino (`Psalterium/Common/Prayers`: Pater noster, Ave Maria, Credo, Confiteor, Gloria Patri...).
2. **Psalterium** (`/dashboard/liturgia/psalterium`):
   - Índice completo de los 150 Salmos de David según la numeración de la Vulgata + Cánticos bíblicos tradicionales (Benedictus, Magnificat, Nunc Dimittis, Te Deum, Benedicite, Quicumque).
   - Buscador rápido por número de salmo (ej. `22`, `ps 50`) o por texto en latín/castellano (ej. `miserere`), con soporte para caracteres diacríticos y acentos.
   - Filtro por categoría: Todos (156), Salmos (150), Cánticos (6).
   - Lector de salmo con navegación rápida (Anterior / Siguiente) y `LiturgiaTexto` bilingüe.
   - Nota visible obligatoria D52: «Numeración de la Vulgata. Traducción española de Divinum Officium (no Torres Amat)».

## 2. Decisiones tomadas
- **Lógica de Salterio pura en `src/lib/liturgia/salterio.ts`**:
  - `generarIndiceSalterio()` genera el catálogo de 156 textos con títulos latinos y castellanos.
  - `buscarSalterio()` con normalización Unicode (`NFD`) para que búsquedas sin tildes coincidan con los incípits acentuados de DO.
  - Constante `NOTA_SALTERIO_VULGATA` exportada y probada en `salterio.test.ts`.
- **Rutas de API y Prefijos**:
  - Se extendió `PREFIJO_CLAVE_LIBRO.ordinarium` en `src/lib/liturgia/parametros.ts` para aceptar `"Psalterium/Common/"` además de `"Missa/Ordo/"`, permitiendo que las Preces comunes se lean de forma nativa desde `/api/liturgia/libro?tipo=ordinarium&clave=Psalterium/Common/Prayers`.
- **Next.js Suspense**:
  - Ambas páginas (`ordinarium/page.tsx`, `psalterium/page.tsx`) envueltas en `<Suspense>` conforme a las reglas del App Router para componentes con `useSearchParams`.

## 3. Pruebas y Verificación
- Tests unitarios: 323 tests (307 pasan, 0 fallan, 16 saltados de base real).
  - 4 nuevos tests en `src/lib/liturgia/salterio.test.ts` que validan el catálogo completo, la búsqueda por número, la búsqueda por texto y la nota de la Vulgata.
- Tipos de TypeScript: `npx tsc --noEmit` completó con código 0 sin errores.
- Compilación de producción: `npm run build` completó con éxito en 27.0s con Turbopack, reconociendo `/dashboard/liturgia/ordinarium` y `/dashboard/liturgia/psalterium` como rutas dinámicas.

## 4. Pendientes y sin verificar
- Verificación en navegador real con pantallas táctiles y teclado en la navegación anterior/siguiente de salmos (registrado en `PENDIENTES_REPOSO_LITURGIA.md`).
