# Hábitos, niveles y perfil

> Pedido (2026-10-10):
> - Cualquier usuario puede **agregar** hábitos, pero solo puede **editar los que creó**.
> - Cada oración es un hábito propio, y se suman hábitos de orden y de cuidado personal.
> - Cada usuario **elige con cuáles empezar**: nada se impone todo junto.
> - Hay un **sistema de niveles más completo** y una página **Mi perfil** (desde el menú de la foto en la barra lateral) con nivel, foto, logros, puntos y todo lo ganado.
> - Una **tienda** para canjear puntos, más adelante.
>
> Se suma la investigación "Análisis operativo de apps de hábitos" (Finch, Way of Life, Productive, Streaks).

Reemplaza las lanes 21–24 propuestas en [NUEVO_HABITO.md](NUEVO_HABITO.md); la auditoría de esa nota sigue vigente. Generaliza el [Camino de oración](CAMINO_DE_ORACION.md).

**Decisiones del usuario (2026-10-10)**
- **Puntos:** todos los hábitos dan **experiencia (XP)** y logros. Solo los de **orden y cuidado personal** dan además **puntos canjeables**; las oraciones no, para que no se recen por premio.
- **Matutinum ya no se bloquea:** el orden noche → Rosario → mañana queda como sugerencia ("Recomendado para empezar") y un aviso suave si se eligen muchos a la vez.

**Modo de trabajo:** las lanes las implementa **agy**. Cada worktree tiene su prompt en `AGY_PROMPT.md` (fuera de git). El merge a `dev` y la limpieza los hace el orquestador.

---

## 1. Catálogo de hábitos del sistema

Las escaleras siguen la regla del Rosario: se sube tras N días seguidos cumplidos. El último paso marca el hábito como **completo** tras N días. `—` = un solo paso: el hábito se sigue por etapas y constancia, sin subir de paso.

| Clave | Nombre | Categoría | Franja | Ancla sugerida | Escalera |
|---|---|---|---|---|---|
| `matutinum` | Oraciones de la mañana (Matutinum) | oración | mañana | Antes del desayuno | — |
| `angelus` | Ángelus | oración | tarde | Al mediodía | — |
| `rosario` | Santo Rosario | oración | tarde | En el momento que elijas | 15 pasos actuales (3 → 6 → 10 + misterio, ×5) |
| `lectura` | Lectura espiritual | oración | tarde | Después del almuerzo | 1 párrafo (7) → 5 minutos (7) → 15 minutos (14) |
| `completorium` | Oraciones de la noche (Completorium) | oración | noche | Antes de dormir, en familia | — |
| `cama` | Tender la cama | orden | mañana | Al levantarme | Estirar el acolchado (7) → Tender la cama completa (14) |
| `aseo` | Lavarse la cara, peinarse y cepillarse los dientes | cuidado | mañana | Después de levantarme | Cepillarse los dientes (7) → Dientes y cara (7) → Dientes, cara y peinarse (14) |
| `bano` | Bañarse | cuidado | noche | Antes de cenar | — |
| `ropero` | Ordenar el ropero | orden | tarde | Al volver a casa | Guardar la ropa del día (7) → Ordenar un estante (7) → Ropero ordenado (14) |

- **Recomendados para empezar:** `completorium` y `rosario`, igual que el Camino original.
- Cada hábito tiene una frase de **identidad** para Consolidación y Hábito firme (G7). Ej.: Rosario → "Sos de los que rezan el Rosario cada día".

**Hábitos creados por usuarios:** nombre, categoría, franja, ancla y, opcionalmente, una versión mínima.
- Con versión mínima: dos pasos, *versión mínima* (14) → *nombre*.
- Sin versión mínima: un solo paso.
- Los ve toda la familia en el catálogo y cualquiera los puede adoptar. Solo su creador los edita o archiva. Los hábitos del sistema no los edita nadie.

## 2. Qué tomamos de la nueva investigación

