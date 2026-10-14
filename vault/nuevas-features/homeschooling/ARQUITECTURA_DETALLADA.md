# Homeschooling — Arquitectura definitiva (v2, lista para implementar)

> ⚠️ **2026-10-14 (lane 115): el supuesto «Roost = solo referencia visual» y «extender `MissionCalendar`» fue REVOCADO por el usuario.** Manda [`PLAN_INTEGRACION_ROOST.md`](PLAN_INTEGRACION_ROOST.md) (porte de código de `vendor/roost/`, modelo y lanes 116–123). Lo que sigue vale solo donde ese plan no lo cambie.

> Estado: **lista para implementar** (2026-10-13). Reemplaza a la v1 de agy; los errores de esa versión están en [`AUDITORIA.md`](AUDITORIA.md) (todos resueltos aquí).
> Stack real: Next 16.2.1 (App Router, `params` asíncronos — leer `node_modules/next/dist/docs/` antes de codear), React 19.2.4, Tailwind 4, Prisma 7 + Supabase, `node:test`.
> Contexto de uso: **solo esta familia, en casa**. No hay SaaS, ni cumplimiento legal, ni premium. Roost se usa como referencia visual con permiso del usuario (sin trámites de licencia).

## 1. Decisiones cerradas (antes eran preguntas abiertas)

| # | Decisión |
|---|---|
| HD1 | **Cada día lectivo es una `Tarea` real** (modelo existente). El niño la completa con `POST /api/tasks/[id]/complete`, el padre la aprueba con `/approve`: puntos, XP, racha, historial y aprobación **ya funcionan**, sin duplicar lógica (esa lógica vive dentro de esas rutas, no en una librería). `DiaLectivo.tareaId` las une. |
| HD2 | **Una lección se considera «hecha» cuando el niño la completa** (la Tarea pasa a `Esperando_Aprobacion`, `Aprobada` o `Completada`); eso desbloquea la siguiente. Los puntos llegan cuando el padre aprueba (flujo actual). |
| HD3 | **El reparto es por `DiaLectivo`**, única fuente de verdad del avance. `LeccionCurso`/`ProgresoLeccion` existen solo para cursos de lecciones discretas (video/enlaces); completar todas las de un día completa el día. |
| HD4 | **Feriados y días sin clase los carga el padre.** «Toda la familia» = una fila por alumno (así no hay filas con `NULL` duplicables). |
| HD5 | **Sin datos legales.** No hay catálogo de jurisdicciones ni créditos Carnegie/GPA. Los reportes son resúmenes de horas, lecciones y fotos, imprimibles. |
| HD6 | **Evidencia = fotos** en la tabla `Archivo` existente (WebP ~200 KB, tope 4 MB, ya implementado en `lib/archivos.ts`). **Audio fuera de v1.** La URL `/api/archivos/<uuid>` es pública pero inadivinable; aceptable por uso doméstico. |
| HD7 | **Quizzes corregidos en el servidor**; el cliente nunca recibe la respuesta correcta. Umbral configurable (70 % por defecto). |
| HD8 | **Repaso espaciado simple** con intervalos fijos 1-3-7-14-30 días (no SM-2). |
| HD9 | **Cartas fuera de v1.** Premio por terminar un curso = un vale/producto de la Tienda que el padre crea a mano. |
| HD10 | **Sonido, temporizador visual e inactividad son opcionales y blandos**: si N2/N13/N4 existen se usan; si no, se omiten. Ninguna lane H espera a una lane N. |
| HD11 | **Kiosk/Curfew no está aquí** (decisión D6: APP nativa). |
| HD12 | **Fuera de alcance:** xAPI/LTI, IA, clases en vivo, pizarra con OCR, audio, Carnegie/GPA, jurisdicciones. |
| HD13 | Alumnos: se diseña para 1 a 6 (cualquier `Usuario` con rol Hijo/Hija), uso táctil en tablet, español. |
| HD14 | Fechas: siempre `YYYY-MM-DD` en la zona de la app. Reutilizar `APP_TZ`, `hoyEnFamilia()`, `aFecha()`, `aClave()` de `src/lib/habitos/server.ts`. La función de pacing es pura: nunca llama a `Date.now()`. |

## 2. Mapa de módulos

