# Liturgia (Divinum Officium) — Especificación

> Estado: **especificación lista para implementar** (2026-10-14, lane 122). Pedido textual: [`README.md`](README.md). Decisiones D40–D53 y supuestos S7–S11: [`../DECISIONES.md`](../DECISIONES.md) §10. Prueba real del motor: [`SPIKE_MOTOR.md`](SPIKE_MOTOR.md). Lanes: [`../lanes/LANES.md`](../lanes/LANES.md) (L1–L9).

## 1. Objetivo y alcance

Traer a Ordo Diei la liturgia tradicional que calcula Divinum Officium (DO): **qué se celebra cada día**, el **Breviario** (8 Horas), la **Misa**, los **propios**, el **ordinario**, el **salterio**, el **martirologio** y los **misterios del Rosario**, en **latín + español**, para las versiones **Tridentine - 1570, - 1888 y - 1906** (predeterminada 1906), Calendarium Generale.

Alimenta: (1) el título del día en el reposo ([`../idle-marco-fotos/SPEC.md`](../idle-marco-fotos/SPEC.md)), (2) el dashboard **Calendarium**, (3) una pantalla por contenido: **Breviarium, Missale, Proprium de Tempore, Proprium Sanctorum, Ordinarium, Psalterium, Rosarium** (D44, D46).

**Fuera de alcance**: otras versiones de DO (1939, 1960, monásticas…), otros idiomas, canto gregoriano (GABC), calendarios diocesanos/propios, votivas, Oficio de Difuntos aparte, notificaciones de Horas, contador de cuentas del Rosario.

## 2. Arquitectura

```
                (PC de casa o GitHub Action — donde hay Perl)                       (Vercel — solo Node)
┌──────────────────────────────────────────────────────────────────────┐
│ scripts/liturgia/descargar.sh  → vendor/divinum-officium/ (commit fijo, │
│                                   sparse ~55 MB, en .gitignore)       │
│ scripts/liturgia/instalar-perl.sh → .cache/do-perl5/ (CGI, URI…)      │
│                                                                      │
│ scripts/liturgia/generar.ts ─┬─ perl kalendar.pl  ─► DiaLiturgico     │      ┌──────────────────────┐
│   (Node, paralelo)           ├─ perl officium.pl  ─► Documento + Bloques ──► │ Postgres (Supabase)  │ ◄── /api/liturgia/*
│                              ├─ perl missa.pl     ─► Documento + Bloques │      └──────────────────────┘     ▲
│                              └─ perl do-libro.pl  ─► Documento (libros)  │                                    │
│   parser HTML→bloques (TS, con tests dorados)                         │                       pantallas /dashboard/liturgia/*
└──────────────────────────────────────────────────────────────────────┘
```

- **El motor no se reescribe** (D47): el Perl original calcula todo; un script Node lo orquesta, convierte su HTML en bloques estructurados y los guarda.
- **Runtime sin Perl**: la app desplegada en Vercel solo **lee** de la base. Si falta un día, la pantalla lo dice («Este día todavía no se generó») y no rompe.
- **Libros sin fecha** (Proprium, Psalterium, Ordinarium): `scripts/liturgia/do-libro.pl` llama a la función original `setupstring()` de DO, que resuelve condicionales y referencias por versión (D48, `SPIKE_MOTOR.md` §6).
- **Actualizar DO**: cambiar el commit fijo en `descargar.sh`, regenerar, revisar el diff de pruebas doradas. Se anota en `GeneracionLiturgica` (§5).

## 3. Descarga y entorno (`scripts/liturgia/`)

| Archivo | Qué hace |
|---|---|
| `descargar.sh` | Clon parcial del commit fijo (`DO_COMMIT=32be5f2…`) con *sparse checkout* de lo listado en `SPIKE_MOTOR.md` §3 a `vendor/divinum-officium/`. Idempotente. **No** baja Help ni otros idiomas. |
| `instalar-perl.sh` | Baja `cpanm` (versión fija) e instala `CGI CGI::Session Date::Format URI URL::Encode Algorithm::Diff` en `.cache/do-perl5/`. Imprime el `PERL5LIB`. |
| `do.ts` | `ejecutarDO({script, params, version})` → `spawn('perl', …)` con `cwd` correcto, `PERL5LIB`, timeout, y quita cabeceras CGI. |
| `parser.ts` | HTML de DO → `Documento` (§4). Puro, con tests. |
| `generar.ts` | CLI: `node scripts/liturgia/generar.ts --versiones 1906,1888,1570 --desde 2026-01-01 --hasta 2027-12-31 [--solo-calendario] [--libros] [--concurrencia 8]`. Upsert idempotente. |
| `do-libro.pl` | Exporta un archivo DO resuelto (`setupstring`) a JSON por sección. |

