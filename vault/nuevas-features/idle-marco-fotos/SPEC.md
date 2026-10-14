# Pantalla de reposo v2 — Unsplash, frases y título del día

> Estado: **especificación lista para implementar** (2026-10-14, lane 122). Reemplaza la v1 con Google Fotos ([`SPEC_V1_GOOGLE_FOTOS.md`](SPEC_V1_GOOGLE_FOTOS.md)).
> Pedido textual y decisiones D34–D53: [`../DECISIONES.md`](../DECISIONES.md) §10. Inactividad y cierre de sesión (sin cambios): [`../sesion-inactividad-borradores/SPEC.md`](../sesion-inactividad-borradores/SPEC.md). Título del día: [`../liturgia/SPEC.md`](../liturgia/SPEC.md).

## 1. Objetivo

La entrada de la app (`/`) y el estado sin uso muestran un **salvapantallas contemplativo**: fotos de naturaleza de Unsplash, y encima, como protagonista, **una frase por vez**, alternando una **cita bíblica** (latín de la Vulgata Clementina + español de Torres Amat + referencia) y una **pregunta del Catecismo de San Pío X** (pregunta + respuesta). En una esquina, chicos: logo y «Ordo Diei». En otra, el **título del oficio del día** según Divinum Officium (Tridentine - 1906). El botón **Entrar** sigue existiendo (D1/D2), con menor jerarquía.

## 2. Qué cambia respecto de la v1

| Tema | v1 (Google Fotos) | v2 (esta) |
|---|---|---|
| Fondo | Fotos familiares de Google Fotos (Picker API) + fotos subidas | **Unsplash, naturaleza** (D34). Sin OAuth, sin fotos subidas. |
| Protagonista | Logo + nombre centrados + Entrar | **La frase** (D35). Logo + nombre en una esquina. |
| Texto | Ninguno | Citas bíblicas y Catecismo alternados (D36–D38) |
| Liturgia | Fuera de alcance | **Título del oficio del día** (D40) |
| Lanes | N1 spike Google, N7 UI, N8 Google | N1 y N8 **canceladas**; N7 se divide en **R1–R3** ([`../lanes/LANES.md`](../lanes/LANES.md)) |

**Sin cambios:** la máquina de estados de `/` (§3), los tiempos de inactividad (15 s en login, 60 s con sesión), el respaldo de partículas, la accesibilidad y el anti burn-in.

## 3. Máquina de estados (igual que v1)

```
            ┌───────────── 15 s sin actividad ─────────────┐
            ▼                                              │
        [REPOSO] ──Entrar──► [SELECTOR] ──elige──► [PIN] ──ok──► [SESIÓN /dashboard]
            ▲                    ▲  │                 │                 │
            │                    └──┴─ "Cambiar" ◄────┘                 │
            └──────── 60 s sin actividad (guarda, cierra sesión) ◄──────┘
```
- Entrada a `/` ⇒ REPOSO. Cierre manual ⇒ SELECTOR. Cierre por inactividad ⇒ REPOSO. Sin usuarios ⇒ `FirstSetupForm` (sin reposo).
- SELECTOR y PIN = `AuthPageClient` actual sin cambios visuales.

## 4. UX/UI