```
src/lib/homeschooling/
  config.ts          umbrales (sobrecarga por unidad, % aprobación, intervalos de repaso)
  pacing.ts          repartir() — pura
  pacing.test.ts
  servidor/
    planes.ts        crear plan, materializar días, recalcular, mover día
    hoy.ts           asegurarTareasDeHoy(alumnoId), leccionesDeHoy()
    progreso.ts      sincronizar estado DiaLectivo desde Tarea; desbloqueo secuencial
    quiz.ts          calificar() en servidor
    repaso.ts        programar/avanzar repasos
    horas.ts         resumen de horas y reportes
    evidencia.ts
src/app/api/homeschooling/...        rutas finas que llaman a servidor/*
src/app/dashboard/homeschooling/     page.tsx (bifurca por rol) + plan/ revision/ portafolio/ reportes/
src/components/homeschooling/        hoy/ plan/ lms/ portafolio/ reportes/ sensorial/
```
Permisos: Padre/Madre pueden todo sobre cualquier alumno; Hijo/Hija solo lo suyo. Reutilizar el patrón de `lib/habitos/permisos.ts` y `conSesion` de `lib/tienda/http.ts`.

## 3. Esquema Prisma (aditivo, definitivo)

Todo son tablas nuevas, más **campos de relación inversa** en `Usuario`, `Libro` y `Tarea` (no agregan columnas). Prefijo de tabla `Homeschool_`.