`package.json`: `"liturgia:descargar"`, `"liturgia:generar"`. `.gitignore`: `vendor/divinum-officium/`, `.cache/do-perl5/`. Variables: `DATABASE_URL` (ya existe).
Regeneración (S9): GitHub Action mensual (`.github/workflows/liturgia.yml`, `ubuntu-latest` trae Perl) con el secreto `DATABASE_URL`, o a mano. Genera **calendario 2026–2035** y **textos del 1-ene del año en curso al 31-dic del siguiente**.

## 4. Formato estructurado

```ts
type Idioma = "la" | "es";
type Segmento =
  | { t: "texto"; v: string }
  | { t: "rubrica"; v: string }        // líneas rojas («!», instrucciones)
  | { t: "versiculo"; v: string }      // ℣.
  | { t: "responsorio"; v: string }    // ℟.
  | { t: "antifona"; v: string }       // Ant.
  | { t: "verso"; num: string; v: string } // salmos: «92:1»
  | { t: "titulo"; v: string }         // «Psalmus 92», «Hymnus»
  | { t: "cruz" };                     // ✠
type Bloque = { la: Segmento[]; es: Segmento[] | null; esFalta?: boolean }; // esFalta: DO cayó a otro idioma (D52)
type Seccion = { clave: string; tituloLa: string; tituloEs: string | null; bloques: string[] }; // hashes de Bloque
type Documento = { titulo: TituloDia; secciones: Seccion[] };
```
- **Deduplicación**: cada `Bloque` se guarda una vez por su SHA-256 (`BloqueLiturgico`); los documentos guardan solo la lista de hashes. Los salmos, el ordinario y las oraciones comunes se comparten entre días y versiones.
- **Respaldo de idioma** (D52): si el texto de la columna española coincide con el latín o con el inglés generado para el mismo bloque, `es = null`, `esFalta = true`. La UI muestra «sin traducción» y solo el latín. **Nunca** inglés.
- Se descartan navegación, scripts, formularios y enlaces de DO.

## 5. Modelo de datos (SQL aditivo con `migrate diff` + `db execute`; **nunca `db push`**)

```prisma
model DiaLiturgico {
  version       String   @map("Version")          // "1906" | "1888" | "1570"
  fecha         DateTime @db.Date @map("Fecha")
  titulo        String   @map("Titulo")           // "S. Callisti Papæ et Martyris"
  tituloEs      String?  @map("Titulo_Es")        // "S. Calixto, Papa y Mártir" (si DO lo trae)
  rango         String   @map("Rango")            // "Duplex"
  lineas        Json     @map("Lineas")           // ["Tempora: Feria Quarta infra …", "Commemoratio: …"]
  color         String   @map("Color")            // blanco | rojo | verde | morado | negro
  tiempo        String   @map("Tiempo")           // adviento | navidad | epifania | septuagesima | cuaresma | pasion | pascua | pentecostes
  dominical     Boolean  @map("Dominical")
  @@id([version, fecha])
  @@map("Dias_Liturgicos")
}

model BloqueLiturgico {
  hash   String @id @map("Hash")
  datos  Json   @map("Datos")                     // Bloque
  @@map("Bloques_Liturgicos")
}

model DocumentoLiturgico {
  version   String    @map("Version")
  tipo      String    @map("Tipo")                // "hora" | "missa" | "martyrologium" | "libro"
  clave     String    @map("Clave")               // "2026-10-14/Laudes" · "2026-10-14" · "Sancti/10-14" · "Psalterium/92"
  fecha     DateTime? @db.Date @map("Fecha")
  titulo    Json      @map("Titulo")
  secciones Json      @map("Secciones")           // Seccion[]
  @@id([version, tipo, clave])
  @@index([version, tipo, fecha])
  @@map("Documentos_Liturgicos")
}

model GeneracionLiturgica {
  id        Int      @id @default(autoincrement())
  doCommit  String   @map("DO_Commit")
  versiones String   @map("Versiones")
  desde     DateTime @db.Date @map("Desde")
  hasta     DateTime @db.Date @map("Hasta")
  documentos Int     @map("Documentos")
  bloques   Int      @map("Bloques_Nuevos")
  createdAt DateTime @default(now()) @map("Created_At")
  @@map("Generaciones_Liturgicas")
}
```
**Presupuesto de espacio**: la lane L1 mide la deduplicación real; objetivo **< 150 MB** para dos años × tres versiones. Si no se cumple, se acorta la ventana de textos (el calendario siempre entra: ~11 000 filas chicas).

