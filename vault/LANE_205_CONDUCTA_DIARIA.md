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
