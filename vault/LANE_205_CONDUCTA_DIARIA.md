# Lane 205 — Conducta diaria: registro, perfil y resumen de los hijos

**Pedido (textual):**
> Quiero separar lo que es regalar un premio a los hijos, con marcar el comportamiento diario.
>
> Debe haber una nueva página en "panel de administración", para registrar comportamiento.
>
> Ahí debería haber un selector de hijo y el mismo component usado para el nivel de dificultad de la tarea, que se use para definir el nivel de comportamiento.
>
> Además de eso debe haber un panel extra que muestre el comportamiento de cada niño en su perfil personal.
>
> También los padres deben tener un panel centralizado donde vean el resumen de los hijos, con tabs para ver cada hijo, algo que al golpe de vista se pueda ver el comportamiento/rendimiento/pendientes/tareas/etc de cada hijo

## Decisiones
- «Comportamiento» (lane 80, premios sorpresa y penitencias) queda como está, pero en el panel pasa a llamarse **«Regalar premio»**: es solo regalar.
- Nueva tabla `Conducta_Dias`: un nivel (1–5) por hijo y por día, con nota opcional; registrar otra vez el mismo día lo corrige. Niveles: Muy mal, Mal, Regular, Bien, Excelente.
- El selector de nivel es el mismo `SloshGauge` de la dificultad de la tarea, extraído a `SelectorNivel` y usado por ambos (sin cambiar el comportamiento de `TaskForm`).
- Páginas: `/dashboard/admin/conducta` (registrar, solo padres) y `/dashboard/admin/hijos` (resumen con una pestaña por hijo, solo padres).
- Perfil: tarjeta «Conducta» con promedio, tira de los últimos 14 días y últimas notas (la ve el hijo y los padres).

## Lane 209 — el selector de conducta tiene que verse líquido
**Pedido (textual):** «ademas el componente de barra no tiene fluidez, ni viscosidad, ni animación, para completar el nivel de comportamiento del niño»

- `SelectorNivel` gana `llenarAlMontar` (el líquido arranca vacío y se llena hasta el nivel al abrir) y `fluidez` (viscosidad, salpicadura, inclinación del `SloshGauge`). El registro de conducta los usa con más rebote (viscosidad 0.1, salpicadura 0.55, inclinación 0.7) y un gauge más alto; la dificultad de la tarea queda igual.
- Si el sistema tiene «reducir movimiento» activado, el `SloshGauge` apaga el rebote y la inclinación por accesibilidad (no es un fallo).

## Lane 210 — notas y evaluaciones visibles para el niño; breadcrumb de Administración
**Pedido (textual):** «ademas tanto las notas de registrar comportamiento como las evaluaciones de cuando se registra un comportamiento al regalar un premio, no se muestran al niño, no se muestran en ningun lado» y «En los breadcumbs del panel de administración, el principal "Administración" debería ser un enlace a /dashboard/admin»

- Antes la evaluación de un premio solo se veía dentro del modal al abrirlo (y después se perdía), y las penitencias y las notas del día no se mostraban en ningún lado.
- Ahora el servidor devuelve la evaluación también después de abrir el premio y la tarjeta de «Mis premios» la muestra entre comillas (mientras el premio está sin abrir sigue siendo sorpresa).
- El panel «Conducta» del perfil (y la pestaña de cada hijo en el resumen) lista las **anotaciones** de los últimos 30 días: notas del día, evaluaciones de premios y penitencias, lo más nuevo primero (`ResumenConducta.anotaciones`).
- Breadcrumb: «Administración» enlaza a `/dashboard/admin` en todas las páginas del grupo.

## Lane 212 — selector de nivel global y arreglo del gauge congelado
**Pedido (textual):** «Ese componente debería ser global, es decir, tener una configuración y estar replicado en donde se use. En el modal de creación de tarea no está funcionando tampoco.»

- **Causa del «no funciona»:** en `SloshGauge`, el cleanup del montaje cancelaba el frame de animación pero dejaba `sim.raf` con el id viejo; con el doble montaje de React en desarrollo (Strict Mode) `wake()` creía que la animación ya corría y el líquido quedaba congelado (en la dificultad de la tarea y en la conducta). Ahora el cleanup reinicia `raf` y `last`.
- **Configuración global:** `CONFIG_SELECTOR_NIVEL` (en `SelectorNivel.tsx`) fija alto, llenado al montar y fluidez (viscosidad, salpicadura, inclinación). La dificultad de la tarea y la conducta la heredan igual; se quitaron los ajustes propios de cada uso.
