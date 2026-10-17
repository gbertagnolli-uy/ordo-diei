-- Liturgia (lane 133 · L2): SOLO agrega tablas (generado con 'prisma migrate diff' y filtrado a los CREATE de estas 4 tablas).
-- Aplicar con: npx prisma db execute --file scripts/liturgia/sql/001-tablas-liturgia.sql

CREATE TABLE IF NOT EXISTS "Dias_Liturgicos" (
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
CREATE TABLE IF NOT EXISTS "Bloques_Liturgicos" (
    "Hash" TEXT NOT NULL,
    "Datos" JSONB NOT NULL,

    CONSTRAINT "Bloques_Liturgicos_pkey" PRIMARY KEY ("Hash")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Documentos_Liturgicos" (
    "Version" TEXT NOT NULL,
    "Tipo" TEXT NOT NULL,
    "Clave" TEXT NOT NULL,
    "Fecha" DATE,
    "Titulo" JSONB NOT NULL,
    "Secciones" JSONB NOT NULL,

    CONSTRAINT "Documentos_Liturgicos_pkey" PRIMARY KEY ("Version","Tipo","Clave")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Generaciones_Liturgicas" (
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Documentos_Liturgicos_Version_Tipo_Fecha_idx" ON "Documentos_Liturgicos"("Version", "Tipo", "Fecha");