## 6. API de lectura (`src/app/api/liturgia/…`, sesión requerida salvo `/api/reposo/dia`)

| Ruta | Devuelve |
|---|---|
| `GET /dia?fecha=&version=` | `DiaLiturgico` |
| `GET /mes?anio=&mes=&version=` | `DiaLiturgico[]` del mes |
| `GET /hora?fecha=&version=&hora=` | `Documento` con bloques resueltos |
| `GET /missa?fecha=&version=` | `Documento` |
| `GET /martyrologium?fecha=&version=` | `Documento` |
| `GET /libro?tipo=&clave=&version=` | `Documento` (Proprium, Psalterium, Ordinarium) |
| `GET /indice?tipo=&version=` | Índice de un libro (lista de claves con títulos) |

`version` acepta `1906` (por defecto), `1888`, `1570`. `Cache-Control: private, max-age=86400` (los textos no cambian hasta la próxima generación). Lógica en `src/lib/liturgia/` (lecturas puras + Prisma), con tests.

## 7. Selector de versión (D43, S7)

- Componente único `src/components/liturgia/SelectorVersion.tsx` (prebuilt `Select`/`native-select` del proyecto) en la **cabecera de cada pantalla**. Opciones: **Tridentine - 1906** (predeterminada), Tridentine - 1888, Tridentine - 1570.
- Estado en la URL (`?version=1888`) y recordado **por pantalla y dispositivo** (`localStorage`, con `try/catch`). Pantalla nueva o sin preferencia ⇒ 1906.
- En **Missale**, las opciones 1888 y 1906 muestran la nota «DO usa el Misal de 1910 para esta versión» (D53).
- En **Rosarium** y **Psalterium** el contenido casi no varía; el selector está igual por consistencia (D43) y afecta lo que dependa del calendario (tiempo litúrgico).

## 8. Navegación

Grupo nuevo **«Liturgia»** en `src/components/app/AppSidebar.tsx`, visible para todos los roles:

| Ítem | Ruta | Ícono (lucide) |
|---|---|---|
| Calendarium | `/dashboard/liturgia` | `CalendarDays` |
| Breviarium | `/dashboard/liturgia/breviarium` | `BookOpen` |
| Missale | `/dashboard/liturgia/missale` | `BookMarked` |
| Proprium de Tempore | `/dashboard/liturgia/proprium-de-tempore` | `CalendarRange` |
| Proprium Sanctorum | `/dashboard/liturgia/proprium-sanctorum` | `Sparkles` |
| Ordinarium | `/dashboard/liturgia/ordinarium` | `ScrollText` |
| Psalterium | `/dashboard/liturgia/psalterium` | `Music` |
| Rosarium | `/dashboard/liturgia/rosarium` | `CircleDot` |

Cada ítem con su nombre latino y, en el *tooltip*, el castellano (Calendario litúrgico, Breviario, Misal, Propio del Tiempo, Propio de los Santos, Ordinario, Salterio, Rosario). `/dashboard/oracion` (redirige a hábitos) **no se toca**.

## 9. Componentes compartidos

