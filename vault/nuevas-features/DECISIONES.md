# Decisiones del usuario — ronda 2 (2026-10-13)

## 1. Pedido textual (nada omitido)

> El idle debe conectarse a Google Fotos. Debe haber una pantalla que tenga el salvapantallas con el logo de Ordo Diei El nombre de la app y un botón de diga "Entrar".
>
> Al hacer click en entrar debe aparecer la pantalla actual de login, que tiene a todos los usuarios con sus fotos.
> Si pasan 15 segundos en la pantalla de login y nadie ingresa ni interactua, se debe activar el salvapantallas. Si un usuario inició sesión y no interactua por 1 minuto, se debe activar el salvapantallas y cerrarle la sesión. Si habian cambios sin guardar, deberian guardarse, si todavía no estaba finalizado lo que el usuario dejó sin guardar, deberia guardarse como borrador.
> Modo Kiosko lo dejamos para cuando hagamos la APP.
> puedo darte una carpeta con canciones para que se reproduzcan.
> EL marketplace deberia permitir comprar todo lo que es posible comprar en la app (los padres debemos tener una nueva pantalla en el panel de administración para ingresar productos al marketplace).
>
> Pero algunos productos deben ser escasos o caros, por eso deberiamos permitir todas las monedas, el filtro se hará por producto.
>
> Si el usuario quiere comprar un sobre de cartas, puede, si quiere comprar un producto del markeplace también, la limitación debe estar en el precio. Algunos productos puede requerir niveles o acciones especificas para desbloquearse, no todo el marketplace debe estar desbloqueado aun que (al igual que con las cartas) deben estar listados con un candado y en escala de grises.
>
> Quiero que documentes todo esto, y que trabajes como arquitecto de software y gerente de producto para definir todas las features, las especificaciones, el UX/UI, para dejar todo pronto para implementar.

## 2. Decisiones firmes (derivadas del pedido)

| # | Decisión | Fuente |
|---|---|---|
| D1 | La pantalla de reposo (salvapantallas) es la **entrada de la app** (`/`): fondo de **Google Fotos**, logo, nombre «Ordo Diei» y botón **«Entrar»**. | pedido |
| D2 | «Entrar» muestra el **login actual** (todos los usuarios con foto → PIN). No se rediseña el login. | pedido |
| D3 | **Login sin actividad 15 s → reposo.** (Incluye la pantalla del PIN.) | pedido |
| D4 | **Sesión iniciada sin actividad 60 s → reposo + cierre de sesión.** | pedido |
| D5 | Al cerrar por inactividad: lo **pendiente de guardar se guarda**; si **no está finalizado**, se guarda como **borrador**. | pedido |
| D6 | **Modo kiosko / app pinning se pospone** hasta la APP nativa. Queda fuera de este ciclo. | pedido |
| D7 | **Música de fondo**: el usuario aporta una **carpeta de canciones** para reproducir. | pedido |
| D8 | **Marketplace** = tienda única de **todo lo comprable** en la app (incluye sobres de cartas). | pedido |
| D9 | Los padres tienen una **pantalla nueva en Administración** para dar de alta productos. | pedido |
| D10 | **Todas las monedas** son válidas; **cada producto elige** con cuáles se paga. La escasez y lo caro se resuelven **por producto**. | pedido |
| D11 | La **única limitación general es el precio**; además, un producto puede exigir **nivel o acciones específicas** para desbloquearse. | pedido |
| D12 | Lo bloqueado **se lista igual**, con **candado y escala de grises** (como las cartas, lane 45). | pedido |

## 3. Supuestos del arquitecto (a confirmar; no bloquean el diseño)

| # | Supuesto | Alternativa |
|---|---|---|
| S1 | Google Fotos entra por la **Picker API** (único acceso permitido a fotos que la app no subió desde 2025-03-31). Un padre elige fotos/álbum con su cuenta; la pantalla de reposo las muestra. Ver `idle-marco-fotos/SPEC.md` §4. | Subir fotos propias (sin Google) como respaldo. |
| S2 | Las acciones **con efectos** (dar premios, comprar, completar tareas) **nunca se auto-ejecutan** al cerrar por inactividad; solo se conservan como borrador. | Auto-enviar todo lo completo (riesgo: premios o tareas no queridos). |
| S3 | La sesión se renueva por **latido** y vence a los pocos minutos sin actividad, para que el cierre sea real también en el servidor. | Solo cierre del lado cliente. |
| S4 | Los sobres y fragmentos de cartas aparecen en el Marketplace como **productos del sistema** (precio y reglas siguen en `economia.ts`); la Tienda de cartas actual **no cambia**. | Migrarlos y retirar la tienda de cartas (más adelante). |
| S5 | Monedas habilitadas: **puntos, estrellas, incienso** (y opcionalmente **sorpresas**/cofres). | Agregar monedas futuras sin migración (el diseño es abierto). |
| S6 | La música vive en `public/musica/` o en almacenamiento propio (no Spotify). | Spotify/radio. |
