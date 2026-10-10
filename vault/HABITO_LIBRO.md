# Hábito "Leer un libro" y premios reclamables

> Pedido (2026-10-10), copiado **textual** en §1. Decisiones en §2, modelo en §3, lane en §5.

Rama base: `dev` · Lane 38 · `task/lane-38-habito-libro`, sin PR a `main`. La implementa el orquestador (Claude). Extiende [HABITOS_Y_NIVELES.md](HABITOS_Y_NIVELES.md).

---

## 1. Pedido textual del usuario

> Quiero agregar un nuevo habito recomendado: "Leer un libro"
>
> Debe empezar con leer dos páginas por dia.
>
> Luego a la semana 4 páginas.
>
> A las 2 semanas6 paginas.
>
> A las 4 semanas 8 paginas.
>
> Y que tenga un selector para ingresar cuantas páginas se leyó al marcar completado el habito.
>
> Se debe guardar la cantidad de paginas leidas.
>
> Al crear el habito se debe pedir el numero del Libro y la cantidad de páginas.
>
> Luego el habito debe tener una barra de progreso, que calcule la cantidad de paginas leidas sobre la cantidad de paginas totales.
>
> Finalizar un libro da como premio pedir un nuevo libro.
>
> Debe haber un lugar donde se guarden los premios y haciendo click en el premio, que se pueda reclamar el premio (eso enviaria una notificacion a los padres o apareceria en algun lugar, para que sepan que deben entregar ese premio).
>
> En el caso del libro, al reclamar se debe especificar en un campo de texto qué libro se desea.

Checklist contra el pedido:

- [x] R1 Hábito del sistema **recomendado** "Leer un libro".
- [x] R2 Escalera: 2 páginas → (1 semana) 4 → (2 semanas) 6 → (4 semanas) 8.
- [x] R3 Selector de páginas leídas al marcar "Hecho".
- [x] R4 Se guardan las páginas leídas.
- [x] R5 Al adoptarlo se pide el libro y su cantidad de páginas.
- [x] R6 Barra de progreso páginas leídas / páginas totales.
- [x] R7 Terminar el libro da el premio "pedir un libro nuevo".
- [x] R8 Lugar donde se guardan los premios; click → reclamar.
- [x] R9 Al reclamar, los padres se enteran (aparece en algún lugar) para entregarlo.
- [x] R10 Premio libro: al reclamar, campo de texto con el libro deseado.

## 2. Decisiones (del orquestador; corregibles)

- **D1 · "numero del Libro"** se interpreta como **nombre (título) del libro**.
- **D2 · Escalera por días seguidos**, como el resto de los hábitos: `2 páginas` (7) → `4 páginas` (7) → `6 páginas` (14) → `8 páginas`. Con constancia perfecta coincide con el calendario pedido (día 8 → 4, día 15 → 6, día 29 → 8). Un corte reinicia el conteo del paso y una recaída baja un paso, igual que en el Rosario.
- **D3 · Categoría** `cuidado` (da 5 puntos por día, como orden y cuidado), franja `noche`, ancla sugerida "Antes de dormir", ícono `BookMarked`. Recomendado para empezar.
- **D4 · Selector de páginas:** al tocar "Hecho" se abre un popover con − / número / +, que arranca en la meta del paso actual. Mínimo 1, máximo 2000. Leer menos que la meta igual cuenta como hecho (se premia leer); la meta se muestra como receta.
- **D5 · Libro activo:** cada usuario tiene a lo sumo un libro en curso por hábito. Las páginas de cada registro se asocian al libro en curso. Si no hay libro en curso (ya terminó y todavía no cargó el siguiente), igual puede marcar el día: las páginas se guardan sin libro y la tarjeta invita a cargar el próximo.
- **D6 · Terminar:** cuando la suma de páginas del libro alcanza el total, el libro queda terminado y se crea el premio **"Un libro nuevo"** (uno por libro, idempotente). Si se deshace el registro que lo terminó y el premio aún no se reclamó, se revierte (libro en curso otra vez, premio borrado). Si ya se reclamó, queda.
- **D7 · Premios reclamables** = modelo nuevo `Recompensa`, separado de los "Premios sorpresa" (`Premio`/`PremioEntregado`, que son de tareas y los configura el admin). Estados: `disponible` → `reclamado` → `entregado`.
- **D8 · Dónde se ven:** página nueva **Mis premios** (`/dashboard/mis-premios`) en la barra lateral, grupo *Rutina*, con insignia:
  - Hijos: premios disponibles para reclamar.
  - Padres: además, sección **"Para entregar"** con lo que reclamó cada miembro (qué libro pidió) y botón **"Marcar entregado"**. La insignia de los padres cuenta los reclamos pendientes de toda la familia: ese es el aviso (R9). No hay push/email en la app; queda como idea futura.
