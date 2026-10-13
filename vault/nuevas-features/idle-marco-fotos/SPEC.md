# Pantalla de reposo con Google Fotos — Especificación

> Reemplaza la interpretación inicial del README (§3: «fotos de los usuarios»). Decisiones D1–D5 en [`../DECISIONES.md`](../DECISIONES.md). Complementa [`../sesion-inactividad-borradores/SPEC.md`](../sesion-inactividad-borradores/SPEC.md).

## 1. Objetivo

La app, al abrirse o al quedar sin uso, muestra un **salvapantallas** con fotos de la familia (Google Fotos), el logo, el nombre y un botón **Entrar**. Evita una pantalla muerta o un login abierto, y protege las cuentas (nadie queda con sesión abierta).

## 2. Máquina de estados de la pantalla `/`

```
            ┌───────────── 15 s sin actividad ─────────────┐
            ▼                                              │
        [REPOSO] ──Entrar──► [SELECTOR] ──elige──► [PIN] ──ok──► [SESIÓN /dashboard]
            ▲                    ▲  │                 │                 │
            │                    └──┴─ "Cambiar" ◄────┘                 │
            └──────── 60 s sin actividad (guarda, cierra sesión) ◄──────┘
```

- **REPOSO**: fondo Google Fotos + logo + «Ordo Diei» + **Entrar**.
- **SELECTOR / PIN**: el `AuthPageClient` actual, sin cambios visuales. Es el estado «login».
- Entrada inicial a `/` ⇒ **REPOSO** (no el selector). `/dashboard` sin sesión redirige a `/` ⇒ REPOSO.
- Un cierre de sesión manual (menú de usuario) ⇒ **SELECTOR** directo (la persona acaba de actuar; no tiene sentido volver al salvapantallas).
- Cierre por inactividad ⇒ **REPOSO**.
- Primera vez sin usuarios: el `FirstSetupForm` actual manda; no se muestra reposo hasta que exista el primer usuario.

## 3. UX/UI de la pantalla de reposo

### 3.1 Composición (escritorio y tablet horizontal)

```
┌────────────────────────────────────────────────────────────┐
│  (foto a pantalla completa, zoom lento, 1 foto cada ~12 s) │
│                                                            │
│                     ┌──────┐                               │
│                     │  OD  │   logo                        │
│                     └──────┘                               │
│                    O r d o  D i e i                        │
│                                                            │
│                   [   Entrar   ]                           │
│                                                            │
│  ▒▒▒ velo oscuro con degradé para legibilidad ▒▒▒          │
└────────────────────────────────────────────────────────────┘
```

- Logo = el cuadrado «OD» actual de `AuthPageClient`. Título = el degradé actual («Ordo Diei», `font-heading`). **No** se agrega el latín ni nada más (el pedido es logo + nombre + botón).
- Botón **Entrar**: `Button` prebuilt del proyecto (tamaño `lg`, variante primaria). Foco automático para teclado (Enter/Espacio). Ancho mín. 12 rem; área táctil ≥ 48 px.
- Cualquier toque fuera del botón **no** entra (evita entradas accidentales), pero **sí** revela el botón si estuviera atenuado (ver anti-burn-in).
- Velo: `bg-gradient-to-t from-black/70 via-black/20 to-black/50` para que el texto cumpla contraste AA sobre cualquier foto.
- Transición entre fotos: fundido cruzado 1,5 s + «Ken Burns» (escala 1 → 1,08, 14 s). Respeta `prefers-reduced-motion` (sin zoom, cambio por fundido corto).
- Anti burn-in: el bloque logo+nombre+botón **se desplaza** lentamente (±24 px, cambia cada 60 s) y la opacidad del bloque baja a 0,85 tras 5 min.
- Sin fotos disponibles (no configurado, sin red, error): **respaldo** = el fondo actual (degradé + `Particles` dorado). Nunca pantalla vacía.
- Entrar: la foto se difumina/oscurece (≈300 ms) y aparece el selector con la animación de hoy.

### 3.2 Vertical / móvil
Mismo bloque centrado; foto `object-cover`. En vertical se prefieren fotos verticales cuando haya orientación conocida (opcional).

