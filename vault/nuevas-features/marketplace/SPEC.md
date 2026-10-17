# Marketplace — Especificación

> **Implementado en la lane 103** con el nombre **«Tienda»** (`/dashboard/tienda`, administración en `/dashboard/admin/tienda`). Ver [`../../LANE_103_TIENDA.md`](../../LANE_103_TIENDA.md) para lo hecho y lo pendiente; la guía de UI usada está en [`ref/ui-tiendas-de-juegos.md`](ref/ui-tiendas-de-juegos.md).

> Decisiones D8–D12 de [`../DECISIONES.md`](../DECISIONES.md). Amplía el borrador de [`README.md`](README.md) (que queda como contexto). Economía de cartas: [`../../ECONOMIA_CARTAS.md`](../../ECONOMIA_CARTAS.md). Flujo de premios: lanes 85, 86, 87, 91, 93.

## 1. Visión
Una **tienda única** donde cada miembro gasta sus monedas en **todo lo comprable de la app**: sobres de cartas, premios físicos reales, vales y lo que los padres inventen. **El precio es la limitación**; además, un producto puede exigir nivel o logros para desbloquearse. Lo bloqueado se ve (candado + escala de grises) para dar una meta.

Principios:
1. **Un catálogo, muchas formas de pagar.** Cada producto define con qué monedas se compra (D10).
2. **Visible ≠ comprable.** Se lista todo lo que el usuario puede ver; el estado (bloqueado, agotado, sin saldo) se explica en la tarjeta (D12).
3. **Atómico y auditable.** Una compra o se completa entera o no pasa; queda registrada con lo que costó.
4. **No tocar lo que funciona.** Sobres y fragmentos siguen usando `comprarSobre`/`comprarFragmentosDirectos`. La Tienda de cartas actual no cambia.
5. **Comprar no baja el nivel.** Se debitan solo saldos gastables (`availablePoints`, `stars`, `incienso`…), nunca `puntosAcumulados` ni `experienciaHabitos` (de ahí sale el XP/nivel).

## 2. Monedas
Registro único `src/lib/marketplace/monedas.ts` (extensible sin migración de productos):

| Clave | Campo en `Usuario` | Nombre | Origen | Notas |
|---|---|---|---|---|
| `puntos` | `availablePoints` | Puntos | tareas aprobadas | `lockedPoints` (pendientes de aprobación) **no** se gastan. |
| `estrellas` | `stars` | Estrellas | 1 por 7 días de racha | escasa → ideal para productos caros. |
| `incienso` | `incienso` | Granos de incienso | fragmentos repetidos / premios | |

**Los cofres/sorpresas no son una moneda (D13):** son una fuente de premios. Lo que contienen sí se usa (D14): puntos → `availablePoints` y incienso → `incienso` (gastables en el Marketplace); XP → `experienciaHabitos` (sube de nivel y habilita requisitos, no se gasta); cartas/fragmentos → colección; vales/físicos → `Recompensa`.

Regla de implementación: **todo premio que otorgue una moneda debe acreditarla en el campo gastable** del registro de monedas (nunca solo en un acumulado). Si se agrega una moneda nueva, el registro `monedas.ts` es el único lugar a tocar y los premios de cofre/comportamiento deben poder otorgarla. Criterio de aceptación adicional: *abrir un cofre con 50 puntos y comprar un producto de 50 puntos funciona sin recargar*.

Cada moneda declara: icono, color de token, formato, `campo`. Un producto referencia solo la **clave**; agregar una moneda nueva = una fila en el registro + la columna.

## 3. Tipos de producto

| Tipo | Qué entrega | Cumplimiento |
|---|---|---|
| `sobre` | Un sobre de cartas (`meditacion`, `devocion`, `revelacion`, `gloria`) | Llama a `comprarSobre`; abre `ModalAperturaSobre`. Reglas de XP y descuento por racha del sobre se **mantienen** (producto del sistema). |
| `fragmentos` | Fragmentos de una carta concreta (cantidad fija) | Usa la lógica de `comprarFragmentosDirectos` (tope diario, XP por rareza). Tarjeta genérica «Fragmentos de cartas» enlaza a la Tienda de cartas para elegir la carta. |
| `fisico` | Un objeto/experiencia real (juguete, salida, dinero) | Crea una `Recompensa` `tipo:"compra"` en estado `reclamado` ⇒ aparece en **«por entregar»** de los padres (flujo ya existente). |
| `vale` | Un voucher canjeable | Crea `Recompensa` `tipo:"vale"` (`entregado`, sin abrir misterio) ⇒ `ValeTicket` ya existente; el padre lo honra al «arrancarlo». |
| *(fase posterior)* `canje` | Convertir monedas (ej. 100 pts → 1 ⭐) | Regla de cambio con límite diario. |
| *(fase posterior)* `cosmetico` | Marcos/avatares | Cuando exista esa capa. |

