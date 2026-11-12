---
lane: 276
titulo: Módulo Social (migrado de OpenCircle)
plane: "#35"
estado: integrada
rama: task/lane-276-social-opencircle
agente: "claude (orquestador) + agy"
actualizado: 2026-11-07
---

# Lane 276 — Módulo Social (migrado de OpenCircle)

## Especificación
Plane #35: «Imitar y clonar las funciones Sociales (Posts, Videos, comentarios, chat) de plataformas de Social LMS como OpenCircle. Clonar el repo en local, usar todo lo que se pueda usar, traducir y adaptar lo necesario, para que la experiencia y el UX/UI sean idénticos, las features sean migradas correctamente y todo funcione bajo el stack de la app Ordo Diei. La idea es programar poco, migrar mucho, aprovechar todo lo posible y el resultado que sea tener un módulo "Social" que al ingresar sea igual que OpenCircle pero que esté integrado con lo que ya hay de "LMS".»

Resultado: sección **`/dashboard/social`** con el layout social de OpenCircle (`apps/platform/src/routes/_socialLayout`), en español:
- **Timeline** (`index.tsx`): formulario de post arriba (texto con markdown, menciones `@`, emoji, fotos y **videos**), lista de posts con tarjeta de OpenCircle (`postCard`), reacciones con emoji, resumen de comentarios.
- **Canales** (`channelList`): columna de canales (públicos y privados con miembros); filtra el timeline.
- **Post** (`posts/$id.tsx`): post completo + comentarios en hilo (`repliesList`, `replyForm`).
- **Perfil** (`$username.tsx`): posts de una persona.
- **Notificaciones** (`notifications`): menciones, reacciones y respuestas; contador en el sidebar.
- **Chat**: se integra el chat que ya existe (`MensajeFamilia`, `/dashboard/homeschooling/mensajes`) como pestaña «Mensajes» del layout social (no se duplica).
- **Integración con el LMS**: canal automático por **materia** de Homeschooling (D3); un post puede enlazar una lección o curso (tarjeta con título y link).

## Repo de origen
`devscalelabs/opencircle@5a8beada` (AGPL-3.0), clonado en el scratchpad de la sesión 18058b32 (`repos/opencircle`).
- Front (`apps/platform`, React 19 + TanStack Router/Query + Tailwind 4 + Radix): **se copia y se adapta**.
- API (`apps/api_v2`, Hono + Prisma): los `service.ts` de `posts` (360 líneas), `channels` (257), `channel-members`, `reactions` (120), `notifications` (48), `media` (93) **se portan** a `src/lib/social/servidor/*` sobre el Prisma de Ordo; los `router.ts` pasan a rutas de Next en `src/app/api/social/**`.
- Fuera: auth propia, cursos/lecciones/inscripciones de OpenCircle (Ordo ya tiene su LMS), artículos, encuestas, broadcasts, emails, invitaciones, admin aparte.

