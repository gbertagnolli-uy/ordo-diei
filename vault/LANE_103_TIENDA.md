# Lane 103 — Tienda (marketplace): página, productos, compras y administración

**Pedido (textual, 2026-10-13):**
> Empecemos con el marketplace.
>
> Para ello quiero usar la pagina de Tienda.
>
> Ademas de eso quiero agregar un nuevo link en el sidebar en el dock para ir a la tienda, con icono de carrito.
>
> Hoy la tienda de sobre está en dashboard/cartas en un tab.
>
> Quiero quitar ese tab y centralizar todo en el marketplace llamado "Tienda".
>
> Las cartas tienen un botón debajo que dice ir a tienda o algo similar, deberia conducir a la nueva página.
>
> Para el UI del marketplace quiero adaptar esta estructura (teniendo en cuenta que no venderemos nada con dinero real, todo será canje de premios o puntos o monedas): *(guía «Cómo organizan el UI las tiendas de juegos freemium», copiada completa en [`nuevas-features/marketplace/ref/ui-tiendas-de-juegos.md`](nuevas-features/marketplace/ref/ui-tiendas-de-juegos.md))*

Especificación completa: [`nuevas-features/marketplace/SPEC.md`](nuevas-features/marketplace/SPEC.md). Decisiones previas en [`nuevas-features/DECISIONES.md`](nuevas-features/DECISIONES.md) (D8–D14).

## Hecho
- **Ruta `/dashboard/tienda`** («Tienda»). Entrada con ícono de carrito en la **barra lateral** (grupo Colección) y en el **dock**. En Cartas: se quitó la pestaña «Tienda» (y `TiendaCartasView`); `/dashboard/cartas?tab=tienda` redirige a la Tienda; el botón de la carta ahora dice «Ir a la Tienda» y lleva a `/dashboard/tienda`; la colección también tiene «Ir a la Tienda».
- **UI adaptada de la guía** (sin dinero real): barra de saldos fija con «Ganar monedas» (el «+» lleva a tareas, hábitos y premios, nunca a una recarga) → «Oferta del día» (la fiesta litúrgica de hoy, ×1,5, con cuenta regresiva: lo único que vence) → «Mi meta» (producto fijado con barras de progreso por moneda) → 4 chips de categoría (Todo, Cartas, Premios, Vales) + «Solo lo que puedo comprar» → fila de **Destacados** → grilla de 2 columnas. Tarjeta entera clicable, arte grande, precio con ícono de moneda siempre visible. **Bloqueado = grises + candado + el requisito más cercano**; agotado, límite y «te faltan X» con texto. Detalle en bottom sheet; compra en **2 pasos** (elegir forma de pago → confirmar con lo que te queda) con idempotencia; celebración con confites; «Mis compras».
- **Monedas**: puntos, estrellas, incienso (`lib/tienda/monedas.ts`); los cofres no son moneda y lo que dan se gasta (D13/D14). El precio de cada producto es una lista de **formas de pago**, cada una una canasta de monedas.
- **Productos del sistema**: los 4 sobres (precios, XP y descuento por racha siguen saliendo de `economia.ts`; compra vía `comprarSobre`) y «Fragmentos de una carta» (selector de carta/cantidad/moneda dentro del detalle, misma API de siempre). Quedan en el historial de compras.
- **Productos manuales** (físico/vale) con precio multimoneda, stock, límite por persona y período, ventana de fechas, destinatarios, aprobación del padre, descuento por racha y **requisitos** (nivel, XP, racha, tareas, cartas consagradas, carta concreta, compra previa, rol, «lo desbloquea un padre»). Físico → `Recompensa` «por entregar» (flujo existente); vale → ticket ya abierto.
- **Administración** (`/dashboard/admin/tienda`, acceso desde el Panel): lista de productos (visible, destacado, editar, duplicar, eliminar/archivar), formulario por secciones con **vista previa en vivo** (incluye «ver bloqueado»), compras (por aprobar, por entregar, historial; aprobar, rechazar y cancelar **reembolsan**, una sola vez; los sobres abiertos no se reembolsan).
- **Esquema** (SQL aditivo aplicado sin `db push`): `Productos_Tienda`, `Compras_Tienda`, `Desbloqueos_Producto`, `Metas_Tienda` + enums `TipoProducto`, `PeriodoLimite`, `EstadoCompra`.
- **Pruebas**: 10 tests puros (`lib/tienda/tienda.test.ts`: precios, requisitos, estados y validación). Además se verificó contra la base con un usuario y productos temporales (ya borrados): compra, idempotencia, stock, bloqueo, aprobación, reembolso, carrera por la última unidad y sobre del sistema.

## Pendiente / decisiones abiertas
- Tipos de requisito `habito`, `libro` y `logro` del SPEC (necesitan datos de hábitos): no incluidos todavía.
- Reordenar productos por arrastre, productos de tipo `canje` y cosméticos (fase posterior).
- Sonido de compra (espera la carpeta de sonidos, ver `nuevas-features/sonidos-ui/SPEC.md`).
- Punto rojo en el dock/sidebar cuando hay novedades en la Tienda (la guía lo recomienda): falta definir qué cuenta como «novedad».