## 4. Modelo de datos (SQL aditivo; ver AGENTS.md §6)

```prisma
enum TipoProducto { sobre fragmentos fisico vale }
enum PeriodoLimite { siempre dia semana mes }
enum EstadoCompra { completada pendiente_aprobacion rechazada cancelada }

model ProductoMarketplace {
  id               Int            @id @default(autoincrement())
  tipo             TipoProducto   @map("Tipo")
  origen           String         @default("manual") @map("Origen")       // "sistema" | "manual"
  sistemaClave     String?        @unique @map("Sistema_Clave")           // p. ej. "sobre:gloria"
  titulo           String         @map("Titulo")
  descripcion      String?        @map("Descripcion")
  imagenClave      String?        @map("Imagen_Clave")                    // Archivo.clave
  categoria        String         @default("general") @map("Categoria")
  /// Alternativas de pago: [{ costos:[{moneda:"puntos",monto:200},{moneda:"estrellas",monto:1}] }, ...]
  precios          Json           @map("Precios")
  /// Reglas de desbloqueo (§6). [] = sin requisitos.
  requisitos       Json           @default("[]") @map("Requisitos")
  /// Datos propios del tipo: { sobre:"gloria" } | { cartaId, cantidad } | { texto }
  config           Json           @default("{}") @map("Config")
  stockTotal       Int?           @map("Stock_Total")                     // null = ilimitado
  stockRestante    Int?           @map("Stock_Restante")
  limiteUsuario    Int?           @map("Limite_Usuario")
  periodoLimite    PeriodoLimite  @default(siempre) @map("Periodo_Limite")
  disponibleDesde  DateTime?      @map("Disponible_Desde")
  disponibleHasta  DateTime?      @map("Disponible_Hasta")
  destinatarios    Json?          @map("Destinatarios")                   // [usuarioId] | null = todos
  requiereAprobacion Boolean      @default(false) @map("Requiere_Aprobacion")
  descuentoRacha   Boolean        @default(false) @map("Descuento_Racha")
  destacado        Boolean        @default(false) @map("Destacado")
  activo           Boolean        @default(true) @map("Activo")
  orden            Int            @default(0) @map("Orden")
  creadoPorId      Int?           @map("Creado_Por_ID")
  createdAt        DateTime       @default(now()) @map("Created_At")
  updatedAt        DateTime       @updatedAt @map("Updated_At")

  compras          CompraMarketplace[]
  desbloqueos      DesbloqueoProducto[]
  @@map("Productos_Marketplace")
}

model CompraMarketplace {
  id              Int           @id @default(autoincrement())
  productoId      Int           @map("Producto_ID")
  usuarioId       Int           @map("Usuario_ID")
  estado          EstadoCompra  @default(completada) @map("Estado")
  opcionPago      Int           @map("Opcion_Pago")                       // índice elegido
  costos          Json          @map("Costos")                            // snapshot [{moneda,monto}] realmente pagado
  producto        Json          @map("Producto_Snapshot")                 // título, tipo, imagen al comprar
  recompensaId    Int?          @unique @map("Recompensa_ID")
  claveIdempotencia String      @map("Clave_Idempotencia")
  resueltaPorId   Int?          @map("Resuelta_Por_ID")
  resueltaEn      DateTime?     @map("Resuelta_En")
  motivo          String?       @map("Motivo")
  createdAt       DateTime      @default(now()) @map("Created_At")

  producto_  ProductoMarketplace @relation(fields: [productoId], references: [id])
  usuario    Usuario             @relation(fields: [usuarioId], references: [id])

  @@unique([usuarioId, claveIdempotencia])
  @@index([usuarioId, productoId, createdAt])
  @@map("Compras_Marketplace")
}

/// Desbloqueo manual de un producto para un usuario concreto (requisito «lo aprueba un padre»)
model DesbloqueoProducto {
  productoId Int @map("Producto_ID")
  usuarioId  Int @map("Usuario_ID")
  porId      Int @map("Por_ID")
  createdAt  DateTime @default(now()) @map("Created_At")
  @@id([productoId, usuarioId])
  @@map("Desbloqueos_Producto")
}

/// Meta (lista de deseos): producto fijado por el usuario
model MetaMarketplace {
  usuarioId  Int @id @map("Usuario_ID")
  productoId Int @map("Producto_ID")
  @@map("Metas_Marketplace")
}
```
(Los nombres de relación exactos se afinan al implementar; se añade el back-relation en `Usuario`.) Migración **solo con `migrate diff` + revisar que no tenga `DROP`**.