## Decisiones
- D1 · **Identidad visual**: se copia el layout y los componentes de OpenCircle (estructura, espaciados, jerarquía), pero con los **tokens de color y tipografía de Ordo** (`globals.css`), para que el módulo no desentone con el resto. Si Gabriel quiere los colores exactos de OpenCircle, se cambia en una microtarea de CSS.
- D2 · **Dependencias** para «migrar mucho» (las instala el orquestador, verificando React 19 / Next 16): `@tanstack/react-query`, `jotai`, `ky`, `emoji-picker-react`, `@uiw/react-md-editor`, `remark-gfm`, `@hugeicons/react` + `@hugeicons/core-free-icons`. Se reemplazan, no se instalan: TanStack Router → `next/navigation` + `Link`; `react-hot-toast` → `@/lib/toast`; `moment` → `date-fns` (ya está). `react-markdown` ya está.
- D3 · **Integración LMS**: un canal por materia de Homeschooling (`Social_Canales.materiaId`), creado al vuelo la primera vez que se abre; miembros = quienes tienen acceso a la materia. Posts del muro de estudio existente (`PublicacionFamilia`) **no se migran** en la v1 (Pendiente: decidir con Gabriel si el muro de estudio se reemplaza por el canal).
- D4 · **Videos**: dependen de LANE_277 (archivos grandes). Sin 277, solo fotos (`/api/upload`).
- D5 · **Chat**: se reutiliza `MensajeFamilia`; OpenCircle no tiene chat (verificado: no hay módulo de mensajes en `api_v2/src/modules`).
- D6 · Moderación: los padres pueden borrar cualquier post/comentario y fijar posts (`isPinned`); los hijos solo los suyos.
- D7 · IDs `uuid` como en OpenCircle (menos cambios al portar); usuarios con el `Int` de Ordo.
- D8 · (orquestador, 2026-11-07) **Dependencias (D2) y `THIRD_PARTY_NOTICES.md` se agregan en la fase 3**, cuando la lane 271 (que también toca `package.json`, `package-lock.json` y `THIRD_PARTY_NOTICES.md`) esté en `origin/dev` (D-BP5). Las fases 0–2 no las necesitan. Mientras tanto la licencia queda en `vendor/opencircle/ORIGEN.md`.
- D9 · (orquestador, 2026-11-07) **Dónde va el esquema.** El ancla de la spec («debajo de `historialAcciones HistorialAccion[]`») aparece 2 veces (`Usuario` y `Tarea`) y ahí insertan 265, 271 y 272; «al final» lo usan 271 y 272; la 270 inserta debajo de `libros` y después de `model Libro`. Para que la integración no choque: las relaciones van en `Usuario` debajo de `reclamosCarta ReclamoCarta[]` y los modelos después de `model MensajeFamilia` (el chat, D5), que ninguna lane abierta toca. La lane tiene `node_modules` propio (`prisma generate` no debe pisar el del directorio principal).
- D10 · (orquestador, 2026-11-07, ensayo) **Ajustes de la fase 1.** (a) Las relaciones en `Usuario` van separadas por una línea vacía y un comentario: así `prisma format` no realinea las 5 líneas de cartas vecinas (con el bloque pegado, el diff borraba 5 líneas ajenas). (b) `extraerMenciones(texto, usuarios, autorId)` recibe el autor como tercer parámetro (la spec decía «sin el autor» sin pasarlo); gana el nombre más largo y no distingue tildes ni mayúsculas. (c) `puedeVerCanal(canal, actor, miembrosIds)`: el canal de materia se trata como privado aunque su `tipo` sea `publico`. (d) `esPadre` se reutiliza de `src/lib/habitos/permisos.ts`.
- D11 · (orquestador, 2026-11-07, lectura completa de `api_v2/src/modules/*` y `packages/core/src/services/routers/*`) **Contrato de `/api/social`: el de `packages/core`, no el de `api_v2`.** El front de OpenCircle (`apps/platform`) habla con `packages/core`, que espera la API vieja: rutas con barra final (`posts/`, `channels/`, `reactions/`, `notifications`), parámetros `skip`/`limit` y en snake_case (`channel_slug`, `parent_id`, `user_id`, `post_type`), respuestas **sin envoltorio** (arrays sueltos, no `{ data, meta }`) y objetos en snake_case con campos calculados (`Post.comment_count`, `reaction_count`, `reactions: { summary: [{ emoji, count, me }], user_reaction_ids }`, `comment_summary: { count, names, me }`, `user`, `medias`, `channel`). `api_v2` responde otra cosa (`{ data, meta }`, camelCase, `page`). Para «migrar mucho» del front sin reescribirlo: **las reglas se portan de `api_v2/*/service.ts`, la forma de entrada y salida es la de `packages/core/*/types.ts`**, con un adaptador `src/lib/social/servidor/dto.ts` (`aUsuarioDTO`, `aCanalDTO`, `aPostDTO`, `aNotificacionDTO`). Usuario de Ordo → `User`: `id: String(id)`, `username: String(id)` (Ordo no tiene usuario; el perfil va por id), `name: nombre`, `avatar_url: fotoUrl`, `role: esPadre ? "admin" : "user"`. Tipos de notificación: `mencion→mention`, `reaccion→like`, `respuesta→reply`. Ruta base: `/api/social/` + la del cliente (`/api/social/posts`, etc.). Se corrigen 2 fallas de `api_v2`: `deletePost` no comprueba autor (acá `puedeBorrarPost`, D6) y `createPost` deja publicar en canal privado si sos admin no miembro (acá `puedeVerCanal`).
- D12 · (orquestador, 2026-11-07, lectura de `features/posts/utils/content{Parsing,Rendering}.tsx` y `replyForm.tsx`) **Menciones = `@username` como en OpenCircle.** El front inserta y reconoce `@(\w+)` y enlaza a `/$username`; un nombre con espacios o tildes no entra. Ordo no tiene username, así que se deriva del nombre: `usernameDe(nombre)` = sin tildes, minúsculas, todo lo que no sea `a-z0-9` → `_` (`Ana Prueba` → `ana_prueba`). Corrige D11 (`username: String(id)` → `usernameDe(nombre)`) y D10(b): `extraerMenciones(texto, usuarios, autorId)` busca los `@token` y los resuelve por `usernameDe`. Si dos integrantes dieran el mismo username, gana el de id menor (pendiente si pasa). El perfil (`/dashboard/social/u/[username]`) busca por ese username.

