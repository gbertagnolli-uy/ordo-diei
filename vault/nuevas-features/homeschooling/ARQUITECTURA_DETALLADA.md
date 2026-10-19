# Homeschooling — Arquitectura (v3, sobre Roost)

> Estado: **lista para implementar** (2026-10-14, lane 117). Reemplaza a la v2. Decisiones de integración con Roost: [`PLAN_INTEGRACION_ROOST.md`](PLAN_INTEGRACION_ROOST.md). Specs por lane: `LANE_*.md` de esta carpeta (índice en el plan §6).
> Stack: Next 16.2.1 (App Router, `params` asíncronos — leer `node_modules/next/dist/docs/` antes de codear), React 19.2.4, Tailwind 4, Prisma 7 + Supabase (solo Postgres, sin `supabase-js`), `node:test`.
> Uso: **solo esta familia, en casa**. Roost (`vendor/roost/`) se **porta** a `src/` con permiso del usuario (D23, D26).

## 1. Decisiones cerradas

| # | Decisión |
|---|---|
| HD1 | **Cada día lectivo es una `Tarea` real.** El niño la completa con `POST /api/tasks/[id]/complete`; el padre la aprueba con `/approve`. Eso da **puntos, estrellas y racha** (no XP de hábitos: `approve` no toca `experienciaHabitos`). No se escribe código de premios. `DiaLectivo.tareaId` las une. |
| HD2 | **«A tiempo» = hasta las 18:00** (hora de la familia, `APP_TZ`). Entre las 18:00 y las 22:00 paga 50 %; después, 0 (regla existente de `complete`). Se logra con `horaEjecucion` (§5.2), sin tocar el cálculo de puntos. |
| HD3 | **Un día está «hecho»** cuando su Tarea está en `Esperando_Aprobacion`, `Aprobada` o `Completada`. Los puntos llegan al aprobar (flujo actual). |
| HD4 | **`DiaLectivo` es la única fuente de verdad del avance.** `ProgresoLeccion` solo existe para recursos con lecciones (`LeccionCurso`); para libros/PDF no hay filas. |
| HD5 | **Contenido familiar, plan por alumno** (modelo de Roost: contenido compartido, avance por usuario). `Materia`, `RecursoCurso` y `LeccionCurso` no tienen alumno; `PlanCurso` sí (`@@unique([recursoId, alumnoId])`). |
| HD6 | **Feriados y días sin clase los carga el padre** a mano (una fila por alumno). |
| HD7 | **Sin datos legales** (ni jurisdicciones, ni Carnegie, ni GPA). Reportes = horas, lecciones y fotos, imprimibles. |
| HD8 | **Evidencia = fotos** en `Archivo`, subidas con `POST /api/upload` (vía `subirImagen`). La URL `/api/archivos/<uuid>` es pública pero imposible de adivinar: **aceptado** por uso doméstico (resuelve AUDITORÍA E1). Audio fuera de v1. |
| HD9 | **Quizzes corregidos en el servidor**; el cliente nunca recibe la respuesta correcta antes de responder. Umbral por recurso (70 % por defecto). |
| HD10 | **Repaso espaciado con `ts-fsrs`** (reemplaza los intervalos fijos de la v2). |
| HD11 | **Sin cartas en v1.** Premio por terminar un curso = vale/producto de la Tienda que crea el padre. |
| HD12 | Sonido, temporizador e inactividad (N2/N13/N4) son **opcionales**: si existen se usan; ninguna lane H los espera. |
| HD13 | Fuera de alcance: Kiosk/Curfew (D6), xAPI/LTI, IA, clases en vivo, pizarra con OCR, audio. |
| HD14 | Fechas: strings `YYYY-MM-DD` en `APP_TZ`. Reutilizar `APP_TZ`, `hoyEnFamilia()`, `aFecha()`, `aClave()` de `src/lib/habitos/server.ts` y `TZDate` de `@date-fns/tz`. `repartir()` es pura: nunca llama a `Date.now()`. |
| HD15 | **Las evidencias de un hijo solo las ven él y los padres.** |
| HD16 | Navegación: un solo enlace **«Estudio»** en `AppSidebar` (no en `MainDock`, para no duplicar). |

