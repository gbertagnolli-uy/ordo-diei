-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "family_tasker";

-- CreateEnum
CREATE TYPE "RolFamiliar" AS ENUM ('Padre', 'Madre', 'Hijo', 'Hija');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('Pendiente', 'En progreso', 'Pausada', 'Completada', 'Vencida', 'Esperando_Aprobacion', 'Aprobada', 'Rechazada', 'Expirada', 'No_Realizada');

-- CreateEnum
CREATE TYPE "DificultadTarea" AS ENUM ('Trivial', 'MuyFacil', 'Facil', 'Media', 'Exigente', 'Dificil', 'MuyDificil', 'Ardua');

-- CreateEnum
CREATE TYPE "TipoRecurrencia" AS ENUM ('Unica', 'Diaria', 'Semanal', 'Mensual_Fecha', 'Mensual_Ordinal');

-- CreateEnum
CREATE TYPE "TipoFrecuencia" AS ENUM ('Semanal', 'Mensual');

-- CreateEnum
CREATE TYPE "EstadoPremio" AS ENUM ('Entregado', 'Pendiente', 'No_ganado');

-- CreateEnum
CREATE TYPE "CategoriaHabito" AS ENUM ('oracion', 'orden', 'cuidado');

-- CreateEnum
CREATE TYPE "FranjaHabito" AS ENUM ('manana', 'tarde', 'noche');

-- CreateEnum
CREATE TYPE "MarcaHabito" AS ENUM ('hecho', 'justificado', 'no');

-- CreateEnum
CREATE TYPE "EstadoRecompensa" AS ENUM ('disponible', 'reclamado', 'entregado');

-- CreateEnum
CREATE TYPE "TipoComportamiento" AS ENUM ('Positivo', 'Negativo');

-- CreateEnum
CREATE TYPE "RarezaCarta" AS ENUM ('Comun', 'Buena', 'Perfecta', 'Celestial');

-- CreateEnum
CREATE TYPE "CategoriaCarta" AS ENUM ('Santo', 'Angel', 'Misterio', 'Tema', 'Persona');

-- CreateEnum
CREATE TYPE "OrigenCarta" AS ENUM ('Sistema', 'Manual');

-- CreateEnum
CREATE TYPE "TipoMovFragmento" AS ENUM ('Sobre', 'Compra', 'CompraIncienso', 'Fiesta', 'Cumpleanos', 'ConversionIncienso', 'Ajuste', 'Bienvenida');

-- CreateEnum
CREATE TYPE "TipoReclamo" AS ENUM ('Fiesta', 'Cumpleanos', 'Bienvenida');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('sobre', 'fragmentos', 'fisico', 'vale');

-- CreateEnum
CREATE TYPE "PeriodoLimite" AS ENUM ('siempre', 'dia', 'semana', 'mes');

-- CreateEnum
CREATE TYPE "EstadoCompra" AS ENUM ('completada', 'pendiente_aprobacion', 'rechazada', 'cancelada');

-- CreateEnum
CREATE TYPE "EstadoCompraCompartida" AS ENUM ('pendiente', 'completada', 'rechazada', 'cancelada');

-- CreateEnum
CREATE TYPE "EstadoParticipanteCompra" AS ENUM ('pendiente', 'aceptada', 'rechazada');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('libro', 'curso_videos', 'pdf', 'enlaces', 'libre');

-- CreateEnum
CREATE TYPE "UnidadContenido" AS ENUM ('pagina', 'capitulo', 'leccion', 'unidad');

-- CreateEnum
CREATE TYPE "EstadoPlan" AS ENUM ('activo', 'pausado', 'finalizado');

-- CreateEnum
CREATE TYPE "EstadoDiaLectivo" AS ENUM ('pendiente', 'hecha', 'movida', 'omitida');

-- CreateEnum
CREATE TYPE "PlataformaVideo" AS ENUM ('youtube', 'vimeo');

-- CreateEnum
CREATE TYPE "EstadoEvidencia" AS ENUM ('pendiente', 'aprobada', 'ajustar');

-- CreateEnum
CREATE TYPE "TipoMaterial" AS ENUM ('texto', 'markdown', 'video', 'pdf', 'documento', 'epub', 'web', 'archivo');

-- CreateEnum
CREATE TYPE "TipoCalificacion" AS ENUM ('tarea', 'examen', 'proyecto', 'lectura', 'oral');

-- CreateEnum
CREATE TYPE "EstadoLectura" AS ENUM ('por_leer', 'leyendo', 'leido');

