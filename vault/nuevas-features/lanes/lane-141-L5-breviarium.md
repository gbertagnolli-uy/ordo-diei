# Lane 141 — L5 Breviarium (`/dashboard/liturgia/breviarium`)

> Implementada el 2026-10-14 sobre la rama `task/lane-141-liturgia-l5-breviarium`.
> Dependencias: L3 (lane 136), L4 (lane 140).
> Especificación: `vault/nuevas-features/liturgia/SPEC.md` §10.2, §11, §12, §13.

## 1. Pedido y Objetivo
Implementar la pantalla completa de Breviarium (Liturgia Horarum / Oficio Divino):
- Modo Hub (`/dashboard/liturgia/breviarium`):
  - Card destacada: Hora canónica vigente (AHORA) calculada en la zona horaria familiar (`APP_TZ`) según las franjas S8 de `src/lib/liturgia/horas.ts`.
  - Imagen a sangre fija de Unsplash según la iluminación del momento (S10) con Ken Burns suave (respetando `prefers-reduced-motion`).
  - Overlay de contraste D54 (`bg-gradient-to-t from-black/90 via-black/50 to-transparent`) que garantiza legibilidad de texto blanco (≥ 4.5:1) en las 8 fotos.
  - Título latino principal en Newsreader, castellano, chip AHORA con franja horaria, botón «Rezar [Hora]» y atribución de autor de foto en Unsplash. Toda la card actúa como link a la Hora.
  - 7 cards secundarias para las demás Horas del Oficio, ordenadas cronológicamente a partir de la siguiente hora canónica, con foto 16:9, franja, título latino y castellano.
- Barra superior de salto rápido:
  - 8 botones para saltar directamente a cualquiera de las Horas del Breviario (Matutinum, Laudes, Prima, Tertia, Sexta, Nona, Vespera, Completorium).
  - Indicador pulsante ambar en la Hora actual.
  - Botón «Ver todas las Horas» cuando una Hora está abierta para volver al Hub.
- Modo Lector de la Hora:
  - Ruta dinámica `/dashboard/liturgia/breviarium/[hora]` (y soporte compatible vía query param `?hora=...`).
  - Cabecera con franja horaria, título latino, subtítulo castellano y título del día litúrgico.
  - Renderizado bilingüe con `LiturgiaTexto` del documento resuelto (`/api/liturgia/hora?fecha=...&hora=...&version=...`).
  - Estado amigable de carga con Skeleton y estado de datos aún no generados.
- Integración con Next.js App Router:
  - Páginas envueltas en `<Suspense>` obligatorio por `useSearchParams`.
  - Parámetros `fecha` y `version` compartibles y preservados al saltar entre Horas o volver al Hub.

## 2. Decisiones tomadas
- **Navegación declarativa (`Link` y `Button asChild`)**:
  - En lugar de manejar estado interno volátil, las transiciones de Horas navegan a `/dashboard/liturgia/breviarium/[hora]` con Next.js `Link`, preservando el historial del navegador (Back/Forward), accesibilidad estándar y URLs limpias para compartir o guardar en marcadores.
- **Next 16 Dynamic Routes**:
  - `BreviariumHoraPage` resuelve `params: Promise<{ hora: string }>` de forma asíncrona conforme a las especificaciones de Next.js 16 / App Router, validando con `esHora(hora)` y disparando `notFound()` ante horas no canónicas.
- **Contraste D54**:
  - Overlay de degradado negro concentrado en la base inferior de las tarjetas de horas para asegurar contraste superior a 4.5:1 sin alterar las fotos elegidas por su luz.

## 3. Pruebas y Verificación
- Tests unitarios: suite completa de 312 tests (296 pasan, 0 fallan, 16 saltados de base real).
- Tipos de TypeScript: `npx tsc --noEmit` completó con código 0 sin errores.
- Compilación de producción: `npm run build` completó con éxito en 31.3s con Turbopack, reconociendo correctamente `/dashboard/liturgia/breviarium` y `/dashboard/liturgia/breviarium/[hora]`.

## 4. Pendientes y sin verificar
- Verificación visual interactiva en distintos tamaños de pantalla para la cadencia del Ken Burns en pantallas táctiles (registrado en `PENDIENTES_REPOSO_LITURGIA.md`).