## 2. Mapa de módulos

```
src/lib/homeschooling/
  config.ts                 MAX_POR_DIA, UMBRAL_APROBACION, HORA_LIMITE_LECCION = "18:00"
  pacing.ts (+ .test.ts)    repartir() — pura
  video.ts (+ .test.ts)     parsearEnlaceVideo(), urlEmbed() — portado de Roost
  roost/
    tipos.ts                tipos de Roost con ids number
    router.ts               shim react-router → next/navigation
    dto.ts                  mapModule/mapRecording/... (de vendor/roost/src/db/adapters/mongodb)
    services/*.ts           cliente: mismas firmas que vendor/roost/src/services/*, cuerpo = fetch
    guarda.test.ts          prohíbe react-router, supabase, clases de Roost sin traducir
  servidor/
    planes.ts               crearPlan, vistaPrevia, marcarNoLectivo, recalcular, moverDia, omitirDia
    cursos.ts               materias, recursos y lecciones (Prisma)
    hoy.ts                  asegurarTareasDeHoy, leccionesDeHoy, vencimientoLeccion
    progreso.ts             sincronizarDia, estaBloqueado, completarLeccion
    guardia.ts              motivoBloqueoTarea(tareaId) — la usa /api/tasks/[id]/complete
    evidencia.ts · quiz.ts · repaso.ts · actividades.ts · horas.ts
src/app/api/homeschooling/...        rutas finas con conSesion + zod
src/app/dashboard/homeschooling/     page.tsx (resumen/notificaciones padre · Hoy aprendo hijo) + materias (PanelMaterias) + materias/[id] (constructor de cursos/clases) + imprimir/quiz/[id] (evaluaciones/clases A4) · plan · dias-sin-clase · revision · portafolio · horas · reportes
src/components/homeschooling/        roost/ (piezas sin datos) · cursos/ (PanelMaterias, CursoDetalle, LeccionForm, VistaLeccion, EditorPreguntas) · material/ (AgregarMaterial, ListaMaterial, VisorMaterial, HojaImpresion) · plan/ (PanelHomeschooling, PlanCalendario) · hoy/ · evidencia/ · revision/ · portafolio/ · quiz/ (HojaQuizImprimible) · horas/ · reportes/ · sensorial/
```
Permisos: Padre/Madre pueden todo sobre cualquier alumno; Hijo/Hija solo lo suyo. `conSesion` (`src/lib/tienda/http.ts`) y `usuariosObjetivo`/`esPadre` (`src/lib/habitos/permisos.ts`). Los `userId` que manden los services portados se **ignoran** si quien llama es hijo (se usa la sesión).

## 3. Esquema Prisma (aditivo, definitivo)

Solo tablas nuevas y **relaciones inversas** (no agregan columnas) en `Usuario`, `Libro` y `Tarea`. Cada lane agrega **solo sus modelos** (tabla §3.2) y, en el mismo commit, las relaciones inversas que esos modelos necesitan. Antes: `git merge dev`; SQL con `prisma migrate diff … --script`; **si hay `DROP`, no se aplica**; nunca `db push`.

### 3.1 Modelos

