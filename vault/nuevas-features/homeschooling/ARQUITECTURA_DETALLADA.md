# Arquitectura Detallada del Sistema de Homeschooling para Ordo Diei

> **Estado:** Documentación técnica y especificación de producto aprobada (2026-10-13).  
> **Estrategia técnica:** Adaptación de componentes del repositorio de referencia **Roost (MIT)** (`msrbuilds/roost`), integrándolos de forma nativa en **Next.js 16 (App Router)**, **React 19.2.4**, **Tailwind CSS 4** y **Supabase PostgreSQL** vía **Prisma 7**.

---

## 1. Visión del Producto y Pilares

El sistema de Homeschooling de Ordo Diei no es un simple calendario ni una lista de tareas pasiva; es un **LMS B2C de alta retención**, un **motor de cumplimiento legal automático (Compliance Moat)** y una **plataforma de evidencia del mundo real** adaptada a la dinámica familiar de pantalla compartida (pantalla de pared / tablets infantiles).

```
+---------------------------------------------------------------------------------------------------------+
|                                  ORDO DIEI — ECOSISTEMA HOMESCHOOLING                                   |
+------------------------------------+------------------------------------+-------------------------------+
| PILAR 1: Motor LMS y Contenido     | PILAR 2: Hub Legal y Compliance    | PILAR 3: Evidencia y RPG      |
+------------------------------------+------------------------------------+-------------------------------+
| - Pacing dinámico ("Set & Forget") | - Mapeo de leyes por estado/país   | - Captura rápida con cámara   |
| - Desbloqueo secuencial (Drip)     | - Horas anuales y alertas déficit  | - Portafolio Digital anual    |
| - Checkpoints en video interactivo | - Generador Transcript Carnegie    | - RPG de Cartas (HoloCards)   |
| - Repaso espaciado (Algoritmo SM-2)| - Rescheduling "Snow Day" líquido  | - Marketplace clases en vivo  |
| - Doble interfaz (Niño vs. Padre)  | - Activity Journal (Horas offline) | - Aprobación swipe por padres |
+------------------------------------+------------------------------------+-------------------------------+
| WHITE SPACE: Interoperabilidad xAPI / LTI · Co-piloto IA de Lecciones · UX Neurodivergencia             |
| COMMAND CENTER: Kiosk Mode · Marco de Fotos Idle · Battery Health Curfew · Timer Visual                 |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Esquema de Datos Integrado (Prisma 7 / Supabase PostgreSQL)

El esquema es **100% aditivo**, compatible con las reglas de migración de Ordo Diei (`AGENTS.md`: nunca `db push`, solo migraciones SQL aditivas validadas con `migrate diff`). Reutiliza los modelos existentes `Usuario`, `Archivo`, `ProductoTienda` y `Carta`.

```prisma
// =============================================================================
// MÓDULO HOMESCHOOLING — ORDO DIEI
// =============================================================================