```prisma
enum TipoRecurso { libro curso_videos pdf enlaces libre }
enum UnidadContenido { pagina capitulo leccion unidad }
enum EstadoPlan { activo pausado finalizado }
enum EstadoDiaLectivo { pendiente hecha movida omitida }      // `hecha` se deriva de la Tarea (HD1/HD2)
enum EstadoEvidencia { pendiente aprobada ajustar }

model Materia {
  id        Int      @id @default(autoincrement())
  alumnoId  Int      @map("Alumno_ID")
  nombre    String   @map("Nombre")
  icono     String?  @map("Icono")        // nombre Lucide
  color     String?  @map("Color")        // token de tema, no hex libre
  dificultad DificultadTarea @default(Media) @map("Dificultad") // se copia a cada Tarea
  metaHoras Int?     @map("Meta_Horas")   // opcional, la fija el padre (sin cifras precargadas)
  activa    Boolean  @default(true) @map("Activa")
  orden     Int      @default(0) @map("Orden")
  createdAt DateTime @default(now()) @map("Created_At")

  alumno   Usuario          @relation("MateriasAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  recursos RecursoCurso[]
  horas    ActividadOffline[]
  @@index([alumnoId, activa])
  @@map("Homeschool_Materias")
}

model RecursoCurso {
  id            Int             @id @default(autoincrement())
  materiaId     Int             @map("Materia_ID")
  titulo        String          @map("Titulo")
  tipo          TipoRecurso     @map("Tipo")
  unidadTipo    UnidadContenido @map("Unidad_Tipo")
  totalUnidades Int             @map("Total_Unidades")
  url           String?         @map("URL")
  libroId       Int?            @map("Libro_ID")           // solo informativo; no sincroniza progreso
  navegacionLibre Boolean       @default(false) @map("Navegacion_Libre") // true = sin candados
  minutosPorUnidad Int          @default(20) @map("Minutos_Por_Unidad")  // tiempo estimado de la Tarea
  umbralAprobacion Int          @default(70) @map("Umbral_Aprobacion")
  createdAt     DateTime        @default(now()) @map("Created_At")

  materia   Materia          @relation(fields: [materiaId], references: [id], onDelete: Cascade)
  libro     Libro?           @relation("RecursoLibro", fields: [libroId], references: [id], onDelete: SetNull)
  plan      PlanCurso?
  lecciones LeccionCurso[]
  @@map("Homeschool_Recursos")
}

model PlanCurso {
  id         Int        @id @default(autoincrement())
  recursoId  Int        @unique @map("Recurso_ID")
  inicio     DateTime   @db.Date @map("Inicio")
  fin        DateTime   @db.Date @map("Fin")
  diasSemana Int[]      @map("Dias_Semana")   // ISO: 1=lunes … 7=domingo
  estado     EstadoPlan @default(activo) @map("Estado")
  createdAt  DateTime   @default(now()) @map("Created_At")

  recurso RecursoCurso @relation(fields: [recursoId], references: [id], onDelete: Cascade)
  dias    DiaLectivo[]
  @@map("Homeschool_Planes")
}

model DiaLectivo {
  id          Int              @id @default(autoincrement())
  planId      Int              @map("Plan_ID")
  fecha       DateTime         @db.Date @map("Fecha")
  unidadDesde Int              @map("Unidad_Desde")   // 1-based, inclusive
  unidadHasta Int              @map("Unidad_Hasta")   // inclusive; siempre >= desde (no hay días vacíos)
  estado      EstadoDiaLectivo @default(pendiente) @map("Estado")
  tareaId     Int?             @unique @map("Tarea_ID")   // se crea al llegar el día (HD1)
  createdAt   DateTime         @default(now()) @map("Created_At")

  plan        PlanCurso  @relation(fields: [planId], references: [id], onDelete: Cascade)
  tarea       Tarea?     @relation("DiaLectivoTarea", fields: [tareaId], references: [id], onDelete: SetNull)
  evidencias  EvidenciaAprendizaje[]
  @@unique([planId, fecha])
  @@index([fecha, estado])
  @@map("Homeschool_Dias_Lectivos")
}

model DiaNoLectivo {
  id        Int      @id @default(autoincrement())
  alumnoId  Int      @map("Alumno_ID")            // obligatorio: "toda la familia" = una fila por alumno (HD4)
  fecha     DateTime @db.Date @map("Fecha")
  motivo    String   @map("Motivo")
  createdAt DateTime @default(now()) @map("Created_At")

  alumno Usuario @relation("DiasNoLectivosAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  @@unique([alumnoId, fecha])
  @@map("Homeschool_Dias_No_Lectivos")
}

// Solo para cursos de lecciones discretas (video/enlaces). Para libros/PDF no hay filas (HD3).
model LeccionCurso {
  id         Int     @id @default(autoincrement())
  recursoId  Int     @map("Recurso_ID")
  orden      Int     @map("Orden")                // = número de unidad (1..N)
  titulo     String  @map("Titulo")
  instrucciones String? @map("Instrucciones")     // texto plano
  videoPlataforma String? @map("Video_Plataforma") // "youtube" | "vimeo"
  videoId    String? @map("Video_ID")
  url        String? @map("URL")

  recurso   RecursoCurso @relation(fields: [recursoId], references: [id], onDelete: Cascade)
  preguntas PreguntaLeccion[]
  progreso  ProgresoLeccion[]
  repasos   RepasoLeccion[]
  @@unique([recursoId, orden])
  @@map("Homeschool_Lecciones")
}

model PreguntaLeccion {
  id         Int    @id @default(autoincrement())
  leccionId  Int    @map("Leccion_ID")
  orden      Int    @map("Orden")
  segundoVideo Int? @map("Segundo_Video")          // null = pregunta del quiz final; número = checkpoint
  enunciado  String @map("Enunciado")
  opciones   Json   @map("Opciones")               // string[]
  correcta   Int    @map("Correcta")               // índice; NUNCA se envía al cliente antes de responder
  explicacion String? @map("Explicacion")

  leccion LeccionCurso @relation(fields: [leccionId], references: [id], onDelete: Cascade)
  @@unique([leccionId, orden])
  @@map("Homeschool_Preguntas")
}

model ProgresoLeccion {
  id          Int      @id @default(autoincrement())
  alumnoId    Int      @map("Alumno_ID")
  leccionId   Int      @map("Leccion_ID")
  completada  Boolean  @default(false) @map("Completada")
  mejorNota   Int?     @map("Mejor_Nota")          // 0-100; null = sin quiz
  intentos    Int      @default(0) @map("Intentos")
  fallosSeguidos Int   @default(0) @map("Fallos_Seguidos")
  completadaEn DateTime? @map("Completada_En")

  alumno  Usuario      @relation("ProgresoAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  leccion LeccionCurso @relation(fields: [leccionId], references: [id], onDelete: Cascade)
  @@unique([alumnoId, leccionId])
  @@map("Homeschool_Progreso")
}

model EvidenciaAprendizaje {
  id           Int             @id @default(autoincrement())
  alumnoId     Int             @map("Alumno_ID")
  diaLectivoId Int?            @map("Dia_Lectivo_ID")
  archivoClave String          @map("Archivo_Clave")        // Archivo.clave (sin FK; se limpia al borrar)
  titulo       String?         @map("Titulo")
  nota         String?         @map("Nota")
  estado       EstadoEvidencia @default(pendiente) @map("Estado")
  comentarioPadre String?      @map("Comentario_Padre")
  estrellas    Int?            @map("Estrellas")            // 1-5, solo valoración (no da monedas)
  destacada    Boolean         @default(false) @map("Destacada")
  createdAt    DateTime        @default(now()) @map("Created_At")

  alumno     Usuario     @relation("EvidenciasAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  diaLectivo DiaLectivo? @relation(fields: [diaLectivoId], references: [id], onDelete: SetNull)
  @@index([alumnoId, estado])
  @@map("Homeschool_Evidencias")
}

model ActividadOffline {          // horas fuera de pantalla (museo, experimento…)
  id        Int      @id @default(autoincrement())
  alumnoId  Int      @map("Alumno_ID")
  materiaId Int      @map("Materia_ID")
  fecha     DateTime @db.Date @map("Fecha")
  titulo    String   @map("Titulo")
  minutos   Int      @map("Minutos")
  createdAt DateTime @default(now()) @map("Created_At")

  alumno  Usuario @relation("ActividadesAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  materia Materia @relation(fields: [materiaId], references: [id], onDelete: Cascade)
  @@index([alumnoId, fecha])
  @@map("Homeschool_Actividades")
}

model RepasoLeccion {
  id         Int      @id @default(autoincrement())
  alumnoId   Int      @map("Alumno_ID")
  leccionId  Int      @map("Leccion_ID")
  paso       Int      @default(0) @map("Paso")       // índice en [1,3,7,14,30] días
  proximo    DateTime @db.Date @map("Proximo")
  resuelto   Boolean  @default(false) @map("Resuelto")

  alumno  Usuario      @relation("RepasosAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  leccion LeccionCurso @relation(fields: [leccionId], references: [id], onDelete: Cascade)
  @@unique([alumnoId, leccionId])
  @@index([alumnoId, proximo, resuelto])
  @@map("Homeschool_Repasos")
}

model PreferenciaAlumno {         // H6
  alumnoId   Int     @id @map("Alumno_ID")
  modoRelajado Boolean @default(false) @map("Modo_Relajado")   // baja estimulación
  primeroDespues Boolean @default(false) @map("Primero_Despues")
  recompensaDespues String? @map("Recompensa_Despues")        // texto libre: "15 min de Lego"
  alumno Usuario @relation("PreferenciaAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  @@map("Homeschool_Preferencias")
}

model HistoriaSocial {            // H6
  id        Int      @id @default(autoincrement())
  alumnoId  Int?     @map("Alumno_ID")                // null = para todos
  titulo    String   @map("Titulo")
  pasos     Json     @map("Pasos")                    // [{texto, icono}] (3 a 5)
  createdAt DateTime @default(now()) @map("Created_At")
  @@map("Homeschool_Historias")
}
```