## 5. Precios (D10)
- `precios` es una lista de **opciones**; cada opción es una **canasta** de una o más monedas que se pagan **juntas**. El comprador elige **una** opción.
  - Ejemplo sobre de Revelación: `[{costos:[puntos 250, estrellas 1]}]` (canasta mixta, como hoy).
  - Ejemplo juguete: `[{costos:[puntos 1500]}, {costos:[estrellas 6]}, {costos:[puntos 600, estrellas 3, incienso 40]}]`.
- Validación al guardar: ≥ 1 opción; cada opción ≥ 1 costo; monto entero ≥ 1; sin monedas repetidas dentro de una canasta.
- **Descuento por racha** (`descuentoRacha`): reduce solo los `puntos` de la canasta con `costoConDescuento` (igual que los sobres). Apagado por defecto en productos manuales.
- **Guía de calibración** (a ~20 pts/día y ≈20 pts por tarea; sobres actuales 120–700 pts): pequeño 100–400 pts (1–3 semanas), mediano 600–1500 pts, grande 3000+ pts o estrellas; «caprichos» muy escasos: 3–10 ⭐ (cada ⭐ ≈ 7 días de racha). Se muestra como ayuda en el formulario admin (tabla «¿cuánto tarda en juntarlo?»: precio ÷ 20 ⇒ días).

## 6. Requisitos de desbloqueo (D11)
Lista de condiciones (todas deben cumplirse). Unión discriminada validada con zod; evaluadas por una función pura `evaluarRequisito(req, ctx)` → `{ cumplido, actual, objetivo, texto }`.

| `tipo` | Parámetros | Se cumple si… | Texto de ejemplo |
|---|---|---|---|
| `nivel` | `min` | nivel ≥ min (`niveles.ts`) | «Nivel 7 · vas por el 5» |
| `xp` | `min` | XP total ≥ min | «2500 XP» |
| `racha` | `dias` | racha efectiva ≥ días | «Racha de 14 días» |
| `carta` | `cartaId`, `gradoMin` | tiene la carta desbloqueada (grado ≥ gradoMin) | «Desbloquea a San José» |
| `coleccion` | `cantidad` | cartas desbloqueadas ≥ cantidad | «20 cartas» |
| `habito` | `habitoId`, `dias` | racha del hábito ≥ días | «Reza 30 días seguidos» |
| `libro` | `libroId?` | terminó el libro (o cualquiera) | «Termina tu libro» |
| `tareas` | `cantidad`, `periodo?` | tareas completadas ≥ N (en el período) | «10 tareas esta semana» |
| `logro` | `logroId` | tiene el logro (`logros.ts`) | |
| `compraPrevia` | `productoId` | compró antes ese producto | «Compra el Sobre de Devoción» (cadenas de progreso) |
| `rol` | `roles[]` | su rol está incluido | |
| `padre` | — | un padre lo desbloqueó para él (`DesbloqueoProducto`) | «Pídele a tus padres que lo desbloqueen» |

- Contexto (`ctx`) se arma **una vez por carga** de la tienda con consultas agrupadas (no N+1).
- Las reglas se evalúan **otra vez en el servidor al comprar** (nunca confiar en el cliente).
- Se extiende agregando una rama a la unión + su evaluador + su editor admin.

## 7. Disponibilidad y escasez
- `stockTotal`/`stockRestante`: global de la familia (ej. «una sola salida a Beto Carrero»). Se descuenta atómicamente. Al llegar a 0 ⇒ «Agotado».
- `limiteUsuario` + `periodoLimite`: «máx. 1 por mes por persona». Se cuenta sobre compras `completada`/`pendiente_aprobacion`.
- `disponibleDesde/Hasta`: ventanas de evento (Navidad, cumpleaños). Antes: «Disponible desde el 20/12». Después: oculto.
- `destinatarios`: solo ciertas personas lo ven (null = todos). Los padres ven todo en admin.
- `activo=false`: oculto.
- **Aprobación:** `requiereAprobacion` ⇒ la compra queda `pendiente_aprobacion` y el costo se **descuenta ya** (reserva); un padre aprueba (⇒ se cumple) o rechaza (⇒ **reembolso** completo y stock devuelto).

