# Meal planner (plan de comidas y lista de compras) — Especificación

> Amplía [`README.md`](README.md). Sin integración de e-commerce en v1.

## 1. Objetivo
Los padres planifican las comidas de la semana en minutos, la familia ve «qué se come hoy», y la app arma la **lista de compras** sin pensar.

## 2. Alcance por fases
- **F1 (MVP):** recetas + plan semanal + lista de compras tildable.
- **F2:** despensa/«ya tengo», repetir semana, quién cocina (tarea con XP), importar receta por enlace, marca de ayuno/abstinencia.
- **F3:** costos/presupuesto, integración con tienda en línea (Uruguay: evaluar), sugerencias.

## 3. Modelo de datos (F1)
```prisma
model Receta {
  id Int @id @default(autoincrement())
  titulo String; porciones Int @default(4); notas String?; imagenClave String?
  ingredientes Json   // [{ nombre, cantidad, unidad, seccion }]
  etiquetas String[]; favorita Boolean @default(false); creadaPorId Int
}
model ComidaPlan {
  id Int @id @default(autoincrement())
  fecha DateTime @db.Date
  tipo  String            // desayuno|almuerzo|merienda|cena
  recetaId Int?; textoLibre String?   // "Pizza del viernes" sin receta
  porciones Int?; notas String?
  @@unique([fecha, tipo])
}
model ItemCompra {
  id Int @id @default(autoincrement())
  semanaDesde DateTime @db.Date
  nombre String; cantidad Float?; unidad String?; seccion String?
  comprado Boolean @default(false); manual Boolean @default(false)
  origenRecetaIds Int[]
}
```
(Nombres de columnas con `@map` en el estilo del proyecto; SQL aditivo.)

## 4. UX/UI
- Entrada «Comidas» en la barra lateral (`/dashboard/comidas`). Todos ven; solo **padres** editan.
- **Semana** (lunes–domingo): cuadrícula 7 × comidas activas (por defecto almuerzo y cena; configurable). Celda = chip con título/foto; tocar abre selector de receta (búsqueda + favoritas + «Texto libre»). Arrastrar para mover/copiar entre días.
- **Hoy** (widget en el dashboard): «Hoy: Almuerzo — Milanesas · Cena — Sopa».
- **Recetas:** lista con búsqueda y etiquetas, formulario con ingredientes repetibles (cantidad/unidad/sección) y foto.
- **Lista de compras:** generada de la semana al pulsar «Armar lista»: junta ingredientes iguales (suma cantidades si la unidad coincide), agrupa por sección (verdulería, almacén…), permite agregar manuales y tildar en el super (móvil, táctil grande). Compartible como texto/WhatsApp.
- Estados vacíos guiados («Planifica tu primera semana»).
- Integra **borradores** (formularios de receta) y **sonidos** (`tap` opcional).

## 5. Reglas
- Las unidades se normalizan en una tabla simple (g/kg, ml/l, unidades, cucharadas); si no coinciden, se listan por separado.
- Editar el plan **no** reescribe la lista ya comprada: se marca «cambió el plan» y se pide regenerar.
- Cambiar porciones escala cantidades proporcionalmente.
- Marca litúrgica opcional (viernes/Cuaresma) usando el calendario litúrgico que ya existe para las cartas: sugerencia «Día de abstinencia», nunca obligación.

## 6. Criterios de aceptación
1. Un padre arma una semana en < 3 min con recetas ya creadas.
2. «Armar lista» agrupa y suma ingredientes repetidos (p. ej. 2 recetas con 200 g de harina → 400 g).
3. La lista se tilda en el móvil y el estado se ve en otros dispositivos al refrescar.
4. Los hijos ven el plan pero no pueden editar.
5. Pruebas unitarias de la función `armarLista` (sumas, unidades distintas, porciones).