### 9.1 `LiturgiaTexto` (lector bilingüe)
- Renderiza un `Documento`. Selector `ToggleGroup`: **Ambos** (predeterminado) · Latín · Español.
- **Ambos**: escritorio ≥ `lg` en dos columnas alineadas por bloque (como DO); móvil, cada bloque latín y debajo su español con sangría y menor contraste.
- **Rúbricas** y signos ℣ ℟ ✠ «Ant.» en **rojo litúrgico**: token nuevo `--rubrica` en `globals.css` (claro `#9f1d20`, oscuro `#f28b82`), contraste AA en ambos temas. Números de verso pequeños en rojo.
- Índice de secciones fijo arriba (chips desplazables) que salta a cada sección (`Incipit`, `Psalmi`, `Capitulum`, `Hymnus`, `Canticum`, `Oratio`…).
- Latín con `lang="la"`, español con `lang="es"`. Tipografía de lectura: Newsreader 1.0625–1.125rem, `leading-relaxed`, `max-w-prose` por columna.
- Bloques sin traducción: en «Español» o «Ambos», el lugar del español muestra «sin traducción» en gris (D52).

### 9.2 `CabeceraLiturgica`
Fecha con navegación (‹ hoy ›, `Calendar` del proyecto en un `Popover`), `SelectorVersion`, punto de color litúrgico + título del día (latín; debajo, el castellano si existe) + rango + líneas (Tempora/Commemoratio). Reutilizada por todas las pantallas fechadas.

### 9.3 Colores litúrgicos (desde `liturgical_color` de DO, `SPIKE_MOTOR.md` §8)

| DO | Ordo Diei | Muestra |
|---|---|---|
| `black`, `blue` | **Blanco** | punto blanco con borde dorado |
| `red` | **Rojo** | `#b91c1c` |
| `green` | **Verde** | `#15803d` |
| `purple` | **Morado** | `#6b21a8` |
| `grey` | **Negro** | `#1c1917` con borde |

## 10. Pantallas

### 10.1 Calendarium — `/dashboard/liturgia` (dashboard)

```
┌ Calendarium · Calendario litúrgico      [‹] Miércoles 14 oct 2026 [›] [Hoy]   [Tridentine - 1906 ▾] ┐
│ ┌───────────────────── Hoy ─────────────────────────────────┐ ┌──────── Octubre 2026 ─────────┐ │
│ │ ● Rojo · Duplex                                            │ │  L  M  M  J  V  S  D          │ │
│ │ S. Callisti Papæ et Martyris                               │ │  …  13 [14] 15 16 …           │ │
│ │ S. Calixto, Papa y Mártir                                  │ │  (punto de color + rango)     │ │
│ │ Tempora: Feria Quarta infra Hebdomadam XX post Oct. Pent.  │ │                               │ │
│ └────────────────────────────────────────────────────────────┘ └───────────────────────────────┘ │
│ ┌ Breviarium del día ───────────┐ ┌ Missale del día ────────────┐ ┌ Mysteria Rosarii ────────────┐ │
│ │ [card de la Hora actual con   │ │ Introitus · Statuit ei…      │ │ Gloriosa · miércoles          │ │
│ │  imagen, como §10.2, compacta]│ │ Oratio (es, 2 líneas)        │ │ I. Resurrectio Domini         │ │
│ │ Laudes · Prima · Tertia · …   │ │ Epistola · Evangelium (refs) │ │ II. Ascensio · III. …         │ │
│ │                  Abrir →      │ │                  Abrir →     │ │                  Abrir →      │ │
│ └───────────────────────────────┘ └──────────────────────────────┘ └───────────────────────────────┘ │
│ ┌ Martyrologium · Santoral del día ───────────────────────────────────────────────────────────────┐ │
│ │ Latín (tradicional) | Español (DO)                                                     Ver todo →│ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────┘ │
```
- **Hoy**: `CabeceraLiturgica` ampliada. **Mes**: grilla del `Calendar` del proyecto con punto de color y rango abreviado (D, Sd, S, F…) por día; tocar un día cambia la fecha de todo el dashboard.
- **Breviarium del día**: la Hora actual (S8) en versión compacta de la card de §10.2 + accesos a las otras 7.
- **Missale del día**: incipit del Introito, Colecta en español (2 líneas), referencias de Epístola y Evangelio.
- **Mysteria Rosarii**: los 5 misterios del día (§10.8).
- **Martyrologium**: entrada del día (`mm-dd`), latín tradicional y español de DO (con nota de que el español es una adaptación, D52).
- Responsive: 12 columnas en escritorio (Hoy 8 + Mes 4; luego 4/4/4; luego 12), una columna en móvil con el orden Hoy → Breviarium → Missale → Rosarium → Martyrologium → Mes.
- Estados: `Skeleton` mientras carga; «Este día todavía no se generó» (`Empty`) si falta.

