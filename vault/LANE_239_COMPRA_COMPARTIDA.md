# Lane 239 — Compra Compartida en el Marketplace (Tienda)

**Pedido (textual, 2026-10-17):**
> Quiero implementar la compra compartida en el marketplace, que dos o mas usuarios puedan unir economia para comprar algo. Un usuario sollicita  
> una compra compartida, selecciona a los participantes y envia la solicitud, si todos aceptan se les debita lo que aceptaron pagar y queda hecha
> la compra. la distribucion de cuanto paga cada uno es recomendada no fija. por ejemplo un usuario puede elegir pagar una estrella y puntos
> mientras los demas solo pagan puntos o una parte. lo que no se permite es que uno de los usuarios no cumpla con las condiciones, por ejemplo
> nivel, XP, o cualquier condicion que bloquee la compra. todos deben cumplir los requisitos para la compra, con excepcion de no tener monedas
> suficientes, porque compartiran el gasto.

## Hecho

1. **Base de Datos & Esquema (SQL aditivo, sin `db push`)**:
   - Enums:
     - `EstadoCompraCompartida` (`pendiente`, `completada`, `rechazada`, `cancelada`).
     - `EstadoParticipanteCompra` (`pendiente`, `aceptada`, `rechazada`).
   - Modelos:
     - `CompraCompartida` (`@@map("Compras_Compartidas")`): producto, opción elegida, solicitante, estado, fecha de expiración, relación 1-a-1 con `CompraTienda`.
     - `ParticipanteCompraTienda` (`@@map("Participantes_Compra_Tienda")`): usuario, estado de aceptación, aportes por moneda (`puntos`, `estrellas`, `incienso`).
   - Relaciones añadidas a `Usuario`, `ProductoTienda` y `CompraTienda`.
   - Generación de diff limpio con `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` y aplicación segura mediante `npx prisma db execute`.

2. **Lógica de Dominio Pura (`src/lib/tienda/compartida.ts`)**:
   - `evaluarAptitudParticipante`: evalúa los requisitos del producto para cada miembro familiar. Se consideran aptos quienes tendrían estado `"comprable"` o `"sinSaldo"` (la falta de monedas individuales está expresamente permitida porque compartirán el gasto). Cualquier requisito insatisfecho (`nivel`, `xp`, `racha`, `tareas`, `bloqueado`, `limite`, `oculto`, `agotado`, o sanción activa en el día) marca al participante como no apto y explica el motivo.
   - `recomendarDistribucion`: algoritmo equitativo adaptativo tipo water-filling por moneda. Si un producto cuesta por ejemplo 1 estrella y 150 puntos, le asigna la estrella al usuario que tiene estrellas disponibles y divide los puntos equitativamente respetando los topes de saldo.
   - `validarDistribucion`: valida que haya al menos 2 participantes únicos, montos enteros no negativos, que cada participante cuente con saldo suficiente para su cuota prometida y que la suma de aportes por cada moneda coincida exactamente con el costo de la opción seleccionada.

3. **Backend & Rutas API**:
   - `src/lib/tienda/server.ts`:
     - Carga familiar en batch (`cargarPersonas`) y cálculo de aptitud de cada familiar para cada producto disponible en la Tienda (`aptitudFamiliar`).
     - `listarComprasCompartidas`: solicitudes pendientes y recientes del usuario (como solicitante o invitado).
     - `crearCompraCompartida`: valida aptitud de todos los miembros seleccionados, verifica saldos del solicitante y crea la solicitud con el solicitante en estado `aceptada`.
     - `responderCompraCompartida`: procesa `aceptar`, `rechazar` y `cancelar`. Cuando el último participante acepta, ejecuta una transacción atómica con lock consultivo (`pg_advisory_xact_lock`), re-verifica aptitud y saldo de todos los participantes, debita a cada uno lo acordado y materializa la compra (`crearRecompensaTienda`, apertura de sobre o vale).
     - Cancelación / rechazo de compras compartidas por padres en administración o por sistema reembolsa a cada participante exactamente lo que aportó.
   - Rutas API:
     - `GET /api/tienda/compartida`: lista compras compartidas del usuario.
     - `POST /api/tienda/compartida`: crea una nueva solicitud validada con Zod.
     - `PATCH /api/tienda/compartida/[id]`: aceptar, rechazar o cancelar una solicitud.

4. **UI & Experiencia de Usuario**:
   - `DetalleProducto.tsx`: botón «Compra compartida» habilitado para productos comprables o sin saldo (incluso si el usuario individualmente no tiene saldo suficiente pero cumple los demás requisitos).
   - `CompraCompartida.tsx`:
     - `FormularioCompraCompartida`: selector visual de participantes con avatares, niveles y badge de bloqueo si no cumplen condiciones; reparto de costos sugerido con botón «Reparto sugerido» y edición libre por usuario y moneda con botón «Resto» para cuadrar totales.
     - `SeccionComprasCompartidas`: panel de solicitudes pendientes en la parte superior de la Tienda con detalle de aportes de cada miembro, botón «Aceptar mi parte» y botón «Rechazar» o «Cancelar».
   - `TiendaView.tsx`: integra `SeccionComprasCompartidas` y actualiza reactivamente el catálogo y compras.
   - `PartesTienda.tsx`: etiqueta `Compartida (Participante1, Participante2)` en el historial de «Mis compras».
   - `AdminTiendaView.tsx`: visualización del desglose de participantes y aportes individuales en el panel de administración.
   - `AppSidebar.tsx` & `layout.tsx`: badge con contador de compras compartidas pendientes sobre el ítem «Tienda» en la barra lateral.

5. **Pruebas y Verificación**:
   - 13 pruebas unitarias completas en `src/lib/tienda/tienda.test.ts` cubriendo aptitud individual, reparto equitativo, aportes mixtos (`estrellas + puntos`), validación de balances y esquemas Zod.
   - Verificación de TypeScript sin errores (`npx tsc --noEmit`).