| Idea | App | Decisión |
|---|---|---|
| Registro de tres estados: Sí / No / Omitido, más una nota del día | Way of Life | Marcas `hecho` / `no` / `justificado`, con nota opcional en "No" y "Omitido". La nota alimenta el diagnóstico futuro de recaídas (G4) |
| Agrupar por momento del día (Mañana / Tarde / Noche) | Productive | La página *Mis hábitos* se ordena por franja (intención de implementación) |
| Biblioteca de plantillas que se adoptan en un clic | Productive | Catálogo con selección múltiple en el paso 1 |
| Onboarding guiado, sin hoja en blanco | Productive / Finch | Estado vacío que lleva al catálogo con los recomendados marcados |
| Refuerzo positivo, sin castigos ni pérdida de progreso | Finch | Se mantiene: el nivel y la XP **nunca bajan** por un día perdido |
| Anillo que se completa (cierre de Gestalt) | Streaks | Anillo "hoy: x de y" en la página de hábitos y anillo de nivel en el perfil (MagicUI *Animated Circular Progress Bar*) |
| Mantener presionado para confirmar | Streaks | **No**: un toque y "Deshacer" ya protegen de errores y es más rápido (< 3 s) |
| Marcado automático por sensores | Streaks | **No** aplica (web, sin HealthKit) |
| Mascota virtual | Finch | **No** por ahora; el perfil y los logros cumplen el rol de progreso visible |

## 3. Modelo de datos (lo hace solo la lane 21)

```prisma
enum CategoriaHabito { oracion orden cuidado }
enum FranjaHabito    { manana tarde noche }
enum MarcaHabito     { hecho justificado no }

model Habito {            // @@map("Habitos")
  id, clave String? @unique   // hábitos del sistema; null = creado por un usuario
  nombre, descripcion?, categoria, franja, ancla, icono (nombre de lucide), minimo String?
  creadorId Int?              // null = sistema
  archivado Boolean @default(false), createdAt, updatedAt
}
model HabitoUsuario {     // @@map("Habitos_Usuario") — adopción: qué practica cada uno
  id, usuarioId, habitoId, desde @db.Date, dias Int @default(127) /* bit 0 = domingo */,
  ancla String? /* receta personal */, activo Boolean @default(true), createdAt
  @@unique([usuarioId, habitoId])
}
model RegistroHabito {    // @@map("Registros_Habito")
  id, usuarioId, habitoId, fecha @db.Date, marca MarcaHabito, nota String?,
  puntos Int @default(0), xp Int @default(0), registradoPorId, createdAt
  @@unique([usuarioId, habitoId, fecha])
}
Usuario.experienciaHabitos Int @default(0) @map("Experiencia_Habitos")
```

- Las escaleras del sistema y las frases de identidad viven en el código (`catalogo.ts`, por clave). En la base solo hay una fila por hábito del sistema, que se crea con un upsert idempotente.
- **Recompensa por registro** (constantes en el catálogo):
  - `hecho` da **10 XP**, más un bono al subir de paso (+25) o al completar (+100) si ocurre hoy.
  - `hecho` en orden o cuidado da además **5 puntos**, que suman a `availablePoints` y a `puntosAcumulados`.
  - Al deshacer o cambiar la marca se revierte lo guardado en el registro. Los puntos se revierten como máximo hasta lo disponible: nunca quedan en negativo.
- **Días no programados** (`dias`): cuentan como "libre". No suman, no cortan los días seguidos y no bajan la constancia, como el Skip de Habitify y el Omitido de Way of Life.
- **Historia previa a la adopción:** el seguimiento empieza en `min(desde, primer registro)`, como hoy con el Completorium.

## 4. Permisos

| Acción | Quién |
|---|---|
| Crear un hábito nuevo | Cualquier usuario |
| Editar o archivar un hábito | Solo su creador. Los del sistema, nadie |
| Adoptar, ajustar días o ancla, dejar de practicar | El propio usuario. Padre o madre también para otro miembro |
| Registrar un día (hoy o hasta 7 atrás) | El propio usuario. Padre o madre para varios ("Rezamos juntos") |
| Ver el perfil de otro miembro | Padre o madre |

## 5. Niveles, logros y perfil