### 3.3 Accesibilidad
- El botón es el único control. `aria-label` = «Entrar a Ordo Diei». Las fotos son decorativas (`alt=""`).
- Contraste texto/fondo ≥ 4,5:1 garantizado por el velo.
- No hay parpadeos; animación suave.

## 4. Integración con Google Fotos

### 4.1 Restricción vigente (verificada en la documentación de Google, 2026-10)
Desde el **31-03-2025** la *Library API* solo permite leer elementos que **la propia app subió**; los *scopes* `photoslibrary.readonly` y `.sharing` fueron retirados. Para acceder a fotos existentes del usuario Google ofrece la **Picker API**: la persona abre una **sesión de selección**, elige fotos/álbumes en la interfaz de Google y la app recibe solo eso. No existe «sincronizar un álbum para siempre» de forma automática.
Fuentes: <https://developers.googleblog.com/en/google-photos-picker-api-launch-and-library-api-updates/> · <https://developers.google.cn/photos/support/updates>.

> **Spike obligatorio antes de implementar** (ver lane 2 de `../lanes/LANES.md`): confirmar en la documentación actual (a) la vida útil de los `baseUrl`, (b) si se permite copiar las imágenes a almacenamiento propio, (c) el límite de elementos por sesión y (d) el tiempo de vida de la sesión. No inventar valores: leerlos de las páginas de referencia de *Picker API* y *Media items*.

### 4.2 Flujo de conexión (lo hace un padre, una vez)
1. Admin → **Reposo y fotos** → «Conectar Google Fotos» → OAuth con scope `photospicker.mediaitems.readonly`.
2. La app crea una **sesión** del Picker y abre el `pickerUri` (nueva pestaña/ventana, mejor en el móvil del padre).
3. El padre elige las fotos (o un álbum) y pulsa «Listo»; la app sondea la sesión hasta `mediaItemsSet = true`.
4. La app guarda en `FotoReposo` la **lista elegida** (id de Google, tipo, dimensiones, fecha de captura, orden) y descarga/refresca los medios según la decisión del spike (§4.3).
5. Estado visible en el panel: «N fotos · última actualización · [Elegir más fotos] [Desconectar]».

### 4.3 Estrategia de entrega de imágenes (decidir con el spike)
| Opción | Cómo | Pro | Contra |
|---|---|---|---|
| **A. Pedir `baseUrl` a Google en vivo** | El servidor renueva las URLs antes de que venzan y las sirve a la pantalla (`/api/reposo/fotos`). | Cumple la política de Google; no almacenamos fotos. | Hay que **re-elegir** cuando la sesión caduque; dependencia de red. |
| **B. Copia local (tabla `Archivo`)** | Al elegir, el servidor baja las imágenes redimensionadas (≈1920 px, WebP) y las guarda. | Funciona sin red y sin caducidad; rápido; la pared no depende de Google. | **Puede no estar permitido** por los términos de Google (cachear contenido). Almacenar fotos de la familia en la base de producción. |
| **C. Híbrido** | A como principal + caché efímera en el navegador (Cache API) por ≤ vida del `baseUrl`. | Resiliencia a cortes breves. | Complejidad media. |

**Recomendación:** **C** si el spike confirma que B está prohibido; **B** si lo permite (más simple y robusto). En ambos casos: carga **anticipada** de la siguiente foto y respaldo visual si falla.

### 4.4 Respaldo sin Google (siempre presente)
«Subir fotos propias» (usa el flujo de `Archivo`/`subirImagen`). Se mezclan con las de Google. Garantiza que el reposo funcione aunque Google cambie las reglas o no se conecte.

### 4.5 Privacidad y seguridad
- Tokens OAuth cifrados en servidor (nunca al cliente); se guarda solo el *refresh token* del padre que conectó. Botón «Desconectar» lo revoca y borra las fotos copiadas.
- Las fotos se sirven **solo a la pantalla de reposo**; la ruta no requiere sesión (por definición el reposo está sin sesión) ⇒ **exponer solo fotos marcadas «para reposo»**, con URL no adivinable y sin metadatos EXIF (ubicación) ni nombres de archivo.
- Aviso al padre al conectar: «Estas fotos se mostrarán en la pantalla de inicio, visible para cualquiera que tenga la pantalla delante».

