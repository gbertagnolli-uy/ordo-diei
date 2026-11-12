# Lane 145 — L9 Rosarium

> Implementada el 2026-10-14 sobre la rama `task/lane-145-liturgia-l9-rosarium`.
> Dependencias: L3 (lane 136).
> Especificación: `vault/nuevas-features/liturgia/SPEC.md` §10.8, §11, §12, §13.

## 1. Pedido y Objetivo
Implementar la pantalla completa para el Santo Rosario tradicional (`/dashboard/liturgia/rosarium`):
1. **Misterios del día destacados arriba (D49)**:
   - Grupo asignado (Gaudiosa / Dolorosa / Gloriosa) y motivo («miércoles», «domingo de Adviento», etc.) derivado con `misteriosDelDia(fecha, dia?.tiempo)`.
   - 5 tarjetas con número romano (`I`–`V`), nombre latino, nombre castellano, fruto espiritual del misterio y cita bíblica de referencia.
   - Confirmación de la regla tradicional preconciliar con fuente impresa citada en el código:
     *The Raccolta* (ed. 1910, n.º 219) y *Manuale Precum* (Ratisbona, 1898, p. 342).
2. **Explorador de las tres coronas (15 misterios)**:
   - Acceso ordenado por pestañas a los tres grupos tradicionales (Gozosos, Dolorosos, Gloriosos).
   - Indicador visual del rezo del día actual.
   - Sin misterios luminosos (2002), conforme a la liturgia y devoción preconciliar (§10.8).
3. **Devocionario tradicional bilingüe (Preces Sancti Rosarii)**:
   - Selector de idioma con `ToggleGroup`: Ambos idiomas, Solo Latín o Solo Español.
   - Textos íntegros de oraciones con sus fuentes impresas anotadas:
     - Signum Crucis (*Manuale Precum 1898*)
     - Symbolum Apostolorum / Credo (*Divinum Officium*)
     - Pater Noster (*Divinum Officium*)
     - Ave Maria (*Divinum Officium*)
     - Gloria Patri (*Divinum Officium*)
     - Oratio Fatimae («O mi Iesu») con distintivo «desde 1917» (*Aparición de Fátima 1917, devocionario tradicional*)
     - Salve Regina con versículo y respuesta (*Divinum Officium*)
     - Oratio Conclusiva / Oremus final (*Manuale Precum 1898*, *The Raccolta 1910*)
     - Litaniæ Lauretanæ completas (50+ invocaciones bilingües, Agnus Dei 3x y Sub tuum præsídium) (*Rituale Romanum*, *The Raccolta 1910*)

## 2. Decisiones tomadas
- **Datos estructurados y puros en `src/data/liturgia/rosarium.json`**:
  - Todas las oraciones y letanías se definieron con textos latinos y castellanos exactos y sus fuentes históricas documentadas.
  - Se importan con atributo ESM `with { type: "json" }` para total compatibilidad con Node.js y Next.js.
- **Lógica litúrgica y tipado en `src/lib/liturgia/rosario.ts`**:
  - Exportación de `DEVOCIONARIO_ROSARIO`, tipos `OracionRosario`, `LitaniaeRosario`, `InvocacionLetania`.
  - Comprobaciones unitarias de integridad de datos en `rosario.test.ts`.
- **Componente `RosariumVista.tsx`**:
  - `CabeceraLiturgica` con selector de versión y selector de fecha.
  - Grid responsivo de tarjetas de misterios (1 col en móvil, 2 en tablet, 5 en escritorio).
  - Selector bilingüe con tipografía serif para lectura sagrada.
- **Next.js Suspense**:
  - `/dashboard/liturgia/rosarium/page.tsx` envuelto en `<Suspense>` debido al uso de `useParametrosLiturgia` (`useSearchParams`).

## 3. Pruebas y Verificación
- Tests unitarios: 322 tests pasan limpiamente (0 fallas, 16 saltados de base real).
  - Tests específicos de `rosario.test.ts` verifican días fijos, regla dominical según tiempo litúrgico, 5 misterios por grupo con frutos y citas, y oraciones con fuentes y etiqueta de Fátima.
- Tipos de TypeScript: `npx tsc --noEmit` completó con código 0 sin errores.

## 4. Pendientes y sin verificar
- Verificación en navegador y dispositivos móviles de las tarjetas táctiles y la selección de idioma (registrado en `PENDIENTES_REPOSO_LITURGIA.md`).