```prisma
enum TipoRecurso {
  libro
  curso_videos
  pdf
  enlaces
  libre
}
enum UnidadContenido {
  pagina
  capitulo
  leccion
  unidad
}
enum EstadoPlan {
  activo
  pausado
  finalizado
}
enum EstadoDiaLectivo {
  pendiente
  hecha
  movida
  omitida
}
enum PlataformaVideo {
  youtube
  vimeo
}
enum EstadoEvidencia {
  pendiente
  aprobada
  ajustar
}

// ← groups de Roost
model Materia {
  id          Int             @id @default(autoincrement())
  nombre      String          @map("Nombre")
  descripcion String?         @map("Descripcion")
  portadaUrl  String?         @map("Portada_URL")
  icono       String?         @map("Icono")          // nombre Lucide
  color       String?         @map("Color")          // token del tema, no hex
  dificultad  DificultadTarea @default(Media) @map("Dificultad") // se copia a cada Tarea
  orden       Int             @default(0) @map("Orden")
  activa      Boolean         @default(true) @map("Activa")
  creadorId   Int             @map("Creador_ID")
  createdAt   DateTime        @default(now()) @map("Created_At")

  creador     Usuario         @relation("MateriasCreadas", fields: [creadorId], references: [id])
  recursos    RecursoCurso[]
  actividades ActividadOffline[]   // H5
  metas       MetaHoras[]          // H5
  @@index([activa, orden])
  @@map("Homeschool_Materias")
}

// ← modules de Roost + campos de pacing
model RecursoCurso {
  id               Int             @id @default(autoincrement())
  materiaId        Int             @map("Materia_ID")
  titulo           String          @map("Titulo")
  descripcion      String?         @map("Descripcion")
  portadaUrl       String?         @map("Portada_URL")
  orden            Int             @default(0) @map("Orden")
  creadorId        Int             @map("Creador_ID")     // será el creadorId de las Tareas
  tipo             TipoRecurso     @map("Tipo")
  unidadTipo       UnidadContenido @map("Unidad_Tipo")
  totalUnidades    Int             @map("Total_Unidades") // curso_videos/enlaces: = cantidad de lecciones (se sincroniza)
  url              String?         @map("URL")
  libroId          Int?            @map("Libro_ID")        // informativo
  minutosPorUnidad Int             @default(20) @map("Minutos_Por_Unidad")
  umbralAprobacion Int             @default(70) @map("Umbral_Aprobacion")
  navegacionLibre  Boolean         @default(false) @map("Navegacion_Libre")
  createdAt        DateTime        @default(now()) @map("Created_At")
  updatedAt        DateTime        @updatedAt @map("Updated_At")

  materia   Materia           @relation(fields: [materiaId], references: [id], onDelete: Cascade)
  creador   Usuario           @relation("RecursosCreados", fields: [creadorId], references: [id])
  libro     Libro?            @relation("RecursoLibro", fields: [libroId], references: [id], onDelete: SetNull)
  planes    PlanCurso[]
  lecciones LeccionCurso[]
  progresos ProgresoLeccion[]  // H2
  @@index([materiaId, orden])
  @@map("Homeschool_Recursos")
}

// ← recordings de Roost
model LeccionCurso {
  id              Int              @id @default(autoincrement())
  recursoId       Int              @map("Recurso_ID")
  orden           Int              @map("Orden")              // = número de unidad 1..N, sin huecos
  titulo          String           @map("Titulo")
  instrucciones   String?          @map("Instrucciones")      // texto plano (description de Roost)
  url             String?          @map("URL")                // video_url de Roost; opcional
  videoPlataforma PlataformaVideo? @map("Video_Plataforma")
  videoId         String?          @map("Video_ID")
  miniaturaUrl    String?          @map("Miniatura_URL")
  creadorId       Int              @map("Creador_ID")
  createdAt       DateTime         @default(now()) @map("Created_At")

  recurso   RecursoCurso      @relation(fields: [recursoId], references: [id], onDelete: Cascade)
  creador   Usuario           @relation("LeccionesCreadas", fields: [creadorId], references: [id])
  progresos ProgresoLeccion[] // H2
  preguntas PreguntaLeccion[] // H4
  intentos  IntentoQuiz[]     // H4
  repasos   TarjetaRepaso[]   // H4
  @@unique([recursoId, orden])
  @@map("Homeschool_Lecciones")
}

model PlanCurso {
  id         Int        @id @default(autoincrement())
  recursoId  Int        @map("Recurso_ID")
  alumnoId   Int        @map("Alumno_ID")
  inicio     DateTime   @db.Date @map("Inicio")
  fin        DateTime   @db.Date @map("Fin")
  diasSemana Int[]      @map("Dias_Semana")   // ISO: 1=lunes … 7=domingo
  estado     EstadoPlan @default(activo) @map("Estado")
  createdAt  DateTime   @default(now()) @map("Created_At")

  recurso RecursoCurso @relation(fields: [recursoId], references: [id], onDelete: Cascade)
  alumno  Usuario      @relation("PlanesAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  dias    DiaLectivo[]
  @@unique([recursoId, alumnoId])
  @@index([alumnoId, estado])
  @@map("Homeschool_Planes")
}

model DiaLectivo {
  id          Int              @id @default(autoincrement())
  planId      Int              @map("Plan_ID")
  fecha       DateTime         @db.Date @map("Fecha")
  unidadDesde Int              @map("Unidad_Desde")   // 1-based, inclusive
  unidadHasta Int              @map("Unidad_Hasta")   // inclusive; >= desde
  estado      EstadoDiaLectivo @default(pendiente) @map("Estado")
  tareaId     Int?             @unique @map("Tarea_ID")
  createdAt   DateTime         @default(now()) @map("Created_At")

  plan       PlanCurso @relation(fields: [planId], references: [id], onDelete: Cascade)
  tarea      Tarea?    @relation("DiaLectivoTarea", fields: [tareaId], references: [id], onDelete: SetNull)
  evidencias EvidenciaAprendizaje[] // H3
  @@unique([planId, fecha])
  @@index([fecha, estado])
  @@map("Homeschool_Dias_Lectivos")
}

model DiaNoLectivo {
  id        Int      @id @default(autoincrement())
  alumnoId  Int      @map("Alumno_ID")   // «toda la familia» = una fila por alumno
  fecha     DateTime @db.Date @map("Fecha")
  motivo    String   @map("Motivo")
  createdAt DateTime @default(now()) @map("Created_At")

  alumno Usuario @relation("DiasNoLectivosAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  @@unique([alumnoId, fecha])
  @@map("Homeschool_Dias_No_Lectivos")
}

// ← lesson_completions de Roost: la fila ES la completitud (H2)
model ProgresoLeccion {
  id           Int      @id @default(autoincrement())
  alumnoId     Int      @map("Alumno_ID")
  leccionId    Int      @map("Leccion_ID")
  recursoId    Int      @map("Recurso_ID")
  completadaEn DateTime @default(now()) @map("Completada_En")

  alumno  Usuario      @relation("ProgresoAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  leccion LeccionCurso @relation(fields: [leccionId], references: [id], onDelete: Cascade)
  recurso RecursoCurso @relation(fields: [recursoId], references: [id], onDelete: Cascade)
  @@unique([alumnoId, leccionId])
  @@index([alumnoId, recursoId])
  @@map("Homeschool_Progreso")
}

// ← showcases de Roost (H3)
model EvidenciaAprendizaje {
  id              Int             @id @default(autoincrement())
  alumnoId        Int             @map("Alumno_ID")
  diaLectivoId    Int?            @map("Dia_Lectivo_ID")
  titulo          String?         @map("Titulo")
  nota            String?         @map("Nota")
  estado          EstadoEvidencia @default(pendiente) @map("Estado")
  comentarioPadre String?         @map("Comentario_Padre")
  revisadaPorId   Int?            @map("Revisada_Por_ID")
  revisadaEn      DateTime?       @map("Revisada_En")
  estrellas       Int?            @map("Estrellas")       // 1-5, no dan monedas
  destacada       Boolean         @default(false) @map("Destacada")
  destacadaEn     DateTime?       @map("Destacada_En")
  createdAt       DateTime        @default(now()) @map("Created_At")

  alumno      Usuario           @relation("EvidenciasAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  revisadaPor Usuario?          @relation("EvidenciasRevisadas", fields: [revisadaPorId], references: [id], onDelete: SetNull)
  diaLectivo  DiaLectivo?       @relation(fields: [diaLectivoId], references: [id], onDelete: SetNull)
  imagenes    EvidenciaImagen[]
  @@index([alumnoId, estado])
  @@map("Homeschool_Evidencias")
}

// ← showcase_images de Roost (H3)
model EvidenciaImagen {
  id          Int      @id @default(autoincrement())
  evidenciaId Int      @map("Evidencia_ID")
  archivoUrl  String   @map("Archivo_URL")   // /api/archivos/<uuid>
  orden       Int      @default(0) @map("Orden")
  pie         String?  @map("Pie")
  createdAt   DateTime @default(now()) @map("Created_At")

  evidencia EvidenciaAprendizaje @relation(fields: [evidenciaId], references: [id], onDelete: Cascade)
  @@map("Homeschool_Evidencia_Imagenes")
}

// (H4)
model PreguntaLeccion {
  id           Int     @id @default(autoincrement())
  leccionId    Int     @map("Leccion_ID")
  orden        Int     @map("Orden")
  segundoVideo Int?    @map("Segundo_Video")   // null = quiz final; número = checkpoint
  enunciado    String  @map("Enunciado")
  opciones     Json    @map("Opciones")        // string[] (2 a 4)
  correcta     Int     @map("Correcta")        // índice; NUNCA viaja al cliente antes de responder
  explicacion  String? @map("Explicacion")

  leccion LeccionCurso @relation(fields: [leccionId], references: [id], onDelete: Cascade)
  @@unique([leccionId, orden])
  @@map("Homeschool_Preguntas")
}

model IntentoQuiz {
  id         Int      @id @default(autoincrement())
  alumnoId   Int      @map("Alumno_ID")
  leccionId  Int      @map("Leccion_ID")
  nota       Int      @map("Nota")             // 0-100
  aprobado   Boolean  @map("Aprobado")
  respuestas Json     @map("Respuestas")       // { preguntaId: índice elegido }
  createdAt  DateTime @default(now()) @map("Created_At")

  alumno  Usuario      @relation("IntentosQuizAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  leccion LeccionCurso @relation(fields: [leccionId], references: [id], onDelete: Cascade)
  @@index([alumnoId, leccionId, createdAt])
  @@map("Homeschool_Intentos_Quiz")
}

model TarjetaRepaso {
  id        Int      @id @default(autoincrement())
  alumnoId  Int      @map("Alumno_ID")
  leccionId Int      @map("Leccion_ID")
  tarjeta   Json     @map("Tarjeta")            // Card de ts-fsrs serializada tal cual
  proximo   DateTime @map("Proximo")            // = tarjeta.due, para consultar
  resuelta  Boolean  @default(false) @map("Resuelta")
  createdAt DateTime @default(now()) @map("Created_At")

  alumno  Usuario      @relation("RepasosAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  leccion LeccionCurso @relation(fields: [leccionId], references: [id], onDelete: Cascade)
  @@unique([alumnoId, leccionId])
  @@index([alumnoId, proximo, resuelta])
  @@map("Homeschool_Repasos")
}

// ← events de Roost (H5)
model ActividadOffline {
  id          Int      @id @default(autoincrement())
  materiaId   Int      @map("Materia_ID")
  titulo      String   @map("Titulo")
  descripcion String?  @map("Descripcion")
  inicio      DateTime @map("Inicio")
  fin         DateTime @map("Fin")               // > inicio (se valida con zod)
  lugar       String?  @map("Lugar")
  creadorId   Int      @map("Creador_ID")
  createdAt   DateTime @default(now()) @map("Created_At")
  updatedAt   DateTime @updatedAt @map("Updated_At")

  materia       Materia                 @relation(fields: [materiaId], references: [id], onDelete: Cascade)
  creador       Usuario                 @relation("ActividadesCreadas", fields: [creadorId], references: [id])
  participantes ParticipanteActividad[]
  @@index([inicio])
  @@map("Homeschool_Actividades")
}

// ← event_attendees de Roost (H5)
model ParticipanteActividad {
  id          Int      @id @default(autoincrement())
  actividadId Int      @map("Actividad_ID")
  alumnoId    Int      @map("Alumno_ID")
  createdAt   DateTime @default(now()) @map("Created_At")

  actividad ActividadOffline @relation(fields: [actividadId], references: [id], onDelete: Cascade)
  alumno    Usuario          @relation("ActividadesAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  @@unique([actividadId, alumnoId])
  @@map("Homeschool_Participantes")
}

model MetaHoras {   // (H5) la fija el padre; sin cifras precargadas
  id        Int @id @default(autoincrement())
  alumnoId  Int @map("Alumno_ID")
  materiaId Int @map("Materia_ID")
  horas     Int @map("Horas")

  alumno  Usuario @relation("MetasHorasAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  materia Materia @relation(fields: [materiaId], references: [id], onDelete: Cascade)
  @@unique([alumnoId, materiaId])
  @@map("Homeschool_Metas_Horas")
}

model PreferenciaAlumno {   // H6
  alumnoId          Int     @id @map("Alumno_ID")
  modoRelajado      Boolean @default(false) @map("Modo_Relajado")
  primeroDespues    Boolean @default(false) @map("Primero_Despues")
  recompensaDespues String? @map("Recompensa_Despues")
  alumno Usuario @relation("PreferenciaAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  @@map("Homeschool_Preferencias")
}

model HistoriaSocial {      // H6
  id        Int      @id @default(autoincrement())
  alumnoId  Int?     @map("Alumno_ID")   // null = para todos (sin relación a propósito)
  titulo    String   @map("Titulo")
  pasos     Json     @map("Pasos")       // [{texto, icono}] (3 a 5)
  createdAt DateTime @default(now()) @map("Created_At")
  @@map("Homeschool_Historias")
}
```

