# Lane 46 — Fiestas Marianas de San Pío V y exclusión de santos posteriores a Pío XII

- **Rama:** `task/lane-46-fiestas-marianas-pio-v` · **Worktree:** `../ordo-diei-lanes/lane-46`
- **Basada en:** `dev`

## Requerimientos abordados
1. **Exclusión de Carlos Acutis y cualquier santo nombrado después de Pío XII (1958)**:
   - Se removió cualquier mención o carta de figuras canonizadas o promovidas con posterioridad a Pío XII:
     - En `temas.json`: se eliminó la carta `divina-misericordia` (asociada a Santa Faustina Kowalska, canonizada en el año 2000).
     - En `santo-rosario`: se actualizó la cita litúrgica a la bula *Consueverunt Romani Pontifices* (1569) de San Pío V Papa, reemplazando citas de pontificados modernos.
     - En `scripts/validar-catalogo.ts`: se eliminaron del mapeo de fechas especiales `san-carlos-acutis` y `santa-faustina-kowalska`.
     - Todos los 42 santos de `src/lib/cartas/catalogo/santos.json` provienen de las *Litaniae Sanctorum* de la tradición perenne de la Iglesia (mártires de los primeros siglos, Padres, Doctores y fundadores medievales).
2. **Inclusión de todas las fiestas marianas de la liturgia de San Pío V (*Missale Romanum* 1570)**:
   - Se agregaron al catálogo `src/lib/cartas/catalogo/temas.json` las diez festividades marianas del Misal Romano promulgado por San Pío V:
     1. `fiesta-purificacion-de-maria` (02-02) — Purificación de Nuestra Señora / Candelaria.
     2. `fiesta-anunciacion-de-maria` (03-25) — La Anunciación de la Virgen María e Encarnación del Verbo.
     3. `fiesta-visitacion-de-maria` (07-02) — La Visitación de Nuestra Señora (fecha tradicional del 2 de julio en el Misal de 1570).
     4. `fiesta-santa-maria-de-las-nieves` (08-05) — Dedicación de Santa María la Mayor y milagro de las nieves.
     5. `fiesta-asuncion-de-maria` (08-15) — La Asunción en cuerpo y alma a los Cielos.
     6. `fiesta-natividad-de-maria` (09-08) — El Santo Nacimiento de la Virgen María.
     7. `fiesta-dolores-de-maria` (09-15) — Nuestra Señora de los Dolores al pie de la Cruz (*Stabat Mater*).
     8. `santo-rosario` (10-07) — Nuestra Señora de las Victorias / Santo Rosario (instituida por San Pío V en 1571 tras Lepanto).
     9. `fiesta-presentacion-de-maria` (11-21) — La Presentación de María en el Templo.
     10. `fiesta-inmaculada-concepcion` (12-08) — La Inmaculada Concepción de la Bienaventurada Virgen María (*Super speculam Domini*).
3. **Orden teológico y litúrgico estricto (`src/lib/cartas/orden.ts`)**:
   - «Después de Dios le sigue la virgen maría»:
     1. **Dios y Nuestro Señor**: `sagrada-eucaristia`, `sagrado-corazon-de-jesus`, `santa-cruz`.
     2. **La Santísima Virgen María y sus fiestas marianas de San Pío V**:
        - `santa-maria-madre-de-dios`
        - Las 10 fiestas marianas de San Pío V en orden del calendario litúrgico tradicional.
     3. **Santos del *Litaniae Sanctorum***: San José, San Juan Bautista, Apóstoles, Mártires, Padres, Doctores y Fundadores.
     4. **Santos Ángeles y Coros celestiales**.
     5. **15 Misterios tradicionales del Rosario**.
4. **Arte provisional de Grado I**:
   - Se crearon los placeholders WebP sobrios en formato 630x880 para las 9 nuevas festividades marianas en `arte-cartas/<clave>/1.webp`.

## Verificación
- `scripts/validar-catalogo.ts`: 79 cartas validadas con Zod y comprobadas en el calendario litúrgico de `romcal` (0 errores).
- `src/lib/cartas/orden.test.ts`: test de exclusión de Carlos Acutis y santos post-Pío XII, test de primacía de Dios, y test de colocación de todas las fiestas marianas de San Pío V inmediatamente después de la Virgen María y antes de San José.
- `npm test`: 60 tests pasando (0 fallos).
- `npx tsc --noEmit`: 0 errores de compilación TypeScript.
- `npx eslint`: 0 errores en `src/lib/cartas/` y `scripts/`.
- `npm run build`: compilación de producción de Next.js Turbopack completada exitosamente.