## Modelo de datos (Prisma; portado de `apps/api_v2/prisma/schema.prisma`)
```prisma
// ← Lane 276: Social (modelo de devscalelabs/opencircle@5a8beada apps/api_v2/prisma/schema.prisma: Post, Media, Channel, ChannelMember, Reaction, Notification)
enum SocialTipoCanal {
  publico
  privado
}

enum SocialTipoNotificacion {
  mencion
  reaccion
  respuesta
}

model SocialCanal {
  id          String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  emoji       String          @default("😊") @map("Emoji")
  nombre      String          @map("Nombre")
  descripcion String?         @map("Descripcion")
  slug        String          @unique @map("Slug")
  tipo        SocialTipoCanal @default(publico) @map("Tipo")
  materiaId   Int?            @unique @map("Materia_ID") // canal automático de una materia del LMS (D3)
  createdAt   DateTime        @default(now()) @map("Created_At")
  deletedAt   DateTime?       @map("Deleted_At")

  miembros SocialCanalMiembro[]
  posts    SocialPost[]

  @@map("Social_Canales")
}

model SocialCanalMiembro {
  canalId   String   @map("Canal_ID") @db.Uuid
  usuarioId Int      @map("Usuario_ID")
  createdAt DateTime @default(now()) @map("Created_At")

  canal   SocialCanal @relation(fields: [canalId], references: [id], onDelete: Cascade)
  usuario Usuario     @relation("SocialCanales", fields: [usuarioId], references: [id], onDelete: Cascade)

  @@id([canalId, usuarioId])
  @@index([usuarioId])
  @@map("Social_Canal_Miembros")
}

model SocialPost {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  contenido String    @map("Contenido")
  autorId   Int       @map("Autor_ID")
  canalId   String?   @map("Canal_ID") @db.Uuid
  padreId   String?   @map("Padre_ID") @db.Uuid // comentario de otro post
  enlaceLms Json?     @map("Enlace_LMS") // { tipo: "curso" | "leccion", id, titulo }
  fijado    Boolean   @default(false) @map("Fijado")
  createdAt DateTime  @default(now()) @map("Created_At")
  updatedAt DateTime  @updatedAt @map("Updated_At")
  deletedAt DateTime? @map("Deleted_At")

  autor       Usuario          @relation("SocialPosts", fields: [autorId], references: [id], onDelete: Cascade)
  canal       SocialCanal?     @relation(fields: [canalId], references: [id], onDelete: SetNull)
  padre       SocialPost?      @relation("SocialRespuestas", fields: [padreId], references: [id], onDelete: Cascade)
  respuestas  SocialPost[]     @relation("SocialRespuestas")
  medios      SocialMedio[]
  reacciones  SocialReaccion[]

  @@index([canalId, createdAt])
  @@index([padreId])
  @@index([autorId])
  @@map("Social_Posts")
}

model SocialMedio {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  postId    String?  @map("Post_ID") @db.Uuid
  autorId   Int      @map("Autor_ID")
  url       String   @map("URL")
  tipo      String   @map("Tipo") // imagen | video
  orden     Int      @default(0) @map("Orden")
  createdAt DateTime @default(now()) @map("Created_At")

  post SocialPost? @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@map("Social_Medios")
}

model SocialReaccion {
  postId    String   @map("Post_ID") @db.Uuid
  usuarioId Int      @map("Usuario_ID")
  emoji     String   @map("Emoji")
  createdAt DateTime @default(now()) @map("Created_At")

  post    SocialPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  usuario Usuario    @relation("SocialReacciones", fields: [usuarioId], references: [id], onDelete: Cascade)

  @@id([postId, usuarioId, emoji])
  @@map("Social_Reacciones")
}

model SocialNotificacion {
  id           String                 @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  destinoId    Int                    @map("Destino_ID")
  origenId     Int                    @map("Origen_ID")
  tipo         SocialTipoNotificacion @map("Tipo")
  postId       String?                @map("Post_ID") @db.Uuid
  leida        Boolean                @default(false) @map("Leida")
  createdAt    DateTime               @default(now()) @map("Created_At")

  destino Usuario @relation("SocialNotificacionesRecibidas", fields: [destinoId], references: [id], onDelete: Cascade)
  origen  Usuario @relation("SocialNotificacionesEnviadas", fields: [origenId], references: [id], onDelete: Cascade)

  @@index([destinoId, leida])
  @@map("Social_Notificaciones")
}
```
(+ en `model Usuario`, debajo de `  historialAcciones HistorialAccion[]`:)
```prisma
  socialCanales               SocialCanalMiembro[] @relation("SocialCanales")
  socialPosts                 SocialPost[]         @relation("SocialPosts")
  socialReacciones            SocialReaccion[]     @relation("SocialReacciones")
  socialNotificacionesRecibidas SocialNotificacion[] @relation("SocialNotificacionesRecibidas")
  socialNotificacionesEnviadas  SocialNotificacion[] @relation("SocialNotificacionesEnviadas")
```