### 3.2 Qué agrega cada lane

| Lane | Enums y modelos | Relaciones inversas que agrega en el mismo commit |
|---|---|---|
| H1a | `TipoRecurso`, `UnidadContenido`, `EstadoPlan`, `EstadoDiaLectivo`, `PlataformaVideo`; `Materia`, `RecursoCurso`, `LeccionCurso`, `PlanCurso`, `DiaLectivo`, `DiaNoLectivo` | `Usuario`: `materiasCreadas Materia[] @relation("MateriasCreadas")`, `recursosCreados RecursoCurso[] @relation("RecursosCreados")`, `leccionesCreadas LeccionCurso[] @relation("LeccionesCreadas")`, `planesAlumno PlanCurso[] @relation("PlanesAlumno")`, `diasNoLectivos DiaNoLectivo[] @relation("DiasNoLectivosAlumno")`; `Libro`: `recursosCurso RecursoCurso[] @relation("RecursoLibro")`; `Tarea`: `diaLectivo DiaLectivo? @relation("DiaLectivoTarea")`. **Sin** los campos marcados `// H2…H5` |
| H2 | `ProgresoLeccion` | `Usuario.progresoLecciones ProgresoLeccion[] @relation("ProgresoAlumno")`; `LeccionCurso.progresos`; `RecursoCurso.progresos` |
| H3 | `EstadoEvidencia`; `EvidenciaAprendizaje`, `EvidenciaImagen` | `Usuario.evidenciasHs … @relation("EvidenciasAlumno")`, `Usuario.evidenciasRevisadas … @relation("EvidenciasRevisadas")`; `DiaLectivo.evidencias` |
| H4 | `PreguntaLeccion`, `IntentoQuiz`, `TarjetaRepaso` | `Usuario.intentosQuiz … @relation("IntentosQuizAlumno")`, `Usuario.repasos … @relation("RepasosAlumno")`; `LeccionCurso.preguntas/intentos/repasos` |
| H5 | `ActividadOffline`, `ParticipanteActividad`, `MetaHoras` | `Usuario.actividadesCreadas … @relation("ActividadesCreadas")`, `Usuario.actividadesAlumno … @relation("ActividadesAlumno")`, `Usuario.metasHoras … @relation("MetasHorasAlumno")`; `Materia.actividades`, `Materia.metas` |
| H6 | `PreferenciaAlumno`, `HistoriaSocial` | `Usuario.preferenciaHs PreferenciaAlumno? @relation("PreferenciaAlumno")` |