- **XP total** = `puntosAcumulados` (tareas y hábitos) + `experienciaHabitos`.
- **Nivel:** misma curva de hoy (`floor(sqrt(xp/100)) + 1`), así nadie baja de nivel con el cambio, con más títulos:

  | Nivel | Título |
  |---|---|
  | 1 | Novato |
  | 2 | Iniciado |
  | 3 | Aprendiz avanzado |
  | 5 | Guerrero disciplinado |
  | 7 | Experto |
  | 10 | Maestro de tareas |
  | 15 | Héroe legendario |
  | 20 | Columna de la familia |
  | 25 | Ejemplo de virtud |
  | 30 | Leyenda de Ordo Diei |

- **Logros** (catálogo puro, derivados al leer, sin tabla). Cada uno devuelve obtenido y su progreso:
  - Tareas: los umbrales actuales de `BadgesDisplay`.
  - Racha, estrellas y nivel 5, 10 y 20.
  - Hábitos:
    - Primer hábito.
    - Primer paso subido.
    - 7 días seguidos.
    - Hábito firme, y 3 hábitos firmes.
    - Escalera completa.
    - Rosario completo.
    - 30 noches de Completorium.
    - Madrugador: Matutinum en Consolidación.
    - Casa en orden: cama y ropero firmes.
    - Volver a empezar: un regreso tras una recaída.
- **Página `/dashboard/perfil`**, desde el menú de la foto → "Mi perfil". Los padres pueden abrir `?usuarioId=` de otro miembro. Muestra:
  - Foto, nombre y rol.
  - Anillo de nivel, título y cuánto falta.
  - Puntos disponibles y acumulados, XP de hábitos, estrellas, sorpresas, racha y tareas completadas.
  - Hábitos activos con su etapa.
  - Logros: obtenidos primero, después los bloqueados con su progreso.
  - Premios ganados (`PremioEntregado`).
- El contenido del modal `USER_STATS` (desde Jerarquía familiar) pasa a ser el mismo componente que usa el perfil, para no duplicar UI.

## 6. Lanes

| Lane | Rama | Depende de | Base |
|---|---|---|---|
| 21 | `task/lane-21-motor-habitos` | — | `dev` |
| 22 | `task/lane-22-ui-habitos` | 21 mergeada en `dev` | `dev` (hace `git merge dev` antes de empezar) |
| 23 | `task/lane-23-niveles-perfil` | 21 mergeada en `dev` | `dev` (ídem). Puede correr en paralelo con la 22 |

- [x] **Lane 21 · motor y datos.**
  - Motor genérico por escalera (`src/lib/habitos/`), catálogo de §1 y modelos de §3 con `db push` aditivo.
  - Recompensas, permisos y API `/api/habitos/*`, con tests.
  - **No toca la UI** y deja funcionando el Camino de oración actual: las tablas viejas se borran en la lane 22.
- [x] **Lane 22 · UI de hábitos.**
  - Página *Mis hábitos* por franjas, diálogo de 2 pasos para agregar o crear, edición solo del creador y marcas de Way of Life.
  - Vista Familia generalizada, barra lateral, G3 y G7.
  - Redirección de /dashboard/oracion a /dashboard/habitos. Conservación segura de datos de oración previos sin pérdida.
- [x] **Lane 23 · niveles, logros y perfil.** Curva `floor(sqrt(xp/100)) + 1` con 10 títulos hasta nivel 30 (`niveles.ts`), catálogo y evaluador de logros (`logros.ts`), página Mi perfil (`/dashboard/perfil`), "Mi perfil" en el menú de la foto y XP total (`puntosAcumulados + experienciaHabitos`) en todo lugar que calcula nivel.
- [ ] **Más adelante, sin rama todavía:**
  - Lane 24: tienda de canje de puntos.
  - Lane 25: recordatorios con fading (G1).
  - Lane 26: adaptación (G4–G6).

## 7. Reglas para todas las lanes

- Leer `AGENTS.md`: Next 16 tiene cambios. Consultar `node_modules/next/dist/docs/` antes de usar una API de Next.
- **UI solo con componentes prearmados** (shadcn `radix-nova`, MagicUI, Aceternity), sin duplicar elementos ni cambiar comportamiento ajeno a la lane. Si el CLI de shadcn agrega imports desde `"cn"`, corregirlos a `@/lib/utils` y desinstalar el paquete `cn`.
- **Reutilizar open source** antes que programar: XState, date-fns + `@date-fns/tz`, Recharts (shadcn chart), react-activity-calendar, `vaul` (shadcn drawer).
- Base de datos: Supabase, schema `family_tasker`, cambios con `npx prisma db push`. Solo aditivo, salvo la lane 22 al borrar las tablas viejas de oración, y únicamente si están vacías.
- Textos en español rioplatense, como el resto de la app.
- Verificación: `npm test`, `npx tsc --noEmit`, `npx eslint` sobre lo tocado, `npx next build` y prueba en el navegador.
- Commits en la rama de la lane, con un registro en la tabla §8. Sin merge ni PR: eso lo hace el orquestador.