## 5. Modelo de datos (SQL aditivo; **sin `db push`**, ver AGENTS.md §6)

```prisma
model ConfigReposo {
  id               Int       @id @default(1)
  segundosLogin    Int       @default(15) @map("Segundos_Login")      // D3
  segundosSesion   Int       @default(60) @map("Segundos_Sesion")     // D4
  segundosPorFoto  Int       @default(12) @map("Segundos_Por_Foto")
  googleConectado  Boolean   @default(false) @map("Google_Conectado")
  googleRefresh    String?   @map("Google_Refresh_Cifrado")
  googleSesionId   String?   @map("Google_Sesion_Picker")
  conectadoPorId   Int?      @map("Conectado_Por_ID")
  ultimaSincronia  DateTime? @map("Ultima_Sincronia")
  @@map("Config_Reposo")
}

model FotoReposo {
  id          Int      @id @default(autoincrement())
  origen      String   @map("Origen")            // "google" | "subida"
  googleId    String?  @unique @map("Google_ID")
  archivoId   Int?     @map("Archivo_ID")        // si hay copia local (opción B) o subida propia
  ancho       Int?     @map("Ancho")
  alto        Int?     @map("Alto")
  tomadaEn    DateTime? @map("Tomada_En")
  activa      Boolean  @default(true) @map("Activa")
  orden       Int      @default(0) @map("Orden")
  createdAt   DateTime @default(now()) @map("Created_At")
  @@map("Fotos_Reposo")
}
```
Tiempos (15 s / 60 s) viven en `ConfigReposo` pero **con esos valores por defecto**; el panel permite ajustarlos (rango 10–300 s) por si se prueba en una tablet de pared.

## 6. API

| Ruta | Método | Auth | Qué hace |
|---|---|---|---|
| `/api/reposo/fotos` | GET | pública | Lista (ids opacos + URL servible) de fotos activas, barajadas. Cache corta. |
| `/api/reposo/foto/[clave]` | GET | pública | Sirve la imagen (opción B/C) con `Cache-Control`. |
| `/api/reposo/config` | GET | pública | Solo `segundosLogin`, `segundosSesion`, `segundosPorFoto`. |
| `/api/admin/reposo` | GET/PATCH | padre | Estado, tiempos. |
| `/api/admin/reposo/google/conectar` | POST | padre | Crea la sesión del Picker; devuelve `pickerUri`. |
| `/api/admin/reposo/google/sesion` | GET | padre | Sondea `mediaItemsSet`; al estar listo importa. |
| `/api/admin/reposo/google/desconectar` | POST | padre | Revoca y limpia. |
| `/api/admin/reposo/fotos` | POST/PATCH/DELETE | padre | Subir propia, activar/desactivar, ordenar. |

## 7. Criterios de aceptación

1. Abrir `/` sin sesión muestra reposo con fotos, logo, nombre y **Entrar**; no muestra usuarios.
2. **Entrar** muestra el selector idéntico al actual (usuarios con foto).
3. En selector o PIN, sin ningún evento de entrada durante 15 s ⇒ vuelve al reposo; cualquier toque/tecla/movimiento antes de los 15 s **reinicia** la cuenta.
4. Sin Google conectado, sin fotos o sin red ⇒ el reposo se ve con el fondo de partículas (sin errores visibles).
5. El reposo rota fotos y precarga la siguiente; con `prefers-reduced-motion` no hace zoom.
6. Un padre conecta Google Fotos, elige fotos y aparecen en el reposo en < 1 min; puede desactivar fotos sueltas y desconectar.
7. Desconectar elimina tokens y copias.
8. La ruta pública no devuelve fotos inactivas ni metadatos EXIF.

## 8. Fuera de alcance (ahora)
Reloj/clima/santoral en el reposo, vídeos, sincronización automática continua de un álbum (no existe en la API actual), ahorro de batería/apagado nocturno (queda para la APP nativa, ver `../kiosk-mode/README.md`).