## 8. Estados de una tarjeta para quien mira (precedencia)

| Prioridad | Estado | Presentación |
|---|---|---|
| 1 | `oculto` (inactivo, fuera de ventana vencida, no destinatario) | no se lista |
| 2 | **`bloqueado`** (algún requisito sin cumplir) | **escala de grises + candado**, sin botón de compra, lista qué falta |
| 3 | `proximamente` (antes de `disponibleDesde`) | grises suaves, fecha |
| 4 | `agotado` (stock 0) | color atenuado + sello «Agotado» |
| 5 | `limite` (alcanzó su límite del período) | sello «Ya lo compraste · otra vez el 3/11» |
| 6 | `sinSaldo` (cumple todo, falta saldo en **todas** las opciones) | color normal, precio en tono de aviso, «Te faltan 340 pts» |
| 7 | `comprable` | color normal, botón **Comprar** |

Calcular en una función pura `estadoProducto(producto, ctx)` con tests por cada fila.

## 9. UX/UI — Marketplace (lado de los miembros)

### 9.1 Ubicación
Entrada **«Marketplace»** en la barra lateral (`AppSidebar`, icono de tienda) y ruta `/dashboard/marketplace`. La Tienda de cartas sigue en su lugar y se enlaza desde la categoría «Cartas».

### 9.2 Pantalla principal
```
┌ Marketplace ──────────────────────────────────────────────┐
│ Tus monedas:  [ 840 pts ] [ 3 ⭐ ] [ 55 ✦ ]                │  ← siempre visibles (sticky)
│ Mi meta: Bicicleta  ▓▓▓▓▓▓░░░░ 62 %  (faltan 570 pts)      │  ← si hay meta
│ [Todo][Cartas][Premios][Vales][Experiencias]   ☐ Solo lo que puedo comprar   Orden ▾ │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│ │ imagen │ │ imagen │ │░░🔒░░░░│ │ imagen │               │
│ │ título │ │ título │ │░ gris ░│ │ título │               │
│ │ 120 pts│ │ 8 ⭐   │ │ Nivel 9│ │Agotado │               │
│ └────────┘ └────────┘ └────────┘ └────────┘               │
└────────────────────────────────────────────────────────────┘
```
- Grilla responsiva (2 col móvil, 3–4 tablet/escritorio). Tarjeta = `Card` prebuilt, imagen 4:3, título, **precio** (chips de moneda; si hay varias opciones, la más barata + «+2 formas de pagar»), insignia de tipo y de escasez («Quedan 2»).
- **Bloqueado:** imagen en `grayscale`, candado centrado (mismo tratamiento que `CartaVista` en modo `bloqueada`, lane 45), sin sombra de color, y una línea «🔒 Nivel 9» con el **requisito más cercano**. Sigue siendo tocable (abre el detalle con la lista completa).
- Orden por defecto: destacados → comprables → sin saldo → bloqueados → agotados; alterno: precio ↑/↓, novedades.
- Filtros: categoría (pestañas), «Solo lo que puedo comprar», búsqueda por texto (≥ 12 productos).
- Vacío: «Todavía no hay productos. Pídele a tus padres que agreguen algunos» (padres: botón «Agregar producto»).
- Skeletons al cargar; actualización cada 15 s reusando el `router.refresh` de `ActualizarPremios` (saldo y stock en vivo).

### 9.3 Detalle del producto (`Dialog`/`Drawer` prebuilt)
- Imagen grande, título, descripción, insignias (tipo, stock, límite, fecha).
- **«Cómo pagar»**: selector de opción (radio cards) si hay varias; cada una muestra las monedas y si **alcanzan** (✓ / «te faltan X»). Por defecto, la primera que alcanza.
- **«Para desbloquear»** (si hay requisitos): checklist con barras de progreso (`Progress`), ✓ cumplidos y ○ pendientes; el `padre` muestra «Pídeselo a tus padres».
- Botón **Comprar** (deshabilitado con motivo textual cuando no se puede) y **«Fijar como mi meta»** (♡/⭐).
- Para `fisico`/`vale`: nota «Tus padres lo recibirán y te lo entregarán» (o «se aprueba primero» si `requiereAprobacion`).