### 10.2 Breviarium — `/dashboard/liturgia/breviarium`

```
┌ Breviarium            [‹] 14 oct 2026 [›]                       [Tridentine - 1906 ▾] ┐
│ ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                                  │ │
│ │                    (foto a sangre: luz de la mañana)                             │ │
│ │                                                                                  │ │
│ │  AHORA · 07:00 – 08:29                                                           │ │
│ │  Ad Primam                                                                       │ │
│ │  Prima · S. Callisti Papæ et Martyris                                            │ │
│ │  [ Rezar ]                                                                       │ │
│ │▓▓▓▓▓▓▓▓▓▓▓ degradado negro → transparente (70 % abajo → 0 %) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │
│ └──────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│ │ [img]    │ │ [img]    │ │ [img]    │ │ [img]    │ │ [img]    │ │ [img]    │ │[img] │ │
│ │ Tertia   │ │ Sexta    │ │ Nona     │ │ Vesperæ  │ │Complet.  │ │Matutinum │ │Laudes│ │
│ │ 08:30–   │ │ 11:00–   │ │ 13:30–   │ │ 16:00–   │ │ 19:30–   │ │ 00:00–   │ │05:00–│ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘ │
```
- **Hora destacada** = la que corresponde a la hora actual (`APP_TZ`, franjas S8). **No obliga** (D45): las otras 7 son cards elegibles, ordenadas cronológicamente a partir de la siguiente.
- **Card destacada** (`Card` del proyecto, `p-0 overflow-hidden relative`, `min-h-[22rem] md:min-h-[26rem]`, `rounded-2xl`):
  - Imagen a sangre: `<img class="absolute inset-0 size-full object-cover">` (hotlink de Unsplash, S10) con Ken Burns muy lento (respeta `prefers-reduced-motion`).
  - Overlay (D54, reemplaza el 5 % de D45): `absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/70 via-black/30 to-transparent` (negro → transparente). La parte superior de la foto queda limpia; la opacidad se concentra donde está el texto.
  - Texto encima, blanco, abajo a la izquierda: chip «AHORA · franja», nombre latino grande (Newsreader, `text-4xl md:text-5xl`), nombre castellano + título del día (`text-sm`, opacidad 0,85), botón **Rezar** (`Button`).
  - **Legibilidad por opacidad, no por elección de fotos** (pedido del usuario, ronda 10): las fotos de las Horas se eligen solo por la luz del momento, sin buscar zonas oscuras. El texto blanco debe dar contraste **≥ 4,5:1** sobre el overlay en las 8 fotos; si alguna no llega, **se sube la opacidad** del overlay (hasta `from-black/85 via-black/40`), nunca se cambia la foto por eso. Sombra de texto sutil opcional: `0 1px 2px rgb(0 0 0/.4)`.
  - Toda la card es el objetivo táctil (abre la Hora); el botón es el foco de teclado.
- **Cards secundarias**: `Card` con imagen en franja superior (aspecto 16:9), nombre latino, castellano y franja. Grilla `grid-cols-2 sm:grid-cols-3 lg:grid-cols-7`.
- **Imágenes de las Horas** (S10): 8 fotos fijas de Unsplash por la luz del momento (Matutinum noche estrellada, Laudes alba, Prima mañana temprana, Tertia media mañana, Sexta mediodía, Nona tarde, Vesperæ atardecer, Completorium crepúsculo). IDs en `src/lib/liturgia/horas.ts` con autor y enlace; atribución en el pie de cada card (`text-[10px]`) o en un `Tooltip` «Foto: …».
- **Lector de la Hora** — `/dashboard/liturgia/breviarium/[hora]?fecha=&version=`: `CabeceraLiturgica` + `LiturgiaTexto` del documento; arriba, barra con las 8 Horas para saltar.