### 4.1 Composición horizontal (tablet de pared, escritorio)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [OD] Ordo Diei                          S. Callisti Papæ et Martyris     │ ← esquinas: jerarquía baja
│                                         ~ Duplex                         │
│                                         Tempora: Feria Quarta infra      │
│                                         Hebdomadam XX post Octavam…      │
│                                                                          │
│                                                                          │
│         Dóminus regit me, et nihil mihi déerit:                          │ ← N1 latín (la mayor)
│         in loco páscuæ ibi me collocávit.                                │
│                                                                          │
│         El Señor es quien me gobierna; nada me faltará.                  │ ← N2 Torres Amat (menor)
│         Él me ha colocado en lugar de pastos…                            │
│                                                                          │
│         SALMO 22, 1-2                                                    │ ← N3 referencia (la menor)
│                                                                          │
│                               [ Entrar ]                                 │ ← secundaria
│ Foto: Ana Pérez · Unsplash                                               │ ← atribución obligatoria
└──────────────────────────────────────────────────────────────────────────┘
```
*(Los textos del dibujo son ilustrativos; los reales salen de las fuentes de §6.)*

Catecismo, mismo lugar y misma grilla:
```
│         ¿Qué es la gracia de Dios?                                       │ ← N1 pregunta
│                                                                          │
│         La gracia de Dios es un don interior, sobrenatural, que se nos   │ ← N2 respuesta
│         da sin ningún merecimiento nuestro…                              │
│                                                                          │
│         CATECISMO MAYOR DE SAN PÍO X · 471                               │ ← N3 referencia (opcional, ver §4.3)
```

### 4.2 Tipografía y jerarquía (fuentes ya cargadas en `src/app/layout.tsx`)

| Nivel | Cita bíblica | Catecismo | Fuente | Tamaño (`clamp`) | Estilo |
|---|---|---|---|---|---|
| N1 | Latín (Vulgata Clementina) | Pregunta | Newsreader (`--font-newsreader`) | `clamp(1.75rem, 1rem + 3vw, 3.5rem)`, `leading-tight` | latín en cursiva; pregunta en redonda |
| N2 | Español (Torres Amat) | Respuesta | Newsreader | ≈ 55 % de N1: `clamp(1.05rem, .8rem + 1.2vw, 1.75rem)` | redonda, opacidad 0,9 |
| N3 | Libro, capítulo y versículo | Referencia | Geist (`--font-sans`) | `0.8rem`–`0.95rem` | versalitas / mayúsculas, `tracking-[0.18em]`, opacidad 0,7 |
| Esquina sup. izq. | Logo «OD» 28–32 px + «Ordo Diei» | | `font-heading` actual | `text-sm` | opacidad 0,85 |
| Esquina sup. der. | Título del día (2–3 líneas, máx. 36 ch) | | Newsreader | `text-sm`/`text-base` | 1.ª línea en cursiva; «~ Duplex» y «Tempora:» con opacidad 0,7 |
| Inferior | **Entrar** (`Button` del proyecto, `size="lg"`, variante `outline` sobre vidrio) | | | | foco automático; área ≥ 48 px |
| Inf. izq. | «Foto: {autor} · Unsplash» con enlaces | | Geist | `text-xs` | opacidad 0,7 |

- Bloque de la frase: `max-w-[36ch]` en N1 y `max-w-[52ch]` en N2, alineado a la izquierda, con su borde izquierdo en el 10–12 % del ancho (no centrado: lectura más natural en textos largos). Separación N1→N2 `mt-6`, N2→N3 `mt-4`.
- **Legibilidad**: velo `bg-gradient-to-t from-black/70 via-black/25 to-black/45` más un velo radial suave detrás del bloque de texto; `text-shadow` sutil. Debe dar contraste ≥ 4,5:1 en N2 y N3 sobre cualquier foto (texto blanco). Mismo criterio que D54: la legibilidad se logra con **opacidad del velo**, no eligiendo fotos; si una foto no da 4,5:1, se sube la opacidad.
- **Tema**: el reposo siempre es oscuro (foto + velo), independiente del tema claro/oscuro de la app.

### 4.3 Reglas de contenido
- **Cita bíblica**: N1 latín → N2 Torres Amat → N3 `Libro capítulo, versículo(s)` con **nombre del libro en español** y **numeración de la Vulgata** (la de Torres Amat). Ej.: «Salmo 22, 1-2», «Eclesiástico 2, 6», «San Juan 14, 6».
- **Catecismo**: N1 pregunta → N2 respuesta. N3 «Catecismo Mayor de San Pío X · n.º» es **opcional** (no fue pedido; se muestra con la misma jerarquía que la referencia bíblica para que ambas pantallas tengan la misma estructura). Se puede apagar en `ConfigReposo.mostrarRefCatecismo`.
- **Largo máximo** para que nada se corte ni haga scroll: latín ≤ 220 caracteres, Torres Amat ≤ 300, pregunta ≤ 140, respuesta ≤ 360 (constantes en `src/lib/reposo/frases.ts`). Las que superen no entran al mazo (quedan en el JSON).
- **Paridad**: si una cita no tiene su par (latín o español), no se muestra.

### 4.4 Secuencia y tiempos
- **Alternancia estricta** (D38): B, C, B, C… El tipo siguiente se decide por el anterior, nunca al azar.
- **Orden dentro de cada tipo**: «bolsa barajada» (Fisher–Yates) sin repetir hasta agotar el mazo; al agotarse se vuelve a barajar evitando que la primera nueva sea igual a la última. La posición en cada mazo se guarda en `localStorage` (con `try/catch`; si falla, arranca de cero).
- **Duración** de cada frase: `clamp(12 s, 8 s + 55 ms × caracteres visibles, 32 s)`. Así una respuesta larga del catecismo da tiempo a leerla.
- **Imagen**: **cada frase nueva trae una foto nueva** tomada al azar del pool, **excluyendo las últimas 12 usadas** (D39). No hay emparejamiento fijo frase↔foto; la misma cita volverá con otra foto.
- **Transiciones**: foto con fundido cruzado 1,5 s + Ken Burns (escala 1 → 1,08 durante la frase); texto sale con fundido 500 ms y entra con fundido + desplazamiento 8 px 700 ms, **después** de que la foto nueva cargó (precarga de la siguiente foto apenas empieza la frase actual).
- `prefers-reduced-motion`: sin Ken Burns ni desplazamiento; fundidos de 300 ms.
- **Pausa**: tocar la frase **no** entra (D1); un toque en cualquier lugar fuera del botón muestra el botón a opacidad completa (anti burn-in, §4.6).

### 4.5 Vertical / móvil
Misma jerarquía; esquinas arriba (logo izq., título del día der., el título se recorta a 2 líneas con `line-clamp-2`); frase centrada verticalmente; foto `object-cover` con la variante vertical (`orientation=portrait`) si el pool tiene suficientes (≥ 20), si no la horizontal recortada.

### 4.6 Anti burn-in y respaldo
- Todo el contenido se desplaza ±24 px cada 60 s; logo, título y Entrar bajan a opacidad 0,6 después de 5 min sin toques (cualquier toque los restaura).
- Sin clave de Unsplash, sin red o pool vacío ⇒ fondo actual (degradé + `Particles` dorado) **y las frases igual se muestran** (los textos son locales). Nunca pantalla vacía.
- Sin datos litúrgicos para hoy ⇒ la esquina del título queda vacía (sin error).

### 4.7 Accesibilidad
- Región de la frase con `aria-live="polite"` y `lang="la"` en el latín, `lang="es"` en el resto.
- Entrar: `aria-label="Entrar a Ordo Diei"`. Fotos decorativas (`alt=""`); la atribución es texto con enlaces reales.
- Sin parpadeos; ritmo lento.

## 5. Unsplash

### 5.1 Reglas de la API que hay que cumplir (verificar en la página vigente al implementar)
1. **Hotlinking**: mostrar la foto desde las URLs que devuelve la API (`urls.raw`/`urls.regular` en `images.unsplash.com`), con parámetros de tamaño (`&w=1920&q=80&auto=format&fit=crop`). **No** re-servirla ni pasarla por `next/image` con optimización (usar `<img>` simple o `unoptimized`).
2. **Registrar la descarga**: llamar a `links.download_location` cuando la foto «se usa». Aquí: **una vez por foto al entrar al pool** (no en cada aparición), desde el servidor.
3. **Atribución**: «Foto de {nombre} en Unsplash», con enlace al perfil del autor y a Unsplash, ambos con `?utm_source=ordo_diei&utm_medium=referral`.
4. La **Access Key** queda en el servidor (`UNSPLASH_ACCESS_KEY`), nunca en el cliente ni en `NEXT_PUBLIC_*`. Credenciales (D55): ya están en el `.env` del directorio principal como `UNSPLASH_APP_ID`, `UNSPLASH_ACCESS_KEY` y `UNSPLASH_SECRET_KEY` (la Secret solo sirve para OAuth de usuarios: **no se usa**). Cada worktree copia el `.env` del directorio principal. **Nunca** escribir los valores en el repo ni en el vault. En Vercel, el usuario tiene que cargar `UNSPLASH_ACCESS_KEY` en las variables del proyecto.
5. No usar «Unsplash» en el nombre ni su logo como ícono.
6. Límite en modo demo: **50 pedidos/hora** (verificado el 2026-10-14 con la clave real: `x-ratelimit-limit: 50`). Con el pool (§5.2) se usan ~40 por día; alcanza sin pedir modo producción. Cabeceras: `Authorization: Client-ID <UNSPLASH_ACCESS_KEY>` y `Accept-Version: v1`.

Fuentes: <https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines> · <https://help.unsplash.com/api-guidelines/guideline-hotlinking-images> · <https://unsplash.com/documentation>.

### 5.2 Pool de fotos (servidor)
- El **cron diario** existente (`src/app/api/cron/daily/route.ts`, 03:00) llama a `refrescarPoolUnsplash()`:
  - `GET /photos/random?topics=6sMVjTLSkeQ&orientation=landscape&content_filter=high&count=30` y `count=10` con `orientation=portrait`. `6sMVjTLSkeQ` es el tema oficial **Nature** de Unsplash (verificado: `GET /topics/nature`, 34 659 fotos). Si el padre escribe una consulta propia en el panel, se usa `query=` en lugar de `topics=`.
  - Descarta las ya presentes y las **ocultadas** por un padre; registra la descarga de cada nueva (§5.1.2).
  - Mantiene el pool en `tamPool` (por defecto 150): si se pasa, desactiva las más viejas.
- Primera carga: si el pool está vacío, la misma función se dispara desde el panel («Cargar fotos ahora»).
- Fallo de Unsplash ⇒ se loguea y el pool queda como estaba.

### 5.3 Modelo de datos (SQL aditivo con `migrate diff` + `db execute`; **nunca `db push`**, AGENTS.md §6)

```prisma
model ConfigReposo {
  id                  Int      @id @default(1)
  segundosLogin       Int      @default(15)   @map("Segundos_Login")      // D3
  segundosSesion      Int      @default(60)   @map("Segundos_Sesion")     // D4
  unsplashTema        String   @default("6sMVjTLSkeQ") @map("Unsplash_Tema")   // tema Nature
  unsplashConsulta    String?                 @map("Unsplash_Consulta")  // si está, reemplaza al tema
  tamPool             Int      @default(150)  @map("Tam_Pool")
  mostrarRefCatecismo Boolean  @default(true) @map("Mostrar_Ref_Catecismo")
  ultimaSincronia     DateTime?               @map("Ultima_Sincronia")
  @@map("Config_Reposo")
}