## Arquitectura
```
src/app/dashboard/social/layout.tsx  ← _socialLayout.tsx (columna de canales + contenido + pestañas)
src/app/dashboard/social/page.tsx               ← _socialLayout/index.tsx (timeline)
src/app/dashboard/social/posts/[id]/page.tsx    ← _socialLayout/posts/$id.tsx
src/app/dashboard/social/u/[usuarioId]/page.tsx ← _socialLayout/$username.tsx
src/app/dashboard/social/notificaciones/page.tsx← _socialLayout/notifications/index.tsx
src/app/dashboard/social/mensajes/page.tsx      → chat existente (MensajeFamilia), D5
src/components/social/{posts,channels,reactions,mention,timeline,notifications,media}/**  ← apps/platform/src/features/<mismo nombre>/**
src/components/social/ui/**                      ← packages/ui (solo lo que usen los componentes portados)
src/lib/social/api.ts                            ← cliente ky de OpenCircle apuntando a /api/social
src/lib/social/servidor/{posts,canales,reacciones,notificaciones,medios,menciones}.ts ← apps/api_v2/src/modules/*/service.ts
src/lib/social/permisos.ts (+ test)              ← D6 y visibilidad de canales privados
src/app/api/social/**                            ← apps/api_v2/src/modules/*/router.ts
```

## Archivos en alcance
`prisma/schema.prisma` · `src/lib/social/**` · `src/app/api/social/**` · `src/components/social/**` · `src/app/dashboard/social/**` · `src/components/app/AppSidebar.tsx` · `package.json`/`package-lock.json`, `vendor/opencircle/**`, `THIRD_PARTY_NOTICES.md` (orquestador)

## Microtareas

### Fase 0 [orquestador]
- [x] M0 vendor (`68b111d`; dependencias y `THIRD_PARTY_NOTICES` → fase 3, D8) · `vendor/opencircle/` (`LICENSE`, `apps/platform/src/{features,routes/_socialLayout*,components,contexts,utils}`, `packages/ui`, `packages/core`, `apps/api_v2/prisma/schema.prisma`, `apps/api_v2/src/modules/{posts,channels,channel-members,reactions,notifications,media}`) + `ORIGEN.md`; `THIRD_PARTY_NOTICES.md`; dependencias D2 con `npm run build` verde.

### Fase 1 — datos y permisos (exacto; ensayada por el orquestador el 2026-11-07, D9–D10)
- [x] M1 [agy] (`2e78963`, salida de agy idéntica al ensayo) Esquema en `prisma/schema.prisma` (solo este archivo).
  1. Precondición: `grep -c "^  reclamosCarta        ReclamoCarta\[\]$" prisma/schema.prisma` → `1`; `grep -c '^  @@map("Homeschool_Mensajes")$' prisma/schema.prisma` → `1`; `grep -c "^model Social" prisma/schema.prisma` → `0` (ojo: `model HistoriaSocial` ya existe y no se toca). Si no da eso: BLOQUEADO.
  2. Debajo de la línea `  reclamosCarta        ReclamoCarta[]` (dentro de `model Usuario`) insertá **una línea vacía**, la línea `  // Social (lane 276)` y estas 5 líneas, sin cambiar ninguna otra línea de `Usuario`:
````prisma
  socialCanales               SocialCanalMiembro[] @relation("SocialCanales")
  socialPosts                 SocialPost[]         @relation("SocialPosts")
  socialReacciones            SocialReaccion[]     @relation("SocialReacciones")
  socialNotificacionesRecibidas SocialNotificacion[] @relation("SocialNotificacionesRecibidas")
  socialNotificacionesEnviadas  SocialNotificacion[] @relation("SocialNotificacionesEnviadas")
````
  3. Debajo de la línea `}` que cierra `model MensajeFamilia` (la que sigue a `  @@map("Homeschool_Mensajes")`) insertá una línea vacía y este bloque completo, tal cual:
````prisma
// ← Lane 276: Social (modelo de devscalelabs/opencircle@5a8beada apps/api_v2/prisma/schema.prisma: Post, Media, Channel, ChannelMember, Reaction, Notification)
enum SocialTipoCanal {
  publico
  privado
}