| Hora (DO) | Título | Castellano | Franja (S8) |
|---|---|---|---|
| Matutinum | Ad Matutinum | Maitines | 00:00–04:59 |
| Laudes | Ad Laudes | Laudes | 05:00–06:59 |
| Prima | Ad Primam | Prima | 07:00–08:29 |
| Tertia | Ad Tertiam | Tercia | 08:30–10:59 |
| Sexta | Ad Sextam | Sexta | 11:00–13:29 |
| Nona | Ad Nonam | Nona | 13:30–15:59 |
| Vespera | Ad Vesperas | Vísperas | 16:00–19:29 |
| Completorium | Ad Completorium | Completas | 19:30–23:59 |

### 10.3 Missale — `/dashboard/liturgia/missale`
`CabeceraLiturgica` + `LiturgiaTexto` con la Misa del día (orden de DO: Introitus, Kyrie, Gloria, Oratio, Lectio/Epistola, Graduale/Tractus/Alleluja/Sequentia, Evangelium, Credo, Offertorium, Secreta, Præfatio, Communio, Postcommunio, conmemoraciones). `ToggleGroup` **«Solo el propio» / «Misa completa»** (con el Ordinario intercalado), si la L1 confirma que DO lo separa. Nota de D53 en 1888/1906.

### 10.4 Proprium de Tempore — `/dashboard/liturgia/proprium-de-tempore`
- Índice por tiempos (`Tabs` o acordeón): Adventus · Nativitas · Epiphania · Septuagesima · Quadragesima · Passio · Pascha · Pentecostes (post Pentecosten). Cada tiempo lista sus domingos y ferias con título latino y castellano (claves `Tempora/Adv1-0`, `Pent04-2`…, de `do-libro.pl`).
- Detalle: dos pestañas **Missa** (Introitus, Oratio, Lectio, Graduale, Evangelium, Offertorium, Secreta, Communio, Postcommunio) y **Officium** (Invitatorium, Hymnus, Antiphonæ, Lectiones, Capitula, Oratio), en `LiturgiaTexto`.
- Enlace «¿Cuándo cae este año?» si el día está dentro de la ventana generada.

### 10.5 Proprium Sanctorum — `/dashboard/liturgia/proprium-sanctorum`
- Índice por mes (12 pestañas) con el **Kalendarium de la versión elegida** (1570 no tiene santos posteriores; se ven las diferencias al cambiar de versión). Búsqueda por nombre (latín o castellano).
- Fila: fecha, nombre latino, castellano, rango, punto de color. Detalle igual que §10.4 (Missa / Officium), con el Común que corresponda resuelto (`vide C2b`, `ex C4`).

### 10.6 Ordinarium — `/dashboard/liturgia/ordinarium`
Pestañas: **Ordo Missæ** (`missa/<idioma>/Ordo/Ordo.txt` resuelto por versión con `do-libro.pl`; las partes propias aparecen como marcadores «→ Propio del día» que enlazan a Missale) y **Preces** (oraciones comunes de `Psalterium/Common/Prayers.txt`: Pater noster, Ave Maria, Credo, Confiteor, Gloria Patri…).

### 10.7 Psalterium — `/dashboard/liturgia/psalterium`
- Índice 1–150 + Cantica, con número (Vulgata), incipit latino y castellano; búsqueda por número o palabra.
- Lector: `LiturgiaTexto` del salmo. Nota visible: «Numeración de la Vulgata. Traducción española de Divinum Officium (no Torres Amat).» (D52)
- Fase 2 (no ahora): distribución semanal del Salterio por Hora.