### 9.4 Confirmación y resultado
1. Confirmación (`AlertDialog`): «¿Comprar *Bicicleta* por **1500 pts**? Te quedarán 340 pts.» [Cancelar] [Comprar].
2. Botón con `Spinner` y anti doble clic (clave de idempotencia por intento).
3. Éxito: según tipo — `sobre` ⇒ `ModalAperturaSobre`; `fisico`/`vale`/`aprobación` ⇒ modal con confites (el de reconocimiento, lane 89) «¡Listo! Avisamos a tus padres» + enlace a **Mis premios**; sonido de compra (ver `../sonidos-ui/`). Los saldos se actualizan sin recargar.
4. Errores con `toast` en español claro (sin saldo, agotado, requisito, límite, «alguien lo compró hace un instante»).

### 9.5 Después de comprar
- `fisico` aparece en **Mis premios → por entregar/entregados** (flujo existente) con origen «Marketplace».
- `vale` aparece como ticket.
- **Historial**: pestaña «Mis compras» con fecha, producto, lo que pagó y estado (entregado / en camino / en aprobación / rechazado — con reembolso visible).

### 9.6 Accesibilidad y estados
Candado con `aria-label="Bloqueado: necesita nivel 9"`; no depender solo del color/gris (texto del requisito); foco gestionado en diálogos; objetivos táctiles ≥ 44 px; respeta modo claro/oscuro y `prefers-reduced-motion`.

## 10. UX/UI — Administración (padres) (D9)

### 10.1 Navegación
`PanelAdmin` → grupo **«Marketplace»** con 2 accesos: «Productos» y «Compras» (badge con **por aprobar + por entregar**). Rutas `/dashboard/admin/marketplace` (productos) y `/dashboard/admin/marketplace/compras`.

### 10.2 Productos
- Lista/tabla: imagen, título, tipo, precio resumido, stock, estado (activo / agotado / programado), ventas. Acciones: Editar, Duplicar, Pausar, Eliminar (solo sin compras; si tiene, se archiva).
- Reordenar por arrastre (`orden`). Marcar destacado.
- Los **productos del sistema** (sobres) aparecen con insignia «Sistema»: solo se pueden **ocultar** o asignar requisitos/destinatarios extra; el **precio sale de `economia.ts`** (una sola fuente de verdad) y se muestra de solo lectura.
- **Plantillas** al crear: «Premio físico», «Vale», «Salida/experiencia», «Tiempo de pantalla» (rellenan tipo y textos).

### 10.3 Formulario de producto (secciones plegables + vista previa en vivo, patrón de `AdminVistaPreviaEnVivo`)
1. **Básico:** tipo, título, descripción, categoría, imagen (subida existente, recorte 4:3), destacado.
2. **Precio:** lista de opciones; cada una con filas `[moneda ▾][monto]` y «+ Moneda»; «+ Otra forma de pagar»; interruptor «Aplicar descuento por racha». Ayuda: «Tardan ~N días en juntarlo».
3. **Disponibilidad:** stock (ilimitado / cantidad), límite por persona y período, fechas, destinatarios (chips de personas), «Requiere mi aprobación».
4. **Desbloqueo:** constructor de requisitos (+ Nivel / Racha / Carta / Hábito / …); vista del texto resultante.
5. **Entrega:** según tipo (sobre: elegir cuál; vale: texto «Vale por…»; físico: nota de entrega).
- **Vista previa en vivo** de la tarjeta en sus estados (normal, bloqueada, agotada) y selector «Ver como: [persona]» que evalúa requisitos y saldo reales.
- Guardado con validación zod compartida cliente/servidor; integra **borradores** (`../sesion-inactividad-borradores/SPEC.md`, modo `final` si válido).

### 10.4 Compras
Pestañas: **Por aprobar** · **Por entregar** · **Historial**.
- Por aprobar: [Aprobar] [Rechazar (motivo opcional ⇒ reembolso)].
- Por entregar: el flujo `Recompensa` ya existente (marcar entregado). Se reutiliza el componente de entrega, no se duplica.
- Historial: filtros por persona/producto/fecha; **Cancelar y reembolsar** una compra no entregada (restituye monedas y stock; deja registro).
- Resumen: monedas «circulando» por persona y gasto del mes (opcional, fase 2).

### 10.5 Desbloqueo manual
En el detalle del producto (admin): «Desbloquear para…» (chips de personas) ⇒ `DesbloqueoProducto`; resuelve el requisito `padre`.

## 11. API