## 8. Registro

| Lane | Merge | Notas |
|---|---|---|
| 21 | bfb9e26 | Motor genérico de hábitos (XState 5), catálogo del sistema (9 hábitos), modelos Prisma aditivos, permisos y recompensas (+5 pts orden/cuidado, +10 XP siempre), endpoints /api/habitos/*. Tests (33 pass), build y verificación de API en puerto 3121 con datos de prueba borrados. |
| 22 | ecaabcc | UI completa de hábitos: página /dashboard/habitos por franjas horarias con anillo animado de progreso, diálogo/drawer responsivo de 2 pasos, tarjeta con marcas Way of Life y notas popover, escaleras visuales, heatmaps de actividad y trayectoria 60d, vista Familia ("Hicimos juntos" y tabla por miembro), badge en sidebar. Capturas verificadas (desktop 1440, mobile 390, dark mode, dialog open, pestaña familia). Tests (33 pass), typecheck y build limpios. |
| 23 | 2146d14 | Curva de niveles ampliada a nivel 30 con 10 títulos y XP total unificada (`puntosAcumulados + experienciaHabitos`). Catálogo de 20 logros evaluados dinámicamente (`logros.ts`). Página `/dashboard/perfil` responsiva (desktop 1440, mobile 390, dark/light) con resumen, hábitos activos, premios y roadmap de niveles. Integración en `NavUser`, `ModalManager` (reemplazo de `UserStatsPopup` con `PerfilResumen`) y `FamilyTree`. Control parental de acceso por query param `?usuarioId=`. 42 tests unitarios pasando, typecheck, lint y build limpios. Base de datos sin datos de prueba. |

### Cierre (2026-10-10, orquestador)
- Worktrees `ordo-diei-lanes/lane-21..23` y ramas `task/lane-21..23` borrados tras verificar que estaban mergeados y sin cambios.
- Error `Cannot read properties of undefined (reading 'upsert')` en `asegurarCatalogo`: el `next dev` del puerto 3000 se había levantado antes de que se regenerara el cliente de Prisma (modelos `Habito*`), y el singleton de `src/lib/prisma.ts` lo conserva en memoria. Se resolvió reiniciando el servidor; no era un bug del código. **Tras un `prisma db push`/`generate`, reiniciar `next dev`.**
- En `dev`: `npm test` 42/42 y `tsc` OK; `/dashboard/habitos`, `/dashboard/perfil` y `/api/habitos` responden 200.
- ~~Pendiente de la lane 22 (paso 5)~~ → hecho en la **lane 22b · `task/lane-22b-limpieza-oracion`** (ver abajo).

### Lane 22b · limpieza del Camino viejo (orquestador)
- Las tablas viejas **no estaban vacías**: Gabriel había comenzado el Camino hoy (`Planes_Oracion` 1 fila) y marcado el Completorium (`Registros_Oracion` 1 fila). Antes de borrar se migró a las tablas nuevas: la adopción de Completorium ya existía; el registro de hoy pasó a `Registros_Habito` como `hecho` con 10 XP (`Experiencia_Habitos` +10). No se adoptó el Rosario: ahora cada uno elige.
- Borrados `src/lib/oracion`, `src/components/oracion`, `src/app/api/oracion`, los modelos y enums de oración y sus back-relations. `/dashboard/oracion` queda como redirección a `/dashboard/habitos`.
- `db push --accept-data-loss` solo borró `Planes_Oracion` y `Registros_Oracion` (más sus 2 enums), verificado antes sin el flag. Copia de las 2 filas guardada fuera del repo antes de borrar.
- `tsc` OK, `npm test` 28/28 (salen los 14 tests del motor viejo), `next build` OK.