enum SocialTipoNotificacion {
  mencion
  reaccion
  respuesta
}

model SocialCanal {
  id          String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  emoji       String          @default("😊") @map("Emoji")
  nombre      String          @map("Nombre")
  descripcion String?         @map("Descripcion")
  slug        String          @unique @map("Slug")
  tipo        SocialTipoCanal @default(publico) @map("Tipo")
  materiaId   Int?            @unique @map("Materia_ID") // canal automático de una materia del LMS (D3)
  createdAt   DateTime        @default(now()) @map("Created_At")
  deletedAt   DateTime?       @map("Deleted_At")

  miembros SocialCanalMiembro[]
  posts    SocialPost[]

  @@map("Social_Canales")
}

model SocialCanalMiembro {
  canalId   String   @map("Canal_ID") @db.Uuid
  usuarioId Int      @map("Usuario_ID")
  createdAt DateTime @default(now()) @map("Created_At")

  canal   SocialCanal @relation(fields: [canalId], references: [id], onDelete: Cascade)
  usuario Usuario     @relation("SocialCanales", fields: [usuarioId], references: [id], onDelete: Cascade)

  @@id([canalId, usuarioId])
  @@index([usuarioId])
  @@map("Social_Canal_Miembros")
}

model SocialPost {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  contenido String    @map("Contenido")
  autorId   Int       @map("Autor_ID")
  canalId   String?   @map("Canal_ID") @db.Uuid
  padreId   String?   @map("Padre_ID") @db.Uuid // comentario de otro post
  enlaceLms Json?     @map("Enlace_LMS") // { tipo: "curso" | "leccion", id, titulo }
  fijado    Boolean   @default(false) @map("Fijado")
  createdAt DateTime  @default(now()) @map("Created_At")
  updatedAt DateTime  @updatedAt @map("Updated_At")
  deletedAt DateTime? @map("Deleted_At")

  autor       Usuario          @relation("SocialPosts", fields: [autorId], references: [id], onDelete: Cascade)
  canal       SocialCanal?     @relation(fields: [canalId], references: [id], onDelete: SetNull)
  padre       SocialPost?      @relation("SocialRespuestas", fields: [padreId], references: [id], onDelete: Cascade)
  respuestas  SocialPost[]     @relation("SocialRespuestas")
  medios      SocialMedio[]
  reacciones  SocialReaccion[]

  @@index([canalId, createdAt])
  @@index([padreId])
  @@index([autorId])
  @@map("Social_Posts")
}

model SocialMedio {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  postId    String?  @map("Post_ID") @db.Uuid
  autorId   Int      @map("Autor_ID")
  url       String   @map("URL")
  tipo      String   @map("Tipo") // imagen | video
  orden     Int      @default(0) @map("Orden")
  createdAt DateTime @default(now()) @map("Created_At")

  post SocialPost? @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@map("Social_Medios")
}

model SocialReaccion {
  postId    String   @map("Post_ID") @db.Uuid
  usuarioId Int      @map("Usuario_ID")
  emoji     String   @map("Emoji")
  createdAt DateTime @default(now()) @map("Created_At")

  post    SocialPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  usuario Usuario    @relation("SocialReacciones", fields: [usuarioId], references: [id], onDelete: Cascade)

  @@id([postId, usuarioId, emoji])
  @@map("Social_Reacciones")
}

model SocialNotificacion {
  id           String                 @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  destinoId    Int                    @map("Destino_ID")
  origenId     Int                    @map("Origen_ID")
  tipo         SocialTipoNotificacion @map("Tipo")
  postId       String?                @map("Post_ID") @db.Uuid
  leida        Boolean                @default(false) @map("Leida")
  createdAt    DateTime               @default(now()) @map("Created_At")

  destino Usuario @relation("SocialNotificacionesRecibidas", fields: [destinoId], references: [id], onDelete: Cascade)
  origen  Usuario @relation("SocialNotificacionesEnviadas", fields: [origenId], references: [id], onDelete: Cascade)

  @@index([destinoId, leida])
  @@map("Social_Notificaciones")
}
````
  4. Corré `npx prisma format`, `npx prisma validate` y `npx prisma generate`. Prohibido `prisma db push`, `migrate` o cualquier comando que toque la base.
  5. Verificación: `git diff --numstat prisma/schema.prisma` → `118	0	prisma/schema.prisma` (0 líneas borradas); `grep -c "^model Social" prisma/schema.prisma` → `6`.