| Ruta | Método | Auth | Descripción |
|---|---|---|---|
| `/api/marketplace` | GET | sesión | Catálogo para el usuario: productos visibles + `estado` + progreso de requisitos + saldos + meta. |
| `/api/marketplace/[id]` | GET | sesión | Detalle. |
| `/api/marketplace/[id]/comprar` | POST `{ opcion, clave }` | sesión | Compra atómica (§12). |
| `/api/marketplace/meta` | PUT/DELETE | sesión | Fijar/quitar meta. |
| `/api/marketplace/compras` | GET | sesión | Historial propio. |
| `/api/admin/marketplace/productos` | GET/POST | padre | Listar / crear. |
| `/api/admin/marketplace/productos/[id]` | PATCH/DELETE | padre | Editar / archivar. |
| `/api/admin/marketplace/productos/[id]/desbloquear` | POST/DELETE | padre | Desbloqueo manual. |
| `/api/admin/marketplace/compras` | GET | padre | Por aprobar / entregar / historial. |
| `/api/admin/marketplace/compras/[id]` | PATCH `{accion:"aprobar"|"rechazar"|"cancelar"}` | padre | Resolver. |

## 12. Algoritmo de compra (servidor, una transacción)
1. Autenticar; cargar producto (`FOR UPDATE`) y usuario.
2. Idempotencia: si existe `(usuarioId, clave)` ⇒ devolver la compra previa.
3. Validar: activo, ventana de fechas, destinatario, **requisitos** (`evaluarRequisitos`), límite por período, stock > 0.
4. Elegir opción; aplicar descuento por racha si corresponde; **validar saldo de cada moneda**.
5. Debitar con `updateMany where campo >= monto` (si `count=0` ⇒ «saldo insuficiente», sin efectos).
6. Descontar stock (`stockRestante` con condición `> 0`).
7. Crear `CompraMarketplace` con snapshot de costos y producto.
8. Cumplir por tipo: `sobre` ⇒ ejecutar el sorteo existente **dentro de la misma transacción** o devolver el id de apertura; `fragmentos` ⇒ otorgar; `fisico`/`vale` ⇒ crear `Recompensa`; con aprobación ⇒ estado `pendiente_aprobacion`.
9. Registrar en `HistorialAccion`.
10. Responder con saldos nuevos y el resultado.
Reembolso: inverso (monedas, stock, estado) en una transacción; nunca reembolsa dos veces (condición de estado).

Los sobres del sistema **no duplican** su lógica: el endpoint delega en `comprarSobre`; las compras de sobre también quedan en `CompraMarketplace` para el historial unificado.

## 13. Seguridad y reglas anti-abuso
- Solo padres CRUD de productos y resolución de compras (`esPadre`).
- Los hijos nunca reciben `precios` de productos ocultos/no destinatarios, ni el stock exacto si es sensible (mostrar «Quedan pocos»).
- Todo cálculo de precio, requisito y saldo se hace en servidor.
- Límite de ritmo por usuario para `comprar`.
- Productos `fisico` de alto valor: se recomienda `requiereAprobacion`.

## 14. Pruebas
- Unitarias: `evaluarRequisito` por cada tipo; `estadoProducto` (precedencia); validación de precios; descuento; límite por período.
- Integración (con `PERMITIR_TESTS_DB=1` solo si el usuario lo pide): compra feliz, saldo insuficiente, stock concurrente (2 compras, 1 unidad), idempotencia, reembolso.

## 15. Criterios de aceptación
1. Un padre crea un producto físico con 2 formas de pagar, stock 1, requisito «Nivel 5», y aparece para los hijos.
2. Un hijo de nivel 3 lo ve **gris y con candado**, con «Nivel 5 · vas por el 3»; no puede comprar.
3. Al llegar a nivel 5 pasa a color; con saldo en cualquiera de las dos opciones puede comprarlo.
4. La compra descuenta solo las monedas de la opción elegida, **no baja el nivel**, deja una `Recompensa` por entregar y avisa a los padres (badge).
5. Dos hijos compran a la vez la última unidad: uno compra, el otro ve «Agotado» sin perder monedas.
6. Los 4 sobres aparecen como productos del sistema y se compran igual que hoy (mismos precios, XP, descuento por racha).
7. Rechazar una compra con aprobación reembolsa todas las monedas y devuelve el stock.
8. Un padre puede cancelar y reembolsar una compra no entregada; una entregada no.
9. Un reintento con la misma clave de idempotencia no cobra dos veces.

## 16. Fuera de alcance de la primera entrega
`canje` entre monedas, cosméticos, reseñas/valoraciones, carrito de varios productos, regalos entre usuarios, informes de gasto.
