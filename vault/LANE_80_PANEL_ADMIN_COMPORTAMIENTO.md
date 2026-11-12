# Lane 80 — Panel de administración + Comportamiento + premio sorpresa 3D

**Pedido (textual):**
> Quiero unificar la administración en un panel centralizado para administradores.
> Desde ahí que se puedan hacer todas las acciones de la app que son para administradores, y que desde ahí se puedan ingresar a las páginas ya existentes para administrar diferentes cosas.
> Ademas se debe crear una nueva página para que los padres puedan gestionar una nueva dimensión llamada "Comportamiento".
> Esa sección comportamiento, será como una bitácora de el desempeño moral y ético de sus hijos. Ahí podrán registrar como se viene comportando, darles premios y penitencias.
> A veces los niños hacen tareas que no están en ningún habito ni tarea ingresada al sistema, en esos casos los padres pueden ingresar un premio para mostrarles agradecimientos a los niños y ese premio debería aparecer en "Mis premios" para que el niño lo vea y lo pueda reclamar. La idea principal es poder ir incentivando o penalizando comportamientos, que no están dentro de la app pero que son importantes.
> Entonces los padres deben ingresar el titulo del comportamiento, un texto opcional de evaluación, y el premio o los premios.
> Dentro de lo que son premios los administradores (padres) podrán dar puntos, incienso, cartas completas o fragmentos de cartas, XP, exonerar de alguna tarea o dar un premio extra (cosas físicas, o lo que sea que el padre defina que esté por fuera de la app, por ej. un permiso para hacer algo, dinero, un regalo comprado, una golosina, un juguete, lo que sea que no esté en la economía de la app).
> La notificación debe aparecerle al niño como los banners de HAPPY HOUR, diciendo que se ganó un premio y que vaya a reclamarlo, con un botón para reclamarlo que lleve a mis premios.
> Al hacer click en reclamar premio (el premio siempre debe ser sorpresa), se debe abrir un modal similar al de las cartas cuando se abre un sobre, con este objeto 3D para ilustrar el premio: `C:\Users\evoxu\Downloads\Agencia\Dev\18_OrdoDiei\3D\present_1_low_poly.glb`
> El objeto debe animarse, primero girando lento luego dando giros acelerados cada vez más rápido hasta que explotan los confites y desaparece el objeto 3D y aparece el premio en texto con confites explotando varias veces.

## Qué se hizo
- **Panel** `/dashboard/admin` (`components/admin/PanelAdmin.tsx`): tarjetas a todas las páginas de padres con contadores de pendientes (solicitudes de hábitos, premios por entregar) y «Simular día». La Agenda master pasó a `/dashboard/admin/agenda`. Los accesos de admin salieron del Dock (que conserva líderes, reglas, tema y salir) y quedan en un único grupo «Administración» de la barra lateral.
- **Comportamiento** `/dashboard/admin/comportamiento` (solo padres): bitácora con filtro por miembro. Premiar (título + evaluación opcional + premios) o Penitencia (texto y/o quitar puntos, nunca deja saldo negativo).
- **Premios** (`lib/comportamiento/premios.ts`): puntos, incienso, XP, carta completa o fragmentos (usa `regalarCartaEnTx` → `otorgarFragmentos`, movimiento tipo `Ajuste`), exoneración y premio extra (texto libre).
- **Datos** (SQL aditivo aplicado): tabla `Comportamientos`, enum `TipoComportamiento`, y en `Recompensas` las columnas `Comportamiento_ID` y `Contenido`. El premio sorpresa es una `Recompensa` de tipo `comportamiento`; su contenido no se envía al cliente hasta que se abre.
- **Apertura** `POST /api/recompensas/[id]` `{accion:"abrir"}`: reclamo atómico (`updateMany where estado=disponible`), acredita puntos/incienso/XP/cartas. Si hay exoneración o extra queda «reclamado» y aparece en «Para entregar» (con el contenido); si no, pasa directo a «entregado».
- **Banner** `PremioBanner` (misma barra que Happy Hour) en todo el dashboard con botón «Reclamar premio» → `/dashboard/mis-premios`.
- **Modal 3D** `ModalSorpresa` + `Regalo3D` (three + @react-three/fiber + drei): giro lento 2 s → aceleración exponencial → explota a los ~5,5 s (espera al servidor si hace falta), confites en 7 ráfagas, premio en texto. Respeta `prefers-reduced-motion`.

## Pendiente del usuario
- (Resuelto en lane 81) `public/models/present_1_low_poly.glb` ya está en el repo.
- Nota técnica: `@react-three/fiber` amplía `JSX.IntrinsicElements`, por eso los íconos tipados `React.ElementType` pasaron a `LucideIcon`.

## Lane 83 — Tarjeta de premio horizontal
**Pedido (textual):** "hay algunas inconsistencias en la card tiene dos partes grises donde aparece la fecha. Ademas de eso, quiero que las cards sean rectangulares, en la izquierda quiero que aparezca esta imagen «gift-3d-boxes-with-golden-ribbon-bow-confetti…» que esta guardada en public/imagenes, y a la derecha la informacion de la card y el boton (texto y boton con alineacion a la izquierda)" y "que el feed de cards de premios, tenga una sola columna".

Hecho: tarjetas horizontales en una sola columna, sin las franjas grises del pie (la fecha pasó a ser texto dentro del bloque derecho). `public/Imagenes/` está en `.gitignore`, así que la ilustración (JPG recortado del zip; el EPS no trae transparencia real, solo un cuadriculado dibujado) se optimizó a `public/premios/regalo.webp`.

## Lane 84 — Premio a varios usuarios y Cool Mode en tarjetas reclamadas
**Pedido (textual):** "Agrega la posibilidad de dar un premio a varios usuarios a la vez" y "que despues de reclamado el premio, al hacer click en cualquier parte de la card, se active el «Cool Mode» para que aparezcan los emojis de regalos cada vez que se clickee una card".

Hecho: el formulario de Comportamiento elige destinatarios con casillas («Elegir a todos» incluido); `POST /api/comportamiento` acepta `usuarioIds` y crea un registro y un premio sorpresa por persona, todo en una transacción (si falla uno no queda ninguno). La penitencia con puntos también se aplica a cada uno. `CoolMode` (`ui/cool-mode.tsx`) ganó la prop `className` y envuelve las tarjetas ya reclamadas.
