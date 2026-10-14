# Lane 140 — L4 Calendarium (`/dashboard/liturgia`)

> Implementada el 2026-10-14 sobre la rama `task/lane-140-liturgia-l4-calendarium`.
> Dependencias: L3 (lane 136).
> Especificación: `vault/nuevas-features/liturgia/SPEC.md` §10.1, §10.8, §12, §13.

## 1. Pedido y Objetivo
Implementar la pantalla central y dashboard del Calendario Litúrgico (`/dashboard/liturgia`):
- `CabeceraLiturgica` con título («Calendarium»), subtítulo («Calendario litúrgico»), selector de versión (Tridentine 1906, 1888, 1570) y navegación por fecha.
- Grilla responsive en escritorio de 12 columnas:
  - Card Hoy (8 columnas): color litúrgico, rango, tiempo litúrgico, título latino principal en tipografía Newsreader grande, título en español (si DO lo incluye), conmemoraciones y líneas de Tempora.
  - Card Mes (4 columnas): calendario mensual interactivo (`CalendariumMes.tsx`) con puntos de color litúrgico, rangos abreviados (D, Sd, S, F...) y selección de día.
  - Card Breviarium del día (4 columnas): Hora canónica actual según la hora local familiar (`APP_TZ`), foto alusiva de Unsplash (S10), chip de franja horaria («AHORA · 07:00 – 08:29»), accesos rápidos a las 8 Horas y botón para abrir Breviarium.
  - Card Missale del día (4 columnas): incipit del Introito, Colecta / Oratio en español/latín y referencias de Epístola y Evangelio.
  - Card Mysteria Rosarii (4 columnas): los 5 misterios correspondientes al día según el día de la semana y la regla dominical tradicional según el tiempo litúrgico.
  - Card Martyrologium (12 columnas): lectura bilingüe del Santoral tradicional del día con columna latina y adaptación española de DO.

## 2. Decisiones tomadas
- **Lógica de Horas del Breviario (`src/lib/liturgia/horas.ts`)**:
  - Franjas S8 exactas probadas en los bordes (00:00–04:59 Matutinum, 05:00–06:59 Laudes, 07:00–08:29 Prima, 08:30–10:59 Tertia, 11:00–13:29 Sexta, 13:30–15:59 Nona, 16:00–19:29 Vespera, 19:30–23:59 Completorium).
  - 8 fotos fijas de Unsplash con temática de iluminación natural (S10) y atribución.
- **Lógica del Rosario tradicional (`src/lib/liturgia/rosario.ts`)**:
  - Regla semanal estándar (Lunes/Jueves Gozosos, Martes/Viernes Dolorosos, Miércoles/Sábado Gloriosos).
  - Regla dominical preconciliar confirmada con fuentes impresas (*The Raccolta*, 1910, n.º 219; *Manuale Precum*, 1898):
    - Adviento, Navidad, Epifanía: Gozosos.
    - Septuagésima, Cuaresma, Pasión: Dolorosos.
    - Pascua, Pentecostés (tiempo per annum): Gloriosos.
  - 15 misterios tradicionales con número romano, título latino, castellano, fruto y cita bíblica.
- **Grilla mensual (`src/components/liturgia/CalendariumMes.tsx`)**:
  - Abreviación de rangos litúrgicos compacta para que quepan en cada celda sin desbordar.
  - Navegación mes a mes con botones de anterior/siguiente.
- **Next.js Suspense**:
  - `/dashboard/liturgia/page.tsx` envuelve `CalendariumVista` en `<Suspense>` obligatorio por el uso de `useSearchParams` a través de `useParametrosLiturgia`.

## 3. Pruebas y Verificación
- Tests unitarios en verde:
  - `src/lib/liturgia/horas.test.ts`: franjas en los bordes, rotación cronológica de horas, metadatos y fotos de Unsplash.
  - `src/lib/liturgia/rosario.test.ts`: días de la semana, regla dominical según tiempo litúrgico, integridad de los 15 misterios.
  - Suite completa: 312 tests (296 pasaron, 0 fallaron, 16 saltados que requieren `PERMITIR_TESTS_DB=1`).
- TypeScript: `npx tsc --noEmit` sin errores.
- Eslint: 0 errores y 0 warnings en los archivos tocados.
- Build: `npm run build` exitoso con Turbopack.

## 4. Pendientes y sin verificar
- Pruebas en navegador real para validar el arrastre y uso táctil en tablets familiares (anotado en `PENDIENTES_REPOSO_LITURGIA.md`).