Validar con `npx prisma validate` antes de generar el SQL.

## 4. Algoritmo de pacing (`pacing.ts`, puro)

```ts
export type EntradaPacing = {
  totalUnidades: number;
  unidadesBase: number;        // unidades ya cubiertas por días conservados (§4 regla 5)
  desde: string; hasta: string; // 'YYYY-MM-DD', inclusive
  diasSemana: number[];         // ISO 1..7
  noLectivos: string[];         // 'YYYY-MM-DD' (incluye las fechas ocupadas por días conservados)
  unidadTipo: "pagina" | "capitulo" | "leccion" | "unidad";
};
export type SalidaPacing = {
  dias: { fecha: string; unidadDesde: number; unidadHasta: number }[];
  diasDisponibles: number; pendientes: number; promedio: number;
  aviso?: { tipo: "sin_dias" | "sobrecarga"; promedio?: number; opciones: string[] };
};
```
Reglas:
1. Disponibles = fechas en `[desde, hasta]` cuyo día ISO ∈ `diasSemana` y ∉ `noLectivos`. Día ISO con `getISODay(parseISO(f))`, nunca `getDay()`.
2. `U = total − base`; si `U ≤ 0` → `dias = []`. Si `D = 0` y `U > 0` → `aviso: sin_dias`.
3. Reparto uniforme: el día `i` (0-based) recibe `floor((i+1)·U/D) − floor(i·U/D)`; **solo se crean días con cantidad > 0**. Las unidades se numeran correlativas desde `base+1`.
4. Sobrecarga: si `promedio = U/D` supera `MAX_POR_DIA[unidadTipo]` (lección 4, página 30, capítulo 1, unidad 3) → `aviso.sobrecarga` con «extender hasta <fecha sugerida>», «sumar el sábado», «aceptar el ritmo».
5. **`recalcular(planId, hoy)`** (en `servidor/planes.ts`, transacción):
   - **Conservados** = días `hecha` u `omitida`, más todo día con `fecha ≥ hoy` cuya Tarea exista y **no** esté en `Pendiente` (ya empezada).
   - `unidadesBase` = máx. `unidadHasta` de los conservados (como el avance es en orden —§5.4—, cubren de la unidad 1 en adelante sin huecos).
   - Días con `fecha < hoy` en `pendiente` → `movida` (su Tarea queda como historial; la guardia impide completarla).
   - Se borran los días `pendiente` con `fecha ≥ hoy` no conservados, y sus Tareas **solo si siguen en `Pendiente`**.
   - `repartir({ desde: hoy, hasta: plan.fin, unidadesBase, noLectivos: no lectivos del alumno ∪ fechas de días conservados con fecha ≥ hoy })`.
   - **`fin` nunca cambia** salvo que el padre acepte «extender».
