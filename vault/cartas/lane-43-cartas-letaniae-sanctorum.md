# Lane 43 — Letaniae Sanctorum, remoción de luminosos y orden canónico

- **Rama:** `task/lane-43-cartas-letaniae-sanctorum` · **Worktree:** `../ordo-diei-lanes/lane-43`
- **Basada en:** `dev`

## Requerimientos abordados
1. **Quitar los misterios luminosos** del listado de cartas católicas:
   - Se removieron los 5 misterios luminosos de `src/lib/cartas/catalogo/misterios.json` (`misterio-bautismo-jesus`, `misterio-bodas-cana`, `misterio-anuncio-reino`, `misterio-transfiguracion`, `misterio-institucion-eucaristia`).
   - El catálogo de misterios queda con exactamente los 15 misterios tradicionales del Rosario (5 Gozosos, 5 Dolorosos, 5 Gloriosos).
   - Se actualizó `temas.json` en la carta `santo-rosario` para indicar «Quince misterios tradicionales».
2. **Listado de santos obtenido del Letaniae Sanctorum (Letanías de los Santos)**:
   - Se reestructuró `src/lib/cartas/catalogo/santos.json` con los 42 santos tradicionales cantados en las Letanías Mayores de los Santos de la Iglesia Católica.
   - Cada santo cuenta con su fecha litúrgica verificada contra el Calendario Romano de `romcal` (48 cartas festivas en total).
   - Se conservaron los datos sagrados y oraciones de los santos ya existentes (`santa-maria-madre-de-dios`, `san-jose`, `san-juan-bautista`, `san-pedro-apostol`, `san-pablo-apostol`, `san-juan-evangelista`, `san-francisco-de-asis`, `san-agustin-de-hipona`, `san-benito-de-nursia`, `san-nicolas-de-bari`, `santa-ines-virgen-y-martir`).
3. **Orden jerárquico de precedencia y dignidad sagrada**:
   - «Los primeros santos que aparecen son los más importantes. Después de Dios le sigue la virgen maría».
   - Se creó `src/lib/cartas/orden.ts` implementando el orden teológico/litúrgico:
     1. **Dios y Nuestro Señor**: Sagrada Eucaristía, Sagrado Corazón de Jesús, Divina Misericordia, Santa Cruz, Santo Rosario.
     2. **La Santísima Virgen María**: Santa María Madre de Dios (primera de todos los santos), Inmaculado Corazón de María.
     3. **Los Santos de la Letanía**: San José, San Juan Bautista, San Pedro, San Pablo, San Andrés, Santiago el Mayor, San Juan Evangelista, Santo Tomás, Apóstoles, Mártires, Doctores, Monjes, Vírgenes.
     4. **Santos Ángeles y Coros celestiales**: San Miguel, San Gabriel, San Rafael, Ángeles Custodios, Serafines, Querubines, etc.
     5. **Los 15 Misterios del Rosario**: Gozosos, Dolorosos, Gloriosos.
   - Se integró `ordenarCartas` en `src/lib/cartas/server.ts` (`listarCartasUsuario` y navegación anterior/siguiente de `obtenerDetalleCarta`), de modo que en Mi Colección, Álbum Completo, Tienda y Detalle las cartas se ordenan de esta forma.
4. **Arte provisional y persistencia**:
   - Se generaron 31 nuevos placeholders WebP 630x880 en `arte-cartas/<clave>/1.webp` mediante `scripts/generar-placeholders.ts`.
   - Se adaptó `scripts/seed-cartas.ts` para marcar automáticamente `activa: false` a las cartas de sistema retiradas (como los misterios luminosos), manteniendo la integridad referencial sin pérdida de datos.

## Verificación
- `scripts/validar-catalogo.ts`: 72 cartas válidas con Zod y `romcal` (0 errores).
- `src/lib/cartas/orden.test.ts`: 5 tests unitarios verificando ausencia de luminosos, primacía de Dios, de la Virgen María y jerarquía de santos.
- `npm test`: 56 tests pasando (0 fallos).
- `npx tsc --noEmit`: 0 errores de tipado.
- `npx eslint`: 0 advertencias ni errores en los archivos modificados.
- `npm run build`: compilación limpia y optimizada de Next.js Turbopack.