- [x] M2 [orquestador] Base (regla 7): `verif-db/sql/12-lane276.sql` generado offline (`migrate diff` desde el esquema de `dev`): `CREATE TYPE` x2, `CREATE TABLE` x6, 8 índices, 10 FKs, **0 `DROP`**. Aplicado solo en la base local; producción pendiente.
- [x] M3 [agy] (`2e78963`, idéntica al ensayo) Crear `src/lib/social/permisos.ts` y `src/lib/social/permisos.test.ts` (carpeta nueva) con este contenido exacto. Precondición: `ls src/lib/social` → no existe; `grep -n "export const esPadre" src/lib/habitos/permisos.ts` → 1 línea.
  - `src/lib/social/permisos.ts`:
````ts
// Reglas del módulo Social (lane 276, D6): quién ve un canal y quién edita, borra o fija un post.
// Sin acceso a la base: el servidor (src/lib/social/servidor/*) trae los datos y pregunta acá.
import { esPadre } from "../habitos/permisos.ts";

export type Actor = { id: number; rol?: string };

/** Público: todos. Privado o de una materia: sus miembros y los padres. */
export function puedeVerCanal(
  canal: { tipo: "publico" | "privado"; materiaId: number | null },
  actor: Actor,
  miembrosIds: number[],
): boolean {
  if (canal.tipo === "publico" && canal.materiaId === null) return true;
  return esPadre(actor.rol) || miembrosIds.includes(actor.id);
}

/** Solo el autor edita su post o comentario. */
export function puedeEditarPost(post: { autorId: number }, actor: Actor): boolean {
  return post.autorId === actor.id;
}

/** El autor, o un padre (moderación). */
export function puedeBorrarPost(post: { autorId: number }, actor: Actor): boolean {
  return post.autorId === actor.id || esPadre(actor.rol);
}

/** Solo los padres fijan posts. */
export function puedeFijar(actor: Actor): boolean {
  return esPadre(actor.rol);
}

const normalizar = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Ids de los usuarios mencionados con `@Nombre` (sin distinguir mayúsculas ni tildes).
 * Gana el nombre más largo («@Juan Pablo» antes que «@Juan»), sin duplicados y sin el autor.
 */
export function extraerMenciones(texto: string, usuarios: { id: number; nombre: string }[], autorId: number): number[] {
  let resto = normalizar(texto);
  const ids: number[] = [];
  const porLargo = [...usuarios].sort((a, b) => b.nombre.length - a.nombre.length);
  for (const u of porLargo) {
    const nombre = normalizar(u.nombre).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`@${nombre}(?![\\p{L}\\p{N}_])`, "gu");
    if (!re.test(resto)) continue;
    resto = resto.replace(re, " ");
    if (u.id !== autorId && !ids.includes(u.id)) ids.push(u.id);
  }
  return ids;
}
````
  - `src/lib/social/permisos.test.ts`:
````ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { extraerMenciones, puedeBorrarPost, puedeEditarPost, puedeFijar, puedeVerCanal } from "./permisos.ts";

const papa = { id: 1, rol: "Padre" };
const mama = { id: 2, rol: "Madre" };
const juan = { id: 3, rol: "Hijo" };
const ana = { id: 4, rol: "Hija" };

test("puedeVerCanal: público para todos; privado o de materia, miembros y padres", () => {
  assert.equal(puedeVerCanal({ tipo: "publico", materiaId: null }, ana, []), true);
  const privado = { tipo: "privado" as const, materiaId: null };
  assert.equal(puedeVerCanal(privado, juan, [3]), true);
  assert.equal(puedeVerCanal(privado, ana, [3]), false);
  assert.equal(puedeVerCanal(privado, mama, []), true);
  const materia = { tipo: "publico" as const, materiaId: 7 };
  assert.equal(puedeVerCanal(materia, ana, [3]), false);
  assert.equal(puedeVerCanal(materia, juan, [3]), true);
  assert.equal(puedeVerCanal(materia, papa, []), true);
});

test("puedeEditarPost: solo el autor", () => {
  assert.equal(puedeEditarPost({ autorId: 3 }, juan), true);
  assert.equal(puedeEditarPost({ autorId: 3 }, papa), false);
});

test("puedeBorrarPost: el autor o un padre", () => {
  assert.equal(puedeBorrarPost({ autorId: 3 }, juan), true);
  assert.equal(puedeBorrarPost({ autorId: 3 }, mama), true);
  assert.equal(puedeBorrarPost({ autorId: 3 }, ana), false);
});

test("puedeFijar: solo padres", () => {
  assert.equal(puedeFijar(papa), true);
  assert.equal(puedeFijar(juan), false);
  assert.equal(puedeFijar({ id: 9 }), false);
});