6. **`moverDia(diaId, nuevaFecha)`**: solo un día `pendiente` cuya Tarea no exista o siga `Pendiente`; la nueva fecha debe ser lectiva, libre y **estar entre el día anterior y el siguiente del mismo plan** (así el orden de fechas sigue al de unidades). Si había Tarea `Pendiente`, se borra (se recrea el día que toque). No recalcula nada más.
7. **`omitirDia(diaId)`** (padre): `estado = omitida`; sus unidades cuentan como vistas para el avance; si había Tarea `Pendiente`, se borra. No da puntos.
8. Recursos `curso_videos`/`enlaces`: `totalUnidades` = cantidad de lecciones; al agregar o borrar una lección se actualiza y se `recalcular` cada plan activo. No se puede borrar una lección cubierta por un día `hecha`/`omitida` (409).

## 5. Puente con Tareas

### 5.1 `asegurarTareasDeHoy(alumnoId, hoy)` (idempotente)
Se llama al abrir «Hoy aprendo» y desde `src/app/api/cron/daily/route.ts` (después de generar las recurrentes) para cada alumno con planes activos.
1. Para cada plan activo con algún día `pendiente` de fecha `< hoy` → `recalcular(plan, hoy)`.
2. Para cada `DiaLectivo` de hoy en `pendiente` y sin `tareaId`: crear la `Tarea` y asignarla **sin carreras**: `create` + `diaLectivo.updateMany({ where: { id, tareaId: null }, data: { tareaId } })`; si actualizó 0 filas (otra pestaña ganó), borrar la Tarea recién creada.