model FotoUnsplash {
  id              String   @id @map("Unsplash_ID")
  urlRaw          String   @map("Url_Raw")
  ancho           Int      @map("Ancho")
  alto            Int      @map("Alto")
  color           String?  @map("Color")          // placeholder mientras carga
  blurHash        String?  @map("Blur_Hash")
  autorNombre     String   @map("Autor_Nombre")
  autorUsuario    String   @map("Autor_Usuario")
  urlFoto         String   @map("Url_Foto")       // links.html
  orientacion     String   @map("Orientacion")    // "horizontal" | "vertical"
  activa          Boolean  @default(true)  @map("Activa")
  oculta          Boolean  @default(false) @map("Oculta")   // un padre la quitó; no vuelve a entrar
  descargaAvisada Boolean  @default(false) @map("Descarga_Avisada")
  createdAt       DateTime @default(now()) @map("Created_At")
  @@map("Fotos_Unsplash")
}
```
`ConfigReposo` **reemplaza** al de la v1, que nunca llegó al esquema (verificado en `prisma/schema.prisma` el 2026-10-14). Igual revisar el SQL de `migrate diff`: si trae `DROP`, no aplicarlo.

### 5.4 API

| Ruta | Método | Auth | Qué hace |
|---|---|---|---|
| `/api/reposo/fotos?orientacion=` | GET | pública | Fotos activas no ocultas: `{id, url, ancho, alto, color, blurHash, autor, urlAutor, urlFoto}` (URLs con UTM). `Cache-Control: s-maxage=3600`. |
| `/api/reposo/config` | GET | pública | `segundosLogin`, `segundosSesion`, `mostrarRefCatecismo`. |
| `/api/reposo/dia` | GET | pública | Título del día (1906, `APP_TZ`) desde `DiaLiturgico` ([`../liturgia/SPEC.md`](../liturgia/SPEC.md) §5). `null` si no hay datos. |
| `/api/admin/reposo` | GET/PATCH | padre | Configuración y estado del pool. |
| `/api/admin/reposo/fotos` | GET/PATCH | padre | Lista del pool; ocultar/mostrar una foto. |
| `/api/admin/reposo/refrescar` | POST | padre | Fuerza `refrescarPoolUnsplash()`. |

Las frases **no** pasan por API: son JSON estáticos importados por el componente (§6).

### 5.5 Panel «Reposo» en Administración
Tarjeta en el panel de administración existente: tiempos (rango 10–300 s), consulta de Unsplash, tamaño del pool, «Mostrar referencia del catecismo», grilla del pool con «Ocultar», «Cargar fotos ahora», última sincronía y aviso si falta `UNSPLASH_ACCESS_KEY`. Componentes prebuilt del proyecto (`Card`, `Field`, `Input`, `Switch`, `Button`); sin duplicar controles existentes.

## 6. Frases: fuentes, datos y generación

### 6.1 Archivos (en git, solo lectura)
- `src/data/reposo/citas-biblicas.json`
  ```ts
  type CitaBiblica = {
    id: string;              // "Ps-22-1-2"
    libro: string;           // código OSIS/Vulgata: "Ps", "Eccli", "Jo"…
    capitulo: number;        // numeración de la Vulgata
    desde: number; hasta: number;
    la: string;              // Vulgata Clementina
    es: string;              // Torres Amat
    ref: string;             // "Salmo 22, 1-2" (generado, no a mano)
  };
  ```
- `src/data/reposo/catecismo-pio-x.json`
  ```ts
  type PreguntaCatecismo = { n: number; parte: string; capitulo: string; pregunta: string; respuesta: string };
  ```
  Se guarda **el catecismo completo**; el filtro de largo (§4.3) se aplica al armar el mazo.
- `vault/nuevas-features/idle-marco-fotos/ref/seleccion-citas.txt`: la **lista curada** de referencias (una por línea, `Ps 22,1-2`). Es lo único que se edita a mano.
- `scripts/reposo/generar-frases.ts`: lee las fuentes (§6.2) y la lista curada y escribe los dos JSON. Nunca se tipea un versículo a mano.

### 6.2 Fuentes (a cerrar en la lane R1)

| Texto | Fuente candidata | Estado | Cuidado |
|---|---|---|---|
| **Vulgata Clementina** | Clementine Text Project (VulSearch, texto por libro) — copias en GitHub: `BibleGet-I-O/Clementine-Vulgate`, `jrichter/ClementineVulgateConverter` (MIT, convierte a XML) | Encontrada | Uso permitido no comercial (este proyecto es doméstico, D23). Sin acentos en el original: se muestra tal cual. |
| **Torres Amat** (1823–25, dominio público) | No hay un dataset limpio publicado. Opciones: (a) texto digital de bibliatodo.com («Torres Amat 1825»), (b) escaneos de dominio público (Princeton Theological Seminary Commons, ed. París 1836; Internet Archive) | **Pendiente** | (a) **renumera los salmos a la numeración hebrea** (su «Salmo 22» es el Ps 21 de la Vulgata) y no está claro si es el texto de 1825 o la revisión del siglo XX ⇒ **verificar cada cita curada contra un escaneo** del s. XIX y **normalizar a numeración Vulgata**. Con ~365 citas es trabajo acotado. Torres Amat intercala palabras aclaratorias en cursiva: conservarlas como `<em>` si la fuente las marca. |
| **Catecismo Mayor de San Pío X** (versión castellana 1906, dominio público) | Wikisource en español: `Índice:Catecismo_Mayor_de_San_Pío_X.pdf` (transcripción) + PDF en Internet Archive | Encontrada | Elegido sobre el de 1912 (D50). Conservar la numeración de preguntas de la edición. |

**Criterio de selección de citas** (D51): salmos, sapienciales (Proverbios, Sabiduría, Eclesiástico, Eclesiastés), profetas, evangelios y epístolas; frases que se entienden solas; ≥ 365; sin repetir pasajes. La lista inicial la propone la lane R1 y la revisa el usuario.

### 6.3 Pruebas (`node --test`)
- Cada cita tiene `la` y `es` no vacíos, `ref` coherente con `libro/capitulo/desde/hasta`.
- Salmos: la numeración de la cita coincide con la del latín (detecta el corrimiento hebreo/Vulgata).
- ≥ 365 citas y ≥ 300 preguntas del catecismo que entran en los límites de §4.3.
- La bolsa barajada: nunca repite antes de agotar; la alternancia B/C se mantiene tras recargar.
- Selección de foto: nunca repite una de las últimas 12 si el pool tiene > 12.

## 7. Componentes y archivos

| Archivo | Rol |
|---|---|
| `src/components/reposo/ReposoPantalla.tsx` | Composición (§4), estados de carga, respaldo de partículas. |
| `src/components/reposo/FraseReposo.tsx` | Renderiza una `CitaBiblica` o `PreguntaCatecismo` con la jerarquía de §4.2. |
| `src/components/reposo/FondoUnsplash.tsx` | Doble capa de `<img>` para el fundido, precarga, Ken Burns, atribución. |
| `src/components/reposo/TituloDia.tsx` | Esquina con el título litúrgico. |
| `src/lib/reposo/frases.ts` | Mazos, bolsa barajada, alternancia, duración (puro, con tests). |
| `src/lib/reposo/unsplash.ts` | Cliente servidor: `refrescarPoolUnsplash`, `avisarDescarga` (puro + `fetch` inyectable para tests). |

Animaciones con `motion` (ya instalada). UI con componentes prebuilt del proyecto; el reposo **reemplaza** el contenido de `/` en estado REPOSO, no se agrega al lado del login (memoria *ui-work-rules*).

## 8. Criterios de aceptación
1. `/` sin sesión muestra el reposo: foto de Unsplash, frase grande, logo y nombre chicos en una esquina, título del día en otra, Entrar abajo, atribución.
2. La secuencia alterna **siempre** cita bíblica ↔ pregunta del catecismo.
3. La cita bíblica muestra latín (más grande), Torres Amat (menor) y referencia (la menor), en ese orden. La pregunta del catecismo es más grande que su respuesta.
4. Cada frase trae otra foto; la misma cita aparece con fotos distintas en vueltas distintas.
5. Ninguna frase se corta ni hace scroll en 1280×800, 1920×1080 y 800×1280.
6. Sin `UNSPLASH_ACCESS_KEY` o sin red: partículas + frases, sin errores visibles.
7. Cada foto del pool registró su descarga una sola vez; la atribución enlaza a autor y Unsplash con UTM.
8. Con datos de liturgia, el título del 14-10-2026 dice «S. Callisti Papæ et Martyris ~ Duplex» y «Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris».
9. Un padre puede ocultar una foto y no vuelve a aparecer (ni tras el refresco diario).
10. Estados SELECTOR/PIN y tiempos de inactividad se comportan igual que en la v1.

## 9. Fuera de alcance
Google Fotos y fotos propias (D34), reloj/clima, audio en el reposo (lo decide `musica-fondo/`), elegir la versión litúrgica en el reposo (S11), apagado nocturno (APP nativa).