**Relaciones inversas a agregar** (sin columnas nuevas): en `Usuario` → `materias Materia[] @relation("MateriasAlumno")`, `diasNoLectivos DiaNoLectivo[] @relation("DiasNoLectivosAlumno")`, `progresoLecciones ProgresoLeccion[] @relation("ProgresoAlumno")`, `evidenciasHs EvidenciaAprendizaje[] @relation("EvidenciasAlumno")`, `actividadesOffline ActividadOffline[] @relation("ActividadesAlumno")`, `repasos RepasoLeccion[] @relation("RepasosAlumno")`, `preferenciaHs PreferenciaAlumno? @relation("PreferenciaAlumno")`; en `Libro` → `recursosCurso RecursoCurso[] @relation("RecursoLibro")`; en `Tarea` → `diaLectivo DiaLectivo? @relation("DiaLectivoTarea")`. `DificultadTarea` ya existe.

**Cada lane agrega solo los modelos que usa** (H1a: Materia, RecursoCurso, PlanCurso, DiaLectivo, DiaNoLectivo; H2: LeccionCurso, ProgresoLeccion; H3: EvidenciaAprendizaje; H4: PreguntaLeccion, RepasoLeccion; H5: ActividadOffline; H6: PreferenciaAlumno, HistoriaSocial). Los modelos de una lane que referencian a otro aún inexistente se declaran sin esa relación y se completan en la lane que lo crea (por ejemplo `RepasoLeccion.leccion` se agrega en H4, que ya tiene `LeccionCurso`). Cada lane hace `git merge dev` antes de tocar `schema.prisma` y aplica solo SQL aditivo (sin `db push`).

## 4. Algoritmo de pacing (`pacing.ts`, puro)