enum TipoRecursoEducativo {
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

enum EstadoDiaLectivo {
  pendiente
  en_progreso
  completada
  omitida
  movida
  repaso
}

enum EstadoEvidencia {
  pendiente_revision
  aprobada
  requiere_ajuste
}

// ── 1. Materias y Configuración del Alumno ───────────────────────────────────
model Materia {
  id                 Int              @id @default(autoincrement())
  alumnoId           Int              @map("Alumno_ID")
  nombre             String           @map("Nombre") // Ej: "Matemáticas", "Historia Sagrada", "Ciencias"
  categoria          String           @default("general") @map("Categoria") // "stem", "humanidades", "arte", "deporte"
  icono              String?          @map("Icono") // Nombre de icono Lucide
  color              String?          @map("Color") // Clave Tailwind o Hex
  horasAnualesMeta   Int              @default(120) @map("Horas_Anuales_Meta") // Meta legal (ej. 120h = 1 Carnegie)
  activa             Boolean          @default(true) @map("Activa")
  orden              Int              @default(0) @map("Orden")
  createdAt          DateTime         @default(now()) @map("Created_At")
  updatedAt          DateTime         @updatedAt @map("Updated_At")

  alumno             Usuario          @relation("MateriasAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  recursos           Recurso[]
  actividadesOffline ActividadOffline[]

  @@map("Homeschool_Materias")
}

// ── 2. Recursos y Planes de Estudio (Pacing) ──────────────────────────────────
model Recurso {
  id                 Int                   @id @default(autoincrement())
  materiaId          Int                   @map("Materia_ID")
  titulo             String                @map("Titulo")
  descripcion        String?               @map("Descripcion")
  tipo               TipoRecursoEducativo  @default(curso_videos) @map("Tipo")
  unidadTipo         UnidadContenido       @default(leccion) @map("Unidad_Tipo")
  totalUnidades      Int                   @map("Total_Unidades") // Ej. 120 lecciones o 300 páginas
  url                String?               @map("URL") // Enlace externo, playlist o PDF
  libroId            Int?                  @map("Libro_ID") // Conexión opcional con modelo Libro de Ordo Diei
  modoLibrePadres    Boolean               @default(false) @map("Modo_Libre_Padres") // true = sin candados secuenciales
  createdAt          DateTime              @default(now()) @map("Created_At")
  updatedAt          DateTime              @updatedAt @map("Updated_At")

  materia            Materia               @relation(fields: [materiaId], references: [id], onDelete: Cascade)
  libro              Libro?                @relation(fields: [libroId], references: [id], onDelete: SetNull)
  planCurso          PlanCurso?
  leccionesDetalle   LeccionContenido[]

  @@map("Homeschool_Recursos")
}

model PlanCurso {
  id                 Int          @id @default(autoincrement())
  recursoId          Int          @unique @map("Recurso_ID")
  fechaInicio        DateTime     @map("Fecha_Inicio") @db.Date
  fechaFin           DateTime     @map("Fecha_Fin") @db.Date
  diasSemana         Int[]        @map("Dias_Semana") // [1, 2, 3, 4, 5] (1=Lunes, 7=Domingo)
  unidadesPorDia     Float        @default(1.0) @map("Unidades_Por_Dia")
  estado             String       @default("activo") @map("Estado") // "activo", "pausado", "finalizado"
  createdAt          DateTime     @default(now()) @map("Created_At")
  updatedAt          DateTime     @updatedAt @map("Updated_At")

  recurso            Recurso      @relation(fields: [recursoId], references: [id], onDelete: Cascade)
  diasLectivos       DiaLectivo[]

  @@map("Homeschool_Planes_Curso")
}

// Días materializados por el motor de Pacing
model DiaLectivo {
  id                 Int               @id @default(autoincrement())
  planId             Int               @map("Plan_ID")
  fecha              DateTime          @map("Fecha") @db.Date
  unidadDesde        Int               @map("Unidad_Desde") // Ej: página 12 o lección 5
  unidadHasta        Int               @map("Unidad_Hasta") // Ej: página 15 o lección 5
  estado             EstadoDiaLectivo  @default(pendiente) @map("Estado")
  tiempoDedicadoSeg  Int               @default(0) @map("Tiempo_Dedicado_Seg")
  completadaEn       DateTime?         @map("Completada_En")
  createdAt          DateTime          @default(now()) @map("Created_At")
  updatedAt          DateTime          @updatedAt @map("Updated_At")

  plan               PlanCurso         @relation(fields: [planId], references: [id], onDelete: Cascade)
  evidencias         EvidenciaAprendizaje[]

  @@unique([planId, fecha, unidadDesde])
  @@index([fecha, estado])
  @@map("Homeschool_Dias_Lectivos")
}

model DiaNoLectivo {
  id                 Int       @id @default(autoincrement())
  fecha              DateTime  @map("Fecha") @db.Date
  alumnoId           Int?      @map("Alumno_ID") // null = feriado/enfermedad para toda la familia
  motivo             String    @map("Motivo") // "Enfermedad", "Feriado Nacional", "Excursión", "Día de Nieve"
  createdAt          DateTime  @default(now()) @map("Created_At")

  alumno             Usuario?  @relation("DiasNoLectivosAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)

  @@unique([fecha, alumnoId])
  @@map("Homeschool_Dias_No_Lectivos")
}

// ── 3. Lecciones, Checkpoints y Active Recall ────────────────────────────────
model LeccionContenido {
  id                 Int               @id @default(autoincrement())
  recursoId          Int               @map("Recurso_ID")
  orden              Int               @map("Orden") // 1..N
  titulo             String            @map("Titulo")
  descripcion        String?           @map("Descripcion")
  videoPlataforma    String?           @map("Video_Plataforma") // "youtube", "vimeo", "directo"
  videoId            String?           @map("Video_ID")
  duracionSegundos   Int               @default(0) @map("Duracion_Segundos")
  contenidoMarkdown  String?           @map("Contenido_Markdown")
  puntosXP           Int               @default(20) @map("Puntos_XP")
  inciensoRecompensa Int               @default(1) @map("Incienso_Recompensa")
  createdAt          DateTime          @default(now()) @map("Created_At")
  updatedAt          DateTime          @updatedAt @map("Updated_At")

  recurso            Recurso           @relation(fields: [recursoId], references: [id], onDelete: Cascade)
  checkpoints        VideoCheckpoint[]
  completiones       ProgresoLeccion[]

  @@unique([recursoId, orden])
  @@map("Homeschool_Lecciones_Contenido")
}

model VideoCheckpoint {
  id                 Int       @id @default(autoincrement())
  leccionId          Int       @map("Leccion_ID")
  segundoPausa       Int       @map("Segundo_Pausa") // Momento en que el video se detiene
  pregunta           String    @map("Pregunta")
  opciones           Json      @map("Opciones") // ["A", "B", "C"]
  respuestaCorrecta  Int       @map("Respuesta_Correcta") // Índice de la correcta
  explicacion        String?   @map("Explicacion")
  esObligatorio      Boolean   @default(true) @map("Es_Obligatorio")

  leccion            LeccionContenido @relation(fields: [leccionId], references: [id], onDelete: Cascade)

  @@map("Homeschool_Video_Checkpoints")
}

model ProgresoLeccion {
  id                 Int       @id @default(autoincrement())
  usuarioId          Int       @map("Usuario_ID")
  leccionId          Int       @map("Leccion_ID")
  calificacion       Float     @default(100.0) @map("Calificacion") // 0 a 100
  intentosQuiz       Int       @default(1) @map("Intentos_Quiz")
  segundosVistos     Int       @default(0) @map("Segundos_Vistos")
  completada         Boolean   @default(true) @map("Completada")
  fechaCompletado    DateTime  @default(now()) @map("Fecha_Completado")

  usuario            Usuario   @relation("ProgresoLeccionesUsuario", fields: [usuarioId], references: [id], onDelete: Cascade)
  leccion            LeccionContenido @relation(fields: [leccionId], references: [id], onDelete: Cascade)

  @@unique([usuarioId, leccionId])
  @@map("Homeschool_Progreso_Lecciones")
}

// ── 4. Evidencia de Aprendizaje y Portafolio Digital ─────────────────────────
model EvidenciaAprendizaje {
  id                 Int              @id @default(autoincrement())
  diaLectivoId       Int?             @map("Dia_Lectivo_ID")
  alumnoId           Int              @map("Alumno_ID")
  archivoClave       String           @map("Archivo_Clave") // Clave en modelo Archivo de Ordo Diei
  audioVozClave      String?          @map("Audio_Voz_Clave") // Nota de voz del niño de 10s
  titulo             String?          @map("Titulo")
  notaEstudiante     String?          @map("Nota_Estudiante")
  retroalimentacion  String?          @map("Retroalimentacion_Padre")
  estado             EstadoEvidencia  @default(pendiente_revision) @map("Estado")
  calificacionEstrellas Int?          @map("Calificacion_Estrellas") // 1..5
  aprobadaPorId      Int?             @map("Aprobada_Por_ID")
  aprobadaEn         DateTime?        @map("Aprobada_En")
  destacada          Boolean          @default(false) @map("Destacada") // Para el portafolio de fin de año
  createdAt          DateTime         @default(now()) @map("Created_At")
  updatedAt          DateTime         @updatedAt @map("Updated_At")

  diaLectivo         DiaLectivo?      @relation(fields: [diaLectivoId], references: [id], onDelete: SetNull)
  alumno             Usuario          @relation("EvidenciasAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  aprobador          Usuario?         @relation("EvidenciasAprobadas", fields: [aprobadaPorId], references: [id], onDelete: SetNull)

  @@index([alumnoId, estado])
  @@map("Homeschool_Evidencias")
}

// ── 5. Activity Journal (Registro de Horas Offline) ──────────────────────────
model ActividadOffline {
  id                 Int       @id @default(autoincrement())
  alumnoId           Int       @map("Alumno_ID")
  materiaId          Int       @map("Materia_ID")
  titulo             String    @map("Titulo") // Ej: "Visita al Museo Histórico"
  descripcion        String?   @map("Descripcion")
  fecha              DateTime  @map("Fecha") @db.Date
  duracionMinutos    Int       @map("Duracion_Minutos") // Ej: 180 min
  tipoActividad      String    @default("excursion") @map("Tipo_Actividad") // "excursion", "experimento", "lectura", "deporte"
  evidenciaFotoClave String?   @map("Evidencia_Foto_Clave")
  aprobada           Boolean   @default(true) @map("Aprobada")
  createdAt          DateTime  @default(now()) @map("Created_At")

  alumno             Usuario   @relation("ActividadesOfflineAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)
  materia            Materia   @relation(fields: [materiaId], references: [id], onDelete: Cascade)

  @@index([alumnoId, fecha])
  @@map("Homeschool_Actividades_Offline")
}

// ── 6. Repaso Espaciado Adaptativo ───────────────────────────────────────────
model RegistroRepaso {
  id                 Int       @id @default(autoincrement())
  alumnoId           Int       @map("Alumno_ID")
  materiaId          Int       @map("Materia_ID")
  conceptoClave      String    @map("Concepto_Clave") // Ej: "Fracciones equivalentes"
  leccionOrigenId    Int?      @map("Leccion_Origen_ID")
  fallosConsecutivos Int       @default(1) @map("Fallos_Consecutivos")
  intervaloDias      Int       @default(1) @map("Intervalo_Dias")
  factorFacilidad    Float     @default(2.5) @map("Factor_Facilidad") // Algoritmo SM-2
  proximaFechaRepaso DateTime  @map("Proxima_Fecha_Repaso") @db.Date
  resuelto           Boolean   @default(false) @map("Resuelto")
  createdAt          DateTime  @default(now()) @map("Created_At")
  updatedAt          DateTime  @updatedAt @map("Updated_At")

  alumno             Usuario   @relation("RepasosAlumno", fields: [alumnoId], references: [id], onDelete: Cascade)

  @@index([alumnoId, proximaFechaRepaso, resuelto])
  @@map("Homeschool_Registros_Repaso")
}
```

---

## 3. Algoritmo de Pacing Dinámico ("Snow Day Logic")

Ubicación: `src/lib/homeschooling/pacing.ts`  
Contrato: **Función pura determinista**, sin efectos secundarios, testeable unitariamente al 100%.

```typescript
export interface ParametrosPacing {
  totalUnidades: number;       // Cantidad total de páginas, videos o lecciones
  unidadesHechas: number;      // Unidades ya completadas con éxito
  fechaInicio: Date;           // Fecha de arranque del cómputo
  fechaFin: Date;              // Fecha tope inamovible (fin de año escolar)
  diasSemanaLectivos: number[];// [1..5] donde 1=Lunes, 7=Domingo
  diasNoLectivos: string[];    // Array de 'YYYY-MM-DD' (enfermedad, feriados)
}

export interface DiaLectivoPlanificado {
  fecha: string;               // 'YYYY-MM-DD'
  unidadDesde: number;
  unidadHasta: number;
  cantidadUnidades: number;
}

export interface ResultadoPacing {
  dias: DiaLectivoPlanificado[];
  totalDiasDisponibles: number;
  unidadesPendientes: number;
  promedioUnidadesPorDia: number;
  alertaSobrecarga?: string;    // Advertencia si faltan días para cumplir la meta
}
```

### Reglas Matemáticas:
1. **Días hábiles disponibles ($D$):** Se filtran todos los días entre `fechaInicio` y `fechaFin` que pertenezcan a `diasSemanaLectivos` y que no estén en el conjunto `diasNoLectivos`.
2. **Unidades pendientes ($U$):** $U = \text{totalUnidades} - \text{unidadesHechas}$.
3. **Distribución equitativa con resto:** Se calcula la cuota base $Q = \lfloor U / D \rfloor$ y el resto $R = U \pmod D$. Los primeros $R$ días reciben $Q + 1$ unidades y los restantes $D - R$ días reciben $Q$ unidades.
4. **Snow Day (Día de Nieve / Enfermedad):** Cuando un día es marcado como no lectivo, el recálculo se ejecuta desde `hoy` hasta `fechaFin`. Las unidades asignadas al día anulado se redistribuyen de forma transparente en los días futuros.
5. **Aviso de Sobrecarga:** Si el promedio diario supera un umbral ergonómico (ej. $> 4$ lecciones/día o $> 30$ páginas/día), el sistema emite sugerencias proactivas al padre:
   - *"Opción A: Extender fecha fin al [Fecha sugerida]"*
   - *"Opción B: Sumar los sábados como día lectivo"*
   - *"Opción C: Aceptar acelerar el ritmo"*

---

## 4. Arquitectura de Doble Interfaz (Padre vs. Alumno)

Para evitar la sobrecarga cognitiva en los niños y mantener la profundidad administrativa en los padres, la interfaz de Homeschooling se bifurca según el rol del usuario activo (`Usuario.rolFamiliar`):

### A. Vista del Alumno: "Hoy Aprendo" (`/dashboard/homeschooling/alumno`)
- **Diseño táctil gigante:** Tarjetas de colores vivos por materia con pictogramas de Lucide.
- **Progreso visual:** Barras circulares tipo "SloshGauge" o indicadores de avance horizontales.
- **Botón "Empezar":** Abre directamente el reproductor interactivo o las instrucciones de lectura ("Lee las páginas 14 a 18").
- **Botón "Terminé":** Dispara sonido de campanadas, lluvia de confeti (`canvas-confetti`), acreditación de XP y fragmentos de Cartas coleccionables.
- **Botón de Cámara Flotante:** Acceso inmediato para capturar maquetas o trabajos físicos.

### B. Vista del Padre: "Cockpit Curricular" (`/dashboard/homeschooling/admin`)
- **Calendario Líquido:** Basado en `CalendarView.tsx` de Roost con `react-big-calendar`. Arrastrar y soltar lecciones para reprogramar.
- **Botón de Emergencia:** *"Hoy no hay clase"* (por hijo o familia completa) con recálculo en 1 clic.
- **Bandeja de Aprobación:** Lista de evidencias pendientes de revisión con interfaz táctil de deslizamiento (`SwipeRow.tsx`).
- **Cockpit de Compliance:** Barra de horas anuales por materia frente a los requisitos legales de la jurisdicción elegida.

---

## 5. Extracción y Adaptación de Componentes de Roost (MIT)

Los componentes de Roost se adaptan directamente a la estructura de Ordo Diei:

```
Repositorio Roost (MIT)                            Ordo Diei (Next.js 16 + Tailwind 4)
-----------------------------------------------    ---------------------------------------------------------
src/components/groups/learn/LessonPlayer.tsx    -> src/components/homeschooling/lms/LessonPlayer.tsx
src/components/groups/learn/LearnSidebar.tsx    -> src/components/homeschooling/lms/LearnSidebar.tsx
src/components/groups/learn/ProgressBar.tsx     -> src/components/homeschooling/lms/CourseProgressBar.tsx
src/components/calendar/CalendarView.tsx        -> src/components/homeschooling/calendar/LiquidCalendar.tsx
src/pages/ShowcaseSubmit.tsx                    -> src/components/homeschooling/portfolio/EvidenceModal.tsx
src/components/showcase/ShowcaseCard.tsx        -> src/components/homeschooling/portfolio/PortfolioCard.tsx
src/services/module.ts (queries Supabase)       -> src/lib/homeschooling/server/queries.ts (Server Actions)
```
