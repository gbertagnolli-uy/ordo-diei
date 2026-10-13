# Música de fondo — Especificación

> Decisión D7 de [`../DECISIONES.md`](../DECISIONES.md): «puedo darte una carpeta con canciones para que se reproduzcan». Reemplaza la comparación A/B/C del README: se elige la **opción A (pistas propias)**. Comparte el motor de audio con [`../sonidos-ui/SPEC.md`](../sonidos-ui/SPEC.md).

## 1. Objetivo
Ambiente musical continuo y discreto mientras la familia usa la app, con control simple y sin cortes al navegar.

## 2. Contenido (la carpeta del usuario)
- El usuario entrega una carpeta con archivos (`.mp3`, `.m4a`, `.ogg`, `.flac`→se convierte).
- **Importador** `scripts/importar-musica.mjs <carpeta>`: lee etiquetas ID3 (`music-metadata`), normaliza a **MP3/AAC ≈ 128–160 kbps** (ffmpeg), calcula duración y sube al almacenamiento. Idempotente (hash del archivo). Crea/actualiza filas de `PistaMusical`.
- **Dónde guardar:** el despliegue es Vercel (sin disco persistente) y la tabla `Archivo` guarda `Bytes` en la base ⇒ **no sirve para audio** (peso). Opciones: **Supabase Storage** (bucket `musica`, ya usan Supabase) o Vercel Blob. Recomendado: Supabase Storage, lectura por URL firmada de 1 h o bucket público con rutas no adivinables. **No** se versionan los mp3 en git.
- **Licencias:** uso doméstico privado está bien; si la app se ofrece a otras familias (SaaS) hay que usar música con licencia. Dejar anotado en el panel (campo `licencia`/`fuente` por pista).

## 3. Reproductor (UX/UI)
- **Mini reproductor** en el pie de la barra lateral (`AppSidebar`): carátula pequeña/ícono, título (marquesina si es largo), ⏮ ⏯ ⏭, volumen, ✕ silenciar. Colapsado en móvil a un botón de nota musical que abre una hoja (`Sheet`) con la cola.
- **Persistencia entre páginas:** el reproductor vive en `dashboard/layout.tsx` como componente cliente único (no se reinicia al navegar).
- **Arranque:** el navegador exige un gesto; el clic en **Entrar** (reposo) o en el PIN cuenta como gesto. Si falla, aparece «Toca para activar la música».
- **Modos:** aleatorio (por defecto), repetir lista, fundido cruzado de 2 s entre pistas.
- **Listas** (`ListaMusical`): «Mañana», «Tarde», «Noche», «Oración», «Todas». Cambio automático por franja horaria (usa la misma `FranjaHabito`) — opcional.
- **Ducking:** al sonar un efecto importante (premio, sobre) la música baja ~60 % durante 1,5 s y vuelve.
- **Media Session API:** controles de teclado/pantalla de bloqueo y metadatos.
- Respeta `prefers-reduced-motion` en la marquesina/visualizador (no hay visualizador en v1).

## 4. Reglas
| Regla | Detalle |
|---|---|
| Quién controla | Cada persona controla **su** volumen/pausa; los padres definen en Admin si la música está habilitada, **horario silencioso** (ej. 21:00–07:00), volumen máximo y si los niños pueden cambiar de pista. |
| Reposo | Configurable: sigue sonando (volumen reducido) o se pausa. Por defecto: **pausa** (la pared no debería sonar sola). |
| Sesión cerrada | Al cerrar sesión por inactividad la música se detiene. |
| Exenciones | Videos/lecciones/temporizadores con sonido: la música se pausa mientras tanto. |
| Preferencias | `PreferenciaAudio` por usuario (sincronizada con efectos, ver sonidos-ui). |
| Datos móviles | Solo precarga la siguiente pista en Wi-Fi si `navigator.connection` lo permite. |

## 5. Modelo de datos
```prisma
model PistaMusical {
  id         Int      @id @default(autoincrement())
  titulo     String   @map("Titulo")
  artista    String?  @map("Artista")
  duracionSeg Int     @map("Duracion_Seg")
  ruta       String   @unique @map("Ruta")        // clave en el bucket
  hash       String   @unique @map("Hash")
  listas     String[] @map("Listas")              // ["manana","oracion"]
  licencia   String?  @map("Licencia")
  activa     Boolean  @default(true) @map("Activa")
  createdAt  DateTime @default(now()) @map("Created_At")
  @@map("Pistas_Musicales")
}
// Config global: ConfigAudio { musicaHabilitada, silencioDesde, silencioHasta, volumenMax, ninosCambianPista, musicaEnReposo }
```
## 6. API
`GET /api/musica` (pistas activas + URLs firmadas) · `GET/PATCH /api/admin/audio` (config) · `PATCH /api/admin/musica/[id]` (activar, listas) · `PUT /api/audio/preferencias` (propias).

## 7. Biblioteca
Usar **Howler.js** (o `<audio>` + Media Session si basta) para crossfade/ducking/sprites; no escribir un motor propio (ver memoria *reuse-open-source*).

## 8. Criterios de aceptación
1. Con una carpeta de ejemplo, el importador crea las pistas y es idempotente.
2. Tras **Entrar** suena música; navegar entre páginas no la interrumpe.
3. Silenciar/volumen se recuerdan por persona.
4. En horario silencioso no suena y el reproductor lo explica.
5. Cerrar sesión (manual o por inactividad) detiene la música.
6. Un efecto de premio baja la música y la restituye.
7. Un padre puede desactivar la música para todos.