```ts
export type EntradaPacing = {
  totalUnidades: number; unidadesHechas: number;   // hechas = máxima unidadHasta de días 'hecha' contiguos desde 1
  desde: string; hasta: string;                    // 'YYYY-MM-DD', inclusive
  diasSemana: number[];                            // ISO 1..7
  noLectivos: string[];                            // 'YYYY-MM-DD'
  unidadTipo: "pagina" | "capitulo" | "leccion" | "unidad";
};
export type SalidaPacing = {
  dias: { fecha: string; unidadDesde: number; unidadHasta: number }[];
  diasDisponibles: number; pendientes: number; promedio: number;
  aviso?: { tipo: "sin_dias" | "sobrecarga"; promedio?: number; opciones: string[] };
};
```
Reglas:
1. Disponibles = fechas en `[desde, hasta]` cuyo día ISO ∈ `diasSemana` y ∉ `noLectivos`. Día ISO con `getISODay(parseISO(f))` (date-fns), nunca `getDay()`.
2. `U = total − hechas`; si `U ≤ 0` → `dias = []`. Si `D = 0` y `U > 0` → `aviso: sin_dias`.
3. Reparto uniforme: el día `i` (0-based) recibe `floor((i+1)·U/D) − floor(i·U/D)`; **solo se crean días con cantidad > 0**. Las unidades se numeran correlativas desde `hechas+1`.
4. Sobrecarga: si `promedio = U/D` supera `MAX_POR_DIA[unidadTipo]` (inicial: lección 4, página 30, capítulo 1, unidad 3) → `aviso.sobrecarga` con opciones: «extender hasta <fecha sugerida>», «sumar el sábado», «aceptar el ritmo».
5. `recalcular(plan, hoy)` (en `servidor/planes.ts`, transaccional): `hechas` = máx. `unidadHasta` entre los días `hecha`; borra los `DiaLectivo` con `fecha ≥ hoy` y estado `pendiente` (y sus Tareas solo si siguen en `Pendiente`); los días pasados `pendiente` pasan a `movida` (sus unidades vuelven a «pendientes» porque `hechas` solo cuenta lo contiguo y completado); regenera con `repartir(desde = hoy)`. **La fecha `fin` nunca cambia** salvo que el padre acepte «extender».
6. **Mover un día** (arrastrar en el calendario) ≠ recalcular: solo cambia la `fecha` de ese `DiaLectivo` a un día lectivo libre del mismo plan. No toca el resto.

## 5. Puente con Tareas (HD1)

- `asegurarTareasDeHoy(alumnoId)` (idempotente; se llama al abrir «Hoy aprendo» y desde `/api/cron/daily`): para cada `DiaLectivo` de hoy sin `tareaId`, crea una `Tarea`: `titulo` = «<Materia>: <Recurso> — lección N» o «páginas A a B»; `asignadoId` = alumno; `creadorId` = el padre/madre dueño del curso (el primero con rol Padre/Madre si no hay otro); `tiempoEjecucionEstimadoSeg` = `(hasta−desde+1)·minutosPorUnidad·60`; `dificultad` = `Materia.dificultad`; `generaPuntosYRecompensa = true`; `tipoRecurrencia = Unica`; `fechaVencimiento` = hoy. Guarda `DiaLectivo.tareaId`.
- El niño completa con el **endpoint existente** (`POST /api/tasks/[id]/complete`). No se escribe código de premios nuevo.
- `sincronizarDia(dia)`: `hecha` si `tarea.estado ∈ {Completada, Esperando_Aprobacion, Aprobada}`; `pendiente` si no. Se ejecuta al leer el plan (consulta con `include: { tarea }`).
- Desbloqueo: el día N exige el día N−1 `hecha`, salvo `navegacionLibre`. Dentro de un día de varias lecciones: la lección k exige la k−1 en `ProgresoLeccion.completada`.
- Si la Tarea queda `Rechazada` o `Vencida`, el día sigue `pendiente` y el niño puede completarla de nuevo: `/complete` solo bloquea `Completada`, `Aprobada` y `Esperando_Aprobacion`. Si el padre elimina la Tarea, `tareaId` queda `null` (SetNull) y se recrea al abrir «Hoy aprendo».

## 6. Doble interfaz

`/dashboard/homeschooling` bifurca por `rolFamiliar` del usuario activo: **Hijo/Hija → «Hoy aprendo»** (tarjetas grandes por materia, botón «Empezar», «Terminé»); **Padre/Madre → «Plan»** (selector de alumno, calendario con `MissionCalendar` extendido, «Hoy no hay clase», alta de curso, bandeja de revisión). Subrutas del padre: `/plan`, `/revision`, `/portafolio`, `/reportes`.

## 7. Referencia visual de Roost (no se copia tal cual)

Roost es Vite + Tailwind 3 + Supabase en el navegador; Ordo es Next 16 + Tailwind 4 + Prisma. Se toma **la estructura y la idea** y se reescribe con los componentes de `src/components/ui` y los tokens del tema. Detalle por archivo en [`MAPEO_COMPONENTES_ROOST.md`](MAPEO_COMPONENTES_ROOST.md). No agregar `react-dropzone`.