- **D9 · Reclamar:** click en el premio → diálogo; para el premio libro, campo obligatorio "¿Qué libro querés?" (máx. 200 caracteres).

## 3. Modelo de datos (aditivo)

```prisma
enum EstadoRecompensa { disponible reclamado entregado }

model Libro {               // @@map("Libros")
  id, usuarioId, habitoId, titulo String, paginas Int,
  iniciadoEn DateTime @default(now()), terminadoEn DateTime?
  registros RegistroHabito[], recompensa Recompensa?
}
RegistroHabito + paginas Int? @map("Paginas"), libroId Int? @map("Libro_ID")
model Recompensa {          // @@map("Recompensas")
  id, usuarioId, tipo String /* "libro" */, titulo String, origen String?,
  libroId Int? @unique, estado EstadoRecompensa @default(disponible),
  pedido String? /* qué libro desea */, ganadaEn, reclamadaEn?, entregadaEn?, entregadaPorId?
}
```

## 4. Superficie

- Catálogo: `libro` en `CATALOGO`, `Paso.meta` (páginas por paso).
- API:
  - `POST /api/habitos/adopciones` acepta `libro: { titulo, paginas }` por ítem.
  - `PUT /api/habitos/registro` acepta `paginas` (obligatorio en `libro` con marca `hecho`).
  - `POST /api/habitos/libros` carga el próximo libro.
  - `GET /api/recompensas`, `POST /api/recompensas/[id]` con `accion: "reclamar" | "entregar"`.
- UI:
  - `HabitoDialog` paso 2: título y páginas del libro.
  - `HabitoCard`: popover de páginas, barra del libro, "Empezar otro libro".
  - `/dashboard/mis-premios` y entrada en la barra lateral.

## 5. Lane

- [x] **Lane 38 · `task/lane-38-habito-libro`** (base `dev`): todo lo anterior, con tests del cálculo de progreso y del premio.

**Cuidado con las lanes de cartas (30–37):** se ramificaron antes de esta lane. Nunca `prisma db push` (regla 6 de `AGENTS.md`): desde una rama sin `git merge dev` borraría `Libros` y `Recompensas`.

## 6. Registro

| Lane | Merge | Notas |
|---|---|---|
| 38 | (ver git log) | Implementada por el orquestador. `Libros`, `Recompensas` y `Registros_Habito.Paginas/Libro_ID` creados con SQL **aditivo** (`prisma db execute`), no con `db push`: la base ya tiene las tablas de cartas de la lane 31 y un push desde `dev` las habría borrado. `npm test` 31/31, `tsc`, eslint y `next build` OK. E2E contra `next start` en :3121 con dos usuarios temporales (hijo y padre), 21/21: escalera, páginas obligatorias, progreso, terminar → premio, deshacer → reabrir, reclamar con pedido, permisos (403), entrega por el padre, libro nuevo, páginas SSR 200. Datos de prueba borrados. **Sin revisión visual en navegador.** Tras el `prisma generate`, reiniciar `next dev`. |
