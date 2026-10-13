# Lane 85 — Cofre sorpresa diario y «Mis premios» como centro de lo reclamable

**Pedido (textual):**
> Ese 3D será usado para un cofre sorpresa. Que será una nueva feature. Todo el que tenga buen comportamiento evaluado por sus padres (los padres deberan registrarlo diariamente) recibirán a las 18:00 un cofre sorpresa con: Puntos de regalo, Fragmentos de cartas, XP. Debe ser en pocas cantidades porque puede llegar a ser diario. Por ejemplo 1 fragmento de una carta celestial, 10 puntos, 50 de XP. la idea es que el portarse bien valga mas que terminar una tarea en la mente del niño. Que ser buena persona sea mejor que ser buen "trabajador" o buen "cumplidor de tareas"
> Además, no me aparece en mis premios el cofre sorpresa. La pagina de "Mis premios" debe centralizar todo lo que el usuario tiene para reclamar, cartas para reclamar completadas, sobres para abrir, cofres, premios, y debajo un resumen de los puntos, XP, incienso, y lo que haya generado el usuario en ese día.

Modelo 3D: `pixellabs-treasure-chest-3502.glb` → `public/models/`.

## Decisiones
- **Cofre = `Recompensa` de tipo `cofre`**, mismo flujo que el premio sorpresa de comportamiento (`abrirPremioSorpresa`), con el modal 3D y el cofre como modelo. El banner de aviso cuenta ambos.
- **Cuándo llega:** `otorgarCofreDelDia` corre al entrar al dashboard; desde las 18:00 (hora de la familia, `HORA_COFRE`) lo otorga si el día es bueno. Sin cron. Un candado de Postgres (`pg_advisory_xact_lock`) y la marca `origen = "Buen comportamiento · AAAA-MM-DD"` impiden duplicados.
- **Día bueno** (`diaEsBueno`): los padres registraron más comportamientos Positivos que Negativos ese día (y al menos uno). Es la «evaluación diaria»: se registra desde Comportamiento. *Supuesto mío, ajustable en `lib/comportamiento/cofre.ts`.*
- **Contenido** (constantes en `cofre.ts`): 10 puntos, 50 XP, 1 fragmento de una carta al azar; rareza por pesos 60/28/10/2 (Común/Buena/Perfecta/Celestial). 50 XP supera a lo que da una tarea promedio: portarse bien pesa más.
- **Mis premios** (`/dashboard/mis-premios`): regalos de cartas (fiesta, cumpleaños, bienvenida: `BannerEventosCartas`), cartas con un grado por reclamar (`CartasPorReclamar`), cofres y premios (`MisPremios`), y al pie `ResumenDia` (puntos, XP, incienso en total y lo ganado hoy; fragmentos de hoy). Hoy suma: tareas aprobadas hoy, hábitos de hoy, premios y cofres abiertos hoy y movimientos de fragmentos.
- **Sobres para abrir:** no existe inventario de sobres (se compran y se abren al instante), por eso no aparecen. Pendiente de decisión del usuario.
- Los modelos se precargan en Mis premios cuando hay algo sin abrir.