### 5.2 Campos de la Tarea
| Campo | Valor |
|---|---|
| `titulo` | «<Materia>: <Recurso> — lección N» / «— lecciones N a M» / «— páginas A a B» |
| `asignadoId` | el alumno del plan |
| `creadorId` | `RecursoCurso.creadorId` |
| `tiempoEjecucionEstimadoSeg` | `(hasta − desde + 1) · minutosPorUnidad · 60` |
| `dificultad` | `Materia.dificultad` |
| `generaPuntosYRecompensa` | `true` |
| `tipoRecurrencia` | `Unica` |
| `fechaVencimiento` | inicio del día en `APP_TZ` (`new TZDate(a, m, d, 0, 0, APP_TZ)`) |
| `horaEjecucion` | **`vencimientoLeccion(hoy, "18:00", estimadoSeg)`** = 18:00 en `APP_TZ` − `estimadoSeg` (nunca antes de las 00:00 de ese día) |

Por qué: `complete` calcula `fechaVencimientoReal = horaEjecucion + tiempoEjecucionEstimadoSeg` (L49-55) y paga completo si `now <= fechaVencimientoReal` (L77) → **completo hasta las 18:00**; `fechaLimite` es ese día a las 22:00 en la hora del servidor (L57-73) → 50 % hasta las 22:00, después 0. El cron pasa a `No_Realizada` lo que siga `Pendiente`/`En_progreso` después de las 22:00 (`cron/daily/route.ts`, «EXPIRAR TAREAS»). En `MissionCalendar` la Tarea aparece como un bloque que termina a las 18:00. **Supuesto:** el servidor corre con la zona de Montevideo (uso en casa); si no, el 50 % termina a las 22:00 de la zona del servidor.