-- CreateTable
CREATE TABLE "Usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "PIN_Secreto" TEXT NOT NULL,
    "Fecha_Nacimiento" TIMESTAMP(3) NOT NULL,
    "Rol_Familiar" "RolFamiliar" NOT NULL,
    "Puntos_Acumulados" INTEGER NOT NULL DEFAULT 0,
    "Available_Points" INTEGER NOT NULL DEFAULT 0,
    "Locked_Points" INTEGER NOT NULL DEFAULT 0,
    "Stars" INTEGER NOT NULL DEFAULT 0,
    "Surprises" INTEGER NOT NULL DEFAULT 0,
    "Completion_Percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "Foto_URL" TEXT,
    "Penalizaciones_Reparacion" INTEGER NOT NULL DEFAULT 0,
    "Mood_Emoji" TEXT,
    "Mood_Set_At" TIMESTAMP(3),
    "Streak_Days" INTEGER NOT NULL DEFAULT 0,
    "Last_Task_Completed_Date" TIMESTAMP(3),
    "Total_Tasks_Completed" INTEGER NOT NULL DEFAULT 0,
    "Experiencia_Habitos" INTEGER NOT NULL DEFAULT 0,
    "Incienso" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tareas" (
    "id" SERIAL NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Creador_ID" INTEGER NOT NULL,
    "Asignado_ID" INTEGER NOT NULL,
    "Tiempo_Ejecucion_Estimado_Segundos" INTEGER NOT NULL,
    "Tiempo_Consumido_Total_Segundos" INTEGER NOT NULL DEFAULT 0,
    "Genera_Puntos_Y_Recompensa" BOOLEAN NOT NULL DEFAULT false,
    "Dificultad" "DificultadTarea" NOT NULL DEFAULT 'Media',
    "Tipo_Recurrencia" "TipoRecurrencia" NOT NULL DEFAULT 'Unica',
    "Fecha_Vencimiento" TIMESTAMP(3),
    "Hora_Ejecucion" TIMESTAMP(3),
    "estado" "EstadoTarea" NOT NULL DEFAULT 'Pendiente',
    "Dia_Del_Mes" INTEGER,
    "Ordinal_Semana" INTEGER,
    "Dia_De_La_Semana" INTEGER,
    "Intervalo" INTEGER NOT NULL DEFAULT 1,
    "Ancla_Completado" BOOLEAN NOT NULL DEFAULT false,
    "Ancla_Fecha" TIMESTAMP(3),
    "Parent_Task_ID" INTEGER,
    "Tiempo_Real_Ejecucion_Segundos" INTEGER,
    "Puntos_Ganados_Perdidos" DOUBLE PRECISION,
    "Retroalimentacion_Algoritmo" TEXT,
    "Grupo_Tarea_ID" TEXT,
    "Rotacion_Config" JSONB,
    "Is_Surprise_Eligible" BOOLEAN NOT NULL DEFAULT false,
    "Puntos_Generados" INTEGER NOT NULL DEFAULT 0,
    "Fecha_Completado" TIMESTAMP(3),
    "Is_Checklist" BOOLEAN NOT NULL DEFAULT false,
    "Requiere_Foto_Prueba" BOOLEAN NOT NULL DEFAULT false,
    "Foto_Prueba_URL" TEXT,
    "Foto_Prueba_Subida_En" TIMESTAMP(3),
    "Timer_Started_At" TIMESTAMP(3),
    "Tiempo_Acumulado_Timer_Seg" INTEGER NOT NULL DEFAULT 0,
    "Generada_Por_Cron" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Tareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Historial_Acciones" (
    "id" SERIAL NOT NULL,
    "Tarea_ID" INTEGER NOT NULL,
    "Actor_ID" INTEGER NOT NULL,
    "Estado_Anterior" "EstadoTarea",
    "Estado_Nuevo" "EstadoTarea" NOT NULL,
    "Duracion_Sesion_Segundos" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Historial_Acciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registros_Animo" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Animo" TEXT NOT NULL,
    "Puntaje" INTEGER NOT NULL,
    "Creado_En" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registros_Animo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reglas_Hogar" (
    "id" SERIAL NOT NULL,
    "Texto_Estricto" TEXT NOT NULL,
    "Actualizado_Por_ID" INTEGER NOT NULL,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reglas_Hogar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checklist_Items" (
    "id" SERIAL NOT NULL,
    "Tarea_ID" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Checklist_Items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Premios" (
    "id" SERIAL NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Cantidad" INTEGER NOT NULL,
    "Tipo_Frecuencia" "TipoFrecuencia" NOT NULL,
    "Dia_Entrega_Semana" INTEGER,
    "Dia_Del_Mes" INTEGER,
    "Tareas_Requeridas_Ids" TEXT NOT NULL,
    "Activo" BOOLEAN NOT NULL DEFAULT true,
    "Es_Vale" BOOLEAN NOT NULL DEFAULT false,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Premios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Premios_Entregados" (
    "id" SERIAL NOT NULL,
    "Premio_ID" INTEGER NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Estado" "EstadoPremio" NOT NULL DEFAULT 'Pendiente',
    "Fecha_Entrega" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Premios_Entregados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habitos" (
    "id" SERIAL NOT NULL,
    "Clave" TEXT,
    "Nombre" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Categoria" "CategoriaHabito" NOT NULL,
    "Franja" "FranjaHabito" NOT NULL,
    "Ancla" TEXT NOT NULL,
    "Icono" TEXT NOT NULL,
    "Minimo" TEXT,
    "Imagen" TEXT,
    "Creador_ID" INTEGER,
    "Archivado" BOOLEAN NOT NULL DEFAULT false,
    "Aprobado" BOOLEAN NOT NULL DEFAULT true,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Habitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habitos_Usuario" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Habito_ID" INTEGER NOT NULL,
    "Desde" DATE NOT NULL,
    "Dias" INTEGER NOT NULL DEFAULT 127,
    "Ancla" TEXT,
    "Activo" BOOLEAN NOT NULL DEFAULT true,
    "Aprobado" BOOLEAN NOT NULL DEFAULT true,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Habitos_Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registros_Habito" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Habito_ID" INTEGER NOT NULL,
    "Fecha" DATE NOT NULL,
    "Marca" "MarcaHabito" NOT NULL,
    "Nota" TEXT,
    "Puntos" INTEGER NOT NULL DEFAULT 0,
    "XP" INTEGER NOT NULL DEFAULT 0,
    "Registrado_Por_ID" INTEGER NOT NULL,
    "Paginas" INTEGER,
    "Libro_ID" INTEGER,
    "Aprobado" BOOLEAN NOT NULL DEFAULT true,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registros_Habito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Libros" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Habito_ID" INTEGER NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Paginas" INTEGER NOT NULL,
    "Iniciado_En" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Terminado_En" TIMESTAMP(3),

    CONSTRAINT "Libros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recompensas" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Tipo" TEXT NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Origen" TEXT,
    "Libro_ID" INTEGER,
    "Estado" "EstadoRecompensa" NOT NULL DEFAULT 'disponible',
    "Pedido" TEXT,
    "Ganada_En" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Reclamada_En" TIMESTAMP(3),
    "Entregada_En" TIMESTAMP(3),
    "Entregada_Por_ID" INTEGER,
    "Usado_En" TIMESTAMP(3),
    "Comportamiento_ID" INTEGER,
    "Contenido" JSONB,
    "Evaluacion" TEXT,

    CONSTRAINT "Recompensas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comportamientos" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Registrado_Por_ID" INTEGER NOT NULL,
    "Tipo" "TipoComportamiento" NOT NULL DEFAULT 'Positivo',
    "Titulo" TEXT NOT NULL,
    "Evaluacion" TEXT,
    "Premios" JSONB,
    "Penitencia" TEXT,
    "Puntos_Penalizados" INTEGER NOT NULL DEFAULT 0,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comportamientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conducta_Dias" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Registrado_Por_ID" INTEGER NOT NULL,
    "Fecha" DATE NOT NULL,
    "Nivel" INTEGER NOT NULL,
    "Nota" TEXT,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conducta_Dias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cartas" (
    "id" SERIAL NOT NULL,
    "Clave" TEXT NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Subtitulo" TEXT,
    "Categoria" "CategoriaCarta" NOT NULL,
    "Rareza" "RarezaCarta" NOT NULL,
    "Celebracion" TEXT,
    "Historia" TEXT NOT NULL,
    "Oracion" TEXT NOT NULL,
    "Frase" TEXT NOT NULL,
    "Frase_Autor" TEXT,
    "Datasheet" JSONB NOT NULL,
    "Imagen_URL" TEXT NOT NULL,
    "Imagen_Grado_2_URL" TEXT,
    "Imagen_Grado_3_URL" TEXT,
    "Imagen_Grado_4_URL" TEXT,
    "Credito_Imagen" TEXT,
    "Fragmentos_Requeridos" INTEGER NOT NULL,
    "Origen" "OrigenCarta" NOT NULL DEFAULT 'Sistema',
    "Editada_Manual" BOOLEAN NOT NULL DEFAULT false,
    "Activa" BOOLEAN NOT NULL DEFAULT true,
    "Creador_ID" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cartas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cartas_Usuario" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Carta_ID" INTEGER NOT NULL,
    "Fragmentos" INTEGER NOT NULL DEFAULT 0,
    "Desbloqueada_En" TIMESTAMP(3),
    "Grado_Reclamado" INTEGER NOT NULL DEFAULT 0,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cartas_Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimientos_Fragmento" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Carta_ID" INTEGER,
    "Tipo" "TipoMovFragmento" NOT NULL,
    "Cantidad" INTEGER NOT NULL,
    "Puntos_Gastados" INTEGER NOT NULL DEFAULT 0,
    "Incienso_Delta" INTEGER NOT NULL DEFAULT 0,
    "Detalle" TEXT,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movimientos_Fragmento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reclamos_Carta" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Carta_ID" INTEGER NOT NULL DEFAULT 0,
    "Tipo" "TipoReclamo" NOT NULL,
    "Periodo" TEXT NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reclamos_Carta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivos" (
    "id" SERIAL NOT NULL,
    "Clave" TEXT NOT NULL,
    "Tipo" TEXT NOT NULL,
    "Datos" BYTEA NOT NULL,
    "Bytes" INTEGER NOT NULL,
    "Ancho" INTEGER,
    "Alto" INTEGER,
    "Nombre_Origen" TEXT,
    "Subido_Por_ID" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Productos_Tienda" (
    "id" SERIAL NOT NULL,
    "Tipo" "TipoProducto" NOT NULL,
    "Origen" TEXT NOT NULL DEFAULT 'manual',
    "Sistema_Clave" TEXT,
    "Titulo" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Imagen_Clave" TEXT,
    "Categoria" TEXT NOT NULL DEFAULT 'premios',
    "Precios" JSONB NOT NULL,
    "Requisitos" JSONB NOT NULL DEFAULT '[]',
    "Config" JSONB NOT NULL DEFAULT '{}',
    "Stock_Total" INTEGER,
    "Stock_Restante" INTEGER,
    "Limite_Usuario" INTEGER,
    "Periodo_Limite" "PeriodoLimite" NOT NULL DEFAULT 'siempre',
    "Disponible_Desde" TIMESTAMP(3),
    "Disponible_Hasta" TIMESTAMP(3),
    "Destinatarios" JSONB,
    "Requiere_Aprobacion" BOOLEAN NOT NULL DEFAULT false,
    "Descuento_Racha" BOOLEAN NOT NULL DEFAULT false,
    "Destacado" BOOLEAN NOT NULL DEFAULT false,
    "Activo" BOOLEAN NOT NULL DEFAULT true,
    "Orden" INTEGER NOT NULL DEFAULT 0,
    "Creado_Por_ID" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Productos_Tienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compras_Tienda" (
    "id" SERIAL NOT NULL,
    "Producto_ID" INTEGER NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Estado" "EstadoCompra" NOT NULL DEFAULT 'completada',
    "Opcion_Pago" INTEGER NOT NULL,
    "Costos" JSONB NOT NULL,
    "Producto_Snapshot" JSONB NOT NULL,
    "Recompensa_ID" INTEGER,
    "Clave_Idempotencia" TEXT NOT NULL,
    "Resuelta_Por_ID" INTEGER,
    "Resuelta_En" TIMESTAMP(3),
    "Motivo" TEXT,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Compras_Tienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compras_Compartidas" (
    "id" SERIAL NOT NULL,
    "Producto_ID" INTEGER NOT NULL,
    "Solicitante_ID" INTEGER NOT NULL,
    "Opcion_Pago" INTEGER NOT NULL,
    "Costos_Totales" JSONB NOT NULL,
    "Producto_Snapshot" JSONB NOT NULL,
    "Estado" "EstadoCompraCompartida" NOT NULL DEFAULT 'pendiente',
    "Compra_ID" INTEGER,
    "Resuelta_En" TIMESTAMP(3),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Compras_Compartidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participantes_Compra_Tienda" (
    "id" SERIAL NOT NULL,
    "Compra_Compartida_ID" INTEGER NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Costos" JSONB NOT NULL,
    "Estado" "EstadoParticipanteCompra" NOT NULL DEFAULT 'pendiente',
    "Respondido_En" TIMESTAMP(3),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participantes_Compra_Tienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Desbloqueos_Producto" (
    "Producto_ID" INTEGER NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Por_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Desbloqueos_Producto_pkey" PRIMARY KEY ("Producto_ID","Usuario_ID")
);