test("extraerMenciones: nombres, tildes, más largo primero, sin duplicados ni autor", () => {
  const usuarios = [
    { id: 3, nombre: "Juan" },
    { id: 5, nombre: "Juan Pablo" },
    { id: 4, nombre: "Ana" },
    { id: 2, nombre: "Mamá" },
  ];
  assert.deepEqual(extraerMenciones("Hola @Ana y @ana otra vez", usuarios, 1), [4]);
  assert.deepEqual(extraerMenciones("@Juan Pablo vino", usuarios, 1), [5]);
  assert.deepEqual(extraerMenciones("@Juan Pablo y @Juan", usuarios, 1).sort(), [3, 5]);
  assert.deepEqual(extraerMenciones("Gracias @mama!", usuarios, 1), [2]);
  assert.deepEqual(extraerMenciones("Yo @Ana", usuarios, 4), []);
  assert.deepEqual(extraerMenciones("@Anabel no existe", usuarios, 1), []);
  assert.deepEqual(extraerMenciones("sin menciones", usuarios, 1), []);
});
````
  - Verificación: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/social/permisos.test.ts` → `pass 5`, `fail 0`.

### Fase 2 — servidor (ensayada por el orquestador el 2026-11-07: 12 tests unitarios + `verif-db/i276api.mjs` 59/59; D11–D12)
Port de las reglas de `api_v2/src/modules/*/service.ts` con la forma de `packages/core` (D11). El contenido exacto de cada archivo lo lleva el prompt de agy (sale del ensayo); acá queda qué es cada uno.
- [x] M4 [agy] (`9a04a52`, idéntica al ensayo) `src/lib/social/permisos.ts` + test: `usernameDe(nombre)` y `extraerMenciones` por `@username` (D12). Test 6/6.
- [x] M5 [agy] (`9a04a52`, idéntica al ensayo) `src/lib/social/servidor/dto.ts` (+ `dto.test.ts`, 6 tests): tipos `UserDTO`, `ChannelDTO`, `MediaDTO`, `PostDTO`, `NotificationDTO` y `aUsuarioDTO`, `aCanalDTO`, `aPostDTO`, `aNotificacionDTO`, `resumirReacciones`, `resumirComentarios`. Imports relativos con `.ts` (para `node --test`).
- [x] M6 [agy] (`9a04a52`, idéntica al ensayo) Servicios en `src/lib/social/servidor/`: `canales.ts` (← `channels` + `channel-members`; `EntradaInvalidaError`, `canalesVisiblesIds`, `canalVisible`, `listarCanales`, `crearCanal`, `editarCanal`, `borrarCanal`, `listarMiembros`, `cambiarMiembro`; crear/editar/borrar/miembros solo padres), `posts.ts` (← `posts`; timeline = sin canal + canales visibles, fijados primero; comentarios = `parent_id`; menciones y respuestas notifican; editar autor, fijar padres, borrar autor o padre), `reacciones.ts` (← `reactions`; alterna; avisa al autor), `notificaciones.ts` (← `notifications`; `notificar`, `listarNotificaciones`, `marcarLeida`, `contarNoLeidas`), `usuarios.ts` (familia para menciones y perfil por username), `http.ts` (sesión, errores: uuid inválido `P2007`/`P2023` → 404, `skip`/`limit` 1–100).
- [x] M7 [agy] (`9a04a52`, idéntica al ensayo) Rutas en `src/app/api/social/`: `posts` (GET, POST), `posts/with-files` (POST form `post` + `files`, solo imágenes ≤ 4 con `guardarImagen`; videos → 400 hasta 277), `posts/[id]` (GET, PUT, DELETE), `reactions` (POST, DELETE), `reactions/[postId]` (GET), `notifications` (GET), `notifications/[id]/read` (POST), `notifications/no-leidas` (GET `{ count }`), `channels` (GET, POST), `channels/[id]` (GET, PUT, DELETE), `channel-members` (GET, POST, DELETE), `users` (GET `?query`), `users/username/[username]` (GET).
- [x] M8 [orquestador] (sobre la salida de agy: tsc 0, eslint 0, tests 636/585/0/51, build OK, API 59/59) Gates + `node verif-db/i276api.mjs <puerto>` contra la base local (59 checks: visibilidad de privados, menciones, respuestas, reacciones, moderación D6, foto, 401/403/404).
Nota para la fase 3: el cliente de `packages/core` pide rutas con barra final (`posts/?skip=`); el `api.ts` portado debe pedirlas sin barra (`/api/social/posts?skip=`) para evitar el 308 de Next.

### Fase 3 — front (port de `apps/platform`, receta de port)
Una microtarea por archivo de `features/{posts,channels,reactions,mention,timeline,notifications,media}` y por ruta de `_socialLayout`. Cambios permitidos además de la receta general: TanStack Router → `next/navigation`; `react-hot-toast` → `@/lib/toast`; `moment` → `date-fns` (`formatDistanceToNow` con `locale: es`); textos al español con la tabla de textos que deja el orquestador; nada más. **UX idéntica**: no se cambian estructura, orden ni comportamiento de los componentes.

### Fase 4 — integración
- [ ] Canal por materia (D3): `asegurarCanalDeMateria(materiaId)` en `canales.ts` + botón «Conversar en Social» en la página de la materia (archivo exacto lo confirma el orquestador con `grep`).
- [ ] Pestaña «Mensajes» → chat existente.
- [ ] Videos con LANE_277.
- [ ] Enlace «Social» (`MessagesSquare`) en `AppSidebar.tsx` con contador de notificaciones no leídas, al final de la ola 3.
- [ ] [orquestador] Prueba: post con foto y mención → notificación al mencionado; comentar y reaccionar; canal privado invisible para quien no es miembro (API); hijo no borra post ajeno, padre sí; a 360 px igual que OpenCircle en celular.

## Criterios de aceptación
- Posts, comentarios, reacciones, menciones, canales y notificaciones como en OpenCircle, en español y dentro de Ordo.
- Chat accesible desde Social sin duplicar el existente.
- Canales por materia del LMS.
- Videos cuando esté LANE_277.

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/social src/app/api/social src/components/social src/app/dashboard/social` · `npm run build`

## Pendientes
- LANE_277 para videos.
- Gabriel: D1 (colores), D3 (¿el muro de estudio se reemplaza por el canal de la materia?), licencias (D-BP2).

## Hallazgos
- OpenCircle no tiene chat (no hay módulo de mensajes en `apps/api_v2/src/modules`); se usa el chat de Ordo (D5).
- El front (`apps/platform`) no habla con `api_v2` sino con el contrato de `packages/core` (API vieja, snake_case, sin envoltorio) → D11.
- Menciones de OpenCircle = `@username` con `\w+` → D12 (username derivado del nombre).
- `api_v2` tiene 2 agujeros que no se portan: `deletePost` no comprueba el autor; `createPost` no exige membresía a un admin.
- `prisma format` realinea las líneas vecinas si el bloque nuevo tiene nombres más largos; separar con línea vacía evita tocar líneas ajenas (D10a).
- Con el adaptador de pg de Prisma 7 un uuid inválido es `P2007`, no `P2023`.
- El front social usa solo 16 llamadas de la API (posts 6, reactions 3, notifications 2, channels.getAll, users 2, extras.getUrlPreview); `channel-members` y `media` no se llaman directo.
- Producción (2026-11-07, orquestador): esquema aplicado con el SQL aditivo de `prisma migrate diff --from-config-datasource` desde `dev` completo (todas las lanes juntas): 15 tablas, 4 enums, valor `virtud`, 2 columnas nullable en `Checklist_Items`; **0 DROP**, sin cambios de datos. `migrate diff` posterior vacío. Amparo: regla 7 de AGENTS.md + «hace lo que haya que hacer» de Gabriel.

## Bitácora
- 2026-11-07 · claude (orquestador) · RESERVA · creada desde Plane #35
- 2026-11-07 · claude (orquestador) + agy · INICIO · worktree `ordo-diei-lanes/lane-276`, `node_modules` propio. M0 vendor `68b111d`.
- 2026-11-07 · claude + agy · fase 1 `2e78963` (esquema + permisos; salida de agy idéntica al ensayo; tests 629/578/0/51). SQL `verif-db/sql/12-lane276.sql` (0 DROP) aplicado solo en la base local.
- 2026-11-07 · claude (orquestador) · fase 2 ensayada (23 archivos; 12 tests unitarios; `verif-db/i276api.mjs` 59/59) y despachada a agy (prompt por archivo, 54 KB).
- 2026-11-07 · claude + agy · fase 2 `9a04a52`: 23/23 archivos idénticos al ensayo; gates verdes y API 59/59 sobre la salida de agy. **Bloqueada para la fase 3** hasta que la 271 esté en `origin/dev` (D8: dependencias en `package.json`). Fase 3 = 66 archivos (~4100 líneas) de `apps/platform`.
- 2026-11-07 · claude (orquestador) · ENTREGA · PR #64 a dev (`scripts/abrir-pr.sh`: origin/dev incluido, tests + tsc verdes) con OK de Gabriel. Lo integra Gabriel; después `scripts/limpiar-lane.sh 276`.
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #64 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