### 10.8 Rosarium — `/dashboard/liturgia/rosarium` (título «Rosarium», subtítulo «Mysteria Rosarii»)
- **Misterios del día** (D49) destacados arriba: grupo (Gaudiosa / Dolorosa / Gloriosa), motivo («miércoles», «domingo de Adviento») y los 5 misterios en `Card`s: número romano, nombre latino, castellano, fruto del misterio y cita bíblica.
- Debajo, los otros dos grupos plegados (acordeón) y las **oraciones** en latín/español (Signum Crucis, Credo, Pater noster, Ave Maria, Gloria Patri, Salve Regina, Oremus final, Litaniæ Lauretanæ). Textos latinos y castellanos tomados de DO (`Prayers.txt`, `Mariaant.txt`) cuando existan; los que no, en `src/data/liturgia/rosarium.json` con su fuente anotada.
- La oración de Fátima («O mi Iesu», 1917) va incluida con la marca «desde 1917» (preconciliar, posterior a 1906).
- Regla de días en `src/lib/liturgia/rosario.ts` (pura, con tests): lunes y jueves gozosos; martes y viernes dolorosos; miércoles y sábado gloriosos; domingo según `DiaLiturgico.tiempo` (adviento/navidad/epifanía → gozosos; septuagésima/cuaresma/pasión → dolorosos; pascua/pentecostés → gloriosos). **La lane confirma la regla dominical con una fuente impresa preconciliar** y la cita en el código.
- Sin los misterios luminosos (2002).

## 11. Rendimiento y accesibilidad
- Documentos de hasta ~200 KB de texto: render en el servidor (Server Components) y `content-visibility: auto` por sección; nada de librerías de virtualización salvo que se mida un problema.
- Navegación por teclado completa; foco visible; títulos jerárquicos (`h1` pantalla, `h2` secciones); el rojo de rúbrica no es la única señal (los signos ℣ ℟ se leen igual).
- Leer `node_modules/next/dist/docs/` antes de escribir rutas y Server Components (AGENTS.md: esta versión de Next cambia APIs).

## 12. Pruebas
- **Dorados del parser**: HTML real de DO guardado en `scripts/liturgia/__fixtures__/` (14-10-2026 Laudes 1906, Misa 1906, Vísperas 1570 y 1888, Kalendarium oct-2026) → JSON esperado.
- **Título**: 14-10-2026 / 1906 ⇒ `titulo = "S. Callisti Papæ et Martyris"`, `rango = "Duplex"`, `lineas[0] = "Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris"`. 15-10-2026 / 1570 ⇒ Feria.
- **Deduplicación**: generar dos días seguidos crea bloques nuevos < 40 % del total.
- **Respaldo de idioma**: una sección española ausente queda `es = null, esFalta = true`.
- **Rosario**: tabla de días × tiempos. **Horas**: franjas S8 en los bordes (04:59/05:00, 23:59/00:00).
- `npm test` + `tsc --noEmit`; nada escribe en la base real sin `PERMITIR_TESTS_DB=1`. El generador escribe en la base **solo** cuando lo corre una persona o la Action, nunca desde un test.

## 13. Criterios de aceptación
1. Con la base generada, Calendarium del 14-10-2026 (1906) muestra el título del ejemplo del pedido, color rojo, la Hora actual, el Introito «Statuit ei Dóminus…», los misterios gloriosos y el Martirologio del día.
2. Cambiar a 1888 el 14-10-2026 muestra S. Teresa con conmemoración de S. Calixto en Vísperas; a 1570, S. Calixto semidoble.
3. Breviarium destaca la Hora según la hora local; cualquier otra card abre su Hora; la card destacada tiene imagen a sangre y el degradado negro → transparente de D54, con texto legible (≥ 4,5:1) en las 8 fotos.
4. Cada pantalla tiene su selector de versión, arranca en 1906 y recuerda la elección por pantalla.
5. Ningún texto en inglés aparece como español; lo no traducido dice «sin traducción».
6. Un día fuera de la ventana generada muestra el aviso, sin errores.
7. Proprium de Tempore/Sanctorum, Ordinarium y Psalterium navegan e indexan el contenido de la versión elegida.
8. El reposo lee el título del día desde `DiaLiturgico` (1906).

## 14. Riesgos
| Riesgo | Mitigación |
|---|---|
| El HTML de DO cambia al actualizar el commit | Commit fijo + dorados; actualizar es un cambio explícito. |
| Espacio en la base | Deduplicación; medir en L1; acortar ventana de textos. |
| Español incompleto o de otra fuente | D52: marca «sin traducción»; nota en Psalterium y Martyrologium. |
| Contraste del texto sobre la foto | Overlay más opaco (D54); se sube la opacidad, no se cambia la foto. |
| Unsplash cambia reglas o cae | Las cards de Horas tienen color de respaldo y título igual de legible. |