-- CreateTable
CREATE TABLE "Metas_Tienda" (
    "Usuario_ID" INTEGER NOT NULL,
    "Producto_ID" INTEGER NOT NULL,

    CONSTRAINT "Metas_Tienda_pkey" PRIMARY KEY ("Usuario_ID")
);

-- CreateTable
CREATE TABLE "Homeschool_Materias" (
    "id" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Portada_URL" TEXT,
    "Icono" TEXT,
    "Color" TEXT,
    "Dificultad" "DificultadTarea" NOT NULL DEFAULT 'Media',
    "Orden" INTEGER NOT NULL DEFAULT 0,
    "Activa" BOOLEAN NOT NULL DEFAULT true,
    "Creador_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Recursos" (
    "id" SERIAL NOT NULL,
    "Materia_ID" INTEGER NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Portada_URL" TEXT,
    "Orden" INTEGER NOT NULL DEFAULT 0,
    "Creador_ID" INTEGER NOT NULL,
    "Tipo" "TipoRecurso" NOT NULL,
    "Unidad_Tipo" "UnidadContenido" NOT NULL,
    "Total_Unidades" INTEGER NOT NULL,
    "URL" TEXT,
    "Libro_ID" INTEGER,
    "Minutos_Por_Unidad" INTEGER NOT NULL DEFAULT 20,
    "Umbral_Aprobacion" INTEGER NOT NULL DEFAULT 70,
    "Navegacion_Libre" BOOLEAN NOT NULL DEFAULT false,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homeschool_Recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Lecciones" (
    "id" SERIAL NOT NULL,
    "Recurso_ID" INTEGER NOT NULL,
    "Orden" INTEGER NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Instrucciones" TEXT,
    "URL" TEXT,
    "Video_Plataforma" "PlataformaVideo",
    "Video_ID" TEXT,
    "Miniatura_URL" TEXT,
    "Creador_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Lecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Planes" (
    "id" SERIAL NOT NULL,
    "Recurso_ID" INTEGER NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Inicio" DATE NOT NULL,
    "Fin" DATE NOT NULL,
    "Dias_Semana" INTEGER[],
    "Estado" "EstadoPlan" NOT NULL DEFAULT 'activo',
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Dias_Lectivos" (
    "id" SERIAL NOT NULL,
    "Plan_ID" INTEGER NOT NULL,
    "Fecha" DATE NOT NULL,
    "Unidad_Desde" INTEGER NOT NULL,
    "Unidad_Hasta" INTEGER NOT NULL,
    "Estado" "EstadoDiaLectivo" NOT NULL DEFAULT 'pendiente',
    "Tarea_ID" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Dias_Lectivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Dias_No_Lectivos" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Fecha" DATE NOT NULL,
    "Motivo" TEXT NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Dias_No_Lectivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Progreso" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Leccion_ID" INTEGER NOT NULL,
    "Recurso_ID" INTEGER NOT NULL,
    "Completada_En" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Progreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Evidencias" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Dia_Lectivo_ID" INTEGER,
    "Titulo" TEXT,
    "Nota" TEXT,
    "Estado" "EstadoEvidencia" NOT NULL DEFAULT 'pendiente',
    "Comentario_Padre" TEXT,
    "Revisada_Por_ID" INTEGER,
    "Revisada_En" TIMESTAMP(3),
    "Estrellas" INTEGER,
    "Destacada" BOOLEAN NOT NULL DEFAULT false,
    "Destacada_En" TIMESTAMP(3),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Evidencia_Imagenes" (
    "id" SERIAL NOT NULL,
    "Evidencia_ID" INTEGER NOT NULL,
    "Archivo_URL" TEXT NOT NULL,
    "Orden" INTEGER NOT NULL DEFAULT 0,
    "Pie" TEXT,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Evidencia_Imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Preguntas" (
    "id" SERIAL NOT NULL,
    "Leccion_ID" INTEGER NOT NULL,
    "Orden" INTEGER NOT NULL,
    "Segundo_Video" INTEGER,
    "Enunciado" TEXT NOT NULL,
    "Opciones" JSONB NOT NULL,
    "Correcta" INTEGER NOT NULL,
    "Explicacion" TEXT,

    CONSTRAINT "Homeschool_Preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Intentos_Quiz" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Leccion_ID" INTEGER NOT NULL,
    "Nota" INTEGER NOT NULL,
    "Aprobado" BOOLEAN NOT NULL,
    "Respuestas" JSONB NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Intentos_Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Repasos" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Leccion_ID" INTEGER NOT NULL,
    "Tarjeta" JSONB NOT NULL,
    "Proximo" TIMESTAMP(3) NOT NULL,
    "Resuelta" BOOLEAN NOT NULL DEFAULT false,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Repasos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Materiales" (
    "id" SERIAL NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Tipo" "TipoMaterial" NOT NULL,
    "Proveedor" TEXT,
    "Externo_ID" TEXT,
    "URL" TEXT,
    "Contenido" TEXT,
    "Miniatura_URL" TEXT,
    "Orden" INTEGER NOT NULL DEFAULT 0,
    "Limite_Impresiones" INTEGER NOT NULL DEFAULT 2,
    "Solo_Padres" BOOLEAN NOT NULL DEFAULT false,
    "Leccion_ID" INTEGER,
    "Dia_Lectivo_ID" INTEGER,
    "Alumno_ID" INTEGER,
    "Fecha" DATE,
    "Hecho_En" TIMESTAMP(3),
    "Creador_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homeschool_Materiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Impresiones" (
    "id" SERIAL NOT NULL,
    "Material_ID" INTEGER NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Tipo" TEXT NOT NULL DEFAULT 'uso',
    "Token" TEXT,
    "Otorgada_Por_ID" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Impresiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Calificaciones" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Materia_ID" INTEGER NOT NULL,
    "Dia_Lectivo_ID" INTEGER,
    "Titulo" TEXT NOT NULL,
    "Tipo" "TipoCalificacion" NOT NULL DEFAULT 'tarea',
    "Puntaje" INTEGER NOT NULL,
    "Comentario" TEXT,
    "Fecha" DATE NOT NULL,
    "Calificada_Por_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homeschool_Calificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Comentarios" (
    "id" SERIAL NOT NULL,
    "Autor_ID" INTEGER NOT NULL,
    "Leccion_ID" INTEGER,
    "Material_ID" INTEGER,
    "Evidencia_ID" INTEGER,
    "Publicacion_ID" INTEGER,
    "Texto" TEXT NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Editado_En" TIMESTAMP(3),

    CONSTRAINT "Homeschool_Comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Reacciones" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Comentario_ID" INTEGER,
    "Evidencia_ID" INTEGER,
    "Publicacion_ID" INTEGER,
    "Emoji" TEXT NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Reacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Avisos" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Tipo" TEXT NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Cuerpo" TEXT,
    "Href" TEXT,
    "Leido_En" TIMESTAMP(3),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Avisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Lecturas" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Autor" TEXT,
    "Portada_URL" TEXT,
    "Estado" "EstadoLectura" NOT NULL DEFAULT 'por_leer',
    "Paginas_Total" INTEGER,
    "Pagina_Actual" INTEGER NOT NULL DEFAULT 0,
    "Empezado_En" DATE,
    "Terminado_En" DATE,
    "Estrellas" INTEGER,
    "Narracion" TEXT,
    "Asignado_Por_ID" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homeschool_Lecturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Sesiones_Lectura" (
    "id" SERIAL NOT NULL,
    "Libro_ID" INTEGER NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Fecha" DATE NOT NULL,
    "Paginas" INTEGER NOT NULL,
    "Minutos" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Sesiones_Lectura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Memoria" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Clave" TEXT,
    "Titulo" TEXT NOT NULL,
    "Texto" TEXT NOT NULL,
    "Tarjeta" JSONB NOT NULL,
    "Proximo" TIMESTAMP(3) NOT NULL,
    "Repasos" INTEGER NOT NULL DEFAULT 0,
    "Dominada" BOOLEAN NOT NULL DEFAULT false,
    "Ultimo_En" TIMESTAMP(3),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Memoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Impresiones_Dia" (
    "id" SERIAL NOT NULL,
    "Dia_Lectivo_ID" INTEGER NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Tipo" TEXT NOT NULL DEFAULT 'uso',
    "Token" TEXT,
    "Otorgada_Por_ID" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Impresiones_Dia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Periodos" (
    "id" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Inicio" DATE NOT NULL,
    "Fin" DATE NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Periodos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Boletines" (
    "id" SERIAL NOT NULL,
    "Periodo_ID" INTEGER NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Comentario" TEXT,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homeschool_Boletines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Muro" (
    "id" SERIAL NOT NULL,
    "Autor_ID" INTEGER,
    "Alumno_ID" INTEGER,
    "Tipo" TEXT NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Cuerpo" TEXT,
    "Href" TEXT,
    "Fijada" BOOLEAN NOT NULL DEFAULT false,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Muro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Mensajes" (
    "id" SERIAL NOT NULL,
    "De_ID" INTEGER NOT NULL,
    "Para_ID" INTEGER NOT NULL,
    "Texto" TEXT NOT NULL,
    "Leido_En" TIMESTAMP(3),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dias_Liturgicos" (
    "Version" TEXT NOT NULL,
    "Fecha" DATE NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Titulo_Es" TEXT,
    "Rango" TEXT NOT NULL,
    "Lineas" JSONB NOT NULL,
    "Color" TEXT NOT NULL,
    "Tiempo" TEXT NOT NULL,
    "Dominical" BOOLEAN NOT NULL,

    CONSTRAINT "Dias_Liturgicos_pkey" PRIMARY KEY ("Version","Fecha")
);

-- CreateTable
CREATE TABLE "Bloques_Liturgicos" (
    "Hash" TEXT NOT NULL,
    "Datos" JSONB NOT NULL,

    CONSTRAINT "Bloques_Liturgicos_pkey" PRIMARY KEY ("Hash")
);

-- CreateTable
CREATE TABLE "Documentos_Liturgicos" (
    "Version" TEXT NOT NULL,
    "Tipo" TEXT NOT NULL,
    "Clave" TEXT NOT NULL,
    "Fecha" DATE,
    "Titulo" JSONB NOT NULL,
    "Secciones" JSONB NOT NULL,

    CONSTRAINT "Documentos_Liturgicos_pkey" PRIMARY KEY ("Version","Tipo","Clave")
);

-- CreateTable
CREATE TABLE "Generaciones_Liturgicas" (
    "id" SERIAL NOT NULL,
    "DO_Commit" TEXT NOT NULL,
    "Versiones" TEXT NOT NULL,
    "Desde" DATE NOT NULL,
    "Hasta" DATE NOT NULL,
    "Documentos" INTEGER NOT NULL,
    "Bloques_Nuevos" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Generaciones_Liturgicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Actividades" (
    "id" SERIAL NOT NULL,
    "Materia_ID" INTEGER NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Inicio" TIMESTAMP(3) NOT NULL,
    "Fin" TIMESTAMP(3) NOT NULL,
    "Lugar" TEXT,
    "Creador_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homeschool_Actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Participantes" (
    "id" SERIAL NOT NULL,
    "Actividad_ID" INTEGER NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Metas_Horas" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Materia_ID" INTEGER NOT NULL,
    "Horas" INTEGER NOT NULL,

    CONSTRAINT "Homeschool_Metas_Horas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Preferencias" (
    "Alumno_ID" INTEGER NOT NULL,
    "Modo_Relajado" BOOLEAN NOT NULL DEFAULT false,
    "Primero_Despues" BOOLEAN NOT NULL DEFAULT false,
    "Recompensa_Despues" TEXT,

    CONSTRAINT "Homeschool_Preferencias_pkey" PRIMARY KEY ("Alumno_ID")
);

-- CreateTable
CREATE TABLE "Homeschool_Historias" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER,
    "Titulo" TEXT NOT NULL,
    "Pasos" JSONB NOT NULL,
    "Mostrar_El" DATE,
    "Vista_En" TIMESTAMP(3),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Historias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config_Reposo" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "Segundos_Login" INTEGER NOT NULL DEFAULT 15,
    "Segundos_Sesion" INTEGER NOT NULL DEFAULT 60,
    "Unsplash_Tema" TEXT NOT NULL DEFAULT '6sMVjTLSkeQ',
    "Unsplash_Consulta" TEXT,
    "Tam_Pool" INTEGER NOT NULL DEFAULT 150,
    "Mostrar_Ref_Catecismo" BOOLEAN NOT NULL DEFAULT true,
    "Ultima_Sincronia" TIMESTAMP(3),

    CONSTRAINT "Config_Reposo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fotos_Unsplash" (
    "Unsplash_ID" TEXT NOT NULL,
    "Url_Raw" TEXT NOT NULL,
    "Ancho" INTEGER NOT NULL,
    "Alto" INTEGER NOT NULL,
    "Color" TEXT,
    "Blur_Hash" TEXT,
    "Autor_Nombre" TEXT NOT NULL,
    "Autor_Usuario" TEXT NOT NULL,
    "Url_Foto" TEXT NOT NULL,
    "Orientacion" TEXT NOT NULL,
    "Activa" BOOLEAN NOT NULL DEFAULT true,
    "Oculta" BOOLEAN NOT NULL DEFAULT false,
    "Descarga_Avisada" BOOLEAN NOT NULL DEFAULT false,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fotos_Unsplash_pkey" PRIMARY KEY ("Unsplash_ID")
);

-- CreateTable
CREATE TABLE "Actividad_Diaria" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Fecha" DATE NOT NULL,
    "Misiones" JSONB NOT NULL DEFAULT '[]',
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Actividad_Diaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metas_Semanales" (
    "id" SERIAL NOT NULL,
    "Semana" DATE NOT NULL,
    "Objetivo" INTEGER NOT NULL,
    "Premio" TEXT NOT NULL,
    "Creada_Por_ID" INTEGER,
    "Cumplida_En" TIMESTAMP(3),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metas_Semanales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Companeros" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Etapa_Vista" INTEGER NOT NULL DEFAULT 1,
    "Personaje" TEXT,
    "Nivel_Visto" INTEGER NOT NULL DEFAULT 0,
    "Equipados" JSONB NOT NULL DEFAULT '{"fondo": "capilla", "objetos": ["veladora"]}',
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Companeros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Companero_Accesorios" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Clave" TEXT NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Companero_Accesorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suscripciones_Push" (
    "id" SERIAL NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Endpoint" TEXT NOT NULL,
    "P256dh" TEXT NOT NULL,
    "Auth" TEXT NOT NULL,
    "Agente" TEXT,
    "Ultimo_Aviso_En" TIMESTAMP(3),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suscripciones_Push_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tareas_estado_idx" ON "Tareas"("estado");

-- CreateIndex
CREATE INDEX "Tareas_Asignado_ID_idx" ON "Tareas"("Asignado_ID");

-- CreateIndex
CREATE INDEX "Tareas_Fecha_Vencimiento_idx" ON "Tareas"("Fecha_Vencimiento");

-- CreateIndex
CREATE INDEX "Registros_Animo_Usuario_ID_Creado_En_idx" ON "Registros_Animo"("Usuario_ID", "Creado_En");

-- CreateIndex
CREATE UNIQUE INDEX "Premios_Entregados_Premio_ID_Usuario_ID_key" ON "Premios_Entregados"("Premio_ID", "Usuario_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Habitos_Clave_key" ON "Habitos"("Clave");

-- CreateIndex
CREATE UNIQUE INDEX "Habitos_Usuario_Usuario_ID_Habito_ID_key" ON "Habitos_Usuario"("Usuario_ID", "Habito_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Registros_Habito_Usuario_ID_Habito_ID_Fecha_key" ON "Registros_Habito"("Usuario_ID", "Habito_ID", "Fecha");

-- CreateIndex
CREATE INDEX "Libros_Usuario_ID_Habito_ID_idx" ON "Libros"("Usuario_ID", "Habito_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Recompensas_Libro_ID_key" ON "Recompensas"("Libro_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Recompensas_Comportamiento_ID_key" ON "Recompensas"("Comportamiento_ID");

-- CreateIndex
CREATE INDEX "Recompensas_Usuario_ID_Estado_idx" ON "Recompensas"("Usuario_ID", "Estado");

-- CreateIndex
CREATE INDEX "Comportamientos_Usuario_ID_Created_At_idx" ON "Comportamientos"("Usuario_ID", "Created_At");

-- CreateIndex
CREATE INDEX "Conducta_Dias_Usuario_ID_Fecha_idx" ON "Conducta_Dias"("Usuario_ID", "Fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Conducta_Dias_Usuario_ID_Fecha_key" ON "Conducta_Dias"("Usuario_ID", "Fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Cartas_Clave_key" ON "Cartas"("Clave");

-- CreateIndex
CREATE UNIQUE INDEX "Cartas_Usuario_Usuario_ID_Carta_ID_key" ON "Cartas_Usuario"("Usuario_ID", "Carta_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Reclamos_Carta_Usuario_ID_Tipo_Carta_ID_Periodo_key" ON "Reclamos_Carta"("Usuario_ID", "Tipo", "Carta_ID", "Periodo");

-- CreateIndex
CREATE UNIQUE INDEX "Archivos_Clave_key" ON "Archivos"("Clave");

-- CreateIndex
CREATE UNIQUE INDEX "Productos_Tienda_Sistema_Clave_key" ON "Productos_Tienda"("Sistema_Clave");

-- CreateIndex
CREATE UNIQUE INDEX "Compras_Tienda_Recompensa_ID_key" ON "Compras_Tienda"("Recompensa_ID");

-- CreateIndex
CREATE INDEX "Compras_Tienda_Usuario_ID_Producto_ID_Created_At_idx" ON "Compras_Tienda"("Usuario_ID", "Producto_ID", "Created_At");

-- CreateIndex
CREATE INDEX "Compras_Tienda_Estado_idx" ON "Compras_Tienda"("Estado");

-- CreateIndex
CREATE UNIQUE INDEX "Compras_Tienda_Usuario_ID_Clave_Idempotencia_key" ON "Compras_Tienda"("Usuario_ID", "Clave_Idempotencia");

-- CreateIndex
CREATE UNIQUE INDEX "Compras_Compartidas_Compra_ID_key" ON "Compras_Compartidas"("Compra_ID");

-- CreateIndex
CREATE INDEX "Compras_Compartidas_Solicitante_ID_Estado_idx" ON "Compras_Compartidas"("Solicitante_ID", "Estado");

-- CreateIndex
CREATE INDEX "Compras_Compartidas_Producto_ID_Estado_idx" ON "Compras_Compartidas"("Producto_ID", "Estado");

-- CreateIndex
CREATE INDEX "Compras_Compartidas_Estado_Created_At_idx" ON "Compras_Compartidas"("Estado", "Created_At");

-- CreateIndex
CREATE INDEX "Participantes_Compra_Tienda_Usuario_ID_Estado_idx" ON "Participantes_Compra_Tienda"("Usuario_ID", "Estado");

-- CreateIndex
CREATE UNIQUE INDEX "Participantes_Compra_Tienda_Compra_Compartida_ID_Usuario_ID_key" ON "Participantes_Compra_Tienda"("Compra_Compartida_ID", "Usuario_ID");

-- CreateIndex
CREATE INDEX "Homeschool_Materias_Activa_Orden_idx" ON "Homeschool_Materias"("Activa", "Orden");

-- CreateIndex
CREATE INDEX "Homeschool_Recursos_Materia_ID_Orden_idx" ON "Homeschool_Recursos"("Materia_ID", "Orden");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Lecciones_Recurso_ID_Orden_key" ON "Homeschool_Lecciones"("Recurso_ID", "Orden");

-- CreateIndex
CREATE INDEX "Homeschool_Planes_Alumno_ID_Estado_idx" ON "Homeschool_Planes"("Alumno_ID", "Estado");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Planes_Recurso_ID_Alumno_ID_key" ON "Homeschool_Planes"("Recurso_ID", "Alumno_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Dias_Lectivos_Tarea_ID_key" ON "Homeschool_Dias_Lectivos"("Tarea_ID");

-- CreateIndex
CREATE INDEX "Homeschool_Dias_Lectivos_Fecha_Estado_idx" ON "Homeschool_Dias_Lectivos"("Fecha", "Estado");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Dias_Lectivos_Plan_ID_Fecha_key" ON "Homeschool_Dias_Lectivos"("Plan_ID", "Fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Dias_No_Lectivos_Alumno_ID_Fecha_key" ON "Homeschool_Dias_No_Lectivos"("Alumno_ID", "Fecha");

-- CreateIndex
CREATE INDEX "Homeschool_Progreso_Alumno_ID_Recurso_ID_idx" ON "Homeschool_Progreso"("Alumno_ID", "Recurso_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Progreso_Alumno_ID_Leccion_ID_key" ON "Homeschool_Progreso"("Alumno_ID", "Leccion_ID");

-- CreateIndex
CREATE INDEX "Homeschool_Evidencias_Alumno_ID_Estado_idx" ON "Homeschool_Evidencias"("Alumno_ID", "Estado");

-- CreateIndex
CREATE INDEX "Homeschool_Evidencia_Imagenes_Archivo_URL_idx" ON "Homeschool_Evidencia_Imagenes"("Archivo_URL");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Preguntas_Leccion_ID_Orden_key" ON "Homeschool_Preguntas"("Leccion_ID", "Orden");

-- CreateIndex
CREATE INDEX "Homeschool_Intentos_Quiz_Alumno_ID_Leccion_ID_Created_At_idx" ON "Homeschool_Intentos_Quiz"("Alumno_ID", "Leccion_ID", "Created_At");

-- CreateIndex
CREATE INDEX "Homeschool_Repasos_Alumno_ID_Proximo_Resuelta_idx" ON "Homeschool_Repasos"("Alumno_ID", "Proximo", "Resuelta");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Repasos_Alumno_ID_Leccion_ID_key" ON "Homeschool_Repasos"("Alumno_ID", "Leccion_ID");

-- CreateIndex
CREATE INDEX "Homeschool_Materiales_Leccion_ID_Orden_idx" ON "Homeschool_Materiales"("Leccion_ID", "Orden");

-- CreateIndex
CREATE INDEX "Homeschool_Materiales_Dia_Lectivo_ID_Orden_idx" ON "Homeschool_Materiales"("Dia_Lectivo_ID", "Orden");

-- CreateIndex
CREATE INDEX "Homeschool_Materiales_Alumno_ID_Fecha_idx" ON "Homeschool_Materiales"("Alumno_ID", "Fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Impresiones_Token_key" ON "Homeschool_Impresiones"("Token");

-- CreateIndex
CREATE INDEX "Homeschool_Impresiones_Material_ID_Alumno_ID_idx" ON "Homeschool_Impresiones"("Material_ID", "Alumno_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Calificaciones_Dia_Lectivo_ID_key" ON "Homeschool_Calificaciones"("Dia_Lectivo_ID");

-- CreateIndex
CREATE INDEX "Homeschool_Calificaciones_Alumno_ID_Materia_ID_Fecha_idx" ON "Homeschool_Calificaciones"("Alumno_ID", "Materia_ID", "Fecha");

-- CreateIndex
CREATE INDEX "Homeschool_Comentarios_Publicacion_ID_Created_At_idx" ON "Homeschool_Comentarios"("Publicacion_ID", "Created_At");

-- CreateIndex
CREATE INDEX "Homeschool_Comentarios_Leccion_ID_Created_At_idx" ON "Homeschool_Comentarios"("Leccion_ID", "Created_At");

-- CreateIndex
CREATE INDEX "Homeschool_Comentarios_Material_ID_Created_At_idx" ON "Homeschool_Comentarios"("Material_ID", "Created_At");

-- CreateIndex
CREATE INDEX "Homeschool_Comentarios_Evidencia_ID_Created_At_idx" ON "Homeschool_Comentarios"("Evidencia_ID", "Created_At");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Reacciones_Usuario_ID_Comentario_ID_Emoji_key" ON "Homeschool_Reacciones"("Usuario_ID", "Comentario_ID", "Emoji");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Reacciones_Usuario_ID_Evidencia_ID_Emoji_key" ON "Homeschool_Reacciones"("Usuario_ID", "Evidencia_ID", "Emoji");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Reacciones_Usuario_ID_Publicacion_ID_Emoji_key" ON "Homeschool_Reacciones"("Usuario_ID", "Publicacion_ID", "Emoji");

-- CreateIndex
CREATE INDEX "Homeschool_Avisos_Usuario_ID_Leido_En_Created_At_idx" ON "Homeschool_Avisos"("Usuario_ID", "Leido_En", "Created_At");

-- CreateIndex
CREATE INDEX "Homeschool_Lecturas_Alumno_ID_Estado_idx" ON "Homeschool_Lecturas"("Alumno_ID", "Estado");

-- CreateIndex
CREATE INDEX "Homeschool_Sesiones_Lectura_Alumno_ID_Fecha_idx" ON "Homeschool_Sesiones_Lectura"("Alumno_ID", "Fecha");

-- CreateIndex
CREATE INDEX "Homeschool_Memoria_Alumno_ID_Dominada_Proximo_idx" ON "Homeschool_Memoria"("Alumno_ID", "Dominada", "Proximo");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Memoria_Alumno_ID_Clave_key" ON "Homeschool_Memoria"("Alumno_ID", "Clave");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Impresiones_Dia_Token_key" ON "Homeschool_Impresiones_Dia"("Token");

-- CreateIndex
CREATE INDEX "Homeschool_Impresiones_Dia_Dia_Lectivo_ID_Alumno_ID_idx" ON "Homeschool_Impresiones_Dia"("Dia_Lectivo_ID", "Alumno_ID");

-- CreateIndex
CREATE INDEX "Homeschool_Periodos_Inicio_idx" ON "Homeschool_Periodos"("Inicio");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Boletines_Periodo_ID_Alumno_ID_key" ON "Homeschool_Boletines"("Periodo_ID", "Alumno_ID");

-- CreateIndex
CREATE INDEX "Homeschool_Muro_Fijada_Created_At_idx" ON "Homeschool_Muro"("Fijada", "Created_At");

-- CreateIndex
CREATE INDEX "Homeschool_Mensajes_Para_ID_Leido_En_idx" ON "Homeschool_Mensajes"("Para_ID", "Leido_En");

-- CreateIndex
CREATE INDEX "Homeschool_Mensajes_De_ID_Para_ID_Created_At_idx" ON "Homeschool_Mensajes"("De_ID", "Para_ID", "Created_At");

-- CreateIndex
CREATE INDEX "Documentos_Liturgicos_Version_Tipo_Fecha_idx" ON "Documentos_Liturgicos"("Version", "Tipo", "Fecha");

-- CreateIndex
CREATE INDEX "Homeschool_Actividades_Inicio_idx" ON "Homeschool_Actividades"("Inicio");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Participantes_Actividad_ID_Alumno_ID_key" ON "Homeschool_Participantes"("Actividad_ID", "Alumno_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Metas_Horas_Alumno_ID_Materia_ID_key" ON "Homeschool_Metas_Horas"("Alumno_ID", "Materia_ID");

-- CreateIndex
CREATE INDEX "Homeschool_Historias_Alumno_ID_Mostrar_El_idx" ON "Homeschool_Historias"("Alumno_ID", "Mostrar_El");

-- CreateIndex
CREATE UNIQUE INDEX "Actividad_Diaria_Usuario_ID_Fecha_key" ON "Actividad_Diaria"("Usuario_ID", "Fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Metas_Semanales_Semana_key" ON "Metas_Semanales"("Semana");

-- CreateIndex
CREATE UNIQUE INDEX "Companeros_Usuario_ID_key" ON "Companeros"("Usuario_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Companero_Accesorios_Usuario_ID_Clave_key" ON "Companero_Accesorios"("Usuario_ID", "Clave");

-- CreateIndex
CREATE UNIQUE INDEX "Suscripciones_Push_Endpoint_key" ON "Suscripciones_Push"("Endpoint");

-- CreateIndex
CREATE INDEX "Suscripciones_Push_Usuario_ID_idx" ON "Suscripciones_Push"("Usuario_ID");

-- AddForeignKey
ALTER TABLE "Tareas" ADD CONSTRAINT "Tareas_Parent_Task_ID_fkey" FOREIGN KEY ("Parent_Task_ID") REFERENCES "Tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tareas" ADD CONSTRAINT "Tareas_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tareas" ADD CONSTRAINT "Tareas_Asignado_ID_fkey" FOREIGN KEY ("Asignado_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historial_Acciones" ADD CONSTRAINT "Historial_Acciones_Tarea_ID_fkey" FOREIGN KEY ("Tarea_ID") REFERENCES "Tareas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historial_Acciones" ADD CONSTRAINT "Historial_Acciones_Actor_ID_fkey" FOREIGN KEY ("Actor_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registros_Animo" ADD CONSTRAINT "Registros_Animo_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist_Items" ADD CONSTRAINT "Checklist_Items_Tarea_ID_fkey" FOREIGN KEY ("Tarea_ID") REFERENCES "Tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Premios_Entregados" ADD CONSTRAINT "Premios_Entregados_Premio_ID_fkey" FOREIGN KEY ("Premio_ID") REFERENCES "Premios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Premios_Entregados" ADD CONSTRAINT "Premios_Entregados_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habitos" ADD CONSTRAINT "Habitos_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habitos_Usuario" ADD CONSTRAINT "Habitos_Usuario_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habitos_Usuario" ADD CONSTRAINT "Habitos_Usuario_Habito_ID_fkey" FOREIGN KEY ("Habito_ID") REFERENCES "Habitos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registros_Habito" ADD CONSTRAINT "Registros_Habito_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registros_Habito" ADD CONSTRAINT "Registros_Habito_Registrado_Por_ID_fkey" FOREIGN KEY ("Registrado_Por_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registros_Habito" ADD CONSTRAINT "Registros_Habito_Habito_ID_fkey" FOREIGN KEY ("Habito_ID") REFERENCES "Habitos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registros_Habito" ADD CONSTRAINT "Registros_Habito_Libro_ID_fkey" FOREIGN KEY ("Libro_ID") REFERENCES "Libros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Libros" ADD CONSTRAINT "Libros_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Libros" ADD CONSTRAINT "Libros_Habito_ID_fkey" FOREIGN KEY ("Habito_ID") REFERENCES "Habitos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recompensas" ADD CONSTRAINT "Recompensas_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recompensas" ADD CONSTRAINT "Recompensas_Entregada_Por_ID_fkey" FOREIGN KEY ("Entregada_Por_ID") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recompensas" ADD CONSTRAINT "Recompensas_Libro_ID_fkey" FOREIGN KEY ("Libro_ID") REFERENCES "Libros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recompensas" ADD CONSTRAINT "Recompensas_Comportamiento_ID_fkey" FOREIGN KEY ("Comportamiento_ID") REFERENCES "Comportamientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comportamientos" ADD CONSTRAINT "Comportamientos_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comportamientos" ADD CONSTRAINT "Comportamientos_Registrado_Por_ID_fkey" FOREIGN KEY ("Registrado_Por_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conducta_Dias" ADD CONSTRAINT "Conducta_Dias_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conducta_Dias" ADD CONSTRAINT "Conducta_Dias_Registrado_Por_ID_fkey" FOREIGN KEY ("Registrado_Por_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cartas" ADD CONSTRAINT "Cartas_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cartas_Usuario" ADD CONSTRAINT "Cartas_Usuario_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cartas_Usuario" ADD CONSTRAINT "Cartas_Usuario_Carta_ID_fkey" FOREIGN KEY ("Carta_ID") REFERENCES "Cartas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimientos_Fragmento" ADD CONSTRAINT "Movimientos_Fragmento_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimientos_Fragmento" ADD CONSTRAINT "Movimientos_Fragmento_Carta_ID_fkey" FOREIGN KEY ("Carta_ID") REFERENCES "Cartas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamos_Carta" ADD CONSTRAINT "Reclamos_Carta_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compras_Tienda" ADD CONSTRAINT "Compras_Tienda_Producto_ID_fkey" FOREIGN KEY ("Producto_ID") REFERENCES "Productos_Tienda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compras_Tienda" ADD CONSTRAINT "Compras_Tienda_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compras_Compartidas" ADD CONSTRAINT "Compras_Compartidas_Producto_ID_fkey" FOREIGN KEY ("Producto_ID") REFERENCES "Productos_Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compras_Compartidas" ADD CONSTRAINT "Compras_Compartidas_Solicitante_ID_fkey" FOREIGN KEY ("Solicitante_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compras_Compartidas" ADD CONSTRAINT "Compras_Compartidas_Compra_ID_fkey" FOREIGN KEY ("Compra_ID") REFERENCES "Compras_Tienda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participantes_Compra_Tienda" ADD CONSTRAINT "Participantes_Compra_Tienda_Compra_Compartida_ID_fkey" FOREIGN KEY ("Compra_Compartida_ID") REFERENCES "Compras_Compartidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participantes_Compra_Tienda" ADD CONSTRAINT "Participantes_Compra_Tienda_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Desbloqueos_Producto" ADD CONSTRAINT "Desbloqueos_Producto_Producto_ID_fkey" FOREIGN KEY ("Producto_ID") REFERENCES "Productos_Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Desbloqueos_Producto" ADD CONSTRAINT "Desbloqueos_Producto_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metas_Tienda" ADD CONSTRAINT "Metas_Tienda_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Materias" ADD CONSTRAINT "Homeschool_Materias_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Recursos" ADD CONSTRAINT "Homeschool_Recursos_Materia_ID_fkey" FOREIGN KEY ("Materia_ID") REFERENCES "Homeschool_Materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Recursos" ADD CONSTRAINT "Homeschool_Recursos_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Recursos" ADD CONSTRAINT "Homeschool_Recursos_Libro_ID_fkey" FOREIGN KEY ("Libro_ID") REFERENCES "Libros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Lecciones" ADD CONSTRAINT "Homeschool_Lecciones_Recurso_ID_fkey" FOREIGN KEY ("Recurso_ID") REFERENCES "Homeschool_Recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Lecciones" ADD CONSTRAINT "Homeschool_Lecciones_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Planes" ADD CONSTRAINT "Homeschool_Planes_Recurso_ID_fkey" FOREIGN KEY ("Recurso_ID") REFERENCES "Homeschool_Recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Planes" ADD CONSTRAINT "Homeschool_Planes_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Dias_Lectivos" ADD CONSTRAINT "Homeschool_Dias_Lectivos_Plan_ID_fkey" FOREIGN KEY ("Plan_ID") REFERENCES "Homeschool_Planes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Dias_Lectivos" ADD CONSTRAINT "Homeschool_Dias_Lectivos_Tarea_ID_fkey" FOREIGN KEY ("Tarea_ID") REFERENCES "Tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Dias_No_Lectivos" ADD CONSTRAINT "Homeschool_Dias_No_Lectivos_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Progreso" ADD CONSTRAINT "Homeschool_Progreso_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Progreso" ADD CONSTRAINT "Homeschool_Progreso_Leccion_ID_fkey" FOREIGN KEY ("Leccion_ID") REFERENCES "Homeschool_Lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Progreso" ADD CONSTRAINT "Homeschool_Progreso_Recurso_ID_fkey" FOREIGN KEY ("Recurso_ID") REFERENCES "Homeschool_Recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Evidencias" ADD CONSTRAINT "Homeschool_Evidencias_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Evidencias" ADD CONSTRAINT "Homeschool_Evidencias_Revisada_Por_ID_fkey" FOREIGN KEY ("Revisada_Por_ID") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Evidencias" ADD CONSTRAINT "Homeschool_Evidencias_Dia_Lectivo_ID_fkey" FOREIGN KEY ("Dia_Lectivo_ID") REFERENCES "Homeschool_Dias_Lectivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Evidencia_Imagenes" ADD CONSTRAINT "Homeschool_Evidencia_Imagenes_Evidencia_ID_fkey" FOREIGN KEY ("Evidencia_ID") REFERENCES "Homeschool_Evidencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Preguntas" ADD CONSTRAINT "Homeschool_Preguntas_Leccion_ID_fkey" FOREIGN KEY ("Leccion_ID") REFERENCES "Homeschool_Lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Intentos_Quiz" ADD CONSTRAINT "Homeschool_Intentos_Quiz_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Intentos_Quiz" ADD CONSTRAINT "Homeschool_Intentos_Quiz_Leccion_ID_fkey" FOREIGN KEY ("Leccion_ID") REFERENCES "Homeschool_Lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Repasos" ADD CONSTRAINT "Homeschool_Repasos_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Repasos" ADD CONSTRAINT "Homeschool_Repasos_Leccion_ID_fkey" FOREIGN KEY ("Leccion_ID") REFERENCES "Homeschool_Lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Materiales" ADD CONSTRAINT "Homeschool_Materiales_Leccion_ID_fkey" FOREIGN KEY ("Leccion_ID") REFERENCES "Homeschool_Lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Materiales" ADD CONSTRAINT "Homeschool_Materiales_Dia_Lectivo_ID_fkey" FOREIGN KEY ("Dia_Lectivo_ID") REFERENCES "Homeschool_Dias_Lectivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Materiales" ADD CONSTRAINT "Homeschool_Materiales_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Materiales" ADD CONSTRAINT "Homeschool_Materiales_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Impresiones" ADD CONSTRAINT "Homeschool_Impresiones_Material_ID_fkey" FOREIGN KEY ("Material_ID") REFERENCES "Homeschool_Materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Impresiones" ADD CONSTRAINT "Homeschool_Impresiones_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Calificaciones" ADD CONSTRAINT "Homeschool_Calificaciones_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Calificaciones" ADD CONSTRAINT "Homeschool_Calificaciones_Calificada_Por_ID_fkey" FOREIGN KEY ("Calificada_Por_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Calificaciones" ADD CONSTRAINT "Homeschool_Calificaciones_Materia_ID_fkey" FOREIGN KEY ("Materia_ID") REFERENCES "Homeschool_Materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Calificaciones" ADD CONSTRAINT "Homeschool_Calificaciones_Dia_Lectivo_ID_fkey" FOREIGN KEY ("Dia_Lectivo_ID") REFERENCES "Homeschool_Dias_Lectivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Comentarios" ADD CONSTRAINT "Homeschool_Comentarios_Autor_ID_fkey" FOREIGN KEY ("Autor_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Comentarios" ADD CONSTRAINT "Homeschool_Comentarios_Leccion_ID_fkey" FOREIGN KEY ("Leccion_ID") REFERENCES "Homeschool_Lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Comentarios" ADD CONSTRAINT "Homeschool_Comentarios_Material_ID_fkey" FOREIGN KEY ("Material_ID") REFERENCES "Homeschool_Materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Comentarios" ADD CONSTRAINT "Homeschool_Comentarios_Evidencia_ID_fkey" FOREIGN KEY ("Evidencia_ID") REFERENCES "Homeschool_Evidencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Comentarios" ADD CONSTRAINT "Homeschool_Comentarios_Publicacion_ID_fkey" FOREIGN KEY ("Publicacion_ID") REFERENCES "Homeschool_Muro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Reacciones" ADD CONSTRAINT "Homeschool_Reacciones_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Reacciones" ADD CONSTRAINT "Homeschool_Reacciones_Comentario_ID_fkey" FOREIGN KEY ("Comentario_ID") REFERENCES "Homeschool_Comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Reacciones" ADD CONSTRAINT "Homeschool_Reacciones_Evidencia_ID_fkey" FOREIGN KEY ("Evidencia_ID") REFERENCES "Homeschool_Evidencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Reacciones" ADD CONSTRAINT "Homeschool_Reacciones_Publicacion_ID_fkey" FOREIGN KEY ("Publicacion_ID") REFERENCES "Homeschool_Muro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Avisos" ADD CONSTRAINT "Homeschool_Avisos_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Lecturas" ADD CONSTRAINT "Homeschool_Lecturas_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Sesiones_Lectura" ADD CONSTRAINT "Homeschool_Sesiones_Lectura_Libro_ID_fkey" FOREIGN KEY ("Libro_ID") REFERENCES "Homeschool_Lecturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Memoria" ADD CONSTRAINT "Homeschool_Memoria_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Impresiones_Dia" ADD CONSTRAINT "Homeschool_Impresiones_Dia_Dia_Lectivo_ID_fkey" FOREIGN KEY ("Dia_Lectivo_ID") REFERENCES "Homeschool_Dias_Lectivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Impresiones_Dia" ADD CONSTRAINT "Homeschool_Impresiones_Dia_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Boletines" ADD CONSTRAINT "Homeschool_Boletines_Periodo_ID_fkey" FOREIGN KEY ("Periodo_ID") REFERENCES "Homeschool_Periodos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Boletines" ADD CONSTRAINT "Homeschool_Boletines_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Muro" ADD CONSTRAINT "Homeschool_Muro_Autor_ID_fkey" FOREIGN KEY ("Autor_ID") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Muro" ADD CONSTRAINT "Homeschool_Muro_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Mensajes" ADD CONSTRAINT "Homeschool_Mensajes_De_ID_fkey" FOREIGN KEY ("De_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Mensajes" ADD CONSTRAINT "Homeschool_Mensajes_Para_ID_fkey" FOREIGN KEY ("Para_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Actividades" ADD CONSTRAINT "Homeschool_Actividades_Materia_ID_fkey" FOREIGN KEY ("Materia_ID") REFERENCES "Homeschool_Materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Actividades" ADD CONSTRAINT "Homeschool_Actividades_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Participantes" ADD CONSTRAINT "Homeschool_Participantes_Actividad_ID_fkey" FOREIGN KEY ("Actividad_ID") REFERENCES "Homeschool_Actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Participantes" ADD CONSTRAINT "Homeschool_Participantes_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Metas_Horas" ADD CONSTRAINT "Homeschool_Metas_Horas_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Metas_Horas" ADD CONSTRAINT "Homeschool_Metas_Horas_Materia_ID_fkey" FOREIGN KEY ("Materia_ID") REFERENCES "Homeschool_Materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Preferencias" ADD CONSTRAINT "Homeschool_Preferencias_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad_Diaria" ADD CONSTRAINT "Actividad_Diaria_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metas_Semanales" ADD CONSTRAINT "Metas_Semanales_Creada_Por_ID_fkey" FOREIGN KEY ("Creada_Por_ID") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companeros" ADD CONSTRAINT "Companeros_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companero_Accesorios" ADD CONSTRAINT "Companero_Accesorios_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suscripciones_Push" ADD CONSTRAINT "Suscripciones_Push_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