### 5.3 Estado del día
- `sincronizarDia(dia)` (al leer, con `include: { tarea }`), **solo para días `pendiente`**: pasa a `hecha` si `tarea.estado ∈ {Completada, Esperando_Aprobacion, Aprobada}`. Cualquier otro estado (`Pendiente`, `En_progreso`, `Pausada`, `Rechazada`, `Vencida`, `Expirada`, `No_Realizada`) lo deja `pendiente`. Los días `movida`/`omitida` no cambian.
- `Rechazada` → el niño puede volver a completarla (`complete` solo bloquea `Completada`, `Aprobada`, `Esperando_Aprobacion`, L30).
- Si el padre borra la Tarea, `tareaId` queda `null` (SetNull) y se recrea solo si el día es hoy.

### 5.4 Candados (`estaBloqueado`)
- Orden = orden de unidades. **Hoy** siempre está disponible (los atrasos se reprograman en §5.1).
- Un día **futuro** está bloqueado, salvo `navegacionLibre` **y** el día anterior del plan `hecha`/`omitida` (adelantar sí, saltear no).
- Dentro de un día con lecciones, la lección k exige `ProgresoLeccion` de la k−1.

### 5.5 Guardia en `complete` (lane H2)
La Tarea de un día también aparece en el tablero de Tareas y se podría completar desde ahí sin hacer las lecciones. Por eso H2 agrega **una** llamada al principio de `src/app/api/tasks/[id]/complete/route.ts`, después del chequeo de estado: `motivoBloqueoTarea(taskId)` (`servidor/guardia.ts`) devuelve un texto (→ 400) si la Tarea es de un `DiaLectivo` y: el día no está `pendiente` (p. ej. `movida`), o el recurso tiene lecciones y falta algún `ProgresoLeccion` del rango del día. Las Tareas que no son de Homeschooling no cambian (devuelve `null` sin más consultas que un `findUnique` por `tareaId`). Con H4, `ProgresoLeccion` solo se crea al aprobar el quiz, así que la guardia también lo cubre.

## 6. Doble interfaz

`/dashboard/homeschooling` (página servidor) bifurca por `rolFamiliar`: **Hijo/Hija → «Hoy aprendo»** (grilla de `TarjetaHoy`, `VisorLeccion`); **Padre/Madre → materias y plan** (`MateriaLayout` portado de Roost, `PlanCalendario` con el `CalendarView` portado y arrastre, «Hoy no hay clase», bandeja de revisión). Subrutas: `materias/[id]` (con `?module=&lesson=` como Roost), `plan`, `dias-sin-clase`, `revision`, `portafolio`, `horas`, `reportes`. Enlace «Estudio» (`GraduationCap`) solo en `AppSidebar`.

## 7. Roost

Se porta el código de `vendor/roost/` según [`PLAN_INTEGRACION_ROOST.md`](PLAN_INTEGRACION_ROOST.md) §1–§3: cada archivo con cabecera `// Portado de vendor/roost/<ruta> (msrbuilds/roost@492af47). Cambios: …`, clases traducidas con la tabla del plan §2.3, datos por los services partidos (§3 del plan). `vendor/roost/` no se edita.
